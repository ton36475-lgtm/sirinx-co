import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table — captures inquiries from Contact form, Solar Assessment, and Partner page.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Lead source: contact, assessment, partner, line */
  source: varchar("source", { length: 32 }).notNull().default("contact"),
  /** Lead status workflow */
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
  /** Contact info */
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  /** Business details */
  industry: varchar("industry", { length: 100 }),
  interest: varchar("interest", { length: 255 }),
  budget: varchar("budget", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  /** Solar assessment data (prefilled from calculator) */
  systemSize: varchar("systemSize", { length: 50 }),
  systemType: varchar("systemType", { length: 100 }),
  monthlyBill: varchar("monthlyBill", { length: 50 }),
  bessInterest: varchar("bessInterest", { length: 10 }),
  /** Free-form message */
  message: text("message"),
  /** Admin notes */
  adminNotes: text("adminNotes"),
  /** LINE user ID if came from LINE */
  lineUserId: varchar("lineUserId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Blog posts table — CMS for articles/insights.
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  /** Cover image URL (CDN) */
  coverImage: text("coverImage"),
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // JSON array stored as text
  author: varchar("author", { length: 255 }).default("SIRINX Team"),
  /** Draft/Published workflow */
  published: boolean("published").default(false).notNull(),
  /** Reading time in minutes */
  readTime: int("readTime").default(5),
  /** SEO fields */
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  /** Admin who created/edited */
  authorId: int("authorId"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Projects table — portfolio of solar installations.
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  location: varchar("location", { length: 255 }),
  type: varchar("type", { length: 100 }),
  capacity: varchar("capacity", { length: 100 }),
  saving: varchar("saving", { length: 255 }),
  year: varchar("year", { length: 10 }),
  description: text("description"),
  /** Cover image URL (CDN) */
  image: text("image"),
  /** Additional gallery images (JSON array of URLs) */
  galleryImages: text("galleryImages"),
  /** Filter tag: rooftop, floating, carport, bess */
  tag: varchar("tag", { length: 50 }),
  /** Display order */
  sortOrder: int("sortOrder").default(0),
  /** Whether to show on public site */
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Contact submissions table — raw form submissions for audit trail.
 */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Links to leads table if converted */
  leadId: int("leadId"),
  /** Raw form data as JSON */
  formData: text("formData").notNull(),
  /** Source page */
  sourcePage: varchar("sourcePage", { length: 100 }).default("contact"),
  /** IP address for spam prevention */
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Page views table — tracks every page visit for traffic analytics.
 */
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  /** URL path visited (e.g. /solutions, /contact) */
  path: varchar("path", { length: 500 }).notNull(),
  /** Referrer URL */
  referrer: text("referrer"),
  /** UTM parameters stored as JSON */
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  /** Visitor fingerprint (hashed IP + UA for unique visitor counting, no PII) */
  visitorId: varchar("visitorId", { length: 64 }),
  /** Session ID to group page views in a single visit */
  sessionId: varchar("sessionId", { length: 64 }),
  /** Device info */
  userAgent: text("userAgent"),
  deviceType: varchar("deviceType", { length: 20 }), // desktop, mobile, tablet
  /** Country/region from IP (optional) */
  country: varchar("country", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

/**
 * Events table — tracks user actions (CTA clicks, form submissions, LINE clicks, etc.)
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  /** Event category: cta_click, form_submit, line_click, download, scroll_depth */
  category: varchar("category", { length: 50 }).notNull(),
  /** Specific action: e.g. "contact_form_submit", "hero_cta_click" */
  action: varchar("action", { length: 100 }).notNull(),
  /** Label for additional context (e.g. button text, page section) */
  label: varchar("label", { length: 255 }),
  /** Numeric value (e.g. scroll percentage, form field count) */
  value: int("value"),
  /** Page where event occurred */
  pagePath: varchar("pagePath", { length: 500 }),
  /** Visitor fingerprint (same as page_views) */
  visitorId: varchar("visitorId", { length: 64 }),
  sessionId: varchar("sessionId", { length: 64 }),
  /** Optional metadata as JSON */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
