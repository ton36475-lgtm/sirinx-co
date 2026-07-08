/**
 * SIRINX Partner & Investor Inquiry Page
 * Dual-theme: semantic CSS vars
 */
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import {
  Handshake,
  TrendingUp,
  Building2,
  Send,
  CheckCircle2,
  ArrowRight,
  Globe,
  BarChart3,
  Shield,
  Users,
  Zap,
  Target,
  Leaf,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TrpcProvider } from "@/lib/trpc-provider";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/partner";
import { lineOfficialConfig } from "@shared/lineOfficial";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const marketStats = [
  { value: "30 GW", label: "partner.market.stat1", icon: Target },
  { value: "15%+", label: "partner.market.stat2", icon: TrendingUp },
  { value: "THB 200B+", label: "partner.market.stat3", icon: BarChart3 },
  { value: "8-15%", label: "partner.market.stat4", icon: Leaf },
] as const;

const partnerTypes = [
  {
    icon: TrendingUp,
    title: "partner.type.investor.title",
    desc: "partner.type.investor.desc",
    benefits: [
      "partner.type.investor.benefit1",
      "partner.type.investor.benefit2",
      "partner.type.investor.benefit3",
      "partner.type.investor.benefit4",
      "partner.type.investor.benefit5",
    ],
    ideal: "partner.type.investor.ideal",
  },
  {
    icon: Building2,
    title: "partner.type.business.title",
    desc: "partner.type.business.desc",
    benefits: [
      "partner.type.business.benefit1",
      "partner.type.business.benefit2",
      "partner.type.business.benefit3",
      "partner.type.business.benefit4",
      "partner.type.business.benefit5",
    ],
    ideal: "partner.type.business.ideal",
  },
  {
    icon: Handshake,
    title: "partner.type.epc.title",
    desc: "partner.type.epc.desc",
    benefits: [
      "partner.type.epc.benefit1",
      "partner.type.epc.benefit2",
      "partner.type.epc.benefit3",
      "partner.type.epc.benefit4",
      "partner.type.epc.benefit5",
    ],
    ideal: "partner.type.epc.ideal",
  },
] as const;

const cooperationOptions = [
  { value: "", label: "partner.form.type.empty" },
  { value: "investor", label: "partner.form.type.investor" },
  { value: "partner", label: "partner.form.type.business" },
  { value: "epc", label: "partner.form.type.epc" },
  { value: "other", label: "partner.form.type.other" },
] as const;

const investmentOptions = [
  { value: "", label: "partner.form.range.empty" },
  { value: "small", label: "partner.form.range.small" },
  { value: "medium", label: "partner.form.range.medium" },
  { value: "large", label: "partner.form.range.large" },
  { value: "xlarge", label: "partner.form.range.xlarge" },
] as const;

const trustItems = [
  { icon: Shield, text: "partner.sidebar.trust1" },
  { icon: Globe, text: "partner.sidebar.trust2" },
  { icon: Users, text: "partner.sidebar.trust3" },
  { icon: Zap, text: "partner.sidebar.trust4" },
] as const;

const processSteps = [
  { step: "1", title: "partner.sidebar.step1.title", time: "partner.sidebar.step1.time" },
  { step: "2", title: "partner.sidebar.step2.title", time: "partner.sidebar.step2.time" },
  { step: "3", title: "partner.sidebar.step3.title", time: "partner.sidebar.step3.time" },
  { step: "4", title: "partner.sidebar.step4.title", time: "partner.sidebar.step4.time" },
] as const;

