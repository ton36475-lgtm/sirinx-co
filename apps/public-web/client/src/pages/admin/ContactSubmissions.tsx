import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Calendar } from "lucide-react";

export default function AdminContactSubmissions() {
  const { data: submissions, isLoading } = trpc.contact.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Contact Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">ประวัติการส่งฟอร์มทั้งหมด</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีการส่งฟอร์ม</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {submissions.map((sub) => {
                let parsed: Record<string, any> = {};
                try { parsed = JSON.parse(sub.formData); } catch {}
                return (
                  <div key={sub.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{parsed.name || `Submission #${sub.id}`}</span>
                          <Badge variant="outline" className="text-[10px]">{sub.sourcePage}</Badge>
                          {sub.leadId && (
                            <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                              Lead #{sub.leadId}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {parsed.email && <span>{parsed.email}</span>}
                          {parsed.phone && <span>{parsed.phone}</span>}
                          {parsed.company && <span>{parsed.company}</span>}
                          {parsed.interest && <span>ความสนใจ: {parsed.interest}</span>}
                        </div>
                        {parsed.message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{parsed.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.createdAt).toLocaleString("th-TH")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
