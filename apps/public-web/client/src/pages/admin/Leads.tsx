import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Phone, Mail, Building2, Calendar, MessageSquare, X, Car, Banknote, Plug } from "lucide-react";

const statusOptions = [
  { value: "new", label: "ใหม่", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "ติดต่อแล้ว", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "qualified", label: "คุณสมบัติผ่าน", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "proposal", label: "ส่งข้อเสนอ", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "won", label: "ปิดการขาย", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "lost", label: "ไม่สำเร็จ", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const sourceLabels: Record<string, string> = {
  contact: "ฟอร์มติดต่อ",
  assessment: "ประเมินโซลาร์",
  partner: "พาร์ทเนอร์",
  line: "LINE",
};

export default function AdminLeads() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.lead.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus } : undefined
  );
  const { data: leadDetail } = trpc.lead.getById.useQuery(
    { id: selectedLead! },
    { enabled: !!selectedLead }
  );

  const updateLead = trpc.lead.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดต lead สำเร็จ");
      utils.lead.list.invalidate();
      utils.lead.stats.invalidate();
      utils.lead.getById.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleStatusChange = (leadId: number, newStatus: string) => {
    updateLead.mutate({ id: leadId, status: newStatus as any });
  };

  const handleSaveNotes = () => {
    if (!selectedLead) return;
    updateLead.mutate({ id: selectedLead, adminNotes });
    toast.success("บันทึกโน้ตสำเร็จ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lead Management</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการ leads จากทุกช่องทาง</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          ทั้งหมด
        </Button>
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={filterStatus === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Lead List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>
          ) : !leads || leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>ไม่พบ lead {filterStatus !== "all" ? `ในสถานะ "${statusOptions.find(s => s.value === filterStatus)?.label}"` : ""}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leads.map((lead) => {
                const statusOpt = statusOptions.find(s => s.value === lead.status);
                return (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedLead(lead.id);
                      setAdminNotes(lead.adminNotes || "");
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{lead.name}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusOpt?.color || ""}`}>
                            {statusOpt?.label || lead.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {sourceLabels[lead.source] || lead.source}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {lead.company && (
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                          )}
                          {lead.interest && (
                            <span className="flex items-center gap-1">ความสนใจ: {lead.interest}</span>
                          )}
                        </div>
                        {/* Category Tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.interest?.toLowerCase().includes("carport") && (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">
                              <Car className="h-2.5 w-2.5 mr-0.5" /> Solar Carport
                            </Badge>
                          )}
                          {(lead.interest?.toLowerCase().includes("ppa") || lead.interest?.toLowerCase().includes("co-invest") || lead.budget) && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              <Banknote className="h-2.5 w-2.5 mr-0.5" /> Financing
                            </Badge>
                          )}
                          {(lead.interest?.toLowerCase().includes("ev") || lead.interest?.toLowerCase().includes("carport") || lead.bessInterest === "yes") && (
                            <Badge variant="outline" className="text-[10px] bg-sky-500/15 text-sky-400 border-sky-500/30">
                              <Plug className="h-2.5 w-2.5 mr-0.5" /> EV-Ready
                            </Badge>
                          )}
                          {lead.bessInterest === "yes" && (
                            <Badge variant="outline" className="text-[10px] bg-purple-500/15 text-purple-400 border-purple-500/30">
                              BESS
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {new Date(lead.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">รายละเอียด Lead</DialogTitle>
          </DialogHeader>
          {leadDetail ? (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">ชื่อ</span>
                  <p className="font-medium">{leadDetail.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">บริษัท</span>
                  <p className="font-medium">{leadDetail.company || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">โทรศัพท์</span>
                  <p className="font-medium">{leadDetail.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">อีเมล</span>
                  <p className="font-medium">{leadDetail.email || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">อุตสาหกรรม</span>
                  <p className="font-medium">{leadDetail.industry || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">ความสนใจ</span>
                  <p className="font-medium">{leadDetail.interest || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">งบประมาณ</span>
                  <p className="font-medium">{leadDetail.budget || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">ระยะเวลา</span>
                  <p className="font-medium">{leadDetail.timeline || "-"}</p>
                </div>
              </div>

              {/* Solar Assessment Data */}
              {(leadDetail.systemSize || leadDetail.systemType || leadDetail.monthlyBill) && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2">ข้อมูลจากการประเมิน</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {leadDetail.systemType && <div><span className="text-muted-foreground text-xs">ระบบ:</span> {leadDetail.systemType}</div>}
                    {leadDetail.systemSize && <div><span className="text-muted-foreground text-xs">ขนาด:</span> {leadDetail.systemSize}</div>}
                    {leadDetail.monthlyBill && <div><span className="text-muted-foreground text-xs">ค่าไฟ/เดือน:</span> {leadDetail.monthlyBill}</div>}
                    {leadDetail.bessInterest && <div><span className="text-muted-foreground text-xs">BESS:</span> {leadDetail.bessInterest}</div>}
                  </div>
                </div>
              )}

              {/* Message */}
              {leadDetail.message && (
                <div>
                  <span className="text-muted-foreground text-xs">ข้อความ</span>
                  <p className="text-sm mt-1 p-3 rounded-lg bg-muted/30">{leadDetail.message}</p>
                </div>
              )}

              {/* Status Update */}
              <div>
                <span className="text-muted-foreground text-xs block mb-1">สถานะ</span>
                <Select
                  value={leadDetail.status}
                  onValueChange={(val) => handleStatusChange(leadDetail.id, val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div>
                <span className="text-muted-foreground text-xs block mb-1">โน้ต (เฉพาะ Admin)</span>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="เพิ่มโน้ตสำหรับ lead นี้..."
                  rows={3}
                />
                <Button size="sm" className="mt-2" onClick={handleSaveNotes} disabled={updateLead.isPending}>
                  บันทึกโน้ต
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <p>แหล่งที่มา: {sourceLabels[leadDetail.source] || leadDetail.source}</p>
                <p>สร้างเมื่อ: {new Date(leadDetail.createdAt).toLocaleString("th-TH")}</p>
                <p>อัพเดตล่าสุด: {new Date(leadDetail.updatedAt).toLocaleString("th-TH")}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">กำลังโหลด...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
