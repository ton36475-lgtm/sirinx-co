import { Link } from "wouter";
import { ArrowRight, Mail, Phone } from "lucide-react";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPage({ eyebrow, title, updatedAt, intro, sections }: LegalPageProps) {
  return (
    <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-background">
      <div className="container max-w-4xl">
        <div className="mb-10">
          <span className="text-xs font-semibold text-accent-secondary tracking-widest uppercase">
            {eyebrow}
          </span>
          <h1 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            {title}
          </h1>
          <p className="text-sm text-text-muted mb-5">อัปเดตล่าสุด: {updatedAt}</p>
          <p className="text-text-secondary leading-relaxed text-lg">{intro}</p>
        </div>

        <div className="space-y-7">
          {sections.map((section) => (
            <article key={section.title} className="border-t border-border-subtle pt-7">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-text-secondary leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border-subtle bg-surface-elevated p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            ติดต่อเรื่องเอกสารและข้อมูลส่วนบุคคล
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-text-secondary mb-5">
            <a href="tel:+66819723969" className="inline-flex items-center gap-2 hover:text-accent-primary">
              <Phone className="w-4 h-4 text-accent-primary" /> +66 81 972 3969
            </a>
            <a href="mailto:pitoon.sirinx@gmail.com" className="inline-flex items-center gap-2 hover:text-accent-primary">
              <Mail className="w-4 h-4 text-accent-primary" /> pitoon.sirinx@gmail.com
            </a>
          </div>
          <Link href="/contact" className="inline-flex items-center gap-2 btn-accent px-5 py-3 rounded-lg font-display font-semibold">
            ติดต่อ SIRINX <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
