import LegalPage from "@/components/LegalPage";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/legal";

export default function Terms() {
  const { t } = usePageTranslation("legal");

  return (
    <LegalPage
      eyebrow={t("legal.terms.eyebrow")}
      title={t("legal.terms.title")}
      updatedAt={t("legal.updatedAtDate")}
      intro={t("legal.terms.intro")}
      sections={[
        {
          title: t("legal.terms.assessment.title"),
          body: [
            t("legal.terms.assessment.body1"),
            t("legal.terms.assessment.body2"),
          ],
        },
        {
          title: t("legal.terms.usage.title"),
          body: [
            t("legal.terms.usage.body1"),
            t("legal.terms.usage.body2"),
          ],
        },
        {
          title: t("legal.terms.ip.title"),
          body: [
            t("legal.terms.ip.body1"),
            t("legal.terms.ip.body2"),
          ],
        },
        {
          title: t("legal.terms.liability.title"),
          body: [
            t("legal.terms.liability.body1"),
            t("legal.terms.liability.body2"),
          ],
        },
      ]}
    />
  );
}
