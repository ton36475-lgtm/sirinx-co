/**
 * example-critique-seo.js — Claude drafts SEO content, ChatGPT reviews
 * รัน: node examples/example-critique-seo.js
 *
 * Flow: Claude Sonnet drafts Thai SEO → ChatGPT reviews → Claude refines
 */

import { Orchestrator } from '../orchestrator.js';

async function main() {
  console.log('\n========================================');
  console.log('  SIRINX Multi-Model Critique Loop');
  console.log('  Claude drafts SEO → ChatGPT reviews');
  console.log('========================================\n');

  const engine = new Orchestrator();
  const init   = await engine.init({ verbose: true });

  if (!init.success) {
    console.error('❌ Engine initialization failed — ตรวจสอบ API keys');
    process.exit(1);
  }

  console.log('\nAvailable models:', init.available.join(', '));
  console.log('\n--- Starting Critique Loop ---\n');

  let lastPhase = '';
  const onProgress = ({ phase, round, score }) => {
    if (phase !== lastPhase || round) {
      const icons = { drafting: '✍️', reviewing: '🔍', approved: '✅', rejected: '❌', max_rounds: '🏁' };
      const msg = `${icons[phase] || '⚡'} ${phase}${round ? ` (round ${round})` : ''}${score ? ` — score: ${score}/100` : ''}`;
      console.log(msg);
      lastPhase = phase;
    }
  };

  const result = await engine.critique(
    'สร้างบทความ SEO ภาษาไทยสำหรับ keyword "โซลาร์เซลล์ โรงงาน พิษณุโลก" ความยาว 600 คำ',
    {
      drafter:          'claude',
      reviewer:         'chatgpt',
      taskType:         'seo_content',
      maxRounds:        2,
      qualityThreshold: 75,
      taskParams: {
        keyword:   'โซลาร์เซลล์ โรงงาน พิษณุโลก',
        location:  'พิษณุโลก',
        wordCount: 600,
        audience:  'ผู้จัดการโรงงานในพิษณุโลก',
      },
      reviewCriteria: {
        accuracy:    'ข้อมูล solar energy ถูกต้อง',
        seo:         'ใช้ keyword อย่างเป็นธรรมชาติ density 1-2%',
        readability: 'อ่านเข้าใจง่าย เหมาะกับ B2B audience',
        cta:         'มี clear call to action',
      },
      onProgress,
    }
  );

  console.log('\n========================================');
  console.log('  RESULTS');
  console.log('========================================');
  console.log(`✅ Final Score: ${result.quality.finalScore}/100`);
  console.log(`📝 Rounds: ${result.totalRounds}`);
  console.log(`💰 Total Cost: ${result.totalCost.thb.toFixed(6)} THB`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);
  console.log(`🤖 Models used: ${result.models.join(' + ')}`);
  console.log('\n--- CONTENT ---\n');
  console.log(result.content);
  console.log('\n--- ROUND DETAILS ---');
  result.rounds?.forEach(r => {
    console.log(`  Round ${r.round}: score=${r.score} | ${r.recommendation} | findings=${r.findings?.length}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
