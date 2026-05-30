import { writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/chokma-growth-os";
const outputPath = path.join(projectRoot, "chokma_generated_assets.md");

const assets = [
  {
    id: "hero-poster",
    role: "Hero section main visual",
    localPath: "/home/ubuntu/webdev-static-assets/chokma-hero-poster.png",
    originalUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-hero-poster-U6YWJQ6EKS8TaMrfGxx5L3.png",
    compressedUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-hero-poster-XsmNSXNMpQZEnQfEdjKbGS.webp",
    prompt:
      "Create an original premium hero image for the brand CHOKMA for use on a Thai landing page. Visual direction: deep blue cinematic background, royal gold highlights, luxurious glow, abstract lottery-number energy motifs, elegant digital light streaks, glossy card-like surfaces, subtle celebratory spark particles, premium mobile-first campaign aesthetic, strong focal composition with the main visual weight on the right side and generous negative space on the left for a headline and call-to-action button. The scene should feel fast, trustworthy, high-conversion, and modern. Include no readable text, no logos from any existing brand, no copied interface, no watermark, and no clutter.",
  },
  {
    id: "lottery-strip",
    role: "Lottery offer support block",
    localPath: "/home/ubuntu/webdev-static-assets/chokma-lottery-strip.png",
    originalUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-lottery-strip-8FnyowjJNNnnAXkQRKZN37.png",
    compressedUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-lottery-strip-LdrAKnifFc43xoUZ9rS3Dr.webp",
    prompt:
      "Create an original premium visual for CHOKMA focused on Thai lottery excitement. Use deep blue and royal gold colors, glowing numbered spheres or abstract lottery balls, celebratory light trails, clean composition, premium campaign look, and safe negative space for nearby marketing copy. No text, no logos, no watermark, no copied layout, no clutter.",
  },
  {
    id: "affiliate-offer",
    role: "Affiliate/referral support block",
    localPath: "/home/ubuntu/webdev-static-assets/chokma-affiliate-offer.png",
    originalUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-affiliate-offer-MMUfEcfatZVMMPRcuZMDDf.png",
    compressedUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-affiliate-offer-cCNyExkL4DdC9UwREw8YAa.webp",
    prompt:
      "Create an original affiliate-program support visual for CHOKMA using deep blue and royal gold. Show a premium network-growth concept with elegant connected user nodes, upward movement cues, subtle commission-growth bars, polished lighting, and a clean high-conversion campaign style for a landing page. The image should communicate referral momentum, exclusivity, and trust. No readable text, no existing brand logos, no copied interface, no watermark. Keep the composition simple and premium.",
  },
];

const markdown = [
  "# CHOKMA Generated Assets",
  "",
  "ไฟล์นี้ถูกสร้างจาก `build-chokma-landing-assets.mjs` เพื่อให้ทีมสามารถอัปเดต prompt spec และ asset manifest ได้แบบรันซ้ำได้จริงเมื่อมีการสร้างภาพรอบใหม่",
  "",
  "| Asset | Local Path | Original URL | Compressed URL | Intended Use | Prompt Spec |",
  "| --- | --- | --- | --- | --- | --- |",
  ...assets.map((asset) =>
    `| ${asset.id} | ${asset.localPath} | ${asset.originalUrl} | ${asset.compressedUrl} | ${asset.role} | ${asset.prompt.replaceAll("|", "\\|")} |`,
  ),
  "",
  "## Rebuild Command",
  "",
  "```bash",
  "cd /home/ubuntu/chokma-growth-os && node build-chokma-landing-assets.mjs",
  "```",
  "",
  "เมื่อต้องการสร้างภาพรอบใหม่ ให้แทนที่ URL และ prompt ในสคริปต์นี้ตาม asset ที่ได้จากระบบสร้างภาพ แล้วรันคำสั่งข้างต้นเพื่อสร้าง manifest เวอร์ชันล่าสุดทันที",
].join("\n");

await writeFile(outputPath, `${markdown}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
