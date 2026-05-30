import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  channel: mysqlEnum("channel", ["ad", "organic", "affiliate", "broadcast", "crm", "manual"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  landingPath: varchar("landingPath", { length: 255 }),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0.00").notNull(),
  targetCpa: decimal("targetCpa", { precision: 12, scale: 2 }),
  targetRoi: decimal("targetRoi", { precision: 10, scale: 2 }),
  objective: text("objective"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").references(() => campaigns.id),
  fullName: varchar("fullName", { length: 160 }),
  phone: varchar("phone", { length: 32 }),
  lineId: varchar("lineId", { length: 64 }),
  telegramHandle: varchar("telegramHandle", { length: 64 }),
  sourceType: mysqlEnum("sourceType", ["ad", "organic", "direct", "affiliate", "broadcast", "manual"]).default("manual").notNull(),
  leadStatus: mysqlEnum("leadStatus", ["new", "contacted", "qualified", "registered", "depositing", "converted", "lost"]).default("new").notNull(),
  vipTier: mysqlEnum("vipTier", ["standard", "vip", "vvip", "whale"]).default("standard").notNull(),
  landingPage: varchar("landingPage", { length: 255 }),
  referrer: varchar("referrer", { length: 255 }),
  deviceType: mysqlEnum("deviceType", ["mobile", "desktop", "tablet", "unknown"]).default("unknown").notNull(),
  utmSource: varchar("utmSource", { length: 120 }),
  utmMedium: varchar("utmMedium", { length: 120 }),
  utmCampaign: varchar("utmCampaign", { length: 120 }),
  utmContent: varchar("utmContent", { length: 120 }),
  utmTerm: varchar("utmTerm", { length: 120 }),
  primaryIntent: varchar("primaryIntent", { length: 120 }),
  predictedValueScore: decimal("predictedValueScore", { precision: 6, scale: 2 }).default("0.00").notNull(),
  acquisitionCost: decimal("acquisitionCost", { precision: 12, scale: 2 }).default("0.00").notNull(),
  notes: text("notes"),
  firstDepositAt: timestamp("firstDepositAt"),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leadEvents = mysqlTable("leadEvents", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  campaignId: int("campaignId").references(() => campaigns.id),
  eventType: mysqlEnum("eventType", ["page_view", "form_submit", "contact", "register", "deposit", "status_change", "note_added", "ai_action", "broadcast_sent", "broadcast_reply"]).notNull(),
  eventSource: mysqlEnum("eventSource", ["system", "user", "ai", "import", "api"]).default("system").notNull(),
  valueAmount: decimal("valueAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customerProfiles = mysqlTable("customerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().unique().references(() => leads.id),
  assignedUserId: int("assignedUserId").references(() => users.id),
  vipLevel: mysqlEnum("vipLevel", ["prospect", "vip", "vvip", "whale"]).default("prospect").notNull(),
  cumulativeDeposit: decimal("cumulativeDeposit", { precision: 12, scale: 2 }).default("0.00").notNull(),
  lifetimeRevenue: decimal("lifetimeRevenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  followUpStatus: mysqlEnum("followUpStatus", ["pending", "active", "nurturing", "retained", "churn_risk", "closed"]).default("pending").notNull(),
  preferredLottery: varchar("preferredLottery", { length: 160 }),
  affordabilityBand: mysqlEnum("affordabilityBand", ["unknown", "mid", "high", "whale"]).default("unknown").notNull(),
  segmentLabel: varchar("segmentLabel", { length: 160 }),
  lastContactAt: timestamp("lastContactAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vipNotes = mysqlTable("vipNotes", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  authorUserId: int("authorUserId").references(() => users.id),
  noteType: mysqlEnum("noteType", ["call", "chat", "deposit", "insight", "reminder", "system"]).default("insight").notNull(),
  content: text("content").notNull(),
  nextActionAt: timestamp("nextActionAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const depositEvents = mysqlTable("depositEvents", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  campaignId: int("campaignId").references(() => campaigns.id),
  depositType: mysqlEnum("depositType", ["first", "repeat", "manual_adjustment"]).default("repeat").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const automationRuns = mysqlTable("automationRuns", {
  id: int("id").autoincrement().primaryKey(),
  module: mysqlEnum("module", ["lead_scoring", "broadcast_followup", "campaign_optimizer", "crm_summary"]).notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed", "review_required"]).default("queued").notNull(),
  targetEntityType: mysqlEnum("targetEntityType", ["campaign", "lead", "segment", "system"]).default("system").notNull(),
  targetEntityId: int("targetEntityId"),
  plannedActions: int("plannedActions").default(0).notNull(),
  actualActions: int("actualActions").default(0).notNull(),
  expectedResult: text("expectedResult"),
  actualResult: text("actualResult"),
  reviewNotes: text("reviewNotes"),
  startedAt: timestamp("startedAt"),
  finishedAt: timestamp("finishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const broadcastQueues = mysqlTable("broadcastQueues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  sourceSystem: mysqlEnum("sourceSystem", ["broadpung", "manual", "system"]).default("manual").notNull(),
  channel: mysqlEnum("channel", ["line", "telegram", "sms", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["draft", "ready", "running", "paused", "completed"]).default("draft").notNull(),
  segmentLabel: varchar("segmentLabel", { length: 160 }),
  scheduledAt: timestamp("scheduledAt"),
  sentCount: int("sentCount").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  conversionCount: int("conversionCount").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type LeadEvent = typeof leadEvents.$inferSelect;
export type InsertLeadEvent = typeof leadEvents.$inferInsert;

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

export type VipNote = typeof vipNotes.$inferSelect;
export type InsertVipNote = typeof vipNotes.$inferInsert;

export type DepositEvent = typeof depositEvents.$inferSelect;
export type InsertDepositEvent = typeof depositEvents.$inferInsert;

export type AutomationRun = typeof automationRuns.$inferSelect;
export type InsertAutomationRun = typeof automationRuns.$inferInsert;

export type BroadcastQueue = typeof broadcastQueues.$inferSelect;
export type InsertBroadcastQueue = typeof broadcastQueues.$inferInsert;
