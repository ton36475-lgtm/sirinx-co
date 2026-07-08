import LegalPage from "@/components/LegalPage";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/legal";

export default function Cookies() {
  const { t } = usePageTranslation("legal");

  return (
    <LegalPage
      eyebrow={t("legal.cookies.eyebrow")}
      title={t("legal.cookies.title")}
      updatedAt={t("legal.updatedAtDate")}
      intro={t("legal.cookies.intro")}
      sections={[
        {
          title: t("legal.cookies.essential.title"),
          body: [
            t("legal.cookies.essential.body1"),
            t("legal.cookies.essential.body2"),
          ],
        },
        {
          title: t("legal.cookies.analytics.title"),
          body: [
            t("legal.cookies.analytics.body1"),
            t("legal.cookies.analytics.body2"),
          ],
        },
        {
          title: t("legal.cookies.management.title"),
          body: [
            t("legal.cookies.management.body1"),
            t("legal.cookies.management.body2"),
          ],
        },
        {
          title: t("legal.cookies.changes.title"),
          body: [
            t("legal.cookies.changes.body1"),
            t("legal.cookies.changes.body2"),
          ],
        },
      ]}
    />
  );
}
