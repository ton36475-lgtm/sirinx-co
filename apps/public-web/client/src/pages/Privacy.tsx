import LegalPage from "@/components/LegalPage";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/legal";

export default function Privacy() {
  const { t } = usePageTranslation("legal");

  return (
    <LegalPage
      eyebrow={t("legal.privacy.eyebrow")}
      title={t("legal.privacy.title")}
      updatedAt={t("legal.updatedAtDate")}
      intro={t("legal.privacy.intro")}
      sections={[
        {
          title: t("legal.privacy.data.title"),
          body: [
            t("legal.privacy.data.body1"),
            t("legal.privacy.data.body2"),
          ],
        },
        {
          title: t("legal.privacy.purpose.title"),
          body: [
            t("legal.privacy.purpose.body1"),
            t("legal.privacy.purpose.body2"),
          ],
        },
        {
          title: t("legal.privacy.disclosure.title"),
          body: [
            t("legal.privacy.disclosure.body1"),
            t("legal.privacy.disclosure.body2"),
          ],
        },
        {
          title: t("legal.privacy.rights.title"),
          body: [
            t("legal.privacy.rights.body1"),
            t("legal.privacy.rights.body2"),
          ],
        },
      ]}
    />
  );
}
