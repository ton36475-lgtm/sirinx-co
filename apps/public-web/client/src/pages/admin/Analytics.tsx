import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Eye, Users, MousePointerClick, TrendingUp,
  Globe, Smartphone, Monitor, Tablet, ArrowUpRight,
  Calendar, Activity, Target, Megaphone
} from "lucide-react";

// ==================== MINI BAR CHART (Pure CSS) ====================

function MiniBarChart({ data, maxValue, color = "bg-accent-primary" }: {
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 truncate shrink-0" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== SPARKLINE (Pure CSS) ====================

function Sparkline({ data, height = 60 }: { data: number[]; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = Math.max(2, Math.floor(100 / data.length));

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="bg-accent-primary/70 hover:bg-accent-primary rounded-t transition-all duration-200"
          style={{
            height: `${(val / max) * 100}%`,
            minHeight: val > 0 ? 2 : 0,
            flex: 1,
          }}
          title={`${val}`}
        />
      ))}
    </div>
  );
}

// ==================== FUNNEL VISUALIZATION ====================

function ConversionFunnel({ stages }: { stages: { stage: string; count: number }[] }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = Math.max(10, (stage.count / maxCount) * 100);
        const prevCount = i > 0 ? stages[i - 1].count : 0;
        const convRate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : null;

        return (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{stage.stage}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{stage.count.toLocaleString()}</span>
                {convRate && i > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {convRate}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="h-6 bg-muted/20 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-primary/60 rounded transition-all duration-700"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== DEVICE ICON ====================

function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case "mobile": return <Smartphone className="w-4 h-4" />;
    case "tablet": return <Tablet className="w-4 h-4" />;
    default: return <Monitor className="w-4 h-4" />;
  }
}

// ==================== MAIN ANALYTICS DASHBOARD ====================

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);

  const { data: pvData, isLoading: pvLoading } = trpc.analytics.pageViews.useQuery({ days });
  const { data: evData, isLoading: evLoading } = trpc.analytics.events.useQuery({ days });

  const isLoading = pvLoading || evLoading;

  // Compute combined funnel with real page view count
  const funnel = useMemo(() => {
    if (!pvData || !evData) return [];
    const funnelStages = [...(evData.funnelStages || [])];
    // Set page views count from actual data
    const pvStage = funnelStages.find(s => s.stage === "Page Views");
    if (pvStage) pvStage.count = pvData.totalViews;
    return funnelStages;
  }, [pvData, evData]);

  // Daily sparkline data
  const dailyViewCounts = useMemo(() => {
    if (!pvData?.daily) return [];
    return pvData.daily.map(d => d.views);
  }, [pvData]);

  const dailyUVCounts = useMemo(() => {
    if (!pvData?.daily) return [];
    return pvData.daily.map(d => d.uniqueVisitors);
  }, [pvData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent-primary" />
            Traffic Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            วัดผลทราฟฟิกและ Conversion แบบ Real-time
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                days === d
                  ? "bg-accent-primary text-white"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-16 bg-muted/30 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-accent-primary" />
                  <Badge variant="outline" className="text-[10px]">{days}D</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {(pvData?.totalViews || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Page Views</p>
                <div className="mt-3">
                  <Sparkline data={dailyViewCounts} height={32} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <Badge variant="outline" className="text-[10px]">{days}D</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {(pvData?.uniqueVisitors || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique Visitors</p>
                <div className="mt-3">
                  <Sparkline data={dailyUVCounts} height={32} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <MousePointerClick className="w-5 h-5 text-amber-500" />
                  <Badge variant="outline" className="text-[10px]">{days}D</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {(evData?.totalEvents || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Events</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  <Badge variant="outline" className="text-[10px]">{days}D</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {pvData && pvData.totalViews > 0
                    ? ((pvData.uniqueVisitors / pvData.totalViews) * 100).toFixed(1) + "%"
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">UV/PV Ratio</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid: Top Pages + Conversion Funnel */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent-primary" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pvData?.topPages && pvData.topPages.length > 0 ? (
                  <MiniBarChart
                    data={pvData.topPages.slice(0, 10).map(p => ({
                      label: p.path === "/" ? "หน้าหลัก" : p.path,
                      value: p.views,
                    }))}
                    maxValue={pvData.topPages[0]?.views || 1}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
                )}
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-primary" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {funnel.length > 0 ? (
                  <ConversionFunnel stages={funnel} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Grid: Referrers + Devices + UTM Sources + Event Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top Referrers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pvData?.topReferrers && pvData.topReferrers.length > 0 ? (
                  <div className="space-y-2">
                    {pvData.topReferrers.slice(0, 8).map((ref, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={ref.referrer}>
                          {ref.referrer}
                        </span>
                        <span className="text-xs font-medium">{ref.views}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Direct traffic</p>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pvData?.devices && pvData.devices.length > 0 ? (
                  <div className="space-y-3">
                    {pvData.devices.map((dev, i) => {
                      const total = pvData.devices.reduce((sum, d) => sum + d.count, 0);
                      const pct = total > 0 ? ((dev.count / total) * 100).toFixed(0) : "0";
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <DeviceIcon type={dev.type} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium capitalize">{dev.type}</span>
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full mt-1">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
                )}
              </CardContent>
            </Card>

            {/* UTM Sources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-orange-500" />
                  UTM Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pvData?.utmSources && pvData.utmSources.length > 0 ? (
                  <div className="space-y-2">
                    {pvData.utmSources.slice(0, 8).map((src, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {src.source}
                        </span>
                        <span className="text-xs font-medium">{src.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มี UTM</p>
                )}
              </CardContent>
            </Card>

            {/* Event Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-amber-500" />
                  Event Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evData?.byCategory && evData.byCategory.length > 0 ? (
                  <div className="space-y-2">
                    {evData.byCategory.slice(0, 8).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {cat.category}
                        </span>
                        <span className="text-xs font-medium">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มี events</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lead Source Attribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Lead Source Attribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evData?.leadSources && evData.leadSources.length > 0 ? (
                  <MiniBarChart
                    data={evData.leadSources.map(s => ({
                      label: s.source === "contact" ? "ฟอร์มติดต่อ" : s.source === "assessment" ? "Solar Assessment" : s.source === "partner" ? "Partner" : s.source === "line" ? "LINE OA" : s.source,
                      value: s.count,
                    }))}
                    maxValue={evData.leadSources[0]?.count || 1}
                    color="bg-green-500"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มี leads</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Views Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-primary" />
                Daily Traffic ({days} Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pvData?.daily && pvData.daily.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Page Views</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Unique Visitors</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Pages/Visitor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pvData.daily.slice().reverse().slice(0, 30).map((day) => (
                        <tr key={day.date} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium">{day.date}</td>
                          <td className="py-2 px-3 text-right">{day.views.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">{day.uniqueVisitors.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            {day.uniqueVisitors > 0
                              ? (day.views / day.uniqueVisitors).toFixed(1)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  ยังไม่มีข้อมูลทราฟฟิก — เมื่อมีผู้เข้าชมเว็บไซต์ ข้อมูลจะแสดงที่นี่
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Actions Table */}
          {evData?.topActions && evData.topActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-accent-primary" />
                  Top Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Category</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Action</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evData.topActions.slice(0, 15).map((act, i) => {
                        const [cat, ...actionParts] = act.action.split(":");
                        return (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-[10px]">{cat}</Badge>
                            </td>
                            <td className="py-2 px-3 font-medium">{actionParts.join(":") || cat}</td>
                            <td className="py-2 px-3 text-right">{act.count.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
