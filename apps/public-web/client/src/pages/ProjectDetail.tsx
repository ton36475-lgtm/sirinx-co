import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import ProjectPhotoGallery from "@/components/ProjectPhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { holatelProjectMedia } from "@shared/holatelProjectMedia";
import {
  getProjectEvidenceBadgeKey,
  getPublicProjectDetail,
} from "@shared/publicProjectContent";
import { ruenphaeProjectMedia } from "@shared/ruenphaeProjectMedia";

const statusLabelByKey: Record<string, string> = {
  badgeVerifiedLive: "ผลงานติดตั้งจริง",
  badgeUnderConstruction: "อยู่ระหว่างก่อสร้าง",
  badgeConceptSimulation: "ภาพจำลอง / Concept Design",
  badgePendingEvidence: "รอตรวจหลักฐาน",
};

const statusColorByKey: Record<string, string> = {
  badgeVerifiedLive: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  badgeUnderConstruction: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  badgeConceptSimulation: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  badgePendingEvidence: "bg-amber-500/15 text-amber-300 border-amber-400/30",
};

function ProjectDetailNotFound() {
  return (
    <main className="min-h-[65vh] bg-background px-4 py-24 text-foreground">
      <div className="container max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
          Project detail
        </p>
        <h1 className="font-display text-3xl font-bold lg:text-5xl">
          ไม่พบรายละเอียดโครงการนี้
        </h1>
        <p className="mt-5 max-w-xl text-text-secondary">
          โครงการอาจยังไม่ผ่านการอนุมัติให้แสดงผล หรือยังไม่มีข้อมูลสาธารณะที่ตรวจสอบได้
        </p>
        <Link
          href="/projects"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border-accent px-4 py-2.5 text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปดูผลงาน
        </Link>
      </div>
    </main>
  );
}

export default function ProjectDetail() {
  const params = useParams<{ slug: string }>();
  const project = getPublicProjectDetail(params.slug);
  const { lang } = useLanguage();

  if (!project) return <ProjectDetailNotFound />;

  const statusKey = getProjectEvidenceBadgeKey(
    project.projectId,
    project.evidenceState,
  );
  const statusLabel = statusLabelByKey[statusKey] ?? "รอตรวจหลักฐาน";
  const statusColor =
    statusColorByKey[statusKey] ?? statusColorByKey.badgePendingEvidence;

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border-subtle bg-background px-4 py-16 lg:py-24">
        <div className="container max-w-5xl">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            <ArrowLeft className="h-4 w-4" /> กลับไปหน้าผลงาน
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}
                >
                  {statusLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {statusKey === "badgeVerifiedLive"
                    ? "ภาพผลงานผ่านการคัดเลือกและตรวจข้อมูลส่วนบุคคล"
                    : "กำลังตรวจหลักฐานก่อนเผยแพร่เต็มรูปแบบ"}
                </span>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
                SIRINX Project Detail
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight lg:text-5xl">
                {project.name}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary lg:text-lg">
                {project.systemSummary}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-text-muted">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent-primary" />
                  {project.province}
                </span>
                <span>{project.industry}</span>
              </div>
            </div>

            <aside className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5 text-sm text-amber-100">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <h2 className="font-semibold text-amber-50">ขอบเขตข้อมูลสาธารณะ</h2>
                  <p className="mt-2 leading-relaxed text-amber-100/80">
                    รายละเอียดนี้เป็นข้อมูลเบื้องต้นเพื่อให้เห็นโครงสร้างงานเท่านั้น ยังไม่ใช่ใบเสนอราคา แบบก่อสร้าง หรือการรับประกันผลประหยัด
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 lg:py-20">
        <div className="container max-w-5xl">
          <ProjectPhotoGallery
            galleryId={project.projectId}
            photos={project.projectId === "holatel-rim-nan" ? holatelProjectMedia : ruenphaeProjectMedia}
            lang={lang}
            fallbackLabel="Project image unavailable"
            title={lang === "th" ? "ภาพผลงานติดตั้งจริง" : lang === "cn" ? "真实安装照片" : "Real Installation Photos"}
            description={lang === "th" ? "ภาพจากงานติดตั้งจริงที่คัดเลือกเพื่อเผยแพร่ โดยไม่ใช้ตัวเลขหรือรายละเอียดที่ยังไม่ผ่านการตรวจหลักฐาน" : lang === "cn" ? "经筛选的真实安装照片，不包含尚未核实的数字或技术细节" : "Selected photographs from the real installation, without unverified numbers or technical details."}
          />

          <div className="grid gap-5 md:grid-cols-2">
            {project.sections.map(section => (
              <article
                key={section.id}
                className="rounded-2xl border border-border-subtle bg-surface-elevated p-6"
              >
                <div className="mb-4 flex items-center gap-2 text-accent-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border-subtle bg-surface-elevated p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                สื่อและสิทธิ์การใช้งาน
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {project.media.note}
              </p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-surface-elevated p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                ตัวเลขและผลลัพธ์
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {project.claims.note}
              </p>
            </article>
          </div>

          <div className="mt-10 rounded-2xl border border-border-accent bg-surface-elevated p-6 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-8">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                ต้องการประเมินโครงการของคุณหรือไม่?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                ส่งข้อมูลพื้นที่และบิลค่าไฟให้ทีมงานประเมินเบื้องต้น แล้วนัดสำรวจหน้างานก่อนออกแบบระบบจริง
              </p>
            </div>
            <div className="mt-5 flex shrink-0 flex-wrap gap-3 lg:mt-0">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-accent-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
              >
                ประเมินเบื้องต้น <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-border-accent px-4 py-2.5 text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
              >
                นัดสำรวจหน้างาน
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
