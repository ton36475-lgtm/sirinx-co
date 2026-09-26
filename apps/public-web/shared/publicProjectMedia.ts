/** Customer-facing project photo data. Provenance stays in private review records. */
export type PublicProjectPhoto = Readonly<{
  id: string;
  src: string;
  width: number;
  height: number;
  presentation?: "original" | "cosmetic-retouch";
  alt: Readonly<{ th: string; en: string; cn: string }>;
}>;
