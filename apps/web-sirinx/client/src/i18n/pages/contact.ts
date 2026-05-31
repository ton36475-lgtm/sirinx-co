import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  /* ── Contact Channels ── */
  chPhone: { th: "โทรศัพท์", en: "Phone", cn: "电话" },
  chPhoneSub: { th: "คุณ Pitoon — CEO & Founder", en: "Khun Pitoon — CEO & Founder", cn: "Pitoon — CEO & 创始人" },
  chEmail: { th: "อีเมล", en: "Email", cn: "电子邮件" },
  chEmailSub: { th: "ตอบกลับภายใน 24 ชม.", en: "Reply within 24 hrs", cn: "24小时内回复" },
  chOffice: { th: "สำนักงาน", en: "Office", cn: "办公室" },
  chWebsite: { th: "เว็บไซต์", en: "Website", cn: "网站" },
  chWebsiteSub: { th: "ติดต่อได้ตลอด 24 ชม.", en: "Available 24/7", cn: "全天候服务" },
  chLineSub: { th: "แชทสดกับทีมงาน", en: "Live chat with our team", cn: "与团队实时聊天" },

  /* ── Interest Options ── */
  interestGeneral: { th: "ปรึกษาทั่วไป", en: "General Consultation", cn: "一般咨询" },

  /* ── Budget Ranges ── */
  budgetUndefined: { th: "ยังไม่ได้กำหนด", en: "Not yet determined", cn: "尚未确定" },
  budgetUnder5: { th: "ต่ำกว่า 5 ล้านบาท", en: "Under 5M THB", cn: "低于500万泰铢" },
  budget5to15: { th: "5-15 ล้านบาท", en: "5-15M THB", cn: "500-1500万泰铢" },
  budget15to50: { th: "15-50 ล้านบาท", en: "15-50M THB", cn: "1500-5000万泰铢" },
  budget50to100: { th: "50-100 ล้านบาท", en: "50-100M THB", cn: "5000万-1亿泰铢" },
  budgetOver100: { th: "มากกว่า 100 ล้านบาท", en: "Over 100M THB", cn: "超过1亿泰铢" },

  /* ── Timeline Options ── */
  timeline1m: { th: "ภายใน 1 เดือน", en: "Within 1 month", cn: "1个月内" },
  timeline1to3m: { th: "1-3 เดือน", en: "1-3 months", cn: "1-3个月" },
  timeline3to6m: { th: "3-6 เดือน", en: "3-6 months", cn: "3-6个月" },
  timeline6to12m: { th: "6-12 เดือน", en: "6-12 months", cn: "6-12个月" },
  timelineResearch: { th: "กำลังศึกษาข้อมูล", en: "Still researching", cn: "正在研究中" },

  /* ── Prefill Messages ── */
  prefillPackage: { th: "แพ็คเกจที่สนใจ:", en: "Interested package:", cn: "感兴趣的套餐：" },
  prefillFromPricing: { th: "(ข้อมูลจากหน้าแพ็คเกจราคา)", en: "(Data from pricing page)", cn: "(来自价格页面的数据)" },
  prefillSystem: { th: "ขนาดระบบที่แนะนำ:", en: "Recommended system size:", cn: "推荐系统规模：" },
  prefillBizType: { th: "ประเภทธุรกิจ:", en: "Business type:", cn: "业务类型：" },
  prefillBill: { th: "ค่าไฟปัจจุบัน:", en: "Current electricity bill:", cn: "当前电费：" },
  prefillBillUnit: { th: "บาท/เดือน", en: "THB/month", cn: "泰铢/月" },
  prefillBESS: { th: "ระบบ BESS:", en: "BESS system:", cn: "BESS系统：" },
  prefillFromCalc: { th: "(ข้อมูลจากเครื่องมือคำนวณ Solar Assessment)", en: "(Data from Solar Assessment calculator)", cn: "(来自太阳能评估计算器的数据)" },

  /* ── Success State ── */
  successToast: { th: "ส่งข้อมูลเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง", en: "Submitted successfully. Our team will contact you within 24 hours.", cn: "提交成功。我们的团队将在24小时内与您联系。" },
  errorToast: { th: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", en: "An error occurred. Please try again.", cn: "发生错误，请重试。" },
  successTitle: { th: "ขอบคุณสำหรับข้อมูล", en: "Thank You for Your Information", cn: "感谢您提供的信息" },
  successDesc: { th: "ทีมวิศวกรของ SIRINX จะตรวจสอบข้อมูลและติดต่อกลับภายใน 24 ชั่วโมง หากต้องการความช่วยเหลือเร่งด่วน กรุณาโทร +66 81 972 3969", en: "SIRINX engineering team will review your information and contact you within 24 hours. For urgent assistance, please call +66 81 972 3969", cn: "SIRINX工程团队将审核您的信息并在24小时内与您联系。如需紧急帮助，请致电 +66 81 972 3969" },
  successBtnHome: { th: "กลับหน้าหลัก", en: "Back to Home", cn: "返回首页" },
  successBtnCalc: { th: "คำนวณระบบโซลาร์", en: "Calculate Solar System", cn: "计算太阳能系统" },
  successLinePrompt: { th: "ติดตามสถานะผ่าน LINE OA ได้เลย", en: "Follow up via LINE OA", cn: "通过LINE OA跟进" },
  successLineBtn: { th: "เพิ่มเพื่อน LINE @SIRINX", en: "Add LINE @SIRINX", cn: "添加LINE @SIRINX" },
  fallbackToast: { th: "ระบบรับข้อมูลอัตโนมัติไม่พร้อม เปิดอีเมลสำรองให้แล้ว", en: "Automatic lead capture is unavailable. Backup email is ready.", cn: "自动线索提交暂不可用，备用邮件已准备好。" },
  fallbackCopyToast: { th: "คัดลอกข้อมูลสำหรับส่งให้ทีม SIRINX แล้ว", en: "Copied the lead details for the SIRINX team.", cn: "已复制给 SIRINX 团队的线索详情。" },
  fallbackTitle: { th: "เปิดช่องทางส่งข้อมูลสำรองแล้ว", en: "Backup Submission Ready", cn: "备用提交已准备好" },
  fallbackDesc: { th: "ระบบบันทึกอัตโนมัติของเว็บยังไม่พร้อมใช้งานในขณะนี้ กรุณากดส่งอีเมลหรือส่งข้อความผ่าน LINE เพื่อให้ทีม SIRINX ได้รับข้อมูลทันที", en: "The website's automatic capture endpoint is not available right now. Send the prepared email or contact us on LINE so the SIRINX team receives the details immediately.", cn: "网站自动提交端点暂不可用。请发送已准备好的邮件或通过 LINE 联系我们，以便 SIRINX 团队立即收到信息。" },
  fallbackEmailBtn: { th: "ส่งอีเมลให้ทีม SIRINX", en: "Email SIRINX Team", cn: "发送邮件给 SIRINX 团队" },
  fallbackLineBtn: { th: "ส่งผ่าน LINE", en: "Send via LINE", cn: "通过 LINE 发送" },
  fallbackCopyBtn: { th: "คัดลอกข้อมูล", en: "Copy Details", cn: "复制详情" },
  fallbackCopiedBtn: { th: "คัดลอกแล้ว", en: "Copied", cn: "已复制" },
  fallbackEditBtn: { th: "กลับไปแก้ข้อมูล", en: "Edit Information", cn: "返回编辑信息" },

  /* ── Hero Section ── */
  heroLabel: { th: "Contact Us", en: "Contact Us", cn: "联系我们" },
  heroTitle: { th: "เริ่มต้น", en: "Start ", cn: "今天开始" },
  heroTitleAccent: { th: "ลดค่าพลังงาน", en: "Reducing Energy Costs", cn: "降低能源成本" },
  heroTitleEnd: { th: "วันนี้", en: " Today", cn: "" },
  heroDesc: { th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด ทีมวิศวกรพร้อมออกแบบระบบที่เหมาะสมกับธุรกิจของคุณ", en: "Free site survey, no obligation. Our engineering team is ready to design the right system for your business.", cn: "免费现场勘察，无任何义务。我们的工程团队随时为您的企业设计最合适的系统。" },

  /* ── Form Section ── */
  formTitle: { th: "แบบฟอร์มขอใบเสนอราคา", en: "Request a Quote", cn: "请求报价" },
  formDesc: { th: "กรอกข้อมูลเบื้องต้น ทีมวิศวกรจะวิเคราะห์และติดต่อกลับภายใน 24 ชม.", en: "Fill in basic information. Our engineers will analyze and contact you within 24 hours.", cn: "填写基本信息。我们的工程师将在24小时内分析并与您联系。" },
  labelName: { th: "ชื่อ-นามสกุล *", en: "Full Name *", cn: "姓名 *" },
  labelCompany: { th: "บริษัท / องค์กร", en: "Company / Organization", cn: "公司/组织" },
  labelEmail: { th: "อีเมล", en: "Email", cn: "电子邮件" },
  labelPhone: { th: "เบอร์โทรศัพท์ *", en: "Phone Number *", cn: "电话号码 *" },
  labelInterest: { th: "โซลูชันที่สนใจ *", en: "Solution of Interest *", cn: "感兴趣的解决方案 *" },
  labelBudget: { th: "งบประมาณโดยประมาณ", en: "Approximate Budget", cn: "大致预算" },
  labelTimeline: { th: "ระยะเวลาที่ต้องการ", en: "Desired Timeline", cn: "期望时间" },
  labelBill: { th: "ค่าไฟฟ้าต่อเดือน (บาท)", en: "Monthly Electricity Bill (THB)", cn: "每月电费（泰铢）" },
  labelRoof: { th: "พื้นที่หลังคาโดยประมาณ (ตร.ม.)", en: "Approximate Roof Area (sq.m.)", cn: "大致屋顶面积（平方米）" },
  labelMessage: { th: "ข้อความเพิ่มเติม", en: "Additional Message", cn: "附加信息" },
  phName: { th: "ชื่อ-นามสกุล", en: "Full name", cn: "姓名" },
  phCompany: { th: "ชื่อบริษัท", en: "Company name", cn: "公司名称" },
  phBill: { th: "เช่น 300000", en: "e.g. 300000", cn: "例如 300000" },
  phRoof: { th: "เช่น 5000", en: "e.g. 5000", cn: "例如 5000" },
  phMessage: { th: "รายละเอียดเพิ่มเติมเกี่ยวกับโครงการ หรือคำถามที่ต้องการให้ทีมวิศวกรตอบ", en: "Additional project details or questions for our engineering team", cn: "项目的其他详情或需要工程团队解答的问题" },
  selectSolution: { th: "เลือกโซลูชัน", en: "Select a solution", cn: "选择解决方案" },
  selectBudget: { th: "เลือกช่วงงบประมาณ", en: "Select budget range", cn: "选择预算范围" },
  selectTimeline: { th: "เลือกระยะเวลา", en: "Select timeline", cn: "选择时间" },
  btnSubmitting: { th: "กำลังส่ง...", en: "Submitting...", cn: "提交中..." },
  btnSubmit: { th: "ส่งข้อมูลขอใบเสนอราคา", en: "Submit Quote Request", cn: "提交报价请求" },
  formPrivacy: { th: "ข้อมูลของคุณจะถูกเก็บเป็นความลับ ใช้เพื่อการติดต่อกลับเท่านั้น", en: "Your information is kept confidential and used only for follow-up contact.", cn: "您的信息将被保密，仅用于后续联系。" },

  /* ── Sidebar ── */
  lineTitle: { th: "แชทกับเราผ่าน LINE", en: "Chat with Us on LINE", cn: "通过LINE与我们聊天" },
  lineDesc: { th: "สอบถามข้อมูลเบื้องต้น หรือนัดสำรวจหน้างานผ่าน LINE OA ได้ทันที ตอบกลับรวดเร็วภายใน 5 นาที", en: "Ask preliminary questions or schedule a site survey via LINE OA. Quick response within 5 minutes.", cn: "通过LINE OA咨询初步问题或预约现场勘察。5分钟内快速回复。" },
  lineBtn: { th: "เพิ่มเพื่อน LINE @SIRINX", en: "Add LINE @SIRINX", cn: "添加LINE @SIRINX" },
  calcTitle: { th: "ยังไม่แน่ใจ?", en: "Not Sure Yet?", cn: "还不确定？" },
  calcDesc: { th: "ใช้เครื่องมือคำนวณขั้นสูงของ SIRINX เพื่อประเมินขนาดระบบ ผลตอบแทน และระยะเวลาคืนทุนเบื้องต้น", en: "Use SIRINX's advanced calculator to estimate system size, returns, and payback period.", cn: "使用SIRINX的高级计算器估算系统规模、回报和投资回收期。" },
  calcLink: { th: "คำนวณระบบโซลาร์", en: "Calculate Solar System", cn: "计算太阳能系统" },

  /* ── Steps after submit ── */
  stepsTitle: { th: "ขั้นตอนหลังส่งแบบฟอร์ม", en: "Steps After Submission", cn: "提交后的步骤" },
  step1Title: { th: "ทีมวิศวกรตรวจสอบข้อมูล", en: "Engineering team reviews data", cn: "工程团队审核数据" },
  step1Time: { th: "ภายใน 24 ชม.", en: "Within 24 hrs", cn: "24小时内" },
  step2Title: { th: "นัดสำรวจหน้างาน", en: "Schedule site survey", cn: "预约现场勘察" },
  step2Time: { th: "ภายใน 3-5 วัน", en: "Within 3-5 days", cn: "3-5天内" },
  step3Title: { th: "ออกแบบระบบ + ประเมิน ROI", en: "System design + ROI estimate", cn: "系统设计 + ROI评估" },
  step3Time: { th: "ภายใน 7 วัน", en: "Within 7 days", cn: "7天内" },
  step4Title: { th: "นำเสนอข้อเสนอ", en: "Present proposal", cn: "提交方案" },
  step4Time: { th: "ภายใน 10 วัน", en: "Within 10 days", cn: "10天内" },

  /* ── Why SIRINX ── */
  whyTitle: { th: "ทำไมเลือก SIRINX", en: "Why Choose SIRINX", cn: "为什么选择SIRINX" },
  why1: { th: "สำรวจหน้างานฟรี ไม่มีข้อผูกมัด", en: "Free site survey, no obligation", cn: "免费现场勘察，无任何义务" },
  why2: { th: "ใบเสนอราคาโปร่งใส ไม่มีค่าใช้จ่ายแอบแฝง", en: "Transparent quotation, no hidden costs", cn: "透明报价，无隐藏费用" },
  why3: { th: "ทีมวิศวกรมืออาชีพ", en: "Professional engineering team", cn: "专业工程团队" },
  why4: { th: "ดูแลระบบตลอดอายุ 25 ปี", en: "System maintenance for 25 years", cn: "25年系统维护" },

  /* ── Final CTA ── */
  ctaTitle: { th: "ต้องการข้อมูลเพิ่มเติม?", en: "Need More Information?", cn: "需要更多信息？" },
  ctaDesc: { th: "ศึกษาข้อมูลเพิ่มเติมเกี่ยวกับโซลูชันและผลงานของเรา", en: "Learn more about our solutions and portfolio", cn: "了解更多关于我们的解决方案和项目" },
  ctaBtnSolutions: { th: "ดูโซลูชันทั้งหมด", en: "View All Solutions", cn: "查看所有解决方案" },
  ctaBtnProjects: { th: "ดูผลงาน", en: "View Portfolio", cn: "查看项目" },
};

registerPageTranslations("contact", dict);
