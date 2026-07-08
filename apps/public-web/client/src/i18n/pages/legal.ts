import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "legal.updatedAt": {
    th: "อัปเดตล่าสุด",
    en: "Last updated",
    cn: "最后更新",
  },
  "legal.updatedAtDate": {
    th: "16 พฤษภาคม 2026",
    en: "May 16, 2026",
    cn: "2026年5月16日",
  },
  "legal.contactTitle": {
    th: "ติดต่อเรื่องเอกสารและข้อมูลส่วนบุคคล",
    en: "Document and Personal Data Contact",
    cn: "文件与个人资料联系",
  },
  "legal.contactCta": {
    th: "ติดต่อ SIRINX",
    en: "Contact SIRINX",
    cn: "联系 SIRINX",
  },

  "legal.privacy.eyebrow": {
    th: "Privacy Policy",
    en: "Privacy Policy",
    cn: "隐私政策",
  },
  "legal.privacy.title": {
    th: "นโยบายความเป็นส่วนตัว",
    en: "Privacy Policy",
    cn: "隐私政策",
  },
  "legal.privacy.intro": {
    th: "SIRINX ให้ความสำคัญกับข้อมูลของลูกค้า ผู้สนใจบริการ และพันธมิตรที่ติดต่อผ่านเว็บไซต์นี้ นโยบายนี้อธิบายข้อมูลที่เราเก็บ วิธีใช้ และสิทธิของคุณ",
    en: "SIRINX treats customer, prospect, and partner data with care. This policy explains what we collect, how we use it, and the rights available to you.",
    cn: "SIRINX 重视客户、潜在客户和合作伙伴的数据。本政策说明我们收集哪些信息、如何使用信息，以及您拥有的权利。",
  },
  "legal.privacy.data.title": {
    th: "ข้อมูลที่เราเก็บ",
    en: "Information We Collect",
    cn: "我们收集的信息",
  },
  "legal.privacy.data.body1": {
    th: "เราอาจเก็บข้อมูลที่คุณกรอกผ่านแบบฟอร์ม เช่น ชื่อ บริษัท อีเมล เบอร์โทร ประเภทธุรกิจ ค่าไฟโดยประมาณ พื้นที่ติดตั้ง และรายละเอียดโครงการ",
    en: "We may collect information submitted through forms, such as name, company, email, phone number, business type, estimated electricity bill, installation area, and project details.",
    cn: "我们可能收集您通过表单提交的信息，例如姓名、公司、电子邮件、电话号码、业务类型、预估电费、安装区域和项目详情。",
  },
  "legal.privacy.data.body2": {
    th: "เว็บไซต์อาจเก็บข้อมูลเชิงเทคนิค เช่น หน้าเว็บที่เข้าชม อุปกรณ์ เบราว์เซอร์ และข้อมูลการใช้งานเพื่อปรับปรุงประสบการณ์และความปลอดภัย",
    en: "The website may collect technical information such as visited pages, device type, browser, and usage data to improve experience and security.",
    cn: "网站可能收集技术信息，例如访问页面、设备类型、浏览器和使用数据，以改善体验和安全性。",
  },
  "legal.privacy.purpose.title": {
    th: "วัตถุประสงค์การใช้ข้อมูล",
    en: "How We Use Information",
    cn: "信息使用目的",
  },
  "legal.privacy.purpose.body1": {
    th: "เราใช้ข้อมูลเพื่อประเมินระบบ Solar Carport, Rooftop Solar, BESS, EV Charger หรือบริการพลังงานที่เกี่ยวข้อง และเพื่อติดต่อกลับตามคำขอของคุณ",
    en: "We use information to assess Solar Carport, Rooftop Solar, BESS, EV Charger, and related energy services, and to respond to your request.",
    cn: "我们使用信息评估 Solar Carport、屋顶光伏、BESS、EV 充电及相关能源服务，并根据您的请求联系您。",
  },
  "legal.privacy.purpose.body2": {
    th: "ข้อมูลเชิงสถิติใช้เพื่อปรับปรุงเว็บไซต์ วิเคราะห์ความสนใจของผู้ใช้งาน และวางแผนบริการให้เหมาะสมกับลูกค้าธุรกิจ",
    en: "Aggregated statistics help us improve the website, understand user interest, and plan services that fit business customers.",
    cn: "汇总统计数据帮助我们改进网站、了解用户兴趣，并规划更适合企业客户的服务。",
  },
  "legal.privacy.disclosure.title": {
    th: "การเปิดเผยข้อมูล",
    en: "Information Sharing",
    cn: "信息共享",
  },
  "legal.privacy.disclosure.body1": {
    th: "เราไม่ขายข้อมูลส่วนบุคคลของคุณให้บุคคลภายนอก",
    en: "We do not sell your personal data to third parties.",
    cn: "我们不会向第三方出售您的个人数据。",
  },
  "legal.privacy.disclosure.body2": {
    th: "ในบางกรณี เราอาจแบ่งปันข้อมูลที่จำเป็นกับทีมวิศวกร ผู้ให้บริการระบบ หรือพันธมิตรที่เกี่ยวข้องกับการประเมินและนำเสนอโครงการ โดยจำกัดตามวัตถุประสงค์เท่านั้น",
    en: "When needed, we may share limited information with engineers, service providers, or relevant partners for assessment and proposal preparation.",
    cn: "必要时，我们可能与工程团队、服务供应商或相关合作伙伴共享有限信息，用于评估和方案准备。",
  },
  "legal.privacy.rights.title": {
    th: "สิทธิของคุณ",
    en: "Your Rights",
    cn: "您的权利",
  },
  "legal.privacy.rights.body1": {
    th: "คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลที่ส่งให้เราได้ตามกฎหมายที่เกี่ยวข้อง",
    en: "You may request access, correction, or deletion of information you submitted, subject to applicable law.",
    cn: "您可根据适用法律请求访问、更正或删除您提交的信息。",
  },
  "legal.privacy.rights.body2": {
    th: "หากต้องการถอนความยินยอมในการติดต่อหรือการใช้ข้อมูลบางประเภท กรุณาติดต่อเราตามข้อมูลด้านล่าง",
    en: "To withdraw consent for contact or selected data use, please contact us using the details below.",
    cn: "如需撤回联系或部分数据使用同意，请通过下方方式联系我们。",
  },

  "legal.terms.eyebrow": {
    th: "Terms of Use",
    en: "Terms of Use",
    cn: "使用条款",
  },
  "legal.terms.title": {
    th: "เงื่อนไขการใช้งาน",
    en: "Terms of Use",
    cn: "使用条款",
  },
  "legal.terms.intro": {
    th: "การใช้งานเว็บไซต์ SIRINX ถือว่าคุณยอมรับเงื่อนไขนี้ ข้อมูลบนเว็บไซต์มีไว้เพื่อการศึกษา การประเมินเบื้องต้น และการติดต่อขอข้อเสนอทางธุรกิจ",
    en: "By using the SIRINX website, you accept these terms. Website information is provided for education, preliminary assessment, and business inquiry purposes.",
    cn: "使用 SIRINX 网站即表示您接受本条款。网站信息用于教育、初步评估和商业咨询目的。",
  },
  "legal.terms.assessment.title": {
    th: "ข้อมูลบริการและการประเมิน",
    en: "Service and Assessment Information",
    cn: "服务与评估信息",
  },
  "legal.terms.assessment.body1": {
    th: "ตัวเลขค่าไฟ ผลประหยัด ขนาดระบบ ระยะคืนทุน และผลตอบแทนที่แสดงบนเว็บไซต์เป็นการประเมินเบื้องต้นเท่านั้น",
    en: "Electricity cost, savings, system size, payback, and return figures on this website are preliminary estimates only.",
    cn: "网站显示的电费、节省金额、系统规模、回本周期和回报数据仅为初步估算。",
  },
  "legal.terms.assessment.body2": {
    th: "ข้อเสนอจริงขึ้นอยู่กับข้อมูลหน้างาน โครงสร้างพื้นที่ เงื่อนไขการเชื่อมต่อไฟฟ้า ราคาอุปกรณ์ และการตรวจสอบโดยทีมวิศวกร",
    en: "Actual proposals depend on site data, structure, grid conditions, equipment pricing, and engineering review.",
    cn: "实际方案取决于现场数据、结构条件、并网条件、设备价格和工程审核。",
  },
  "legal.terms.usage.title": {
    th: "การใช้งานเว็บไซต์",
    en: "Website Use",
    cn: "网站使用",
  },
  "legal.terms.usage.body1": {
    th: "ผู้ใช้งานต้องไม่ใช้เว็บไซต์เพื่อส่งข้อมูลเท็จ รบกวนระบบ ทดลองโจมตี หรือดำเนินการใดที่กระทบต่อความปลอดภัยและการให้บริการ",
    en: "Users must not submit false information, disrupt systems, attempt attacks, or take actions that affect security or service availability.",
    cn: "用户不得提交虚假信息、干扰系统、尝试攻击，或采取影响安全和服务可用性的行为。",
  },
  "legal.terms.usage.body2": {
    th: "เราขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือหยุดให้บริการบางส่วนของเว็บไซต์โดยไม่ต้องแจ้งล่วงหน้า",
    en: "We reserve the right to improve, change, or suspend parts of the website without prior notice.",
    cn: "我们保留在不提前通知的情况下改进、更改或暂停网站部分内容的权利。",
  },
  "legal.terms.ip.title": {
    th: "ทรัพย์สินทางปัญญา",
    en: "Intellectual Property",
    cn: "知识产权",
  },
  "legal.terms.ip.body1": {
    th: "ข้อความ ภาพประกอบ โครงสร้างหน้าเว็บ เครื่องหมายการค้า และองค์ประกอบแบรนด์ของ SIRINX เป็นทรัพย์สินของบริษัทหรือผู้ให้สิทธิ์ที่เกี่ยวข้อง",
    en: "Text, imagery, page structure, trademarks, and SIRINX brand elements belong to the company or relevant licensors.",
    cn: "文字、图片、页面结构、商标和 SIRINX 品牌元素属于公司或相关授权方。",
  },
  "legal.terms.ip.body2": {
    th: "ห้ามคัดลอก ดัดแปลง เผยแพร่ หรือใช้เพื่อการค้าโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
    en: "Copying, modifying, publishing, or commercial use without written permission is prohibited.",
    cn: "未经书面许可，禁止复制、修改、发布或用于商业用途。",
  },
  "legal.terms.liability.title": {
    th: "ข้อจำกัดความรับผิด",
    en: "Limitation of Liability",
    cn: "责任限制",
  },
  "legal.terms.liability.body1": {
    th: "SIRINX จะใช้ความพยายามอย่างเหมาะสมในการให้ข้อมูลที่ถูกต้อง แต่ไม่รับประกันว่าข้อมูลทุกส่วนจะครบถ้วนหรือเหมาะกับทุกสถานการณ์",
    en: "SIRINX makes reasonable efforts to provide accurate information but does not guarantee that all information is complete or suitable for every situation.",
    cn: "SIRINX 会合理努力提供准确信息，但不保证所有信息完整或适用于每种情况。",
  },
  "legal.terms.liability.body2": {
    th: "ผู้ใช้งานควรปรึกษาทีมวิศวกรหรือผู้เชี่ยวชาญก่อนตัดสินใจลงทุนหรือติดตั้งระบบพลังงาน",
    en: "Users should consult engineers or qualified experts before making investment or installation decisions.",
    cn: "用户在投资或安装能源系统前，应咨询工程团队或合格专家。",
  },

  "legal.cookies.eyebrow": {
    th: "Cookie Policy",
    en: "Cookie Policy",
    cn: "Cookie 政策",
  },
  "legal.cookies.title": {
    th: "นโยบายคุกกี้",
    en: "Cookie Policy",
    cn: "Cookie 政策",
  },
  "legal.cookies.intro": {
    th: "เว็บไซต์ SIRINX อาจใช้คุกกี้และเทคโนโลยีคล้ายกันเพื่อให้เว็บไซต์ทำงานได้ดี วิเคราะห์การใช้งาน และปรับปรุงบริการออนไลน์",
    en: "The SIRINX website may use cookies and similar technologies to operate correctly, analyze usage, and improve online services.",
    cn: "SIRINX 网站可能使用 Cookie 和类似技术，以确保网站正常运行、分析使用情况并改进在线服务。",
  },
  "legal.cookies.essential.title": {
    th: "คุกกี้ที่จำเป็น",
    en: "Essential Cookies",
    cn: "必要 Cookie",
  },
  "legal.cookies.essential.body1": {
    th: "คุกกี้บางประเภทจำเป็นต่อการทำงานพื้นฐานของเว็บไซต์ เช่น การตั้งค่าภาษา ธีม การรักษาความปลอดภัย และการแสดงผลที่ถูกต้อง",
    en: "Some cookies are necessary for basic website functions such as language, theme, security, and correct rendering.",
    cn: "部分 Cookie 是网站基本功能所必需，例如语言、主题、安全和正确显示。",
  },
  "legal.cookies.essential.body2": {
    th: "หากปิดคุกกี้เหล่านี้ บางฟังก์ชันอาจทำงานไม่สมบูรณ์",
    en: "If these cookies are disabled, some functions may not work correctly.",
    cn: "如果禁用这些 Cookie，某些功能可能无法正常运行。",
  },
  "legal.cookies.analytics.title": {
    th: "คุกกี้วิเคราะห์การใช้งาน",
    en: "Analytics Cookies",
    cn: "分析 Cookie",
  },
  "legal.cookies.analytics.body1": {
    th: "เราอาจใช้ข้อมูลการเข้าชมแบบรวมเพื่อดูว่าหน้าใดมีผู้ใช้งานมากที่สุด เส้นทางใดทำให้ผู้ใช้ติดต่อเรา และจุดใดควรปรับปรุง",
    en: "We may use aggregated visit data to understand popular pages, contact paths, and areas that need improvement.",
    cn: "我们可能使用汇总访问数据了解热门页面、联系路径和需要改进的部分。",
  },
  "legal.cookies.analytics.body2": {
    th: "ข้อมูลนี้ช่วยให้เราปรับปรุงเนื้อหา Solar Carport, BESS, EV Charger และบริการพลังงานให้ตรงกับความต้องการของผู้ใช้",
    en: "This helps us improve Solar Carport, BESS, EV Charger, and energy service content around user needs.",
    cn: "这些数据帮助我们根据用户需求改进 Solar Carport、BESS、EV 充电和能源服务内容。",
  },
  "legal.cookies.management.title": {
    th: "การจัดการคุกกี้",
    en: "Managing Cookies",
    cn: "管理 Cookie",
  },
  "legal.cookies.management.body1": {
    th: "คุณสามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธหรือลบคุกกี้ได้ตลอดเวลา",
    en: "You can configure your browser to reject or delete cookies at any time.",
    cn: "您可以随时设置浏览器拒绝或删除 Cookie。",
  },
  "legal.cookies.management.body2": {
    th: "การปิดคุกกี้บางส่วนอาจทำให้ประสบการณ์ใช้งานลดลง แต่ยังสามารถเข้าถึงข้อมูลหลักของเว็บไซต์ได้",
    en: "Disabling some cookies may reduce the experience, but core website information should remain accessible.",
    cn: "禁用部分 Cookie 可能影响体验，但仍可访问网站核心信息。",
  },
  "legal.cookies.changes.title": {
    th: "การเปลี่ยนแปลงนโยบาย",
    en: "Policy Changes",
    cn: "政策变更",
  },
  "legal.cookies.changes.body1": {
    th: "เราอาจปรับปรุงนโยบายคุกกี้ตามการเปลี่ยนแปลงของระบบ เว็บไซต์ หรือข้อกำหนดทางกฎหมาย",
    en: "We may update this cookie policy as systems, the website, or legal requirements change.",
    cn: "我们可能因系统、网站或法律要求变化而更新本 Cookie 政策。",
  },
  "legal.cookies.changes.body2": {
    th: "วันที่อัปเดตล่าสุดจะแสดงบนหน้านี้เพื่อให้ผู้ใช้งานตรวจสอบได้ง่าย",
    en: "The latest update date is shown on this page for easy review.",
    cn: "最新更新日期会显示在本页面，方便用户查看。",
  },
};

registerPageTranslations("legal", dict);

export default dict;
