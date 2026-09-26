import type { PublicProjectPhoto } from "./publicProjectMedia";

/** Owner-supplied installation photos selected without people, plates, equipment labels, or billboards. */
export const holatelProjectMedia: readonly PublicProjectPhoto[] = Object.freeze([
  Object.freeze({
    id: "holatel-1000075878",
    src: "/assets/projects/holatel/20260924/1000075878.jpg",
    width: 1280,
    height: 721,
    alt: Object.freeze({
      th: "แผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
      en: "Rooftop solar arrays at Holatel Hotel",
      cn: "Holatel Hotel 屋顶太阳能阵列",
    }),
  }),
  Object.freeze({
    id: "holatel-1000075879",
    src: "/assets/projects/holatel/20260924/1000075879.jpg",
    width: 1280,
    height: 721,
    alt: Object.freeze({
      th: "ภาพระยะใกล้ของแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
      en: "Close view of rooftop solar panels at Holatel Hotel",
      cn: "Holatel Hotel 屋顶太阳能板近景",
    }),
  }),
  Object.freeze({
    id: "holatel-1000075803",
    src: "/assets/projects/holatel/20260924/1000075803.jpg",
    width: 597,
    height: 1280,
    alt: Object.freeze({
      th: "อาคารโรงแรมโฮลาเทลจากพื้นที่จอดรถ",
      en: "Holatel Hotel building viewed from the parking area",
      cn: "从停车区拍摄的 Holatel Hotel 建筑",
    }),
  }),
]);

export const holatelCover = holatelProjectMedia[0].src;

export function isHolatelProjectMediaPath(src: string): boolean {
  return holatelProjectMedia.some(photo => photo.src === src);
}
