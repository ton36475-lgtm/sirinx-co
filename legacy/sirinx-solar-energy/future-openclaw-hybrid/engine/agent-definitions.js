/**
 * agent-definitions.js — Full 47 Ronin Agent Definitions
 * แต่ละ agent มี: name, layer, specialization, model, task queue, status, revenue
 * Layer structure: L1 Perception(16) → L2 Analysis(9) → L3 Decision(10) → L4 Coordination(8) → L5 R&D(4) + Kai(1)
 */

// Agent statuses
export const STATUS = { IDLE: 'idle', ACTIVE: 'active', BLOCKED: 'blocked', COOLDOWN: 'cooldown' };

// Model assignments per specialization
const M = {
  claude:   'claude',
  chatgpt:  'chatgpt',
  gemini:   'gemini',
  qwen:     'qwen',
};

/**
 * @typedef {Object} AgentDef
 * @property {string}   id           — Unique agent ID
 * @property {string}   codename     — 47 Ronin codename
 * @property {number}   number       — Agent number (1-47)
 * @property {string}   layer        — L1 | L2 | L3 | L4 | L5 | Chatbot
 * @property {string}   role         — Agent role description
 * @property {string}   specialization — What this agent does
 * @property {string[]} skills       — Specific capabilities
 * @property {string}   model        — Preferred AI model
 * @property {string}   tier         — fast | default | complex
 * @property {string}   taskType     — Default task type from TASK_MODEL_MAP
 * @property {number}   tokenBudget  — Max tokens per run
 * @property {string}   status       — idle | active | blocked | cooldown
 * @property {number}   idleMinutes  — Minutes since last task
 * @property {number}   revenueGenerated — THB generated this session
 * @property {string[]} taskQueue    — Pending tasks
 * @property {string}   currentTask  — Current task being worked on
 * @property {Object}   metrics      — Performance metrics
 */

