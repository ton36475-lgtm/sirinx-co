import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  automationRuns,
  broadcastQueues,
  campaigns,
  customerProfiles,
  depositEvents,
  InsertAutomationRun,
  InsertBroadcastQueue,
  InsertCampaign,
  InsertCustomerProfile,
  InsertDepositEvent,
  InsertLead,
  InsertLeadEvent,
  InsertUser,
  InsertVipNote,
  leadEvents,
  leads,
  users,
  vipNotes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

type InsertResultLike = {
  insertId?: number;
};

function extractInsertId(result: unknown): number {
  const maybe = result as InsertResultLike;
  return typeof maybe?.insertId === "number" ? maybe.insertId : 0;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
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
    const values: InsertUser = {
      openId: user.openId,
    };
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaign(input: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(campaigns).values(input);
  return extractInsertId(result);
}

export async function listCampaigns() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function createLead(input: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(input);
  return extractInsertId(result);
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function listRecentLeads(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}

export async function updateLeadStatus(id: number, leadStatus: InsertLead["leadStatus"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads).set({ leadStatus, lastActivityAt: new Date() }).where(eq(leads.id, id));
}

export async function createLeadEvent(input: InsertLeadEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leadEvents).values(input);
  return extractInsertId(result);
}

export async function createOrUpdateCustomerProfile(input: InsertCustomerProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.leadId, input.leadId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(customerProfiles)
      .set({
        assignedUserId: input.assignedUserId,
        vipLevel: input.vipLevel,
        cumulativeDeposit: input.cumulativeDeposit,
        lifetimeRevenue: input.lifetimeRevenue,
        followUpStatus: input.followUpStatus,
        preferredLottery: input.preferredLottery,
        affordabilityBand: input.affordabilityBand,
        segmentLabel: input.segmentLabel,
        lastContactAt: input.lastContactAt,
        nextFollowUpAt: input.nextFollowUpAt,
      })
      .where(eq(customerProfiles.leadId, input.leadId));

    return existing[0].id;
  }

  const result = await db.insert(customerProfiles).values(input);
  return extractInsertId(result);
}

export async function listWhaleProfiles() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.vipLevel, "whale"))
    .orderBy(desc(customerProfiles.cumulativeDeposit));
}

export async function addVipNote(input: InsertVipNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vipNotes).values(input);
  return extractInsertId(result);
}

export async function listVipNotesForLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(vipNotes).where(eq(vipNotes.leadId, leadId)).orderBy(desc(vipNotes.createdAt));
}

export async function createDepositEvent(input: InsertDepositEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(depositEvents).values(input);
  return extractInsertId(result);
}

export async function listDepositEventsForLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(depositEvents)
    .where(eq(depositEvents.leadId, leadId))
    .orderBy(desc(depositEvents.occurredAt), desc(depositEvents.createdAt));
}

export async function createAutomationRun(input: InsertAutomationRun) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(automationRuns).values(input);
  return extractInsertId(result);
}

export async function listAutomationRuns(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(automationRuns).orderBy(desc(automationRuns.createdAt)).limit(limit);
}

export async function createBroadcastQueue(input: InsertBroadcastQueue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(broadcastQueues).values(input);
  return extractInsertId(result);
}

export async function listBroadcastQueues(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(broadcastQueues).orderBy(desc(broadcastQueues.createdAt)).limit(limit);
}

export async function getCampaignPerformance() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      objective: campaigns.objective,
      channel: campaigns.channel,
      status: campaigns.status,
      landingPath: campaigns.landingPath,
      spend: campaigns.spend,
      leadCount: sql<number>`(
        select count(*)
        from ${leads}
        where ${leads.campaignId} = ${campaigns.id}
      )`,
      convertedCount: sql<number>`(
        select count(*)
        from ${leads}
        where ${leads.campaignId} = ${campaigns.id}
          and ${leads.leadStatus} = 'converted'
      )`,
      totalDeposits: sql<number>`(
        select coalesce(sum(${depositEvents.amount}), 0)
        from ${depositEvents}
        where ${depositEvents.campaignId} = ${campaigns.id}
      )`,
    })
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

  return rows.map((row) => {
    const spend = Number(row.spend ?? 0);
    const leadCount = Number(row.leadCount ?? 0);
    const convertedCount = Number(row.convertedCount ?? 0);
    const totalDeposits = Number(row.totalDeposits ?? 0);
    const estimatedCpa = leadCount > 0 ? spend / leadCount : 0;
    const roi = spend > 0 ? ((totalDeposits - spend) / spend) * 100 : 0;

    return {
      ...row,
      spend,
      leadCount,
      convertedCount,
      totalDeposits,
      estimatedCpa,
      roi,
    };
  });
}

export async function getDashboardSnapshot() {
  const db = await getDb();
  if (!db) {
    return {
      newLeads: 0,
      convertedLeads: 0,
      totalDeposits: 0,
      totalSpend: 0,
      conversionRate: 0,
      roi: 0,
      costPerAcquisition: 0,
      activeCampaigns: 0,
      queuedAutomations: 0,
    };
  }

  const [leadCountRow] = await db.select({ value: sql<number>`count(*)` }).from(leads);
  const [convertedCountRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.leadStatus, "converted"));
  const [depositTotalRow] = await db
    .select({ value: sql<number>`coalesce(sum(${depositEvents.amount}), 0)` })
    .from(depositEvents);
  const [spendTotalRow] = await db
    .select({ value: sql<number>`coalesce(sum(${campaigns.spend}), 0)` })
    .from(campaigns);
  const [activeCampaignRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(campaigns)
    .where(eq(campaigns.status, "active"));
  const [queuedAutomationRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(automationRuns)
    .where(eq(automationRuns.status, "queued"));

  const newLeads = Number(leadCountRow?.value ?? 0);
  const convertedLeads = Number(convertedCountRow?.value ?? 0);
  const totalDeposits = Number(depositTotalRow?.value ?? 0);
  const totalSpend = Number(spendTotalRow?.value ?? 0);
  const activeCampaigns = Number(activeCampaignRow?.value ?? 0);
  const queuedAutomations = Number(queuedAutomationRow?.value ?? 0);
  const conversionRate = newLeads > 0 ? (convertedLeads / newLeads) * 100 : 0;
  const costPerAcquisition = convertedLeads > 0 ? totalSpend / convertedLeads : 0;
  const roi = totalSpend > 0 ? ((totalDeposits - totalSpend) / totalSpend) * 100 : 0;

  return {
    newLeads,
    convertedLeads,
    totalDeposits,
    totalSpend,
    conversionRate,
    roi,
    costPerAcquisition,
    activeCampaigns,
    queuedAutomations,
  };
}
