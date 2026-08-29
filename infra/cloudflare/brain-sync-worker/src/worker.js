/**
 * SIRINX Brain @ Edge — Obsidian knowledge A2A sync on Cloudflare Workers + D1.
 *
 * Same delta-sync contract as sirinx-a2a (camelCase JSON, agent cards),
 * so any mesh node — Mac mini Obsidian vault, Hermes, cloud workers —
 * syncs knowledge through one edge endpoint:
 *
 *   GET  /health                       open
 *   POST /api/brain/sync               {node, since, notes[]} -> {node, changed[], peerAgents[]}
 *   GET  /api/brain/search?q=...       FTS5 over titles+content
 *   GET  /api/brain/notes?path=...     fetch one note
 *
 * Auth: Authorization: Bearer <BRAIN_SYNC_TOKEN> on /api/*.
 * Conflict rule: last-write-wins by updatedAt; tombstones via deleted=1.
 */

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function unauthorized() {
  return json({ error: "missing or invalid bearer token" }, 401);
}

function selfCard(env) {
  return {
    id: "brain-edge",
    name: "SIRINX Brain @ Edge",
    capabilities: ["brain-sync", "brain-search"],
    endpoint: env.PUBLIC_URL || "https://sirinx-brain-sync.workers.dev",
    priority: 10,
  };
}

async function registerCard(db, card) {
  await db
    .prepare(
      `insert into a2a_agent_cards (id, name, capabilities, endpoint, priority, updated_at)
       values (?1, ?2, ?3, ?4, ?5, datetime('now'))
       on conflict(id) do update set
         name = excluded.name, capabilities = excluded.capabilities,
         endpoint = excluded.endpoint, priority = excluded.priority,
         updated_at = excluded.updated_at`
    )
    .bind(
      card.id,
      card.name || card.id,
      JSON.stringify(card.capabilities || []),
      card.endpoint || "",
      card.priority | 0
    )
    .run();
}

function rowToNote(row) {
  return {
    id: row.id,
    path: row.path,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags || "[]"),
    source: row.source,
    contentHash: row.content_hash,
    updatedAt: row.updated_at,
    deleted: !!row.deleted,
    // Hermes brain.mjs extras: {summary, headings, links, tasks, obsidianUrl}
    meta: JSON.parse(row.meta || "{}"),
  };
}

async function upsertNote(db, note) {
  // Last-write-wins: skip if we already hold a newer revision.
  const existing = await db
    .prepare("select updated_at from brain_notes where path = ?1")
    .bind(note.path)
    .first();
  if (existing && existing.updated_at >= note.updatedAt) return false;

  await db
    .prepare(
      `insert into brain_notes (id, path, title, content, tags, source, content_hash, updated_at, deleted, meta)
       values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
       on conflict(path) do update set
         title = excluded.title, content = excluded.content, tags = excluded.tags,
         source = excluded.source, content_hash = excluded.content_hash,
         updated_at = excluded.updated_at, deleted = excluded.deleted,
         meta = excluded.meta`
    )
    .bind(
      note.id || crypto.randomUUID(),
      note.path,
      note.title || note.path,
      note.content || "",
      JSON.stringify(note.tags || []),
      note.source || "obsidian",
      note.contentHash || "",
      note.updatedAt,
      note.deleted ? 1 : 0,
      JSON.stringify(note.meta || {})
    )
    .run();

  // Keep FTS in step (delete + reinsert by id).
  const idRow = await db
    .prepare("select id from brain_notes where path = ?1")
    .bind(note.path)
    .first();
  if (idRow) {
    await db.prepare("delete from brain_notes_fts where id = ?1").bind(idRow.id).run();
    if (!note.deleted) {
      await db
        .prepare("insert into brain_notes_fts (id, title, content) values (?1, ?2, ?3)")
        .bind(idRow.id, note.title || note.path, note.content || "")
        .run();
    }
  }
  return true;
}

async function handleSync(request, env) {
  const body = await request.json();
  const node = body.node || {};
  const since = body.since || "1970-01-01T00:00:00Z";
  const notes = Array.isArray(body.notes) ? body.notes : [];

  if (node.id) await registerCard(env.BRAIN_DB, node);

  let pushed = 0;
  for (const note of notes) {
    if (!note.path || !note.updatedAt) continue;
    if (await upsertNote(env.BRAIN_DB, note)) pushed += 1;
  }

  const changedRows = await env.BRAIN_DB.prepare(
    "select * from brain_notes where updated_at > ?1 order by updated_at limit 500"
  )
    .bind(since)
    .all();
  const changed = changedRows.results.map(rowToNote);

  const cardRows = await env.BRAIN_DB.prepare("select * from a2a_agent_cards").all();
  const peerAgents = cardRows.results.map((r) => ({
    id: r.id,
    name: r.name,
    capabilities: JSON.parse(r.capabilities || "[]"),
    endpoint: r.endpoint,
    priority: r.priority,
  }));

  await env.BRAIN_DB.prepare(
    "insert into brain_sync_log (node_id, pushed, pulled) values (?1, ?2, ?3)"
  )
    .bind(node.id || "unknown", pushed, changed.length)
    .run();

  return json({ node: selfCard(env), changed, peerAgents, pushed });
}

async function handleSearch(url, env) {
  const q = url.searchParams.get("q");
  if (!q) return json({ error: "q parameter required" }, 422);
  const rows = await env.BRAIN_DB.prepare(
    `select f.id, f.title, snippet(brain_notes_fts, 2, '[', ']', '…', 12) as snippet, n.path
     from brain_notes_fts f join brain_notes n on n.id = f.id
     where brain_notes_fts match ?1 and n.deleted = 0 limit 20`
  )
    .bind(q)
    .all();
  return json({ query: q, results: rows.results });
}

async function handleGetNote(url, env) {
  const path = url.searchParams.get("path");
  if (!path) return json({ error: "path parameter required" }, 422);
  const row = await env.BRAIN_DB.prepare(
    "select * from brain_notes where path = ?1 and deleted = 0"
  )
    .bind(path)
    .first();
  if (!row) return json({ error: "note not found" }, 404);
  return json(rowToNote(row));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "sirinx-brain-sync" });
    }

    if (url.pathname.startsWith("/api/")) {
      const auth = request.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!env.BRAIN_SYNC_TOKEN || token !== env.BRAIN_SYNC_TOKEN) {
        return unauthorized();
      }
    }

    try {
      if (url.pathname === "/api/brain/sync" && request.method === "POST") {
        return await handleSync(request, env);
      }
      if (url.pathname === "/api/brain/search" && request.method === "GET") {
        return await handleSearch(url, env);
      }
      if (url.pathname === "/api/brain/notes" && request.method === "GET") {
        return await handleGetNote(url, env);
      }
    } catch (err) {
      console.error("brain-sync error", err);
      return json({ error: "internal error" }, 500);
    }

    return json({ error: "not found" }, 404);
  },
};
