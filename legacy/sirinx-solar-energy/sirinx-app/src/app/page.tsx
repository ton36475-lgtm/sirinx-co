import Link from 'next/link'

const LAYERS = [
  { id: 'L1', name: 'Perception', count: 16, color: '#06B6D4', desc: 'Data input, scraping, monitoring' },
  { id: 'L2', name: 'Analysis',   count: 9,  color: '#A855F7', desc: 'Scoring, enrichment, forecasting' },
  { id: 'L3', name: 'Decision',   count: 10, color: '#F5A623', desc: 'Proposal, generation, actions' },
  { id: 'L4', name: 'Coordination', count: 8, color: '#10B981', desc: 'Orchestration, pipelines, state' },
  { id: 'L5', name: 'R&D Bunker', count: 4,  color: '#EF4444', desc: 'AI trends, benchmarks, research' },
  { id: 'KAI', name: 'Chatbot Kai', count: 1, color: '#F5A623', desc: 'Customer chatbot, 5-step CoT' },
]

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ fontSize: 13, color: '#F5A623', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>
          SIRINX Solar · AI-WarRoom
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#F1F5F9', margin: '0 0 16px', lineHeight: 1.1 }}>
          47 Ronin<br />
          <span style={{ color: '#F5A623' }}>Multi-Agent System</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 520, margin: '0 auto 32px' }}>
          Solar sales &amp; operations intelligence platform for the Thai market.
          48 specialized AI agents across 5 processing layers.
        </p>
        <Link href="/agents" style={{
          display: 'inline-block', padding: '14px 32px',
          background: 'linear-gradient(135deg, #F5A623, #E8960F)',
          color: '#0A1628', fontWeight: 700, fontSize: 15,
          borderRadius: 8, textDecoration: 'none',
          boxShadow: '0 4px 24px rgba(245,166,35,0.35)',
        }}>
          ⚔ View 47 Agents DNA
        </Link>
      </div>

      {/* Layer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 48 }}>
        {LAYERS.map(l => (
          <div key={l.id} style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${l.color}33`,
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: l.color, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {l.id}
              </span>
              <span style={{
                background: `${l.color}22`, color: l.color,
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              }}>
                {l.count} agents
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>{l.name}</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>{l.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Total Agents', value: '48', sub: '47 Ronin + Kai' },
          { label: 'MRR Target M6', value: '฿250K', sub: 'SaaS + Leads + Data' },
          { label: 'Cost vs Competitors', value: '95%↓', sub: 'SIRINX ฿2,990 vs ฿55K' },
          { label: 'AI Models', value: '4', sub: 'Claude · Qwen · GLM · Gemini' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A623', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
