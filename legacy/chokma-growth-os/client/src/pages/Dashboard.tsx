import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, BadgeDollarSign, Bot, CircleGauge, Crown, Target, Users } from "lucide-react";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl tracking-tight">{value}</CardTitle>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function getLeadQualityLabel(score: number) {
  if (score >= 85) return "whale-ready";
  if (score >= 70) return "high intent";
  if (score >= 55) return "qualified";
  return "review";
}

export default function DashboardPage() {
  const refreshInterval = 10000;
  const snapshot = trpc.dashboard.snapshot.useQuery(undefined, { refetchInterval: refreshInterval });
  const actualVsResult = trpc.dashboard.actualVsResult.useQuery(undefined, { refetchInterval: refreshInterval });
  const affiliateOverview = trpc.dashboard.affiliateOverview.useQuery(undefined, { refetchInterval: refreshInterval });
  const operationalAlerts = trpc.dashboard.operationalAlerts.useQuery(undefined, { refetchInterval: refreshInterval });
  const recentLeads = trpc.leads.recent.useQuery(undefined, { refetchInterval: refreshInterval });
  const campaignPerformance = trpc.dashboard.campaignPerformance.useQuery(undefined, { refetchInterval: refreshInterval });

  const data = snapshot.data;
  const campaignMetrics = campaignPerformance.data ?? [];
  const automationRuns = actualVsResult.data?.automationRuns ?? [];
  const plannedActionsTotal = automationRuns.reduce((sum, run) => sum + Number(run.plannedActions ?? 0), 0);
  const actualActionsTotal = automationRuns.reduce((sum, run) => sum + Number(run.actualActions ?? 0), 0);
  const reviewRequiredCount = automationRuns.filter((run) => run.status === "review_required" || run.status === "failed").length;
  const completionRate = plannedActionsTotal > 0 ? (actualActionsTotal / plannedActionsTotal) * 100 : 0;
  const highIntentLeadCount = (recentLeads.data ?? []).filter((lead) => Number(lead.predictedValueScore ?? 0) >= 70).length;
  const referralReadyLeadCount = (recentLeads.data ?? []).filter((lead) => {
    const source = `${lead.utmSource ?? ""} ${lead.utmCampaign ?? ""} ${lead.sourceType ?? ""}`.toLowerCase();
    return source.includes("affiliate") || source.includes("refer");
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border/70 bg-[linear-gradient(135deg,rgba(9,19,40,1)_0%,rgba(19,42,88,1)_45%,rgba(114,88,24,1)_100%)] px-6 py-8 text-white shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Executive marketing cockpit</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">ศูนย์ควบคุมผลลัพธ์จริงของ lead, campaign และการดูแลลูกค้าขาใหญ่</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
                พื้นที่นี้ออกแบบเพื่อเชื่อมการได้มาของลูกค้า การติดตาม CRM การเคลื่อนไหวของแคมเปญ และผลจริงจากงานที่ระบบหรือ AI ดำเนินการไว้แล้วให้ผู้ดูแลตัดสินใจได้เร็วขึ้น
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Active campaigns</p>
                <p className="mt-3 text-2xl font-semibold">{data?.activeCampaigns ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Queued AI jobs</p>
                <p className="mt-3 text-2xl font-semibold">{data?.queuedAutomations ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Recent leads</p>
                <p className="mt-3 text-2xl font-semibold">{recentLeads.data?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Lead ใหม่"
            value={String(data?.newLeads ?? 0)}
            description="จำนวน lead ที่ถูกบันทึกเข้าระบบและพร้อมเข้าสู่การติดตามต่อใน CRM"
            icon={Users}
          />
          <StatCard
            title="ยอดฝากสะสม"
            value={`฿${Number(data?.totalDeposits ?? 0).toLocaleString()}`}
            description="มูลค่าการฝากทั้งหมดที่เชื่อมมาจาก lead และ campaign attribution"
            icon={BadgeDollarSign}
          />
          <StatCard
            title="Conversion Rate"
            value={`${Number(data?.conversionRate ?? 0).toFixed(1)}%`}
            description="สัดส่วนของ lead ที่ถูกเปลี่ยนเป็น converted lead จากข้อมูลในระบบจริง"
            icon={CircleGauge}
          />
          <StatCard
            title="ROI โดยรวม"
            value={`${Number(data?.roi ?? 0).toFixed(1)}%`}
            description="วัดความคุ้มค่าของการใช้ spend เทียบกับยอดฝากรวมที่ระบบเก็บได้"
            icon={ArrowUpRight}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>ภาพรวมแคมเปญที่ระบบมองเห็น</CardTitle>
              <CardDescription>ใช้เปรียบเทียบความพร้อมของ campaign, landing path, matched leads, converted leads และ estimated CPA แบบอัปเดตอัตโนมัติทุก 10 วินาที</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaignMetrics.length > 0 ? (
                campaignMetrics.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold tracking-tight">{campaign.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{campaign.objective || "ยังไม่มีคำอธิบายแคมเปญ"}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {campaign.status}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Channel</p>
                        <p className="mt-1 text-sm font-medium">{campaign.channel}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Spend</p>
                        <p className="mt-1 text-sm font-medium">฿{Number(campaign.spend ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Landing path</p>
                        <p className="mt-1 text-sm font-medium">{campaign.landingPath || "/"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Matched leads</p>
                        <p className="mt-1 text-sm font-medium">{campaign.leadCount}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Converted leads</p>
                        <p className="mt-1 text-sm font-medium">{campaign.convertedCount}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated CPA</p>
                        <p className="mt-1 text-sm font-medium">{campaign.estimatedCpa > 0 ? `฿${campaign.estimatedCpa.toFixed(0)}` : "รอ lead"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ROI</p>
                        <p className="mt-1 text-sm font-medium">{Number(campaign.roi ?? 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ยังไม่มี campaign ในฐานข้อมูลตอนนี้ แต่โครงสร้างพร้อมรองรับการบันทึกและวัดผลทันทีเมื่อเริ่มใช้งานจริง
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Actual vs Result</CardTitle>
              <CardDescription>เปรียบเทียบสิ่งที่ระบบหรือ AI ตั้งใจทำ จำนวน action ที่เกิดขึ้นจริง และรายการที่ต้อง review ต่อ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Planned actions</p>
                  <p className="mt-1 text-lg font-semibold">{plannedActionsTotal}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actual actions</p>
                  <p className="mt-1 text-lg font-semibold">{actualActionsTotal}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Completion rate</p>
                  <p className="mt-1 text-lg font-semibold">{completionRate.toFixed(0)}%</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Review required</p>
                  <p className="mt-1 text-lg font-semibold">{reviewRequiredCount}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Lead คุณภาพสูงที่เพิ่งเข้าระบบ</p>
                      <p className="text-xs text-muted-foreground">อ้างอิงจากคะแนนคุณภาพที่ระบบประเมินจากข้อมูลจริง</p>
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{highIntentLeadCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                  <div className="flex items-center gap-3 text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Lead สาย referral / affiliate</p>
                      <p className="text-xs text-amber-900/75">ใช้เป็นฐานตั้งต้นสำหรับ referral dashboard และการติดตาม partner traffic</p>
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-amber-950">{referralReadyLeadCount}</p>
                </div>
              </div>
              {automationRuns.length > 0 ? (
                automationRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium tracking-tight">{run.module}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{run.expectedResult || "ยังไม่ได้ระบุ expected result"}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{run.status}</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Planned / actual</p>
                        <p className="mt-1 font-medium">{run.plannedActions} / {run.actualActions}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actual result</p>
                        <p className="mt-1 font-medium">{run.actualResult || "รอผลลัพธ์จริง"}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Review notes</p>
                        <p className="mt-1 font-medium">{run.reviewNotes || "ไม่มีประเด็นต้อง review เพิ่ม"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ตอนนี้ยังไม่มี automation run ถูกบันทึก แต่ data model พร้อมใช้สำหรับติดตาม planned actions, actual actions และผลจริงของ workflow ที่จะต่อยอดภายหลัง
                </div>
              )}
               </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Referral / Affiliate Tracking</CardTitle>
              <CardDescription>มุมมองเริ่มต้นสำหรับ traffic ที่มาจาก partner, referral และ affiliate-style acquisition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Affiliate leads</p>
                  <p className="mt-1 text-lg font-semibold">{affiliateOverview.data?.affiliateLeadCount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">High-intent affiliate leads</p>
                  <p className="mt-1 text-lg font-semibold">{affiliateOverview.data?.highIntentAffiliateLeadCount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Affiliate campaigns</p>
                  <p className="mt-1 text-lg font-semibold">{affiliateOverview.data?.affiliateCampaignCount ?? 0}</p>
                </div>
              </div>
              {affiliateOverview.data?.recentAffiliateLeads?.length ? (
                <div className="space-y-3">
                  {affiliateOverview.data.recentAffiliateLeads.map((lead) => (
                    <div key={lead.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{lead.fullName || lead.phone || `Lead #${lead.id}`}</p>
                          <p className="text-muted-foreground">{lead.utmCampaign || lead.utmSource || lead.sourceType}</p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">score {lead.predictedValueScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ตอนนี้ยังไม่พบ lead สาย affiliate หรือ referral ในชุดข้อมูลล่าสุด แต่บล็อกนี้พร้อมใช้ทันทีเมื่อเริ่มติดแท็ก sourceType หรือ utm ที่เกี่ยวข้อง
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Operational Alerts</CardTitle>
              <CardDescription>ใช้เฝ้าระวังงานที่อาจสะดุด เช่น suspicious traffic, automation review และ queue backlog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open alerts</p>
                <p className="mt-1 text-lg font-semibold">{operationalAlerts.data?.alertCount ?? 0}</p>
              </div>
              {operationalAlerts.data?.alerts?.length ? (
                <div className="space-y-3">
                  {operationalAlerts.data.alerts.map((alert) => (
                    <div key={alert.code} className="rounded-2xl border border-border/70 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{alert.title}</p>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase text-muted-foreground">{alert.severity}</span>
                      </div>
                      <p className="mt-2 leading-6 text-muted-foreground">{alert.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ตอนนี้ยังไม่พบ operational alert ที่เปิดอยู่ ระบบจะแสดงรายการอัตโนมัติเมื่อเจอ suspicious traffic, automation run ที่ต้อง review หรือ queue backlog ที่มากผิดปกติ
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Lead ล่าสุดที่เข้าสู่ระบบ</CardTitle>
              <CardDescription>มองเห็นคุณภาพ lead ที่กำลังไหลเข้าจากหน้า Landing Page และแคมเปญต่าง ๆ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLeads.data && recentLeads.data.length > 0 ? (
                recentLeads.data.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold tracking-tight">{lead.fullName || lead.phone || `Lead #${lead.id}`}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{lead.phone || lead.lineId || lead.telegramHandle || "ยังไม่มีช่องทางติดต่อครบ"}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{lead.leadStatus}</div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">VIP tier</p>
                        <p className="mt-1 text-sm font-medium">{lead.vipTier}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Source</p>
                        <p className="mt-1 text-sm font-medium">{lead.utmSource || lead.sourceType}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Campaign</p>
                        <p className="mt-1 text-sm font-medium">{lead.utmCampaign || "unassigned"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Value score</p>
                        <p className="mt-1 text-sm font-medium">{lead.predictedValueScore}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Traffic label</p>
                        <p className="mt-1 text-sm font-medium">{getLeadQualityLabel(Number(lead.predictedValueScore ?? 0))}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ยังไม่มี lead ล่าสุดในฐานข้อมูล หากกรอกฟอร์มจากหน้า Landing Page ระบบจะเริ่มบันทึกและแสดงผลที่นี่ทันที
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>ทำไมระบบนี้เหมาะกับลูกค้าขาใหญ่</CardTitle>
              <CardDescription>กรอบคิดสำหรับ CRM และทีมติดตามลูกค้ามูลค่าสูง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-950">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5" />
                  <p className="font-medium">ระบบเก็บยอดฝากและสถานะ VIP แยกจาก lead status เพื่อไม่ให้การติดตามลูกค้าขาใหญ่ปะปนกับลีดทั่วไป</p>
                </div>
              </div>
              <p>
                เมื่อเชื่อมข้อมูลจาก lead form, CRM notes, deposit event และ actual-vs-result เข้าด้วยกัน ทีมงานจะมองเห็นได้ว่าลูกค้ากลุ่มใดควรได้รับการดูแลก่อน กลุ่มใดควรถูกย้ายเข้าสู่ VIP handling และ campaign ใดกำลังพาลูกค้ามูลค่าสูงเข้าระบบได้จริง
              </p>
              <p>
                ในเฟสถัดไป หน้า CRM จะต่อยอดส่วนนี้ด้วยหน้าจัดการ profile, follow-up notes และมุมมอง whale segmentation เพื่อให้การดำเนินงานย้ายจากการติดตามแบบกระจัดกระจายไปสู่การบริหารลูกค้าระดับมูลค่าสูงแบบมีโครงสร้าง
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
