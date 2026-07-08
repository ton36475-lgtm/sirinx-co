import type { BlogLanguage } from "@/lib/blogData";

export type BlogArticleContent = {
  sections: { heading: string; body: string }[];
  keyTakeaways: string[];
};

const localizedArticleContent: Partial<
  Record<string, Partial<Record<BlogLanguage, BlogArticleContent>>>
> = {
  "rooftop-solar-roi-2025": {
    en: {
      sections: [
        {
          heading: "Why rooftop solar ROI is stronger in 2025",
          body: "Solar panel pricing has fallen materially over the past decade while business electricity tariffs remain a major operating cost. For factories with high daytime load, rooftop solar can convert unused roof area into a predictable cost-control asset.\n\nA credible ROI model should not rely on a generic payback number. It should evaluate load profile, tariff class, available roof area, shading, grid constraints, financing method, and O&M assumptions.",
        },
        {
          heading: "The variables that move payback",
          body: "1. Current electricity cost: higher tariffs make self-consumed solar more valuable.\n\n2. Correct system sizing: the best ROI usually comes from high self-consumption, not from installing the largest possible array.\n\n3. Roof orientation and structure: direction, tilt, usable area, and structural condition affect generation and installation cost.\n\n4. Equipment quality: Tier 1 modules, proven inverters, and monitoring discipline protect performance over a long asset life.",
        },
        {
          heading: "Example ROI framework",
          body: "For a mid-sized factory with a high daytime load, a 500 kWp rooftop solar system may generate roughly 700-800 MWh per year depending on site conditions.\n\nThe financial case should compare total installed cost, annual avoided electricity cost, inverter replacement assumptions, insurance, O&M, degradation, and tax treatment. Site-specific data is required before making any investment decision.",
        },
        {
          heading: "Next step",
          body: "Use the SIRINX solar assessment flow to estimate system size and payback from your real bill and site data, or contact the engineering team for a site review.",
        },
      ],
      keyTakeaways: [
        "Rooftop solar ROI depends on real load profile and tariff data.",
        "High self-consumption is usually more important than maximum system size.",
        "Equipment quality and monitoring protect long-term performance.",
        "A site-specific assessment is required before investment decisions.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "为什么 2025 年屋顶太阳能 ROI 更值得关注",
          body: "过去十多年太阳能组件成本显著下降，而企业电费仍是重要运营成本。对于白天负载高的工厂，屋顶太阳能可以把闲置屋顶转化为可预测的降本资产。\n\n可信的 ROI 模型不能只使用通用回本年限，而应评估负载曲线、电价类别、屋顶可用面积、遮挡、并网条件、融资方式与运维假设。",
        },
        {
          heading: "影响回本周期的关键因素",
          body: "1. 当前电费水平：电价越高，自发自用太阳能的价值越高。\n\n2. 系统容量匹配：最佳 ROI 通常来自高自用率，而不是盲目安装最大容量。\n\n3. 屋顶朝向与结构：朝向、倾角、可用面积和结构条件会影响发电量与施工成本。\n\n4. 设备质量：Tier 1 组件、成熟逆变器与持续监测可以保护长期表现。",
        },
        {
          heading: "ROI 评估框架示例",
          body: "对于白天负载较高的中型工厂，500 kWp 屋顶太阳能系统每年可能产生约 700-800 MWh 电量，具体取决于现场条件。\n\n财务模型应比较总安装成本、年度节省电费、逆变器更换、保险、运维、衰减与税务处理。投资前必须使用现场数据评估。",
        },
        {
          heading: "下一步",
          body: "可使用 SIRINX 太阳能评估流程，根据真实电费单与现场资料估算系统容量和回本周期，或联系工程团队安排现场评估。",
        },
      ],
      keyTakeaways: [
        "屋顶太阳能 ROI 取决于真实负载曲线与电价数据。",
        "高自用率通常比最大装机容量更重要。",
        "设备质量与监测机制保护长期表现。",
        "投资决策前需要现场级评估。",
      ],
    },
  },
  "ai-energy-management-guide": {
    en: {
      sections: [
        {
          heading: "What AI Energy Management means",
          body: "An AI Energy Management System uses data models to analyze, forecast, and optimize energy use across a building, factory, or campus. It can combine electricity consumption, solar generation, weather, operating schedules, and equipment behavior into one decision layer.",
        },
        {
          heading: "Why AI matters after solar is installed",
          body: "Solar reduces imported electricity, but AI-EMS can improve how and when energy is consumed. It can support load shifting, peak-demand management, anomaly detection, weather-aware scheduling, and operational dashboards for management teams.",
        },
        {
          heading: "Core building blocks",
          body: "A practical AI-EMS usually includes metering and IoT sensors, a real-time data platform, forecasting models, control rules, operator dashboards, and a maintenance workflow. The value comes from turning energy data into repeatable action, not from dashboards alone.",
        },
      ],
      keyTakeaways: [
        "AI-EMS turns energy data into operational decisions.",
        "The highest-value use cases are often load shifting and peak management.",
        "Forecasting and anomaly detection help protect system performance.",
        "Dashboards matter only when tied to action and accountability.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "什么是 AI 能源管理",
          body: "AI 能源管理系统利用数据模型分析、预测并优化建筑、工厂或园区的能源使用。它可以把用电量、太阳能发电、天气、运营时间表与设备行为整合为一个决策层。",
        },
        {
          heading: "为什么安装太阳能后仍需要 AI",
          body: "太阳能可以减少购电量，而 AI-EMS 可以优化能源使用的时间和方式。它可支持负载转移、需量管理、异常侦测、天气感知排程，以及面向管理层的运营仪表板。",
        },
        {
          heading: "核心组成",
          body: "实用的 AI-EMS 通常包括计量与 IoT 传感器、实时数据平台、预测模型、控制规则、运营仪表板与维护流程。价值来自把能源数据变成可重复执行的动作，而不只是展示图表。",
        },
      ],
      keyTakeaways: [
        "AI-EMS 将能源数据转化为运营决策。",
        "负载转移与需量管理通常是高价值场景。",
        "预测与异常侦测有助于保护系统表现。",
        "仪表板必须连接到行动与责任机制才有价值。",
      ],
    },
  },
  "floating-solar-thailand": {
    en: {
      sections: [
        {
          heading: "Thailand's floating solar opportunity",
          body: "Floating solar can use water surfaces such as reservoirs, industrial ponds, and retention basins without competing for land. Water can also help reduce module temperature, which may improve performance in hot climates.",
        },
        {
          heading: "How it compares with rooftop solar",
          body: "Floating solar often costs more than rooftop solar because it requires floats, anchoring, marine-grade cabling, and specialized maintenance planning. It can still be attractive where land is constrained, roof area is limited, or water-surface use creates additional operational value.",
        },
      ],
      keyTakeaways: [
        "Floating solar can unlock energy generation without using land.",
        "Water cooling may improve module performance in hot climates.",
        "The structure and anchoring system increase project complexity.",
        "Best-fit sites need water-depth, wind, anchoring, and O&M review.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "泰国漂浮式太阳能机会",
          body: "漂浮式太阳能可利用水库、工业水池和蓄水池等水面，不与土地使用竞争。水体也有助于降低组件温度，在炎热气候下可能提升发电表现。",
        },
        {
          heading: "与屋顶太阳能的比较",
          body: "漂浮式太阳能通常比屋顶系统成本更高，因为需要浮体、锚固、耐水电缆与特殊维护规划。但在土地有限、屋顶面积不足或水面利用能带来额外价值的场景中，它仍可能具有吸引力。",
        },
      ],
      keyTakeaways: [
        "漂浮式太阳能可在不占用土地的情况下发电。",
        "水体降温可能提升高温环境下的组件表现。",
        "浮体与锚固系统会增加项目复杂度。",
        "适合场地需要评估水深、风载、锚固与运维。",
      ],
    },
  },
  "solar-tax-benefits-thailand": {
    en: {
      sections: [
        {
          heading: "Potential tax and incentive considerations",
          body: "Solar investment in Thailand may involve several tax or incentive considerations, depending on current policy and the structure of the project. These may include accelerated depreciation, BOI promotion for eligible activities, and possible carbon-credit value.\n\nThis article is general information only. It is not tax or legal advice. Businesses should consult qualified tax and legal professionals before making investment decisions.",
        },
      ],
      keyTakeaways: [
        "Tax treatment depends on project structure and current policy.",
        "Accelerated depreciation may be relevant for some assets.",
        "BOI and carbon-credit opportunities require eligibility review.",
        "Professional tax and legal advice is required.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "可能涉及的税务与激励因素",
          body: "泰国太阳能投资可能涉及多种税务或激励因素，具体取决于当前政策与项目结构，包括加速折旧、符合条件活动的 BOI 促进政策，以及潜在碳信用价值。\n\n本文仅为一般信息，不构成税务或法律建议。企业在投资前应咨询合格的税务与法律专业人士。",
        },
      ],
      keyTakeaways: [
        "税务处理取决于项目结构与当前政策。",
        "部分资产可能适用加速折旧。",
        "BOI 与碳信用机会需要资格审查。",
        "必须取得专业税务与法律建议。",
      ],
    },
  },
  "bess-peak-shaving": {
    en: {
      sections: [
        {
          heading: "What peak shaving means",
          body: "Peak shaving uses battery energy storage to reduce a site's maximum grid demand. The battery charges during lower-load or lower-cost periods and discharges when demand spikes, helping reduce demand charges and grid stress.",
        },
        {
          heading: "How to evaluate the business case",
          body: "A practical BESS study should analyze load profile, peak timing, demand-charge structure, target reduction, battery power rating, usable energy capacity, cycle life, controls, and maintenance. Payback depends heavily on tariff design and how reliably the system can reduce peaks.",
        },
      ],
      keyTakeaways: [
        "Peak shaving reduces maximum grid demand.",
        "BESS sizing must be based on load-profile data.",
        "Tariff structure is central to the financial case.",
        "Controls and maintenance determine whether savings are repeatable.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "什么是削峰",
          body: "削峰是利用电池储能降低场站从电网取得的最大需量。电池在低负载或低电价时段充电，在需量峰值时放电，从而降低需量电费并减轻电网压力。",
        },
        {
          heading: "如何评估商业价值",
          body: "实用的 BESS 研究应分析负载曲线、峰值发生时间、需量电费结构、削峰目标、电池功率、可用容量、循环寿命、控制策略与维护。回本高度取决于电价结构以及系统是否能稳定削减峰值。",
        },
      ],
      keyTakeaways: [
        "削峰可降低最大电网需量。",
        "BESS 容量必须基于负载曲线数据。",
        "电价结构是财务模型的核心。",
        "控制与维护决定节省是否可重复实现。",
      ],
    },
  },
  "esg-solar-reporting": {
    en: {
      sections: [
        {
          heading: "Solar energy in ESG reporting",
          body: "Solar projects can support ESG reporting by reducing purchased grid electricity and therefore reducing Scope 2 emissions. The value is strongest when generation data, metering, and reporting boundaries are clear.",
        },
        {
          heading: "Carbon-footprint calculation",
          body: "A carbon calculation should use accepted grid emission factors, measured generation, and a clear reporting period. The resulting data can support disclosures under frameworks such as GRI, CDP, TCFD, or customer-specific sustainability requirements.",
        },
      ],
      keyTakeaways: [
        "Solar directly supports Scope 2 emissions reduction.",
        "Credible reporting needs measured generation data.",
        "Emission factors and reporting boundaries must be explicit.",
        "Solar data can support investor and customer ESG requests.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "ESG 报告中的太阳能",
          body: "太阳能项目可通过减少外购电量来降低 Scope 2 排放，从而支持 ESG 报告。当发电数据、计量方式与报告边界清晰时，其价值最强。",
        },
        {
          heading: "碳足迹计算",
          body: "碳计算应使用被接受的电网排放因子、实测发电量与明确报告周期。相关数据可支持 GRI、CDP、TCFD 或客户指定可持续发展要求下的披露。",
        },
      ],
      keyTakeaways: [
        "太阳能直接支持 Scope 2 减排。",
        "可信报告需要实测发电数据。",
        "排放因子与报告边界必须明确。",
        "太阳能数据可支持投资人与客户 ESG 要求。",
      ],
    },
  },
  "solar-panel-comparison-2025": {
    en: {
      sections: [
        {
          heading: "Three major solar module technologies",
          body: "Mono PERC remains a mature and cost-effective technology. TOPCon is increasingly popular because it can deliver higher efficiency at a moderate premium. HJT is a premium option with strong temperature behavior and high efficiency, but usually comes at a higher price.",
        },
        {
          heading: "What fits Thailand's climate",
          body: "For many Thai commercial projects in 2025, TOPCon can offer a balanced mix of efficiency, cost, and availability. HJT may fit space-constrained or premium projects, while Mono PERC can still be appropriate where budget is the main constraint.",
        },
      ],
      keyTakeaways: [
        "TOPCon is often a balanced choice in 2025.",
        "HJT offers premium performance but usually costs more.",
        "Mono PERC remains practical for budget-sensitive projects.",
        "System design quality matters more than module label alone.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "三类主要太阳能组件技术",
          body: "Mono PERC 是成熟且具成本效率的技术。TOPCon 因较高效率与适中溢价而越来越受欢迎。HJT 属于高端选项，具备较好的高温表现与高效率，但价格通常更高。",
        },
        {
          heading: "适合泰国气候的选择",
          body: "对于 2025 年多数泰国商业项目，TOPCon 通常在效率、成本与供应上取得平衡。HJT 适合面积受限或高端项目，而 Mono PERC 仍适合预算敏感场景。",
        },
      ],
      keyTakeaways: [
        "TOPCon 在 2025 年通常是平衡选择。",
        "HJT 表现较高端，但成本通常更高。",
        "Mono PERC 仍适合预算敏感项目。",
        "系统设计质量比组件名称本身更重要。",
      ],
    },
  },
  "net-metering-thailand-guide": {
    en: {
      sections: [
        {
          heading: "Net metering status in Thailand",
          body: "Thailand's grid-export rules continue to evolve. In many cases, exported power is valued below the retail electricity rate, so maximizing self-consumption remains the most reliable commercial strategy.",
        },
        {
          heading: "Practical next steps",
          body: "Businesses should check local utility requirements, application documents, metering conditions, and current purchase rates before assuming grid-export revenue. System sizing should be tested under both self-consumption and export scenarios.",
        },
      ],
      keyTakeaways: [
        "Grid-export rules and rates can change.",
        "Self-consumption remains the strongest design principle.",
        "Utility requirements must be checked locally.",
        "Export revenue should not be assumed without current approval data.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "泰国 Net Metering 现状",
          body: "泰国售电回网规则仍在发展。在许多情况下，回售电价低于企业购电电价，因此最大化自发自用仍是更可靠的商业策略。",
        },
        {
          heading: "实际下一步",
          body: "企业在假设回网收入前，应确认当地电力公司的要求、申请文件、计量条件与当前收购电价。系统容量应同时测试自用场景与回售场景。",
        },
      ],
      keyTakeaways: [
        "回网规则与价格可能变化。",
        "自发自用仍是最强的设计原则。",
        "必须确认当地电力公司要求。",
        "没有当前批准数据时，不应假设回售收入。",
      ],
    },
  },
  "solar-carport-ev-charging": {
    en: {
      sections: [
        {
          heading: "Solar carport plus EV charging",
          body: "A solar carport turns parking areas into energy infrastructure. It can provide shade, generate clean electricity, and support EV charging in one visible asset for malls, hotels, office buildings, and fleet parking.",
        },
        {
          heading: "Sizing example",
          body: "A 50-car parking area may support roughly 100-150 kWp depending on layout, structure, shading, and electrical constraints. The business case should include self-consumption, EV charging revenue, demand-charge impact, and long-term O&M.",
        },
      ],
      keyTakeaways: [
        "Solar carports provide shade and generate power.",
        "EV charging can be integrated into the same asset.",
        "Parking layout and structure determine usable capacity.",
        "The business case should include energy savings and charging use.",
      ],
    },
    cn: {
      sections: [
        {
          heading: "太阳能车棚 + EV 充电",
          body: "太阳能车棚把停车场转化为能源基础设施。它可同时提供遮阳、清洁发电与 EV 充电，适合商场、酒店、办公楼与车队停车区。",
        },
        {
          heading: "容量估算示例",
          body: "50 个车位的停车区域可能支持约 100-150 kWp，具体取决于布局、结构、遮挡与电气条件。商业模型应纳入自用电、充电收入、需量电费影响与长期运维。",
        },
      ],
      keyTakeaways: [
        "太阳能车棚可遮阳并发电。",
        "EV 充电可整合进同一资产。",
        "停车布局与结构决定可用容量。",
        "商业模型应包括节省电费与充电使用。",
      ],
    },
  },
};

export function getLocalizedArticleContent(
  slug: string,
  lang: BlogLanguage,
  fallback?: BlogArticleContent
): BlogArticleContent | undefined {
  if (lang === "th") return fallback;
  return localizedArticleContent[slug]?.[lang] ?? fallback;
}
