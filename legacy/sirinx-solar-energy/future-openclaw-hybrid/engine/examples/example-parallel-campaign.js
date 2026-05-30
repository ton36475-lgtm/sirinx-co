/**
 * example-parallel-campaign.js — Claude writes copy + ChatGPT writes code simultaneously
 * รัน: node examples/example-parallel-campaign.js
 *
 * Flow: ส่ง 4 tasks พร้อมกัน → แต่ละ model ทำงาน parallel → merge ผลลัพธ์
 */

import { Orchestrator } from '../orchestrator.js';

async function main() {
  console.log('\n========================================');
  console.log('  SIRINX Parallel Build Example');
  console.log('  4 tasks, optimal model assignment');
  console.log('========================================\n');

  const engine = new Orchestrator();
  const init   = await engine.init({ verbose: true });

  if (!init.success) {
    console.error('❌ Engine initialization failed');
    process.exit(1);
  }

  console.log('\n--- Defining 4 Parallel Sub-Tasks ---\n');

  const subTasks = [
    {
      id:      'thai_marketing_copy',
      task:    'สร้าง marketing copy สำหรับ Facebook Ad: "ลดค่าไฟโรงงาน 60% ด้วย Solar SIRINX" เน้น ROI และ urgency สำหรับผู้จัดการโรงงาน',
      taskType: 'marketing_copy',
      model:   'claude',
      prompt:  'สร้าง Facebook Ad copy สำหรับ SIRINX Solar:\n- Headline (< 40 chars)\n- Primary text (< 125 chars)\n- Description (< 30 chars)\n- CTA button text\n- Hook: ประหยัด 60%/ปี\n- Target: ผู้จัดการโรงงานในภาคกลาง\n- Tone: professional, urgent, data-driven\n\nReturn JSON: {headline, primaryText, description, cta, hashtags}',
    },
    {
      id:      'roi_calculator_code',
      task:    'เขียน JavaScript function คำนวณ solar ROI ให้ครบถ้วน',
      taskType: 'code_generation',
      model:   'chatgpt',
      prompt:  `Write a complete JavaScript solar ROI calculator function:

function calculateSolarROI(params) {
  // params: { monthlyBill, systemKwp, installCost, electricityRate, escalationRate, years }
  // Returns: { annualSavings, paybackYears, npv, irr, roi25year, monthlyCashFlow[] }
}

Requirements:
- Real financial calculations (NPV, IRR using iteration)
- Include electricity price escalation (typical 3-5% annually)
- Handle both cash purchase and loan scenarios
- TypeScript-compatible with JSDoc types
- Unit tests included`,
    },
    {
      id:      'seo_meta_tags',
      task:    'สร้าง SEO meta tags สำหรับหน้า landing page โซลาร์เซลล์ พิษณุโลก',
      taskType: 'seo_content',
      model:   null,  // auto-route
      prompt:  'สร้าง SEO meta tags สำหรับ landing page:\nKeyword: โซลาร์เซลล์ พิษณุโลก\nBusiness: SIRINX Solar Energy\n\nReturn JSON:\n{\n  "title": "< 60 chars",\n  "description": "< 160 chars",\n  "keywords": ["kw1", "kw2"],\n  "ogTitle": "OG title",\n  "ogDescription": "OG desc",\n  "schema": "JSON-LD schema markup"\n}',
    },
    {
      id:      'email_template',
      task:    'สร้าง follow-up email template สำหรับ leads ที่ดูหน้า calculator แล้วยังไม่ contact',
      taskType: 'creative_content_th',
      model:   'claude',
      prompt:  'สร้าง follow-up email ภาษาไทย:\n- Subject: น่าสนใจ, personalized\n- Body: 150-200 words\n- Context: lead เข้าดู solar ROI calculator แล้วไม่ contact\n- Tone: friendly, helpful, not pushy\n- CTA: นัด free consultation\n\nReturn JSON:\n{\n  "subject": "...",\n  "preheader": "...",\n  "body": "...",\n  "cta": "...",\n  "postscript": "..."\n}',
    },
  ];

  console.log('Sub-tasks:');
  subTasks.forEach((t, i) => {
    console.log(`  [${i+1}] ${t.id} → ${t.model || 'auto-route'}`);
  });

  console.log('\n--- Executing in Parallel... ---\n');

  const startedAt = Date.now();

  const onProgress = ({ phase, total }) => {
    if (phase === 'executing') console.log(`⚡ Running ${total} tasks simultaneously...`);
    if (phase === 'merging')   console.log('🔄 Merging results...');
  };

  const result = await engine.parallel(subTasks, { onProgress });

  const elapsed = Date.now() - startedAt;

  console.log('\n========================================');
  console.log('  RESULTS');
  console.log('========================================');
  console.log(`✅ Success: ${result.successful}/${subTasks.length} tasks`);
  console.log(`💰 Total Cost: ${result.totalCost.thb.toFixed(6)} THB`);
  console.log(`⏱️  Wall Time: ${elapsed}ms (vs ~${elapsed * subTasks.length}ms sequential)`);
  console.log(`🚀 Speedup: ~${Math.round(subTasks.length * 0.7)}x faster than sequential`);

  console.log('\n--- Per-Task Results ---');
  result.subTaskResults?.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const info = r.success
      ? `${r.modelId || r.provider} | ${r.cost?.thb?.toFixed(6)} THB | ${r.latencyMs}ms`
      : `ERROR: ${r.error}`;
    console.log(`${icon} ${r.id}: ${info}`);
  });

  console.log('\n--- MERGED OUTPUT ---\n');
  console.log(result.content?.slice(0, 2000));
  if (result.content?.length > 2000) {
    console.log(`\n... [${result.content.length - 2000} more characters]`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
