import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Crown, NotebookPen, PhoneCall, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CRMPage() {
  const whales = trpc.crm.whales.useQuery();
  const recentLeads = trpc.leads.recent.useQuery();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  const notesQuery = trpc.crm.notesByLead.useQuery(
    { leadId: selectedLeadId ?? 0 },
    { enabled: selectedLeadId !== null },
  );
  const depositsQuery = trpc.crm.depositsByLead.useQuery(
    { leadId: selectedLeadId ?? 0 },
    { enabled: selectedLeadId !== null },
  );

  const addNote = trpc.crm.addNote.useMutation({
    onSuccess: async () => {
      toast.success("บันทึก CRM note เรียบร้อยแล้ว");
      setNote("");
      setNextActionAt("");
      await notesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "ไม่สามารถบันทึกโน้ตได้");
    },
  });

  const leadOptions = useMemo(() => recentLeads.data ?? [], [recentLeads.data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border/70 bg-[linear-gradient(125deg,rgba(9,16,32,1)_0%,rgba(32,31,74,1)_42%,rgba(98,71,18,1)_100%)] px-6 py-8 text-white shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Whale CRM workspace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">คัดแยก ติดตาม และขยายมูลค่าของลูกค้าศักยภาพสูงในที่เดียว</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
                หน้า CRM นี้ถูกออกแบบเพื่อเปลี่ยน lead คุณภาพดีให้กลายเป็นลูกค้าที่ได้รับการดูแลต่อเนื่อง โดยเก็บทั้งสถานะ VIP ข้อมูลมูลค่า follow-up notes และบริบทแคมเปญภายใต้กฎแบรนด์ CHOKMA เท่านั้น เพื่อให้ทีมงานใช้ปิดการขายหรือดูแลลูกค้าระยะยาวได้สม่ำเสมอ
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Whale profiles</p>
                <p className="mt-3 text-2xl font-semibold">{whales.data?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Lead pool</p>
                <p className="mt-3 text-2xl font-semibold">{leadOptions.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Open notes</p>
                <p className="mt-3 text-2xl font-semibold">{notesQuery.data?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Crown className="h-5 w-5 text-primary" /> กลุ่มลูกค้าปลาวาฬในระบบ</CardTitle>
              <CardDescription>ใช้ดูรายชื่อที่ถูกจัดระดับเป็น whale และควรได้รับการดูแลแบบใกล้ชิด</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {whales.data && whales.data.length > 0 ? (
                whales.data.map((profile) => (
                  <div key={profile.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold tracking-tight">Lead #{profile.leadId}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{profile.segmentLabel || "ยังไม่ได้ตั้งชื่อ segment"}</p>
                      </div>
                      <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-medium text-amber-700">{profile.vipLevel}</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cumulative deposit</p>
                        <p className="mt-1 text-sm font-medium">฿{Number(profile.cumulativeDeposit ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Revenue</p>
                        <p className="mt-1 text-sm font-medium">฿{Number(profile.lifetimeRevenue ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Follow-up</p>
                        <p className="mt-1 text-sm font-medium">{profile.followUpStatus}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ตอนนี้ยังไม่มีกลุ่ม whale ถูกจัดระดับในฐานข้อมูล แต่ระบบพร้อมรองรับทันทีเมื่อทีมงานเริ่มอัปเดต profile และยอดฝากสะสมของลูกค้า
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /> เลือก lead เพื่อทำ CRM action</CardTitle>
              <CardDescription>ใช้สำหรับเพิ่ม follow-up note, นัดหมายครั้งถัดไป และบันทึก insight ที่ช่วยปิดลูกค้าคุณภาพสูง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-selector">Lead เป้าหมาย</Label>
                <select
                  id="lead-selector"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedLeadId ?? ""}
                  onChange={(event) => setSelectedLeadId(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">เลือก lead</option>
                  {leadOptions.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.fullName || lead.phone || `Lead #${lead.id}`} · {lead.leadStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="next-action">เวลาติดตามครั้งถัดไป</Label>
                  <Input id="next-action" type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
                </div>
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  ใช้โซนนี้สำหรับบันทึกการโทร การแชต การให้ข้อเสนอ หรือ insight เชิงพฤติกรรม รวมถึงสัญญาณคุณภาพของทราฟฟิกและ intent ของลูกค้า เพื่อให้ทีมรู้ว่าควรปิดการขายหรือติดตามแบบไหนต่อ
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm-note">CRM note</Label>
                <Textarea
                  id="crm-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-32"
                  placeholder="เช่น ชอบเล่นหวยรัฐบาลเป็นหลัก, สนใจโปรโมชันเครดิตฟรี, ฝากผ่าน wallet สะดวกกว่า, ควร follow-up ช่วงเย็น"
                />
              </div>

              <Button
                className="w-full"
                disabled={!selectedLeadId || !note || addNote.isPending}
                onClick={() => {
                  if (!selectedLeadId || !note) return;
                  addNote.mutate({
                    leadId: selectedLeadId,
                    noteType: "insight",
                    content: note,
                    nextActionAt: nextActionAt || undefined,
                  });
                }}
              >
                {addNote.isPending ? "กำลังบันทึก..." : "บันทึก CRM note"}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><NotebookPen className="h-5 w-5 text-primary" /> CRM note timeline</CardTitle>
              <CardDescription>มุมมอง follow-up ล่าสุดสำหรับ lead ที่กำลังทำงานอยู่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedLeadId === null ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  เลือก lead จากด้านบนก่อน แล้วระบบจะแสดง note timeline ที่เกี่ยวข้องให้ทันที
                </div>
              ) : notesQuery.data && notesQuery.data.length > 0 ? (
                notesQuery.data.map((crmNote) => (
                  <div key={crmNote.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <PhoneCall className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{crmNote.noteType}</p>
                        <p className="text-sm leading-7 text-muted-foreground">{crmNote.content}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Next action: {crmNote.nextActionAt ? new Date(crmNote.nextActionAt).toLocaleString() : "ยังไม่ได้กำหนด"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ยังไม่มี note สำหรับ lead นี้ คุณสามารถสร้าง note แรกเพื่อเริ่ม timeline การติดตามได้ทันที
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" /> Deposit history</CardTitle>
              <CardDescription>ประวัติการฝากของ lead ที่เลือกเพื่อใช้ประเมินมูลค่าและจังหวะ follow-up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedLeadId === null ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  เลือก lead ก่อน แล้วระบบจะแสดงประวัติการฝากที่เชื่อมกับ customer profile ให้ทันที
                </div>
              ) : depositsQuery.data && depositsQuery.data.length > 0 ? (
                depositsQuery.data.map((deposit) => (
                  <div key={deposit.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{deposit.depositType}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {new Date(deposit.occurredAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount</p>
                        <p className="mt-1 text-sm font-semibold">฿{Number(deposit.amount ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  ยังไม่มีประวัติการฝากสำหรับ lead นี้ แต่โครงสร้าง CRM พร้อมเชื่อมยอดฝากจริงทันทีเมื่อข้อมูลถูกบันทึกเข้าระบบ
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" /> Whale handling principles</CardTitle>
              <CardDescription>แนวทางใช้งาน CRM เพื่อให้ระบบช่วยขยายมูลค่าต่อรายได้จริง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                โครงสร้าง CRM ของระบบนี้ตั้งใจแยกการบริหารลูกค้าปลาวาฬออกจากการจัดการ lead ทั่วไป โดยให้ทีมสามารถระบุสถานะ follow-up, segment, affordability band ประวัติการดูแลอย่างต่อเนื่อง และข้อสังเกตด้านคุณภาพทราฟฟิกในที่เดียว
              </p>
              <p>
                เมื่อเชื่อมกับหน้า dashboard แล้ว ทีมจะเห็นได้ว่าลูกค้ากลุ่มใดถูกปิดการขายเร็ว ลูกค้ากลุ่มใดสร้างยอดฝากซ้ำ และ workflow ใดให้ผลจริงมากกว่าสิ่งที่คาดการณ์ไว้ จึงเหมาะกับการสร้างระบบ retained revenue มากกว่าการมองแค่ยอดสมัครครั้งแรก
              </p>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-950">
                หัวใจของหน้านี้ไม่ใช่แค่การบันทึกข้อความ แต่คือการทำให้ทุกการ follow-up ถูกเก็บเป็นข้อมูลที่ต่อยอดไปสู่การจัด segment, actual-vs-result, lead scoring และการ broadcast automation ในเฟสถัดไป
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
