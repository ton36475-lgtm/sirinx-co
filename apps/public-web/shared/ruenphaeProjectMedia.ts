import type { PublicProjectPhoto } from "./publicProjectMedia";

const photo = (
  filename: string,
  portrait: boolean,
  alt: PublicProjectPhoto["alt"],
): PublicProjectPhoto => Object.freeze({
  id: `ruenphae-${filename}`,
  src: `/assets/projects/ruenphae/20260924/${filename}.jpg`,
  width: portrait ? 721 : 1280,
  height: portrait ? 1280 : 721,
  alt: Object.freeze({ ...alt }),
});

/** Public-draft images reviewed without people or readable vehicle plates. */
export const ruenphaeProjectMedia: readonly PublicProjectPhoto[] = Object.freeze([
  photo("1000076001", false, {
    th: "แผงโซลาร์บนหลังคาอาคารบริเวณสระว่ายน้ำ โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Rooftop solar panels beside the pool at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店泳池旁建筑屋顶的太阳能板",
  }),
  photo("1000076003", false, {
    th: "ภาพรวมแผงโซลาร์บนหลังคารอบสระว่ายน้ำ โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Overview of rooftop solar arrays around the pool at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店泳池周围屋顶太阳能阵列全景",
  }),
  photo("1000076002", false, {
    th: "แผงโซลาร์บนหลังคาหลายส่วนของอาคาร โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar arrays on several roof sections at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店多个屋顶区域安装的太阳能阵列",
  }),
  photo("1000076004", true, {
    th: "ภาพมุมสูงของ Solar Carport และพื้นที่จอดรถ โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Elevated view of the solar carport and parking area at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店太阳能车棚及停车区的高处视角",
  }),
  photo("1000076005", true, {
    th: "แผงโซลาร์เหนือพื้นที่จอดรถจากมุมสูง โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar panels above the parking area seen from above at Ruenphae Royal Park Hotel",
    cn: "从高处俯瞰 Ruenphae Royal Park 酒店停车区上方的太阳能板",
  }),
  photo("1000075999", true, {
    th: "Solar Carport บริเวณทางเข้าโรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar carport near the entrance of Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店入口附近的太阳能车棚",
  }),
]);

export const ruenphaeCover = ruenphaeProjectMedia[0].src;

export function isRuenphaeProjectMediaPath(src: string): boolean {
  return ruenphaeProjectMedia.some(photo => photo.src === src);
}
