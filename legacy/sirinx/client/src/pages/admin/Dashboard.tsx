import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, FolderOpen, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "คุณสมบัติผ่าน",
  proposal: "ส่งข้อเสนอ",
  won: "ปิดการขาย",
  lost: "ไม่สำเร็จ",
};

const statusColors: Record<string, string> = {
  new: "text-blue-400",
  contacted: "text-cyan-400",
  qualified: "text-amber-400",
  proposal: "text-purple-400",
  won: "text-green-400",
  lost: "text-red-400",
};

export default function AdminDashboard() {
  const { data: leadStats, isLoading: loadingStats } = trpc.lead.stats.useQuery();
  const { data: recentLeads, isLoading: loadingLeads } = trpc.lead.list.useQuery({ limit: 5 });
  const { data: blogPosts, isLoading: loadingBlog } = trpc.blog.adminList.useQuery({ limit: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">ภาพรวมระบบ SIRINX Admin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads ทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "..." : leadStats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads ใหม่</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {loadingStats ? "..." : leadStats?.byStatus?.new ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ปิดการขาย</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {loadingStats ? "..." : leadStats?.byStatus?.won ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">บทความ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingBlog ? "..." : blogPosts?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      {leadStats && leadStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สถานะ Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(leadStats.byStatus).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className={`text-xl font-bold ${statusColors[status] || ""}`}>{count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{statusLabels[status] || status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads ล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLeads ? (
            <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
          ) : !recentLeads || recentLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ยังไม่มี lead — เมื่อมีผู้สนใจส่งฟอร์มจากหน้าเว็บ จะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {lead.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company || lead.email || lead.phone || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${statusColors[lead.status] || ""}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
