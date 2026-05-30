import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  addVipNote: vi.fn(),
  createAutomationRun: vi.fn(),
  createLead: vi.fn(),
  createLeadEvent: vi.fn(),
  createOrUpdateCustomerProfile: vi.fn(),
  getCampaignPerformance: vi.fn(),
  getDashboardSnapshot: vi.fn(),
  listDepositEventsForLead: vi.fn(),
  listAutomationRuns: vi.fn(),
  listBroadcastQueues: vi.fn(),
  listCampaigns: vi.fn(),
  listRecentLeads: vi.fn(),
  listVipNotesForLead: vi.fn(),
  listWhaleProfiles: vi.fn(),
  updateLeadStatus: vi.fn(),
}));
const notificationMocks = vi.hoisted(() => ({
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/notification", () => notificationMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUser(role: "user" | "admin" = "user"): AuthenticatedUser {
  return {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("marketing router", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach((mock) => mock.mockReset());
  });

  it("submits a lead with UTM metadata and creates an initial customer profile", async () => {
    dbMocks.createLead.mockResolvedValue(44);
    dbMocks.createLeadEvent.mockResolvedValue(88);
    dbMocks.createOrUpdateCustomerProfile.mockResolvedValue(12);
    dbMocks.createAutomationRun.mockResolvedValue(91);
    notificationMocks.notifyOwner.mockResolvedValue(true);

    const caller = appRouter.createCaller(createContext());

    const result = await caller.leads.submit({
      fullName: "Ton Whale",
      phone: "0890000000",
      lineId: "@tonwhale",
      landingPage: "/?utm_source=meta",
      referrer: "https://facebook.com",
      deviceType: "mobile",
      utmSource: "meta",
      utmMedium: "cpc",
      utmCampaign: "chokma-whale",
      utmContent: "payout-7000",
      utmTerm: "หวยจ่ายสูง",
      primaryIntent: "high-value lottery prospect",
      notes: "สนใจข้อเสนอ 4 ตัว 7,000 บาท",
      predictedValueScore: 85,
      sourceType: "ad",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        leadId: 44,
        trafficStatus: "trusted",
        vipTier: "whale",
        notificationDelivered: true,
      }),
    );
    expect(dbMocks.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: "meta",
        utmCampaign: "chokma-whale",
        predictedValueScore: "100.00",
        sourceType: "ad",
        vipTier: "whale",
      }),
    );
    expect(dbMocks.createLeadEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        leadId: 44,
        eventType: "form_submit",
      }),
    );
    expect(dbMocks.createLeadEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        leadId: 44,
        eventType: "ai_action",
        eventSource: "ai",
      }),
    );
    expect(dbMocks.createOrUpdateCustomerProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 44,
        vipLevel: "whale",
        segmentLabel: "High Intent Whale Prospect",
      }),
    );
    expect(notificationMocks.notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("lead คุณภาพสูง"),
        content: expect.stringContaining("คะแนนคุณภาพ: 100/100"),
      }),
    );
    expect(dbMocks.createAutomationRun).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "lead_scoring",
        status: "completed",
        targetEntityType: "lead",
        targetEntityId: 44,
      }),
    );
  });

  it("marks suspicious traffic for review and keeps the profile outside whale workflow", async () => {
    dbMocks.createLead.mockResolvedValue(45);
    dbMocks.createLeadEvent.mockResolvedValue(89);
    dbMocks.createOrUpdateCustomerProfile.mockResolvedValue(13);
    dbMocks.createAutomationRun.mockResolvedValue(92);
    notificationMocks.notifyOwner.mockResolvedValue(false);

    const caller = appRouter.createCaller(createContext());

    const result = await caller.leads.submit({
      fullName: "Test Lead Bot",
      landingPage: "/preview",
      referrer: "http://localhost:3000",
      deviceType: "unknown",
      notes: "testing flow before launch",
      sourceType: "manual",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        leadId: 45,
        trafficStatus: "suspicious",
        vipTier: "standard",
        notificationDelivered: false,
      }),
    );
    expect(dbMocks.createOrUpdateCustomerProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 45,
        vipLevel: "prospect",
        followUpStatus: "nurturing",
        segmentLabel: "Traffic Review Required",
      }),
    );
    expect(dbMocks.createAutomationRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "review_required",
        reviewNotes: expect.stringContaining("owner_notification_failed"),
      }),
    );
  });

  it("returns per-campaign analytics for dashboard ROI and CPA cards", async () => {
    dbMocks.getCampaignPerformance.mockResolvedValue([
      {
        id: 7,
        name: "CHOKMA Whale Meta",
        objective: "Lead acquisition",
        channel: "meta",
        status: "active",
        landingPath: "/",
        spend: 12000,
        leadCount: 24,
        convertedCount: 6,
        totalDeposits: 46000,
        estimatedCpa: 500,
        roi: 283.3,
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.dashboard.campaignPerformance();

    expect(dbMocks.getCampaignPerformance).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        name: "CHOKMA Whale Meta",
        estimatedCpa: 500,
        roi: 283.3,
      }),
    ]);
  });

  it("returns deposit history for a selected lead in crm", async () => {
    dbMocks.listDepositEventsForLead.mockResolvedValue([
      {
        id: 31,
        leadId: 44,
        campaignId: 7,
        depositType: "first",
        amount: "3500.00",
        occurredAt: new Date("2026-04-20T10:00:00Z"),
        createdAt: new Date("2026-04-20T10:05:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.crm.depositsByLead({ leadId: 44 });

    expect(dbMocks.listDepositEventsForLead).toHaveBeenCalledWith(44);
    expect(result).toEqual([
      expect.objectContaining({
        leadId: 44,
        depositType: "first",
        amount: "3500.00",
      }),
    ]);
  });

  it("rejects protected dashboard access when the user is not authenticated", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.dashboard.snapshot()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "UNAUTHORIZED",
    });
  });

  it("allows admin users to trigger owner notifications manually", async () => {
    notificationMocks.notifyOwner.mockResolvedValue(true);

    const caller = appRouter.createCaller(createContext(createUser("admin")));

    const result = await caller.system.notifyOwner({
      title: "CHOKMA ops alert",
      content: "มี lead ใหม่คุณภาพสูงเข้าสู่ระบบ",
    });

    expect(notificationMocks.notifyOwner).toHaveBeenCalledWith({
      title: "CHOKMA ops alert",
      content: "มี lead ใหม่คุณภาพสูงเข้าสู่ระบบ",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects manual owner notifications from non-admin users", async () => {
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(
      caller.system.notifyOwner({
        title: "CHOKMA ops alert",
        content: "มี lead ใหม่คุณภาพสูงเข้าสู่ระบบ",
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });

  it("builds actual-versus-result dashboard data from snapshot and automation runs", async () => {
    dbMocks.getDashboardSnapshot.mockResolvedValue({
      newLeads: 12,
      totalDeposits: 45000,
      conversionRate: 20,
      roi: 160,
      activeCampaigns: 3,
      queuedAutomations: 2,
    });
    dbMocks.listAutomationRuns.mockResolvedValue([
      {
        id: 1,
        module: "lead_scoring",
        status: "completed",
        plannedActions: 10,
        actualActions: 9,
        expectedResult: "จัดอันดับ whale prospects",
        actualResult: "จัดอันดับสำเร็จ 9 ราย",
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.dashboard.actualVsResult();

    expect(dbMocks.getDashboardSnapshot).toHaveBeenCalledTimes(1);
    expect(dbMocks.listAutomationRuns).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      summary: expect.objectContaining({
        newLeads: 12,
        totalDeposits: 45000,
      }),
      automationRuns: [
        expect.objectContaining({
          module: "lead_scoring",
          actualResult: "จัดอันดับสำเร็จ 9 ราย",
        }),
      ],
    });
  });

  it("summarizes affiliate overview from recent leads and campaign performance", async () => {
    dbMocks.listRecentLeads.mockResolvedValue([
      {
        id: 1,
        fullName: "Affiliate One",
        phone: "0800000001",
        sourceType: "affiliate",
        utmSource: "partner-network",
        utmCampaign: "affiliate-q2",
        utmContent: null,
        predictedValueScore: "78.00",
      },
      {
        id: 2,
        fullName: "Organic Lead",
        phone: "0800000002",
        sourceType: "organic",
        utmSource: "google",
        utmCampaign: "seo-core",
        utmContent: null,
        predictedValueScore: "61.00",
      },
    ]);
    dbMocks.getCampaignPerformance.mockResolvedValue([
      {
        id: 7,
        name: "affiliate-q2",
        channel: "affiliate",
        landingPath: "/partner/chokma",
      },
      {
        id: 8,
        name: "meta-scale",
        channel: "ad",
        landingPath: "/lp/main",
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));
    const result = await caller.dashboard.affiliateOverview();

    expect(result).toEqual(
      expect.objectContaining({
        affiliateLeadCount: 1,
        affiliateCampaignCount: 1,
        highIntentAffiliateLeadCount: 1,
      }),
    );
    expect(result.recentAffiliateLeads[0]).toMatchObject({
      fullName: "Affiliate One",
      utmCampaign: "affiliate-q2",
    });
  });

  it("builds operational alerts from suspicious leads, review-required automation and queue backlog", async () => {
    dbMocks.listRecentLeads.mockResolvedValue([
      {
        id: 1,
        predictedValueScore: "42.00",
      },
    ]);
    dbMocks.listAutomationRuns.mockResolvedValue([
      {
        id: 9,
        status: "review_required",
      },
    ]);
    dbMocks.listBroadcastQueues.mockResolvedValue([
      { id: 1, status: "ready" },
      { id: 2, status: "ready" },
      { id: 3, status: "ready" },
      { id: 4, status: "running" },
      { id: 5, status: "running" },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));
    const result = await caller.dashboard.operationalAlerts();

    expect(result.alertCount).toBe(3);
    expect(result.alerts.map((alert) => alert.code)).toEqual([
      "suspicious_traffic",
      "automation_review_required",
      "queue_backlog",
    ]);
  });
});
