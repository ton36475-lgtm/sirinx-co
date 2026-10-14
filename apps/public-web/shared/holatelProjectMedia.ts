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
  Object.freeze({
    id: "holatel-20261004-0126",
    src: "/assets/projects/holatel/20261004/holatel-20261004-0126.jpg",
    width: 1200,
    height: 900,
    alt: Object.freeze({
      th: "ภาพมุมสูงแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล ติดกับถนนมิตรภาพ",
      en: "Aerial view of rooftop solar arrays at Holatel Hotel beside the main highway",
      cn: "Holatel Hotel 屋顶太阳能阵列航拍",
    }),
  }),
  Object.freeze({
    id: "holatel-20261004-0127",
    src: "/assets/projects/holatel/20261004/holatel-20261004-0127.jpg",
    width: 1200,
    height: 900,
    alt: Object.freeze({
      th: "ภาพมุมมองจากด้านบนของแผงโซลาร์ครบชุดบนหลังคาโรงแรมโฮลาเทล",
      en: "Top-down view of the complete rooftop solar array at Holatel Hotel",
      cn: "Holatel Hotel 屋顶太阳能板俯视",
    }),
  }),
  Object.freeze({
    id: "holatel-20261004-0128",
    src: "/assets/projects/holatel/20261004/holatel-20261004-0128.jpg",
    width: 1200,
    height: 900,
    alt: Object.freeze({
      th: "แผงโซลาร์บนหลังคาโรงแรมโฮลาเทล มองเห็นถนนและย่านเมืองโดยรอบ",
      en: "Holatel Hotel rooftop solar installation with the surrounding city district",
      cn: "Holatel Hotel 屋顶太阳能与周边街区",
    }),
  }),
  Object.freeze({
    id: "holatel-20261004-0129",
    src: "/assets/projects/holatel/20261004/holatel-20261004-0129.jpg",
    width: 1200,
    height: 900,
    alt: Object.freeze({
      th: "ภาพมุมกว้างผลงานติดตั้งโซลาร์บนหลังคาโรงแรมโฮลาเทล",
      en: "Wide aerial view of the Holatel Hotel rooftop solar installation",
      cn: "Holatel Hotel 屋顶太阳能全景",
    }),
  }),
  Object.freeze({
    id: "holatel-20261004-0130",
    src: "/assets/projects/holatel/20261004/holatel-20261004-0130.jpg",
    width: 1200,
    height: 900,
    alt: Object.freeze({
      th: "แผงโซลาร์หลายส่วนบนหลังคาโรงแรมโฮลาเทล พร้อมสะพานคนข้ามและย่านการค้า",
      en: "Multiple rooftop solar sections at Holatel Hotel with footbridge and commercial district",
      cn: "Holatel Hotel 多区域屋顶太阳能",
    }),
  }),
]);

export const holatelCover = holatelProjectMedia[0].src;

export function isHolatelProjectMediaPath(src: string): boolean {
  return holatelProjectMedia.some(photo => photo.src === src);
}
