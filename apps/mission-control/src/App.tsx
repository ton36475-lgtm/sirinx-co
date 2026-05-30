import React, { useState, useEffect } from 'react';

interface Worker {
  name: string;
  type: string;
  status: 'idle' | 'thinking' | 'active';
  task: string;
}

interface ApprovalRequest {
  id: string;
  scope: string;
  desc: string;
  status: 'pending' | 'approved' | 'blocked';
  risk: 'low' | 'medium' | 'high';
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'security';
  message: string;
}

export default function App() {
  // Mock states based on M2 Control Node reality
  const [workers, setWorkers] = useState<Worker[]>([
    { name: 'Codex Worker', type: 'OpenAI/Codex', status: 'thinking', task: 'Auditing legacy/sirinx package.json' },
    { name: 'OpenJarvis Kernel', type: 'Local AI Kernel', status: 'active', task: 'Summarizing daily security reports' },
    { name: 'Claude Code Agent', type: 'Anthropic/Claude', status: 'idle', task: 'Waiting for task handoff' },
    { name: 'thClaws Queue', type: 'Async Runtime', status: 'idle', task: 'Queue empty' },
  ]);

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    { id: 'P8-A', scope: 'Local Preview', desc: 'Initialize local live dashboard preview on port 3333.', status: 'approved', risk: 'low' },
    { id: 'P8-D', scope: 'Local Commit', desc: 'Commit normalized monorepo scaffold and quarantined legacy repositories.', status: 'approved', risk: 'low' },
    { id: 'P8-B', scope: 'ClawForge Render', desc: 'Execute real-time MP4 video demo rendering for Mission Control.', status: 'pending', risk: 'medium' },
    { id: 'P8-C', scope: 'Devpost Export', desc: 'Package evidence manifest and artifacts for project validation.', status: 'pending', risk: 'low' },
    { id: 'P8-E', scope: 'Git Push', desc: 'Push integration branch to remote origin. (Cloud access required)', status: 'blocked', risk: 'high' },
    { id: 'P8-F', scope: 'Cloudflare Deploy', desc: 'Deploy preview workspace to Cloudflare Pages environment.', status: 'blocked', risk: 'high' },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: '23:30:12', type: 'info', message: 'Mission Control initialized on Mac mini M2 Control Node.' },
    { timestamp: '23:31:54', type: 'success', message: 'Local Git Repository initialized cleanly.' },
    { timestamp: '23:35:46', type: 'info', message: 'Local diagnostics audit: Node v26.0.0, Ollama reachable.' },
    { timestamp: '23:36:16', type: 'security', message: 'Secrets Scan completed: 0 keys, certificates, or tokens leaked.' },
    { timestamp: '23:37:55', type: 'success', message: 'P8-D Approval: Scaffold and Governance files committed (74b9790).' },
    { timestamp: '23:40:36', type: 'success', message: 'Auto Approval: 9 quarantined legacy repositories imported (7f7f2cc).' },
    { timestamp: '23:42:36', type: 'success', message: 'P8-D Approval: PNPM Workspace activated and committed (2a37a06).' },
  ]);

  const [activeTab, setActiveTab] = useState<'status' | 'approvals' | 'security'>('status');
  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(62);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);

  // Simulate hardware fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(8, Math.min(35, prev + change));
      });
      setRamUsage(prev => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(59, Math.min(65, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (id: string) => {
    if (processingId) return;
    
    setProcessingId(id);
    setProgressWidth(0);
    
    // Simulate loading progress bar
    const progressInterval = setInterval(() => {
      setProgressWidth(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    setTimeout(() => {
      setApprovals(prev => prev.map(app => {
        if (app.id === id) {
          return { ...app, status: 'approved' };
        }
        return app;
      }));
      
      const appRequest = approvals.find(a => a.id === id);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      setLogs(prev => [
        ...prev,
        { timestamp: timeStr, type: 'success', message: `Part 8 Approval [${id}] - ${appRequest?.scope} granted and executed successfully.` }
      ]);
      
      // Update corresponding worker task
      if (id === 'P8-B') {
        setWorkers(prev => prev.map(w => w.name === 'OpenJarvis Kernel' ? { ...w, status: 'thinking', task: 'ClawForge render pipeline triggered' } : w));
      }
      
      setProcessingId(null);
      setProgressWidth(0);
    }, 1800);
  };

  const getIndicatorClass = (status: string) => {
    switch (status) {
      case 'idle': return 'indicator-dot';
      case 'thinking': return 'indicator-dot thinking';
      case 'active': return 'indicator-dot active';
      case 'pending': return 'indicator-dot pending';
      case 'approved': return 'indicator-dot active';
      case 'blocked': return 'indicator-dot blocked';
      default: return 'indicator-dot';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="header-title-section">
          <h1>🧭 SIRINXDev Monorepo</h1>
          <p>Local-First Control Node &bull; Mac mini M2</p>
        </div>
        <div className="system-badges">
          <div className="badge pulse-cyan">
            <span className={getIndicatorClass('thinking')}></span> Ollama Engine
          </div>
          <div className="badge pulse-emerald">
            <span className={getIndicatorClass('active')}></span> Guardrails Locked
          </div>
          <div className="badge pulse-rose">
            <span className={getIndicatorClass('blocked')}></span> External Blocked
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column - System Telemetry */}
        <section className="column">
          <div className="card">
            <div className="card-title">
              <span>M2 Node Status</span>
              <span className="accent-cyan">Active</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">CPU Usage</span>
              <span className="stat-value highlight">{cpuUsage}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">RAM Active</span>
              <span className="stat-value">{ramUsage}% (16GB Unified)</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Node Environment</span>
              <span className="stat-value">v26.0.0</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Active Port</span>
              <span className="stat-value highlight">3333</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>Local AI Engine</span>
              <span className="accent-purple">Ollama</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Active Model</span>
              <span className="stat-value highlight">qwen3.5:2b</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Secondary Model</span>
              <span className="stat-value">deepseek-r1:1.5b</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">continuity status</span>
              <span className="stat-value">Ready</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">memory stats</span>
              <span className="stat-value">62 indexed notes</span>
            </div>
          </div>

          {/* Locked Hologram External Gate */}
          <div className="hologram-gate">
            <div className="lock-title">🔴 Production Mutation</div>
            <div className="lock-status">SECURITY LOCK: ENGAGED</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Cloud mutations, wrangler deploy, and git pushes are hard-blocked at the command level until explicit Part 8 written authorization.
            </p>
          </div>
        </section>

        {/* Center Column - Worker Grid & Activity */}
        <section className="column">
          <div className="card">
            <div className="card-title">
              <span>Active Agent Workers</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'lowercase', color: 'var(--text-muted)' }}>local threads only</span>
            </div>
            <div className="agents-grid">
              {workers.map((w, idx) => (
                <div className="agent-node" key={idx}>
                  <div className="agent-header">
                    <span className="agent-name">{w.name}</span>
                    <span className={getIndicatorClass(w.status)}></span>
                  </div>
                  <div className="agent-status">{w.type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.task}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Approvals Panel */}
          <div className="card">
            <div className="card-title">
              <span>P8 Gate Approval Queue</span>
              <span className="accent-cyan">Action Required</span>
            </div>
            <div className="approval-list">
              {approvals.map((app) => (
                <div className="approval-item" key={app.id}>
                  <div className="approval-header">
                    <span className="approval-scope">{app.scope}</span>
                    <span className="approval-badge">{app.id}</span>
                  </div>
                  <div className="approval-desc">{app.desc}</div>
                  
                  {processingId === app.id && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cyber-cyan)', marginBottom: '0.2rem', fontFamily: 'monospace' }}>
                        EXECUTING OPERATION [P8-GATE]...
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progressWidth}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="approval-actions">
                    {app.status === 'pending' ? (
                      <>
                        <button 
                          className="btn btn-cyan" 
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId !== null}
                        >
                          Approve Action
                        </button>
                        <button className="btn btn-outline" disabled={processingId !== null}>View Details</button>
                      </>
                    ) : app.status === 'approved' ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--cyber-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ✓ STATUS: APPROVED & COMMITTED LOCALLY
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--cyber-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ❌ STATUS: LOCKED BY WORKSPACE SECURITY RULES
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column - Compliance & Command Log */}
        <section className="column">
          <div className="card">
            <div className="card-title">
              <span>Compliance Guard</span>
              <span className="accent-emerald">Secured</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Zero-Keys Leak Audit</span>
              <span className="stat-value" style={{ color: 'var(--cyber-emerald)' }}>CLEAN</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Target Allowlist Gate</span>
              <span className="stat-value" style={{ color: 'var(--cyber-cyan)' }}>LOCKED</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <strong>Rigid Allowlist Rules:</strong> FinalRecon/Pentest Swarm commands strictly restricted to owned domains inside <code>owned-targets.txt</code>.
            </div>
          </div>

          {/* Shell / Event Log console */}
          <div className="card" style={{ flexGrow: 1 }}>
            <div className="card-title">
              <span>Live System Audit Terminal</span>
            </div>
            <div style={{ 
              background: '#020306', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px', 
              padding: '0.8rem', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              height: '320px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ 
                  color: log.type === 'success' ? 'var(--cyber-emerald)' : 
                         log.type === 'warn' ? 'var(--cyber-amber)' : 
                         log.type === 'security' ? 'var(--cyber-rose)' : '#fff'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
