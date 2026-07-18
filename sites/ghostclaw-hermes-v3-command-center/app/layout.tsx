import type { Metadata } from "next";
import "./globals.css";

const title = "GHOSTCLAW · Hermes V3 Command Center";
const description =
  "A bilingual, read-only owner briefing for the evidence-gated 47 Ronin work lane.";
// Replaced with the exact owner-only Sites production origin after the first
// saved deployment reveals it. Keeping this fixed prevents forwarded-header
// poisoning and malformed-origin render failures.
const metadataOrigin = new URL("https://ghostclaw-hermes-command-center.invalid");

export function generateMetadata(): Metadata {
  const socialImage = new URL("/og.png", metadataOrigin).toString();

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1731,
          height: 909,
          alt: "GHOSTCLAW Hermes V3 Command Center — read only, evidence first, human final",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
