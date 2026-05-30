/**
 * example-cascade-content.js — Start with Qwen, escalate to Claude if quality insufficient
 * รัน: node examples/example-cascade-content.js
 *
 * Flow: Qwen (cheapest) → Gemini → Claude (if quality < threshold)
 * Cost optimization: ประหยัด 80-90% ถ้า Qwen ผ่าน quality gate
 */

import { Orchestrator } from '../orchestrator.js';
import { getCostOptimizer } from '../cost-optimizer.js';

async function main() {
  console.log('\n========================================');
  console.log('  SIRINX Cascade Workflow Example');
  console.log('  Qwen → Gemini → Claude (if needed)');
  console.log('========================================\n');

  const engine = new Orchestrator();
  const init   = await engine.init({ verbose: true });

  if (!init.success) {
    console.error('❌ Engine initialization failed');
    process.exit(1);
  }

  const available = init.available;
  console.log('\nAvailable models:', available.join(', '));

  // Build cascade chain from available models (cheapest first)
  const chainPreference = ['qwen', 'gemini', 'chatgpt', 'claude'];
  const chain           = chainPreference.filter(m => available.includes(m));

  if (chain.length === 0) {
    console.error('❌ No models available for cascade');
    process.exit(1);
  }

  console.log(`\nCascade chain: ${chain.join(' → ')}`);
  console.log('\n--- Starting Cascade ---\n');

  const onProgress = ({ phase, model, score, level }) => {
    const icons = {
      generating: '🔗',
      reviewed:   '📊',
      accepted:   '✅',
      escalating: '⬆️',
      max_rounds: '🏁',
    };
    const msg = `${icons[phase] || '⚡'} [Level ${level || '?'}] ${phase}` +
                (model ? ` — ${model}` : '') +
                (score ? ` (score: ${score}/100)` : '');
    console.log(msg);
  };

  // Example 1: Bulk SEO content (expect Qwen to pass)
  console.log('=== Test 1: Bulk SEO Content (Qwen should handle this) ===\n');

  const result1 = await engine.cascade(
    'สร้าง meta description 160 ตัวอักษรสำหรับ keyword "โซลาร์เซลล์ราคาถูก สระบุรี" — เน้น savings และ SIRINX brand',
    {
      chain,
      qualityThreshold: 65,  // ต่ำกว่าปกติ — Qwen น่าจะผ่าน
      taskType:         'seo_content',
      onProgress,
    }
  );

  console.log(`\nResult 1: score=${result1.quality.finalScore} | levels=${result1.quality.levels} | cost=${result1.totalCost.thb.toFixed(6)} THB`);
  console.log('Content:', result1.content?.slice(0, 300));

  console.log('\n=== Test 2: Complex Investment Proposal (likely needs Claude) ===\n');

  const result2 = await engine.cascade(
    'สร้าง executive summary สำหรับ investment proposal โครงการ solar farm 10MW บนหลังคาโรงงาน Hemaraj Saraburi — รวม ROI, risk factors, และ competitive advantages',
    {
      chain,
      qualityThreshold: 80,  // สูง — น่าจะต้อง escalate ถึง Claude
      taskType:         'investment_analysis',
      taskParams:       { projectSize: '10MW', location: 'Saraburi', type: 'rooftop', client: 'Hemaraj' },
      onProgress,
    }
  );

  console.log(`\nResult 2: score=${result2.quality.finalScore} | levels=${result2.quality.levels} | cost=${result2.totalCost.thb.toFixed(6)} THB`);
  console.log('Content:', result2.content?.slice(0, 500));

  // Cost comparison report
  const costOptimizer = getCostOptimizer();
  const summary       = costOptimizer.getSessionSummary();

  console.log('\n========================================');
  console.log('  COST OPTIMIZATION REPORT');
  console.log('========================================');
  console.log(`Total cost: ${summary.totalTHB.toFixed(6)} THB`);
  console.log(`Total tokens: ${summary.totalTokens?.toLocaleString()}`);
  console.log(`\nBy tier:`);
  console.log(`  Economy (Qwen/Gemini): ${summary.byTier.economy.spent.toFixed(6)} THB (${summary.byTier.economy.pct}%)`);
  console.log(`  Standard (Claude/GPT): ${summary.byTier.standard.spent.toFixed(6)} THB (${summary.byTier.standard.pct}%)`);
  console.log(`  Premium (Opus/o1): ${summary.byTier.premium.spent.toFixed(6)} THB (${summary.byTier.premium.pct}%)`);

  // Show cost savings
  const ifAllClaude = summary.totalTokens * 0.000015;  // Claude Sonnet price per token (rough)
  const savings     = Math.max(0, ifAllClaude - summary.totalUSD);
  console.log(`\nEstimated savings vs using Claude for everything: ~${(savings * 34).toFixed(4)} THB`);
  console.log(`Budget used: ${summary.budgetUsedPct}% of monthly 1,400 THB`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
