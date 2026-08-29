-- SIRINX Brain @ Edge schema — applied to D1 `sirinx-unified-db`
-- (3d1da4d2-3f50-4ec8-ac2f-5be50f86bd2e) on 2026-07-18 via Cloudflare API.
-- Kept in-repo as the canonical copy; re-running is idempotent.

create table if not exists brain_notes (
  id text primary key,
  path text not null unique,
  title text not null,
  content text not null,
  tags text not null default '[]',
  source text not null default 'obsidian',
  content_hash text not null,
  updated_at text not null,
  deleted integer not null default 0,
  -- Hermes brain.mjs note extras: {summary, headings[], links, tasks{open,done,total}, obsidianUrl}
  meta text not null default '{}'
);
create index if not exists brain_notes_updated_idx on brain_notes (updated_at);
create index if not exists brain_notes_source_idx on brain_notes (source);

create virtual table if not exists brain_notes_fts using fts5(id unindexed, title, content);

create table if not exists brain_sync_log (
  id integer primary key autoincrement,
  node_id text not null,
  pushed integer not null default 0,
  pulled integer not null default 0,
  synced_at text not null default (datetime('now'))
);

create table if not exists a2a_agent_cards (
  id text primary key,
  name text not null,
  capabilities text not null default '[]',
  endpoint text not null,
  priority integer not null default 0,
  updated_at text not null default (datetime('now'))
);
