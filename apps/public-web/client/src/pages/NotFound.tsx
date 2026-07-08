import { Link } from "wouter";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-glow flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-accent-primary" />
        </div>
        <h1 className="font-display text-6xl font-bold text-gradient-accent mb-3">404</h1>
        <h2 className="font-display text-xl font-semibold text-foreground mb-3">{t("notFound.title")}</h2>
        <p className="text-text-muted mb-8">
          {t("notFound.desc")}
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 font-display font-semibold btn-accent rounded-lg">
          <ArrowLeft className="w-4 h-4" /> {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}
