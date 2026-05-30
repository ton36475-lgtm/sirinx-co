/*
 * Layout — SIRINX Solar Digital Agentic Company
 * Real brand data: Logo, Contact, Address, DBD Registered badge
 * CEO: Pitoon Yingyosruangrong
 */
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "@/lib/static-motion";
import AILiveAvatarMark from "@/components/AILiveAvatarMark";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Moon,
  Sun,
  ArrowUpRight,
  Linkedin,
  Facebook,
  MapPin,
  Globe,
  Zap,
  Calculator,
  FileText,
  Home,
  Layers,
  Factory,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useLanguage,
  LANGUAGE_LABELS,
  type Language,
} from "@/contexts/LanguageContext";

const LOGO_URL = "/assets/optimized/sirinx-logo.jpg";
const DBD_REGISTERED_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/DLpAL6PTE5qU_2bde4df9.png";
const THAILAND_TRUST_MARK_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/yOSTZisxsQLA_fba48286.jpg";
const DBD_VERIFIED_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/pxcfay2CDun0_9a6a41ea.jpg";

const navLinksData = [
  { href: "/", i18nKey: "nav.home" },
  { href: "/solar-carport", i18nKey: "nav.solarCarport", featured: true },
  {
    href: "/solutions",
    i18nKey: "nav.solutions",
    children: [
      { href: "/solar-carport", i18nKey: "sol.solarCarport" },
      { href: "/home-solution", i18nKey: "sol.homeSolution" },
      { href: "/solutions#rooftop", i18nKey: "sol.rooftopSolar" },
      { href: "/solutions#floating", i18nKey: "sol.floatingSolar" },
      { href: "/solutions#bess", i18nKey: "sol.bess" },
      { href: "/solutions#ai-energy", i18nKey: "sol.aiEnergy" },
      { href: "/solutions#ai-om", i18nKey: "sol.oAndM" },
    ],
  },
  { href: "/industries", i18nKey: "nav.industries" },
  { href: "/pricing", i18nKey: "nav.pricing" },
  { href: "/projects", i18nKey: "nav.projects" },
  { href: "/investment", i18nKey: "nav.investment" },
  { href: "/about", i18nKey: "nav.about" },
];