export const AGENTS = [
  // ============================================================
  // LAYER 1 — PERCEPTION (16 agents) — Token budget: 4K
  // Role: Data collection, scanning, monitoring
  // ============================================================
  {
    id: 'kuranosuke-01', codename: 'Kuranosuke', number: 1, layer: 'L1',
    role: 'Lead Scanner',
    specialization: 'สแกนหา leads ใหม่จาก Facebook Groups, LINE, Telegram',
    skills: ['facebook_group_scan', 'lead_extraction', 'contact_parsing'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, leadsFound: 0, avgLatencyMs: 0 },
  },
  {
    id: 'yazama-02', codename: 'Yazama', number: 2, layer: 'L1',
    role: 'FB Group Monitor',
    specialization: 'ตรวจสอบ Facebook Groups โซลาร์เซลล์ ติดตามโพสต์ใหม่',
    skills: ['fb_group_monitoring', 'post_classification', 'intent_detection'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, postsScanned: 0, intentMatches: 0 },
  },
  {
    id: 'hara-03', codename: 'Hara', number: 3, layer: 'L1',
    role: 'Market Data Scraper',
    specialization: 'เก็บข้อมูล market data: ราคาไฟฟ้า, อัตรา solar, ราคาแผง',
    skills: ['market_data_collection', 'price_tracking', 'data_normalization'],
    model: M.gemini, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, dataPointsCollected: 0 },
  },
  {
    id: 'muramatsu-04', codename: 'Muramatsu', number: 4, layer: 'L1',
    role: 'Competitor Monitor',
    specialization: 'ติดตามคู่แข่ง: ราคา, แคมเปญ, โปรโมชั่น, บริการใหม่',
    skills: ['competitor_tracking', 'price_intelligence', 'campaign_monitoring'],
    model: M.qwen, tier: 'fast', taskType: 'competitive_intel', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, competitorsTracked: 0 },
  },
  {
    id: 'yoshida-05', codename: 'Yoshida', number: 5, layer: 'L1',
    role: 'Price Monitor',
    specialization: 'ติดตามราคาแผงโซลาร์, inverter, อุปกรณ์ใน Shopee/Lazada',
    skills: ['ecommerce_scraping', 'price_comparison', 'trend_detection'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, pricePointsTracked: 0 },
  },
  {
    id: 'kaiga-06', codename: 'Kaiga', number: 6, layer: 'L1',
    role: 'News Monitor',
    specialization: 'ติดตามข่าว: นโยบายพลังงาน, กฎระเบียบ ERC, subsidies',
    skills: ['news_monitoring', 'policy_tracking', 'regulatory_alert'],
    model: M.gemini, tier: 'fast', taskType: 'research', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, newsProcessed: 0, alertsGenerated: 0 },
  },
  {
    id: 'hazama-07', codename: 'Hazama', number: 7, layer: 'L1',
    role: 'Job Posting Scanner',
    specialization: 'สแกน job postings เพื่อหา leads (โรงงาน, โรงแรมกำลังขยาย)',
    skills: ['job_board_scraping', 'company_identification', 'expansion_detection'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, companiesFound: 0 },
  },
  {
    id: 'okuda-08', codename: 'Okuda', number: 8, layer: 'L1',
    role: 'Regulation Tracker',
    specialization: 'ติดตามกฎระเบียบ กฟผ. กฟน. กฟภ. และ BOI incentives',
    skills: ['regulatory_monitoring', 'compliance_tracking', 'subsidy_detection'],
    model: M.gemini, tier: 'fast', taskType: 'research', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, regulationsTracked: 0 },
  },
  {
    id: 'hazama-09', codename: 'Shigeemon', number: 9, layer: 'L1',
    role: 'Weather/Energy Data',
    specialization: 'เก็บข้อมูล irradiance, อุณหภูมิ, ผลผลิต solar จากสถานีทั่วไทย',
    skills: ['weather_data', 'solar_irradiance', 'energy_production_tracking'],
    model: M.qwen, tier: 'fast', taskType: 'data_analysis', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, dataPointsCollected: 0 },
  },
  {
    id: 'tomogoro-10', codename: 'Tomogoro', number: 10, layer: 'L1',
    role: 'Social Media Monitor',
    specialization: 'ติดตาม mentions แบรนด์ SIRINX บน social media',
    skills: ['social_listening', 'brand_monitoring', 'sentiment_collection'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, mentionsFound: 0 },
  },
  {
    id: 'fuwa-11', codename: 'Fuwa', number: 11, layer: 'L1',
    role: 'Google Trends Monitor',
    specialization: 'ติดตาม Google Trends: keywords solar Thailand ทุกจังหวัด',
    skills: ['trend_monitoring', 'keyword_volume', 'seasonal_detection'],
    model: M.gemini, tier: 'fast', taskType: 'seo_content', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, keywordsTracked: 0 },
  },
  {
    id: 'sayinnosuke-12', codename: 'Sayinnosuke', number: 12, layer: 'L1',
    role: 'Shopee/Lazada Scanner',
    specialization: 'ติดตามสินค้า solar บน Shopee/Lazada: ราคา, รีวิว, ยอดขาย',
    skills: ['shopee_scraping', 'lazada_scraping', 'product_intelligence'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, productsTracked: 0 },
  },
  {
    id: 'chuzaemon-13', codename: 'Chuzaemon', number: 13, layer: 'L1',
    role: 'Gov Subsidy Scanner',
    specialization: 'สแกนโครงการภาครัฐ: subsidy, soft loan, ส่งเสริม solar',
    skills: ['government_portal_scraping', 'subsidy_detection', 'loan_tracking'],
    model: M.gemini, tier: 'fast', taskType: 'research', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, subsidiesFound: 0 },
  },
  {
    id: 'onodera-14', codename: 'Onodera', number: 14, layer: 'L1',
    role: 'EV Charging Demand',
    specialization: 'ติดตามความต้องการ EV charging + solar เชิงพาณิชย์',
    skills: ['ev_market_monitoring', 'charging_station_tracking', 'demand_forecasting'],
    model: M.qwen, tier: 'fast', taskType: 'data_analysis', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, evLeadsFound: 0 },
  },
  {
    id: 'senzaki-15', codename: 'Senzaki', number: 15, layer: 'L1',
    role: 'Real Estate Scanner',
    specialization: 'สแกน listings โรงงาน, โกดัง, โรงแรมใหม่ที่เหมาะติด solar',
    skills: ['real_estate_scraping', 'building_type_classification', 'roof_area_estimation'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, propertiesFound: 0 },
  },
  {
    id: 'kinemon-16', codename: "Kin'emon", number: 16, layer: 'L1',
    role: 'Telegram/LINE Scanner',
    specialization: 'สแกน Telegram groups, LINE OA สำหรับ solar inquiries',
    skills: ['telegram_monitoring', 'line_monitoring', 'intent_classification'],
    model: M.qwen, tier: 'fast', taskType: 'bulk_processing', tokenBudget: 4000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, inquiriesFound: 0 },
  },

  // ============================================================
  // LAYER 2 — ANALYSIS (9 agents) — Token budget: 8K
  // Role: Processing, scoring, insights
  // ============================================================
  {
    id: 'junai-17', codename: 'Junai', number: 17, layer: 'L2',
    role: 'Lead Quality Analyzer',
    specialization: 'วิเคราะห์คุณภาพ leads: scoring, qualification, ICP match',
    skills: ['lead_scoring', 'icp_matching', 'qualification_assessment'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, leadsAnalyzed: 0, avgScore: 0 },
  },
  {
    id: 'jurozaemon-18', codename: 'Jurozaemon-ROI', number: 18, layer: 'L2',
    role: 'ROI/NPV/IRR Calculator',
    specialization: 'คำนวณ ROI, NPV, IRR, Payback Period สำหรับโครงการ solar',
    skills: ['financial_modeling', 'roi_calculation', 'payback_analysis', 'npv_irr'],
    model: M.chatgpt, tier: 'default', taskType: 'financial_modeling', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, proposalsCalculated: 0 },
  },
  {
    id: 'tadaoki-19', codename: 'Tadaoki', number: 19, layer: 'L2',
    role: 'Competitive Analyst',
    specialization: 'วิเคราะห์คู่แข่ง: SWOT, positioning, price gap, strategy',
    skills: ['competitive_analysis', 'swot_analysis', 'market_positioning'],
    model: M.claude, tier: 'default', taskType: 'competitive_intel', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, reportsGenerated: 0 },
  },
  {
    id: 'masakazu-20', codename: 'Masakazu', number: 20, layer: 'L2',
    role: 'Market Sizing',
    specialization: 'ขนาดตลาด, TAM/SAM/SOM, growth rate per province',
    skills: ['market_sizing', 'tam_sam_som', 'growth_analysis', 'province_mapping'],
    model: M.chatgpt, tier: 'default', taskType: 'data_analysis', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, marketsAnalyzed: 0 },
  },
  {
    id: 'yoshinao-21', codename: 'Yoshinao', number: 21, layer: 'L2',
    role: 'Price Optimizer',
    specialization: 'เพิ่มประสิทธิภาพ pricing: margin, competitive price, tiered pricing',
    skills: ['price_optimization', 'margin_analysis', 'competitive_pricing'],
    model: M.chatgpt, tier: 'default', taskType: 'data_analysis', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, priceModelsGenerated: 0 },
  },
  {
    id: 'mitsunojo-22', codename: 'Mitsunojo', number: 22, layer: 'L2',
    role: 'Content Performance Analyst',
    specialization: 'วิเคราะห์ performance ของ content: reach, engagement, conversion',
    skills: ['content_analytics', 'engagement_analysis', 'conversion_tracking'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, contentPiecesAnalyzed: 0 },
  },
  {
    id: 'shozaemon-23', codename: 'Shozaemon', number: 23, layer: 'L2',
    role: 'SEO Ranking Analyst',
    specialization: 'วิเคราะห์ SEO ranking, keyword gaps, SERP opportunities ทุก 77 จังหวัด',
    skills: ['seo_analysis', 'keyword_gap', 'serp_analysis', 'backlink_audit'],
    model: M.claude, tier: 'default', taskType: 'seo_content', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, keywordsAnalyzed: 0, rankingsTracked: 0 },
  },
  {
    id: 'tadashige-24', codename: 'Tadashige', number: 24, layer: 'L2',
    role: 'Customer Behavior Analyst',
    specialization: 'วิเคราะห์พฤติกรรม customer: touchpoints, churn risk, LTV',
    skills: ['behavioral_analysis', 'churn_prediction', 'ltv_modeling'],
    model: M.chatgpt, tier: 'default', taskType: 'data_analysis', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, customersAnalyzed: 0 },
  },
  {
    id: 'jurozaemon-25', codename: 'Jurozaemon-FM', number: 25, layer: 'L2',
    role: 'Financial Modeler',
    specialization: 'สร้าง financial models: P&L, cash flow, break-even สำหรับโครงการ',
    skills: ['financial_statements', 'cash_flow_modeling', 'scenario_analysis'],
    model: M.chatgpt, tier: 'default', taskType: 'financial_modeling', tokenBudget: 8000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, modelsBuilt: 0 },
  },

  // ============================================================
  // LAYER 3 — DECISION (10 agents) — Token budget: 16K
  // Role: Strategy, proposals, decisions
  // ============================================================
  {
    id: 'kihei-26', codename: 'Kihei', number: 26, layer: 'L3',
    role: 'Campaign Strategist',
    specialization: 'วางกลยุทธ์แคมเปญ: เลือก channel, timing, budget allocation',
    skills: ['campaign_strategy', 'channel_selection', 'budget_planning'],
    model: M.claude, tier: 'default', taskType: 'marketing_copy', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, campaignsPlanned: 0 },
  },
  {
    id: 'genemon-27', codename: 'Genemon', number: 27, layer: 'L3',
    role: 'Pricing Decision Maker',
    specialization: 'ตัดสินใจราคา: quote generation, discount approval, bundling',
    skills: ['pricing_decisions', 'quote_generation', 'discount_strategy'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, quotesGenerated: 0 },
  },
  {
    id: 'yasohachi-28', codename: 'Yasohachi', number: 28, layer: 'L3',
    role: 'Lead Prioritizer',
    specialization: 'จัดลำดับ leads: urgency, deal size, close probability',
    skills: ['lead_prioritization', 'deal_scoring', 'pipeline_management'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, leadsPrioritized: 0 },
  },
  {
    id: 'kazuemon-29', codename: 'Kazuemon', number: 29, layer: 'L3',
    role: 'Content Calendar Planner',
    specialization: 'วางแผน content calendar 30 วัน: posts, articles, videos',
    skills: ['content_planning', 'editorial_calendar', 'topic_clustering'],
    model: M.claude, tier: 'default', taskType: 'creative_content_th', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, calendarsCreated: 0 },
  },
  {
    id: 'yukie-30', codename: 'Yukie', number: 30, layer: 'L3',
    role: 'Ad Budget Allocator',
    specialization: 'จัดสรร budget โฆษณา: Facebook, Google, TikTok per province',
    skills: ['budget_allocation', 'ad_optimization', 'roas_optimization'],
    model: M.chatgpt, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, budgetsOptimized: 0 },
  },
  {
    id: 'juroemon-31', codename: 'Juroemon', number: 31, layer: 'L3',
    role: 'Partnership Evaluator',
    specialization: 'ประเมิน partners: ผู้ติดตั้ง, ซัพพลายเออร์, ตัวแทนจำหน่าย',
    skills: ['partner_evaluation', 'vendor_assessment', 'channel_partner_scoring'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, partnersEvaluated: 0 },
  },
  {
    id: 'suganoya-32', codename: 'Suganoya', number: 32, layer: 'L3',
    role: 'Territory Planner (77 Provinces)',
    specialization: 'วางแผนเขตขาย 77 จังหวัด: priority score, เส้นทาง, sales team',
    skills: ['territory_planning', 'geographic_analysis', 'route_optimization'],
    model: M.chatgpt, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, territoriesPlanned: 0 },
  },
  {
    id: 'magoemon-33', codename: 'Magoemon', number: 33, layer: 'L3',
    role: 'Product Mix Optimizer',
    specialization: 'เลือก product mix: kWp, brand, spec ที่เหมาะกับ customer แต่ละราย',
    skills: ['product_configuration', 'spec_matching', 'upsell_identification'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, configurationsGenerated: 0 },
  },
  {
    id: 'yajiro-34', codename: 'Yajiro', number: 34, layer: 'L3',
    role: 'Promotion Timing Optimizer',
    specialization: 'เลือกเวลาที่ดีที่สุดสำหรับ promotions: seasonality, events, trends',
    skills: ['timing_optimization', 'seasonal_analysis', 'event_marketing'],
    model: M.claude, tier: 'default', taskType: 'marketing_copy', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, promotionsTimed: 0 },
  },
  {
    id: 'yasoemon-35', codename: 'Yasoemon', number: 35, layer: 'L3',
    role: 'Customer Segmentation',
    specialization: 'แบ่ง customer segments: factory, hotel, hospital, agriculture',
    skills: ['customer_segmentation', 'persona_creation', 'segment_targeting'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, segmentsCreated: 0 },
  },

  // ============================================================
  // LAYER 4 — COORDINATION (8 agents) — Token budget: 32K
  // Role: Orchestration, execution, management
  // ============================================================
  {
    id: 'gengo-36', codename: 'Gengo (Orchestrator)', number: 36, layer: 'L4',
    role: 'Master Orchestrator',
    specialization: 'ควบคุมการทำงานของ agents ทุกชั้น, prioritization, resource allocation',
    skills: ['agent_orchestration', 'task_routing', 'priority_management', 'resource_allocation'],
    model: M.claude, tier: 'complex', taskType: 'reasoning', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, agentsCoordinated: 0 },
  },
  {
    id: 'emonojo-37', codename: 'Emonojo', number: 37, layer: 'L4',
    role: 'Sales Pipeline Manager',
    specialization: 'จัดการ pipeline: follow-up schedule, deal stage tracking, forecasting',
    skills: ['pipeline_management', 'follow_up_automation', 'deal_forecasting'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, dealsManaged: 0 },
  },
  {
    id: 'yomoshichi-38', codename: 'Yomoshichi', number: 38, layer: 'L4',
    role: 'Marketing Executor',
    specialization: 'execute marketing: post content, run ads, send emails, LINE blasts',
    skills: ['content_publishing', 'ad_management', 'email_automation', 'line_blast'],
    model: M.claude, tier: 'default', taskType: 'marketing_copy', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, contentPublished: 0, leadsGenerated: 0 },
  },
  {
    id: 'churozaemon-39', codename: 'Churozaemon', number: 39, layer: 'L4',
    role: 'Installer Scheduler',
    specialization: 'จัดตารางการติดตั้ง: เลือก installer, เส้นทาง, materials delivery',
    skills: ['scheduling', 'route_planning', 'inventory_management'],
    model: M.chatgpt, tier: 'default', taskType: 'reasoning', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, installationsScheduled: 0 },
  },
  {
    id: 'togoro-40', codename: 'Togoro', number: 40, layer: 'L4',
    role: 'Customer Onboarding',
    specialization: 'onboard ลูกค้าใหม่: สัญญา, kickoff, document collection, timeline',
    skills: ['onboarding_automation', 'document_management', 'customer_communication'],
    model: M.claude, tier: 'default', taskType: 'technical_docs', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, customersOnboarded: 0 },
  },
  {
    id: 'bunzaemon-41', codename: 'Bunzaemon', number: 41, layer: 'L4',
    role: 'Project Manager',
    specialization: 'manage projects: milestones, risks, budget, stakeholder updates',
    skills: ['project_management', 'milestone_tracking', 'risk_management'],
    model: M.chatgpt, tier: 'default', taskType: 'technical_docs', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, projectsManaged: 0 },
  },
  {
    id: 'kanzaemon-42', codename: 'Kanzaemon', number: 42, layer: 'L4',
    role: 'Reporting & Dashboard',
    specialization: 'สร้าง reports: CEO dashboard, KPIs, weekly/monthly reports',
    skills: ['report_generation', 'kpi_tracking', 'dashboard_updates', 'data_visualization'],
    model: M.claude, tier: 'default', taskType: 'data_analysis', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, reportsGenerated: 0 },
  },
  {
    id: 'yogoro-43', codename: 'Yogoro', number: 43, layer: 'L4',
    role: 'Quality Assurance',
    specialization: 'ตรวจสอบคุณภาพ: output review, compliance check, brand voice',
    skills: ['quality_assurance', 'brand_compliance', 'output_review'],
    model: M.claude, tier: 'default', taskType: 'code_review', tokenBudget: 32000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, reviewsCompleted: 0 },
  },

  // ============================================================
  // LAYER 5 — R&D (4 agents) — Token budget: 128K
  // Role: AI trends, benchmarks, prototypes, technology scouting
  // ============================================================
  {
    id: 'mimura-44', codename: 'Mimura', number: 44, layer: 'L5',
    role: 'AI Model Evaluator',
    specialization: 'benchmark new AI models: speed, cost, quality ต่อ use case',
    skills: ['model_benchmarking', 'evaluation_design', 'cost_analysis', 'capability_mapping'],
    model: M.claude, tier: 'complex', taskType: 'research', tokenBudget: 128000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, modelsEvaluated: 0 },
  },
  {
    id: 'yokogawa-45', codename: 'Yokogawa', number: 45, layer: 'L5',
    role: 'System Optimizer',
    specialization: 'optimize ระบบ: latency, cost, prompt engineering, workflow tuning',
    skills: ['system_optimization', 'prompt_engineering', 'performance_tuning'],
    model: M.chatgpt, tier: 'complex', taskType: 'reasoning', tokenBudget: 128000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, optimizationsApplied: 0 },
  },
  {
    id: 'kayano-46', codename: 'Kayano', number: 46, layer: 'L5',
    role: 'Prototype Developer',
    specialization: 'สร้าง prototypes: new features, integrations, automation scripts',
    skills: ['rapid_prototyping', 'integration_development', 'automation_scripting'],
    model: M.chatgpt, tier: 'complex', taskType: 'code_generation', tokenBudget: 128000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, prototypesBuilt: 0 },
  },
  {
    id: 'terasaka-47', codename: 'Terasaka', number: 47, layer: 'L5',
    role: 'Technology Scout',
    specialization: 'ค้นหาเทคโนโลยีใหม่: solar tech, AI tools, IoT, automation opportunities',
    skills: ['technology_scouting', 'trend_analysis', 'opportunity_identification'],
    model: M.claude, tier: 'complex', taskType: 'research', tokenBudget: 128000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, technologiesEvaluated: 0 },
  },

  // ============================================================
  // CHATBOT — Kai (1 agent) — Customer-facing
  // ============================================================
  {
    id: 'kai-chatbot', codename: 'Kai', number: 0, layer: 'Chatbot',
    role: 'Customer Chatbot',
    specialization: 'ตอบ inquiries ลูกค้า: 5-step CoT (Clarify→Qualify→Calculate→Present→Close)',
    skills: ['customer_chat', 'lead_qualification', 'roi_calculation', 'appointment_booking'],
    model: M.claude, tier: 'default', taskType: 'creative_content_th', tokenBudget: 16000,
    status: STATUS.IDLE, idleMinutes: 0, revenueGenerated: 0,
    taskQueue: [], currentTask: null,
    metrics: { tasksCompleted: 0, conversationsHandled: 0, appointmentsBooked: 0 },
  },
];

// Helper: get agents by layer
export function getAgentsByLayer(layer) {
  return AGENTS.filter(a => a.layer === layer);
}

// Helper: get agent by ID
export function getAgent(id) {
  return AGENTS.find(a => a.id === id);
}

// Layer counts
export const LAYER_COUNTS = {
  L1: 16, L2: 9, L3: 10, L4: 8, L5: 4, Chatbot: 1, Total: 47,
};

export default AGENTS;
