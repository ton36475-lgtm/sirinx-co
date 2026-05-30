import { eq, desc, and, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertLead, leads,
  InsertBlogPost, blogPosts,
  InsertProject, projects,
  InsertContactSubmission, contactSubmissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USERS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== LEADS ====================

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  return { id: result[0].insertId };
}

export async function getLeads(opts?: { status?: string; source?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];
  if (opts?.status) conditions.push(eq(leads.status, opts.status as any));
  if (opts?.source) conditions.push(eq(leads.source, opts.source));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  return rows;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
  return { success: true };
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use SQL aggregation instead of fetching all rows
  const [totalResult] = await db.select({ count: count() }).from(leads);
  const total = totalResult?.count ?? 0;
  const statusRows = await db.select({ status: leads.status, count: count() }).from(leads).groupBy(leads.status);
  const sourceRows = await db.select({ source: leads.source, count: count() }).from(leads).groupBy(leads.source);
  const byStatus: Record<string, number> = {};
  for (const row of statusRows) byStatus[row.status] = row.count;
  const bySource: Record<string, number> = {};
  for (const row of sourceRows) bySource[row.source] = row.count;
  return { total, byStatus, bySource };
}

// ==================== BLOG POSTS ====================

export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(blogPosts).values(data);
  return { id: result[0].insertId };
}

export async function getBlogPosts(opts?: { published?: boolean; category?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];
  if (opts?.published !== undefined) conditions.push(eq(blogPosts.published, opts.published));
  if (opts?.category) conditions.push(eq(blogPosts.category, opts.category));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(blogPosts)
    .where(where)
    .orderBy(desc(blogPosts.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  return rows;
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getBlogPostById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
  return { success: true };
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return { success: true };
}

// ==================== PROJECTS ====================

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return { id: result[0].insertId };
}

export async function getProjects(opts?: { published?: boolean; tag?: string; limit?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];
  if (opts?.published !== undefined) conditions.push(eq(projects.published, opts.published));
  if (opts?.tag) conditions.push(eq(projects.tag, opts.tag));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(desc(projects.sortOrder))
    .limit(opts?.limit ?? 100);
  return rows;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
  return { success: true };
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
  return { success: true };
}

// ==================== CONTACT SUBMISSIONS ====================

export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(data);
  return { id: result[0].insertId };
}

export async function getContactSubmissions(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  return rows;
}

// ==================== ANALYTICS: PAGE VIEWS ====================

import {
  InsertPageView, pageViews,
  InsertEvent, events,
} from "../drizzle/schema";
import { gte } from "drizzle-orm";

export async function recordPageView(data: InsertPageView) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pageViews).values(data);
  return { success: true };
}

export async function recordEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(events).values(data);
  return { success: true };
}

/**
 * Get page view analytics for admin dashboard.
 * Returns daily page views, unique visitors, top pages, top referrers.
 */
export async function getPageViewAnalytics(opts?: { days?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const daysBack = opts?.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // All page views in range
  const allViews = await db
    .select()
    .from(pageViews)
    .where(gte(pageViews.createdAt, since))
    .orderBy(desc(pageViews.createdAt));

  // Daily aggregation
  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
  const topPagesMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const utmSourceMap = new Map<string, number>();
  const uniqueVisitors = new Set<string>();

  for (const view of allViews) {
    const dateKey = view.createdAt.toISOString().split("T")[0];

    // Daily stats
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { views: 0, visitors: new Set() });
    }
    const day = dailyMap.get(dateKey)!;
    day.views++;
    if (view.visitorId) {
      day.visitors.add(view.visitorId);
      uniqueVisitors.add(view.visitorId);
    }

    // Top pages
    topPagesMap.set(view.path, (topPagesMap.get(view.path) || 0) + 1);

    // Top referrers
    if (view.referrer) {
      try {
        const refHost = new URL(view.referrer).hostname;
        if (refHost) referrerMap.set(refHost, (referrerMap.get(refHost) || 0) + 1);
      } catch {
        referrerMap.set(view.referrer, (referrerMap.get(view.referrer) || 0) + 1);
      }
    }

    // Device types
    if (view.deviceType) {
      deviceMap.set(view.deviceType, (deviceMap.get(view.deviceType) || 0) + 1);
    }

    // UTM sources
    if (view.utmSource) {
      utmSourceMap.set(view.utmSource, (utmSourceMap.get(view.utmSource) || 0) + 1);
    }
  }

  // Convert daily map to sorted array
  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, views: data.views, uniqueVisitors: data.visitors.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top pages sorted by views
  const topPages = Array.from(topPagesMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  // Top referrers
  const topReferrers = Array.from(referrerMap.entries())
    .map(([referrer, views]) => ({ referrer, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  // Device breakdown
  const devices = Array.from(deviceMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // UTM sources
  const utmSources = Array.from(utmSourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totalViews: allViews.length,
    uniqueVisitors: uniqueVisitors.size,
    daily,
    topPages,
    topReferrers,
    devices,
    utmSources,
    period: { from: since.toISOString(), to: new Date().toISOString(), days: daysBack },
  };
}

/**
 * Get event analytics for admin dashboard.
 * Returns event counts by category, top actions, conversion funnel.
 */
export async function getEventAnalytics(opts?: { days?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const daysBack = opts?.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const allEvents = await db
    .select()
    .from(events)
    .where(gte(events.createdAt, since))
    .orderBy(desc(events.createdAt));

  // Category aggregation
  const categoryMap = new Map<string, number>();
  const actionMap = new Map<string, number>();
  const dailyEventsMap = new Map<string, number>();

  for (const evt of allEvents) {
    categoryMap.set(evt.category, (categoryMap.get(evt.category) || 0) + 1);

    const actionKey = `${evt.category}:${evt.action}`;
    actionMap.set(actionKey, (actionMap.get(actionKey) || 0) + 1);

    const dateKey = evt.createdAt.toISOString().split("T")[0];
    dailyEventsMap.set(dateKey, (dailyEventsMap.get(dateKey) || 0) + 1);
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const topActions = Array.from(actionMap.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const dailyEvents = Array.from(dailyEventsMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Real conversion funnel: page_view → cta_click → form_submit → lead_created
  // Use SQL COUNT instead of fetching all rows for performance
  const [leadCountResult] = await db
    .select({ count: count() })
    .from(leads)
    .where(gte(leads.createdAt, since));

  const [pvCountResult] = await db
    .select({ count: count() })
    .from(pageViews)
    .where(gte(pageViews.createdAt, since));

  const funnelStages = [
    { stage: "Page Views", count: pvCountResult?.count ?? 0 },
    { stage: "CTA Clicks", count: categoryMap.get("cta_click") || 0 },
    { stage: "Form Submits", count: categoryMap.get("form_submit") || 0 },
    { stage: "Leads Created", count: leadCountResult?.count ?? 0 },
    { stage: "LINE Clicks", count: categoryMap.get("line_click") || 0 },
  ];

  // Lead source attribution via SQL aggregation
  const leadSourceRows = await db
    .select({ source: leads.source, count: count() })
    .from(leads)
    .where(gte(leads.createdAt, since))
    .groupBy(leads.source);
  const leadSources = leadSourceRows
    .map((row) => ({ source: row.source || "unknown", count: row.count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: allEvents.length,
    byCategory,
    topActions,
    dailyEvents,
    funnelStages,
    leadSources,
    period: { from: since.toISOString(), to: new Date().toISOString(), days: daysBack },
  };
}