function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const languages: Language[] = ["th", "en", "cn"];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(null);
  }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface-overlay backdrop-blur-xl border-b border-border-subtle shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 lg:h-20">
        {/* Logo — Real SIRINX brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src={LOGO_URL}
            alt="SIRINX Logo"
            width={44}
            height={44}
            decoding="async"
            className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover shadow-lg shadow-brand/20 ring-2 ring-brand/30"
          />
          <div className="flex flex-col">
            <span className="font-display text-xl lg:text-2xl font-bold tracking-tight text-foreground leading-none">
              SIRINX
            </span>
            <span className="text-[9px] lg:text-[10px] tracking-[0.15em] text-text-muted uppercase leading-none mt-0.5">
              Solar Digital Agentic
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinksData.map(link => (
            <div
              key={link.href}
              className="relative"
              onMouseEnter={() => link.children && setDropdownOpen(link.href)}
              onMouseLeave={() => setDropdownOpen(null)}
            >
              <Link
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                  location === link.href ||
                  (link.href !== "/" && location.startsWith(link.href))
                    ? "text-accent-primary"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                <span
                  className={
                    link.featured ? "text-accent-primary font-semibold" : ""
                  }
                >
                  {t(link.i18nKey)}
                </span>
                {link.children && <ChevronDown className="w-3.5 h-3.5" />}
              </Link>
              {link.children && dropdownOpen === link.href && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 mt-1 w-56 py-2 rounded-xl glass-card shadow-xl"
                >
                  {link.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2.5 text-sm text-text-secondary hover:text-accent-primary hover:bg-accent-glow transition-colors"
                    >
                      {t(child.i18nKey)}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop CTA + Theme Toggle + Language */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Language Switcher */}
          <div
            className="relative"
            onMouseEnter={() => setLangMenuOpen(true)}
            onMouseLeave={() => setLangMenuOpen(false)}
          >
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-foreground hover:bg-accent-glow transition-colors border border-border-subtle"
              title="Change language"
            >
              <Globe className="w-4 h-4" />
              <span>{LANGUAGE_LABELS[lang]}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {langMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-1 w-32 py-1 rounded-xl glass-card shadow-xl z-50"
              >
                {languages.map(l => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      lang === l
                        ? "text-accent-primary bg-accent-glow font-medium"
                        : "text-text-secondary hover:text-foreground hover:bg-accent-glow"
                    }`}
                  >
                    {LANGUAGE_LABELS[l]}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-secondary hover:text-foreground hover:bg-accent-glow transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <Link
            href="/assessment"
            className="btn-accent-outline px-4 py-2 text-sm font-medium rounded-lg"
          >
            {t("nav.assessment")}
          </Link>
          <Link
            href="/contact"
            className="sirinx-avatar-button sirinx-avatar-button--nav"
            aria-label={t("nav.getQuote")}
            title={t("nav.getQuote")}
          >
            <AILiveAvatarMark className="sirinx-avatar-button__mark" />
            <span className="sr-only">{t("nav.getQuote")}</span>
          </Link>
        </div>

        {/* Mobile: Language + Theme toggle + Menu */}
        <div className="flex lg:hidden items-center gap-1.5">
          {/* Mobile Language Switcher */}
          <button
            onClick={() => {
              const idx = languages.indexOf(lang);
              setLang(languages[(idx + 1) % languages.length]);
            }}
            className="px-2 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-foreground border border-border-subtle transition-colors"
            title="Change language"
          >
            <Globe className="w-4 h-4 inline mr-0.5" />
            {LANGUAGE_LABELS[lang]}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-secondary hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — Full-screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="lg:hidden fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-2xl overflow-y-auto"
          >
            <div className="px-5 pt-4 pb-32">
              {/* === Hero CTA: Solar Assessment === */}
              <Link
                href="/assessment"
                className="group flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-accent-primary/15 via-accent-primary/10 to-accent-secondary/10 border border-accent-primary/30 hover:border-accent-primary/50 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-primary/20 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-accent-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold text-foreground text-sm">
                    {t("nav.assessment")}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {lang === "en"
                      ? "Calculate your savings"
                      : lang === "cn"
                        ? "计算您的节省"
                        : "คำนวณค่าไฟที่ประหยัดได้"}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-accent-primary group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* === Primary Navigation === */}
              <div className="space-y-0.5">
                {navLinksData.map(link => {
                  const isActive =
                    location === link.href ||
                    (link.href !== "/" && location.startsWith(link.href));
                  const isSolutionsDropdown = !!link.children;
                  const isMobileDropdownOpen =
                    dropdownOpen === `mobile-${link.href}`;

                  return (
                    <div key={link.href}>
                      {isSolutionsDropdown ? (
                        /* Collapsible dropdown for Solutions */
                        <button
                          onClick={() =>
                            setDropdownOpen(
                              isMobileDropdownOpen
                                ? null
                                : `mobile-${link.href}`
                            )
                          }
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                            isActive
                              ? "text-accent-primary bg-accent-glow"
                              : "text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Layers className="w-4.5 h-4.5 text-text-muted" />
                            {t(link.i18nKey)}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                            isActive
                              ? "text-accent-primary bg-accent-glow"
                              : link.featured
                                ? "text-accent-primary font-semibold hover:bg-accent-glow"
                                : "text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          {link.href === "/" && (
                            <Home className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {link.href === "/solar-carport" && (
                            <Zap className="w-4.5 h-4.5 text-accent-primary" />
                          )}
                          {link.href === "/industries" && (
                            <Factory className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {link.href === "/pricing" && (
                            <BarChart3 className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {link.href === "/projects" && (
                            <FileText className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {link.href === "/investment" && (
                            <Sparkles className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {link.href === "/about" && (
                            <Users className="w-4.5 h-4.5 text-text-muted" />
                          )}
                          {t(link.i18nKey)}
                        </Link>
                      )}

                      {/* Animated sub-items */}
                      <AnimatePresence>
                        {isSolutionsDropdown && isMobileDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 pl-4 border-l-2 border-accent-primary/20 py-1 space-y-0.5">
                              {link.children!.map(child => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-accent-primary hover:bg-accent-glow/50 transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/40" />
                                  {t(child.i18nKey)}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* === Bottom CTA Buttons === */}
              <div className="mt-6 pt-5 border-t border-border-subtle space-y-3">
                <Link
                  href="/solar-carport"
                  className="flex items-center justify-center gap-2 w-full btn-accent px-4 py-3.5 text-sm font-display font-semibold rounded-xl"
                >
                  <Zap className="w-4 h-4" />
                  Solar Carport — Flagship
                </Link>
                <Link
                  href="/contact"
                  className="sirinx-avatar-button sirinx-avatar-button--menu"
                  aria-label={t("nav.getQuote")}
                  title={t("nav.getQuote")}
                >
                  <AILiveAvatarMark className="sirinx-avatar-button__mark" />
                  <span className="sr-only">{t("nav.getQuote")}</span>
                </Link>
              </div>

              {/* === Quick Contact Info === */}
              <div className="mt-6 pt-5 border-t border-border-subtle">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Phone className="w-4 h-4 text-accent-primary" />
                  <a
                    href="tel:+66614195156"
                    className="hover:text-accent-primary transition-colors"
                  >
                    061-419-5156
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted mt-2">
                  <Mail className="w-4 h-4 text-accent-primary" />
                  <a
                    href="mailto:sirinx.co@gmail.com"
                    className="hover:text-accent-primary transition-colors"
                  >
                    sirinx.co@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

const footerLinksData = [
  {
    titleKey: "footer.solutions",
    links: [
      { href: "/solar-carport", i18nKey: "sol.solarCarport" },
      { href: "/home-solution", i18nKey: "sol.homeSolution" },
      { href: "/solutions#rooftop", i18nKey: "sol.rooftopSolar" },
      { href: "/solutions#floating", i18nKey: "sol.floatingSolar" },
      { href: "/solutions#bess", i18nKey: "sol.bess" },
      { href: "/solutions#ai-energy", i18nKey: "sol.aiEnergy" },
      { href: "/solutions#ai-om", i18nKey: "sol.oAndM" },
      { href: "/pricing", i18nKey: "nav.pricing" },
    ],
  },
  {
    titleKey: "footer.industries",
    links: [
      { href: "/industries#manufacturing", i18nKey: "ind.manufacturing" },
      { href: "/industries#agriculture", i18nKey: "ind.agriculture" },
      { href: "/industries#hospitality", i18nKey: "ind.hospitality" },
      { href: "/industries#education", i18nKey: "ind.education" },
      { href: "/industries#commercial", i18nKey: "ind.commercial" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { href: "/about", i18nKey: "nav.about" },
      { href: "/projects", i18nKey: "nav.projects" },
      { href: "/strategy", i18nKey: "nav.strategy" },
      { href: "/blog", i18nKey: "nav.blog" },
      { href: "/partner", i18nKey: "nav.partner" },
      { href: "/investment", i18nKey: "nav.investment" },
    ],
  },
];

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-surface-secondary border-t border-border-subtle relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent-glow opacity-30 pointer-events-none" />

      <div className="container py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand — Real SIRINX info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <img
                src={LOGO_URL}
                alt="SIRINX Logo"
                width={40}
                height={40}
                decoding="async"
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover shadow-lg shadow-brand/20 ring-2 ring-brand/30"
              />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-foreground leading-none">
                  SIRINX
                </span>
                <span className="text-[9px] tracking-[0.15em] text-text-muted uppercase leading-none mt-0.5">
                  Solar Digital Agentic Company
                </span>
              </div>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-5 max-w-sm">
              {t("footer.tagline")}
            </p>

            {/* Real Contact Info */}
            <div className="space-y-2.5 text-sm text-text-muted mb-6">
              <a
                href="tel:+66819723969"
                className="flex items-center gap-2.5 hover:text-accent-primary transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" /> +66 81 972 3969
              </a>
              <a
                href="mailto:pitoon.sirinx@gmail.com"
                className="flex items-center gap-2.5 hover:text-accent-primary transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" /> pitoon.sirinx@gmail.com
              </a>
              <a
                href="https://www.sirinx.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-accent-primary transition-colors"
              >
                <Globe className="w-4 h-4 shrink-0" /> www.sirinx.co
              </a>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  600/99 Midtrapab Rd., Mueang Phitsanulok, Phitsanulok 65000,
                  Thailand
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/sirinxsolar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-border-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/sirinx"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-border-accent transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinksData.map(section => (
            <div key={section.titleKey}>
              <h2 className="font-display font-semibold text-foreground mb-4 text-sm tracking-wider uppercase">
                {t(section.titleKey)}
              </h2>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-accent-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {t(link.i18nKey)}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certification Badges — DBD Registered, Thailand Trust Mark */}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex flex-col items-center gap-4 mb-8">
            <p className="text-xs text-text-muted tracking-wider uppercase font-medium">
              Certified & Trusted
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* DBD Registered */}
              <a
                href="https://www.trustmarkthai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border-subtle hover:border-border-accent transition-all group"
                title="DBD Registered — กรมพัฒนาธุรกิจการค้า"
              >
                <img
                  src={DBD_REGISTERED_URL}
                  alt="DBD Registered"
                  width={96}
                  height={32}
                  className="h-8 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              {/* DBD Verified */}
              <a
                href="https://www.trustmarkthai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border-subtle hover:border-border-accent transition-all group"
                title="DBD Verified"
              >
                <img
                  src={DBD_VERIFIED_URL}
                  alt="DBD Verified"
                  width={96}
                  height={32}
                  className="h-8 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              {/* Thailand Trust Mark */}
              <a
                href="https://www.thailandtrustmark.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border-subtle hover:border-border-accent transition-all group"
                title="Thailand Trust Mark"
              >
                <img
                  src={THAILAND_TRUST_MARK_URL}
                  alt="Thailand Trust Mark"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              {/* ISO Badge (SVG inline) */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border-subtle"
                title="ISO 9001:2015 Quality Management"
              >
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary flex items-center justify-center">
                  <span className="text-[8px] font-bold text-accent-primary leading-none">
                    ISO
                    <br />
                    9001
                  </span>
                </div>
                <span className="text-[10px] text-text-muted leading-tight">
                  Quality
                  <br />
                  Management
                </span>
              </div>
              {/* BOI Badge */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border-subtle"
                title="BOI Promoted — สำนักงานคณะกรรมการส่งเสริมการลงทุน"
              >
                <div className="w-8 h-8 rounded-full border-2 border-accent-secondary flex items-center justify-center">
                  <span className="text-[8px] font-bold text-accent-secondary leading-none">
                    BOI
                  </span>
                </div>
                <span className="text-[10px] text-text-muted leading-tight">
                  Investment
                  <br />
                  Promoted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} SIRINX Co., Ltd. {t("footer.rights")}
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <a
              href="/privacy"
              className="hover:text-accent-primary transition-colors"
            >
              นโยบายความเป็นส่วนตัว
            </a>
            <a
              href="/terms"
              className="hover:text-accent-primary transition-colors"
            >
              เงื่อนไขการใช้งาน
            </a>
            <a
              href="/cookies"
              className="hover:text-accent-primary transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative isolate overflow-x-clip">
      <div className="sirinx-live-energy" aria-hidden="true">
        <span className="sirinx-energy-grid" />
        <span className="sirinx-energy-flow sirinx-energy-flow-a" />
        <span className="sirinx-energy-flow sirinx-energy-flow-b" />
        <span className="sirinx-energy-flow sirinx-energy-flow-c" />
        <span className="sirinx-energy-scan sirinx-energy-scan-a" />
        <span className="sirinx-energy-scan sirinx-energy-scan-b" />
        <span className="sirinx-energy-node sirinx-energy-node-a" />
        <span className="sirinx-energy-node sirinx-energy-node-b" />
        <span className="sirinx-energy-node sirinx-energy-node-c" />
        <span className="sirinx-avatar-watermark">
          <AILiveAvatarMark className="w-full h-full" decorative />
        </span>
      </div>
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
