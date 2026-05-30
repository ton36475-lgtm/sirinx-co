/**
 * SIRINX Contact Page — Lead Capture & Qualification
 * Dual-theme: semantic CSS vars
 * Features: URL param prefill from Solar Calculator, lead qualification, success state,
 *           tRPC backend integration, LINE OA button, i18n (TH/EN/CN)
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { TrpcProvider } from "@/lib/trpc-provider";
import { useTrackCTA, useTrackFormSubmit, useTrackLINEClick } from "@/hooks/useAnalytics";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/contact";
import {
  ArrowRight, Phone, Mail, MapPin, Clock, Send, CheckCircle2,
  Calculator, Shield, FileText, Users, Zap, MessageCircle, Loader2,
  ClipboardCopy, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import {
  buildLeadFallbackMailto,
  buildLeadFallbackSummary,
  isLeadTransportFallbackError,
} from "@/lib/leadFallback";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const LINE_OA_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINE_OA_URL) || "https://lin.ee/sirinx";

function ContactInner() {
  const { t } = usePageTranslation("contact");
  const searchString = useSearch();
  const [submitted, setSubmitted] = useState(false);
  const [fallbackLead, setFallbackLead] = useState<{ mailtoHref: string; summary: string } | null>(null);
  const [copiedFallback, setCopiedFallback] = useState(false);
  const trackCTA = useTrackCTA();
  const trackFormSubmit = useTrackFormSubmit();
  const trackLINEClick = useTrackLINEClick();
  const [formData, setFormData] = useState({
    name: "", company: "", email: "", phone: "",
    interest: "", budget: "", timeline: "",
    monthlyBill: "", roofArea: "", message: "",
  });

  const contactChannels = [
    { icon: Phone, title: t("chPhone"), value: "+66 81 972 3969", sub: t("chPhoneSub"), action: "tel:+66819723969" },
    { icon: Mail, title: t("chEmail"), value: "pitoon.sirinx@gmail.com", sub: t("chEmailSub"), action: "mailto:pitoon.sirinx@gmail.com" },
    { icon: MapPin, title: t("chOffice"), value: "600/99 Mittraphap Rd.", sub: "Mueang Phitsanulok 65000", action: "https://maps.google.com/?q=600/99+Mittraphap+Rd+Phitsanulok" },
    { icon: Clock, title: t("chWebsite"), value: "www.sirinx.co", sub: t("chWebsiteSub"), action: "https://www.sirinx.co" },
  ];

  const interestOptions = [
    "Solar Carport", "Rooftop Solar", "Floating Solar", "BESS / ESS",
    "AI Energy Management", "O&M Service", "Co-investment / PPA", t("interestGeneral"),
  ];

  const budgetRanges = [
    t("budgetUndefined"), t("budgetUnder5"), t("budget5to15"),
    t("budget15to50"), t("budget50to100"), t("budgetOver100"),
  ];

  const timelineOptions = [
    t("timeline1m"), t("timeline1to3m"), t("timeline3to6m"), t("timeline6to12m"), t("timelineResearch"),
  ];

  const submitLead = trpc.lead.submit.useMutation({
    onSuccess: () => {
      setFallbackLead(null);
      setSubmitted(true);
      trackFormSubmit("contact_form", Object.values(formData).filter(Boolean).length);
      toast.success(t("successToast"));
    },
    onError: (err) => {
      if (isLeadTransportFallbackError(err)) {
        const submittedAt = new Date();
        const fallback = {
          mailtoHref: buildLeadFallbackMailto(formData, submittedAt),
          summary: buildLeadFallbackSummary(formData, submittedAt),
        };
        setFallbackLead(fallback);
        trackFormSubmit("contact_form_email_fallback", Object.values(formData).filter(Boolean).length);
        toast.error(t("fallbackToast"));
        window.setTimeout(() => {
          window.location.href = fallback.mailtoHref;
        }, 100);
        return;
      }
      toast.error(err.message || t("errorToast"));
    },
  });

  // Prefill from Solar Calculator URL params or Pricing page
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const system = params.get("system");
    const type = params.get("type");
    const bill = params.get("bill");
    const bess = params.get("bess");
    const interest = params.get("interest");
    const pkg = params.get("package");

    if (interest || pkg) {
      const interestMap: Record<string, string> = {
        "solar-carport": "Solar Carport",
        "rooftop-solar": "Rooftop Solar",
        "floating-solar": "Floating Solar",
        "bess": "BESS / ESS",
        "ai-energy": "AI Energy Management",
        "hospitality": t("interestGeneral"),
      };
      const packageLabels: Record<string, string> = {
        "start": "Start (10-30 kWp)",
        "pro": "Pro (30-100 kWp)",
        "enterprise": "Enterprise (100-500+ kWp)",
      };
      const mappedInterest = interest ? (interestMap[interest] || "Solar Carport") : "Solar Carport";
      const pkgLabel = pkg ? packageLabels[pkg] : null;
      const msgParts: string[] = [];
      if (pkgLabel) msgParts.push(`${t("prefillPackage")} ${pkgLabel}`);
      msgParts.push(t("prefillFromPricing"));
      setFormData(prev => ({
        ...prev,
        interest: mappedInterest,
        message: prev.message || msgParts.join("\n"),
      }));
    } else if (system || type || bill) {
      const parts: string[] = [];
      if (system) parts.push(`${t("prefillSystem")} ${system}`);
      if (type) parts.push(`${t("prefillBizType")} ${type}`);
      if (bill) parts.push(`${t("prefillBill")} ${Number(bill).toLocaleString()} ${t("prefillBillUnit")}`);
      if (bess) parts.push(`${t("prefillBESS")} ${bess}`);
      parts.push(`\n${t("prefillFromCalc")}`);
      setFormData(prev => ({
        ...prev,
        interest: system?.includes("BESS") ? "BESS / ESS" : "Rooftop Solar",
        monthlyBill: bill || "",
        message: parts.join("\n"),
      }));
    }
  }, [searchString]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLead(null);
    setCopiedFallback(false);
    submitLead.mutate({
      source: "contact",
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      interest: formData.interest || undefined,
      budget: formData.budget || undefined,
      timeline: formData.timeline || undefined,
      monthlyBill: formData.monthlyBill || undefined,
      message: formData.message || undefined,
    });
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const copyFallbackSummary = async () => {
    if (!fallbackLead) return;
    await navigator.clipboard.writeText(fallbackLead.summary);
    setCopiedFallback(true);
    toast.success(t("fallbackCopyToast"));
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">{t("successTitle")}</h2>
          <p className="text-text-secondary mb-6">{t("successDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent rounded-lg text-sm font-display font-semibold">
              {t("successBtnHome")}
            </Link>
            <Link href="/assessment" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold">
              {t("successBtnCalc")}
            </Link>
          </div>
          <div className="mt-6 p-4 rounded-xl border border-[#06C755]/30 bg-[#06C755]/10">
            <p className="text-sm text-text-secondary mb-3">{t("successLinePrompt")}</p>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLINEClick("contact_success_cta")}
	              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#047A35] hover:bg-[#03662c] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> {t("successLineBtn")}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (fallbackLead) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full p-6 lg:p-8 rounded-2xl border border-amber-400/40 bg-surface-elevated">
          <div className="w-14 h-14 rounded-full bg-amber-400/15 flex items-center justify-center mb-5">
            <Mail className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">{t("fallbackTitle")}</h2>
          <p className="text-text-secondary mb-6">{t("fallbackDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href={fallbackLead.mailtoHref}
              onClick={() => trackCTA("contact_fallback_email", "contact_fallback")}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 btn-accent rounded-lg text-sm font-display font-semibold"
            >
              <Mail className="w-4 h-4" /> {t("fallbackEmailBtn")}
            </a>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLINEClick("contact_fallback_cta")}
	              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#047A35] hover:bg-[#03662c] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> {t("fallbackLineBtn")}
            </a>
            <button
              type="button"
              onClick={copyFallbackSummary}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 btn-accent-outline rounded-lg text-sm font-display font-semibold"
            >
              <ClipboardCopy className="w-4 h-4" /> {copiedFallback ? t("fallbackCopiedBtn") : t("fallbackCopyBtn")}
            </button>
          </div>
          <div className="rounded-xl border border-border-subtle bg-background p-4 mb-6 max-h-72 overflow-auto">
            <pre className="text-xs text-text-secondary whitespace-pre-wrap break-words font-sans">{fallbackLead.summary}</pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setFallbackLead(null)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold"
            >
              {t("fallbackEditBtn")}
            </button>
            <Link href="/assessment" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold">
              {t("successBtnCalc")} <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-background text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors";

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("heroLabel")}</span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {t("heroTitle")}<span className="text-gradient-accent">{t("heroTitleAccent")}</span>{t("heroTitleEnd")}
            </h1>
            <p className="text-text-secondary leading-relaxed">{t("heroDesc")}</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Channels + LINE OA */}
      <section className="pb-12 bg-background">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {contactChannels.map((ch, i) => (
              <motion.a key={ch.title} href={ch.action}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="group p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-all">
                <ch.icon className="w-5 h-5 text-accent-primary mb-3" />
                <div className="font-display font-semibold text-foreground text-sm group-hover:text-accent-primary transition-colors">{ch.value}</div>
                <div className="text-xs text-text-muted mt-1">{ch.sub}</div>
              </motion.a>
            ))}
            <motion.a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLINEClick("contact_channel_card")}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
              className="group p-5 rounded-xl border border-[#06C755]/30 bg-[#06C755]/10 hover:border-[#06C755]/60 hover:bg-[#06C755]/20 transition-all"
            >
              <MessageCircle className="w-5 h-5 text-[#06C755] mb-3" />
              <div className="font-display font-semibold text-foreground text-sm group-hover:text-[#06C755] transition-colors">LINE @SIRINX</div>
              <div className="text-xs text-text-muted mt-1">{t("chLineSub")}</div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-12 lg:py-16 section-alt">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_380px] gap-10">
            {/* Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="p-6 lg:p-8 rounded-2xl border border-border-subtle bg-surface-elevated">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">{t("formTitle")}</h2>
                <p className="text-sm text-text-muted mb-6">{t("formDesc")}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelName")}</label>
	                      <input type="text" required value={formData.name} onChange={(e) => update("name", e.target.value)} className={inputCls} placeholder={t("phName")} aria-label={t("labelName")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelCompany")}</label>
	                      <input type="text" value={formData.company} onChange={(e) => update("company", e.target.value)} className={inputCls} placeholder={t("phCompany")} aria-label={t("labelCompany")} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelEmail")}</label>
	                      <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="email@company.com" aria-label={t("labelEmail")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelPhone")}</label>
	                      <input type="tel" required value={formData.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="08X-XXX-XXXX" aria-label={t("labelPhone")} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelInterest")}</label>
	                    <select required value={formData.interest} onChange={(e) => update("interest", e.target.value)} className={inputCls} aria-label={t("labelInterest")}>
                      <option value="">{t("selectSolution")}</option>
                      {interestOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelBudget")}</label>
	                        <select value={formData.budget} onChange={(e) => update("budget", e.target.value)} className={inputCls} aria-label={t("labelBudget")}>
                        <option value="">{t("selectBudget")}</option>
                        {budgetRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelTimeline")}</label>
	                      <select value={formData.timeline} onChange={(e) => update("timeline", e.target.value)} className={inputCls} aria-label={t("labelTimeline")}>
                        <option value="">{t("selectTimeline")}</option>
                        {timelineOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelBill")}</label>
	                      <input type="number" min="0" value={formData.monthlyBill} onChange={(e) => update("monthlyBill", e.target.value)} className={inputCls} placeholder={t("phBill")} aria-label={t("labelBill")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelRoof")}</label>
	                      <input type="number" min="0" value={formData.roofArea} onChange={(e) => update("roofArea", e.target.value)} className={inputCls} placeholder={t("phRoof")} aria-label={t("labelRoof")} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t("labelMessage")}</label>
	                    <textarea rows={4} value={formData.message} onChange={(e) => update("message", e.target.value)}
	                      className={`${inputCls} resize-none`} placeholder={t("phMessage")} aria-label={t("labelMessage")} />
                  </div>
                  <button
                    type="submit"
                    disabled={submitLead.isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 btn-accent rounded-lg font-display font-semibold text-base disabled:opacity-60"
                  >
                    {submitLead.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t("btnSubmitting")}</>
                    ) : (
                      <><Send className="w-4 h-4" /> {t("btnSubmit")}</>
                    )}
                  </button>
                  <p className="text-xs text-text-muted text-center">{t("formPrivacy")}</p>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* LINE OA prominent CTA */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
                className="p-6 rounded-xl border border-[#06C755]/30 bg-[#06C755]/10">
                <MessageCircle className="w-6 h-6 text-[#06C755] mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-2">{t("lineTitle")}</h3>
                <p className="text-sm text-text-secondary mb-4">{t("lineDesc")}</p>
                <a
                  href={LINE_OA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLINEClick("contact_sidebar_cta")}
	                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#047A35] hover:bg-[#03662c] text-white rounded-lg text-sm font-semibold transition-colors w-full justify-center"
                >
                  <MessageCircle className="w-4 h-4" /> {t("lineBtn")}
                </a>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
                className="p-6 rounded-xl border border-border-accent bg-accent-glow">
                <Calculator className="w-6 h-6 text-accent-primary mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-2">{t("calcTitle")}</h3>
                <p className="text-sm text-text-secondary mb-4">{t("calcDesc")}</p>
                <Link href="/assessment" className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline">
                  {t("calcLink")} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground mb-4">{t("stepsTitle")}</h3>
                <div className="space-y-4">
                  {[
                    { step: "1", title: t("step1Title"), time: t("step1Time") },
                    { step: "2", title: t("step2Title"), time: t("step2Time") },
                    { step: "3", title: t("step3Title"), time: t("step3Time") },
                    { step: "4", title: t("step4Title"), time: t("step4Time") },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-glow text-accent-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                      <div>
                        <div className="text-sm font-medium text-foreground">{s.title}</div>
                        <div className="text-xs text-text-muted">{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground mb-4">{t("whyTitle")}</h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: t("why1") },
                    { icon: FileText, text: t("why2") },
                    { icon: Users, text: t("why3") },
                    { icon: Zap, text: t("why4") },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-accent-primary shrink-0" />
                      <span className="text-sm text-text-secondary">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{t("ctaTitle")}</h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/solutions" className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold">
              {t("ctaBtnSolutions")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/projects" className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold">
              {t("ctaBtnProjects")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Contact() {
  return (
    <TrpcProvider>
      <ContactInner />
    </TrpcProvider>
  );
}