function PartnerInner() {
  const { t } = usePageTranslation("partner");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "",
    investmentRange: "",
    message: "",
  });

  const leadMutation = trpc.lead.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("partner.toast.success"));
    },
    onError: () => {
      toast.error(t("partner.toast.error"));
    },
  });

  const getOptionLabel = (
    value: string,
    options: readonly { value: string; label: string }[]
  ) => {
    const option = options.find(item => item.value === value);
    return option?.value ? t(option.label) : "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const typeLabel = getOptionLabel(formData.type, cooperationOptions);
    const rangeLabel = getOptionLabel(formData.investmentRange, investmentOptions);
    const messageParts = [
      typeLabel ? `${t("partner.form.message.type")}: ${typeLabel}` : "",
      rangeLabel ? `${t("partner.form.message.range")}: ${rangeLabel}` : "",
      formData.message,
    ].filter(Boolean);

    leadMutation.mutate({
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email || "",
      phone: formData.phone || undefined,
      interest: `${t("partner.form.interestPrefix")}: ${typeLabel || formData.type}`,
      source: "partner",
      message: messageParts.join(" | "),
    });
  };

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));
  const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-background text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors";

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            {t("partner.success.title")}
          </h2>
          <p className="text-text-secondary mb-6">
            {t("partner.success.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent rounded-lg text-sm font-display font-semibold"
            >
              {t("partner.success.home")}
            </Link>
            <Link
              href="/investment"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold"
            >
              {t("partner.success.investment")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-24 lg:py-32 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-2xl"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("partner.hero.eyebrow")}
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t("partner.hero.title")}
              <br />
              <span className="text-gradient-accent">
                {t("partner.hero.accent")}
              </span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              {t("partner.hero.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {marketStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated text-center"
              >
                <stat.icon className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-2xl lg:text-3xl font-bold text-gradient-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-text-muted">{t(stat.label)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl mb-12"
          >
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("partner.types.title")}
            </h2>
            <p className="text-text-secondary">{t("partner.types.desc")}</p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            {partnerTypes.map((pt, i) => (
              <motion.div
                key={pt.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <pt.icon className="w-8 h-8 text-accent-primary mb-4" />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {t(pt.title)}
                </h3>
                <p className="text-sm text-text-secondary mb-4">{t(pt.desc)}</p>
                <ul className="space-y-2 mb-4">
                  {pt.benefits.map(benefit => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
                      {t(benefit)}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-border-subtle">
                  <span className="text-xs text-text-muted">
                    {t("partner.types.idealLabel")}{" "}
                  </span>
                  <span className="text-xs text-accent-primary">
                    {t(pt.ideal)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <div className="p-6 lg:p-8 rounded-2xl border border-border-subtle bg-surface-elevated">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("partner.form.title")}
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  {t("partner.form.desc")}
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.name")}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => update("name", e.target.value)}
                        className={inputCls}
                        placeholder={t("partner.form.namePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.company")}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={e => update("company", e.target.value)}
                        className={inputCls}
                        placeholder={t("partner.form.companyPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.email")}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => update("email", e.target.value)}
                        className={inputCls}
                        placeholder="email@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.phone")}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => update("phone", e.target.value)}
                        className={inputCls}
                        placeholder="0XX-XXX-XXXX"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.type")}
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={e => update("type", e.target.value)}
                        className={inputCls}
                      >
                        {cooperationOptions.map(option => (
                          <option key={option.label} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t("partner.form.range")}
                      </label>
                      <select
                        value={formData.investmentRange}
                        onChange={e => update("investmentRange", e.target.value)}
                        className={inputCls}
                      >
                        {investmentOptions.map(option => (
                          <option key={option.label} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("partner.form.message")}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={e => update("message", e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder={t("partner.form.messagePlaceholder")}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 btn-accent rounded-lg font-display font-semibold text-base"
                  >
                    <Send className="w-4 h-4" /> {t("partner.form.submit")}
                  </button>
                  <p className="text-xs text-text-muted text-center">
                    {t("partner.form.privacy")}
                  </p>
                </form>
              </div>
            </motion.div>

            <div className="space-y-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={1}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated"
              >
                <h3 className="font-display font-semibold text-foreground mb-4">
                  {t("partner.sidebar.whyTitle")}
                </h3>
                <div className="space-y-3">
                  {trustItems.map(item => (
                    <div key={item.text} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-accent-primary shrink-0" />
                      <span className="text-sm text-text-secondary">
                        {t(item.text)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={2}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated"
              >
                <h3 className="font-display font-semibold text-foreground mb-4">
                  {t("partner.sidebar.processTitle")}
                </h3>
                <div className="space-y-4">
                  {processSteps.map(step => (
                    <div key={step.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-glow text-accent-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t(step.title)}
                        </div>
                        <div className="text-xs text-text-muted">
                          {t(step.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={3}
                className="p-5 rounded-xl border border-border-accent bg-accent-glow"
              >
                <p className="text-xs text-text-muted leading-relaxed">
                  <strong className="text-foreground">
                    {t("partner.sidebar.disclaimerLabel")}:
                  </strong>{" "}
                  {t("partner.sidebar.disclaimer")}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 section-alt">
        <div className="container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
            {t("partner.cta.title")}
          </h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            {t("partner.cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/investment"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold"
            >
              {t("partner.cta.investment")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold"
            >
              {t("partner.cta.projects")} <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={lineOfficialConfig.addFriendUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#00C300] font-display font-semibold text-white transition-colors hover:bg-[#00B300]"
              aria-label={t("partner.cta.lineAria")}
            >
              <MessageCircle className="w-4 h-4" />
              {t("partner.cta.line")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Partner() {
  return (
    <TrpcProvider>
      <PartnerInner />
    </TrpcProvider>
  );
}
