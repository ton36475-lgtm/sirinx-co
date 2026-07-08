/**
 * SIRINX Blog / Insights — SEO-friendly, content marketing ready
 * Dual-theme: semantic CSS vars
 * Features: category filtering, featured posts, structured data-ready, newsletter CTA
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Clock,
  Tag,
  Search,
  BookOpen,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { blogPosts, getLocalizedBlogPosts } from "@/lib/blogData";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/blog";

// Re-export for backward compatibility with BlogPost.tsx
export type { BlogPostMeta } from "@/lib/blogData";
export { blogPosts } from "@/lib/blogData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

const categories = [
  { key: "all", labelKey: "blog.category.all", icon: BookOpen },
  { key: "solar-tech", labelKey: "blog.category.solarTech", icon: Zap },
  {
    key: "energy-mgmt",
    labelKey: "blog.category.energyMgmt",
    icon: TrendingUp,
  },
  {
    key: "investment",
    labelKey: "blog.category.investment",
    icon: TrendingUp,
  },
  { key: "industry", labelKey: "blog.category.industry", icon: BookOpen },
  { key: "esg", labelKey: "blog.category.esg", icon: BookOpen },
];

export default function Blog() {
  const { lang, t } = usePageTranslation("blog");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const localizedPosts = getLocalizedBlogPosts(lang);

  const filteredPosts = localizedPosts.filter(post => {
    const matchCategory =
      activeCategory === "all" || post.categoryKey === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const featured = filteredPosts.filter(p => p.featured);
  const regular = filteredPosts.filter(p => !p.featured);
  const activeCategoryLabelKey = categories.find(
    c => c.key === activeCategory
  )?.labelKey;
  const calculatorMetrics = [
    {
      label: t("blog.metric.savings.label"),
      value: t("blog.metric.savings.value"),
      sub: t("blog.metric.savings.sub"),
    },
    {
      label: t("blog.metric.payback.label"),
      value: t("blog.metric.payback.value"),
      sub: t("blog.metric.payback.sub"),
    },
    {
      label: t("blog.metric.lifespan.label"),
      value: t("blog.metric.lifespan.value"),
      sub: t("blog.metric.lifespan.sub"),
    },
    {
      label: t("blog.metric.co2.label"),
      value: t("blog.metric.co2.value"),
      sub: t("blog.metric.co2.sub"),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                {t("blog.hero.eyebrow")}
              </span>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {t("blog.hero.titleLead")}
                <span className="text-gradient-accent">
                  {t("blog.hero.titleAccent")}
                </span>
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed">
                {t("blog.hero.desc")}
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("blog.search.placeholder")}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border-subtle bg-surface-elevated text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-all"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 border-y border-border-subtle bg-surface-elevated sticky top-16 z-20">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap border transition-all ${
                  activeCategory === cat.key
                    ? "bg-accent-glow text-accent-primary border-border-accent"
                    : "border-border-subtle text-text-secondary hover:text-accent-primary hover:border-border-accent"
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-20 bg-background">
          <div className="container">
            <h2 className="font-display text-xl font-bold text-foreground mb-8">
              {t("blog.featured.title")}
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {featured.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-border-accent transition-all h-full"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 text-xs font-medium bg-accent-primary text-text-inverse rounded-md">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-accent-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-text-muted mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.readTime}
                          </span>
                          <span>{post.date}</span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {post.author}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] rounded-full border border-border-subtle text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-xl font-bold text-foreground">
              {activeCategory === "all"
                ? t("blog.all.title")
                : activeCategoryLabelKey
                  ? t(activeCategoryLabelKey)
                  : t("blog.all.fallback")}
            </h2>
            <span className="text-sm text-text-muted">
              {filteredPosts.length} {t("blog.all.countSuffix")}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {regular.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {regular.map((post, i) => (
                  <motion.div
                    key={post.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i % 3}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group block rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-border-accent transition-all h-full"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-3 h-3 text-accent-secondary" />
                          <span className="text-xs text-accent-secondary">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-accent-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-text-muted mb-3 leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {post.readTime}
                            </span>
                            <span>{post.date}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] rounded-full border border-border-subtle text-text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted">{t("blog.empty")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Solar Calculator CTA */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <div>
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                {t("blog.calculator.eyebrow")}
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
                {t("blog.calculator.title")}
              </h2>
              <p className="text-text-secondary mb-6 leading-relaxed">
                {t("blog.calculator.desc")}
              </p>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-6 py-3 font-display font-semibold btn-accent rounded-lg"
              >
                {t("blog.calculator.cta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6 rounded-xl glass-card">
              <div className="grid grid-cols-2 gap-4 text-center">
                {calculatorMetrics.map(item => (
                  <div key={item.label} className="p-3">
                    <div className="font-display text-2xl font-bold text-gradient-accent">
                      {item.value}
                    </div>
                    <div className="text-xs text-foreground font-medium mt-1">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              {t("blog.newsletter.title")}
            </h2>
            <p className="text-text-secondary mb-6">
              {t("blog.newsletter.desc")}
            </p>
            <form
              onSubmit={e => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input");
                if (input && input.value) {
                  toast.success(t("blog.newsletter.success"));
                  input.value = "";
                } else {
                  toast.error(t("blog.newsletter.error"));
                }
              }}
              className="flex gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder={t("blog.newsletter.placeholder")}
                className="flex-1 px-4 py-3 rounded-lg border border-border-subtle bg-surface-elevated text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
              />
              <button
                type="submit"
                className="px-6 py-3 font-display font-semibold btn-accent rounded-lg whitespace-nowrap"
              >
                {t("blog.newsletter.submit")}
              </button>
            </form>
            <p className="text-xs text-text-muted mt-3">
              {t("blog.newsletter.note")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
