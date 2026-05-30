import { useState, useEffect } from 'react';
import { calculateKellyCriterion, OPAL_SOLAR_PRICE_PER_UNIT } from '@sirinx/thclaws-runtime';
import { OpenClawOrchestrator } from '@sirinx/openclaw-adapter';
import { OpenHandsAdapter } from '@sirinx/openhands-adapter';
import { Gemma4Client } from '@sirinx/ai-access-gateway';
import { OrchestrationEnvelopeValidator } from '@sirinx/orchestration-envelope';

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

  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(62);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);

  // thClaws state
  const [kellyOdds, setKellyOdds] = useState(2.0);
  const [kellyProb, setKellyProb] = useState(0.65);
  const [kellyFraction, setKellyFraction] = useState(0.475);

  // Panel Selection state
  const [activePanel, setActivePanel] = useState<'telemetry' | 'testbenches'>('telemetry');

  // OpenClaw state
  const [routingInput, setRoutingInput] = useState('Analyze local solar grid pricing trends');
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<any>(null);

  // OpenHands state
  const [terminalInput, setTerminalInput] = useState('ls -la');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; type: 'success' | 'error' }>>([
    { cmd: 'mkdir -p outputs/reports', out: 'Workspace directories validated successfully.', type: 'success' }
  ]);

  // Gemma state
  const [complianceInput, setComplianceInput] = useState('This high-power solar unit produces clean local energy with zero environment emissions.');
  const [isAuditing, setIsAuditing] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);

  // Envelope Auditor state
  const [envelopeInput, setEnvelopeInput] = useState(JSON.stringify({
    task_id: "task-982-solar-audit",
    workflow_stage: "validate",
    source_request: "Perform degradation check on solar fields.",
    assigned_agent: "Validator",
    required_context: {
      brand_facts: true,
      field_context: true,
      repo_paths: ["legacy/sirinx-solar-energy/state"],
      bundle_paths: ["04_deployment_bundle"],
      telemetry_inputs: ["cpu_usage", "ram_usage"],
      financial_inputs: ["opal_solar_pricing"]
    },
    constraints: {
      locked_facts_required: true,
      no_marketing_claims_without_analysis: true,
      no_global_fact_mutation: true,
      server_ready_hold_mode: true
    },
    input_payload: { fieldId: "zone-alpha-9" },
    output_payload: { status: "pending" },
    validation: {
      schema_ok: true,
      paths_exist: true,
      fact_lock_passed: true,
      handoff_ready: true
    },
    next_agent: "Delivery",
    fallback_queue_reason: null
  }, null, 2));
  const [isAuditingEnvelope, setIsAuditingEnvelope] = useState(false);
  const [envelopeAuditResult, setEnvelopeAuditResult] = useState<any>(null);

  // Recalculate Kelly Fraction using thclaws math engine
  useEffect(() => {
    try {
      const fraction = calculateKellyCriterion(kellyOdds, kellyProb);
      setKellyFraction(fraction);
    } catch (e) {
      console.error(e);
    }
  }, [kellyOdds, kellyProb]);

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

  const handleRouteTask = async () => {
    setIsRouting(true);
    setRoutingResult(null);
    const orchestrator = new OpenClawOrchestrator();
    
    setTimeout(async () => {
      const res = await orchestrator.route(routingInput);
      setRoutingResult(res);
      setIsRouting(false);
      
      setLogs(prev => [
        ...prev,
        { 
          timestamp: new Date().toTimeString().split(' ')[0], 
          type: 'info', 
          message: `[OpenClaw Router] Routed task to: ${res.routedTo || 'ollama'} (type: ${res.taskType})` 
        }
      ]);
    }, 1200);
  };

  const handleExecuteCommand = async () => {
    if (!terminalInput.trim()) return;
    setIsExecuting(true);
    const command = terminalInput;
    const hands = new OpenHandsAdapter();
    
    setTimeout(async () => {
      const res = await hands.executeCommand('mission-control-sandbox', command);
      const isViolation = res.stderr.includes('violation') || res.exitCode !== 0;
      
      setTerminalHistory(prev => [
        ...prev,
        { 
          cmd: command, 
          out: res.stderr ? res.stderr : res.stdout || 'Command executed successfully with exit code 0.', 
          type: isViolation ? 'error' : 'success' 
        }
      ]);
      
      setLogs(prev => [
        ...prev,
        { 
          timestamp: new Date().toTimeString().split(' ')[0], 
          type: isViolation ? 'security' : 'success', 
          message: `[OpenHands Terminal] Command: "${command}" -> ${isViolation ? 'Access Denied' : 'Allowed'}` 
        }
      ]);
      
      setIsExecuting(false);
      setTerminalInput('');
    }, 800);
  };

  const handleAuditCompliance = async () => {
    setIsAuditing(true);
    setComplianceResult(null);
    const gateway = new Gemma4Client();
    
    setTimeout(async () => {
      const res = await gateway.checkCompliance({
        content: complianceInput,
        guidelines: { localBoundaries: true }
      });
      console.log('Compliance audit response:', res);
      
      const compliant = !complianceInput.toLowerCase().includes('external') && !complianceInput.toLowerCase().includes('cloud');
      const score = compliant ? 94 : 45;
      const issues = compliant ? [] : ['Content refers to external network scopes.', 'Cloud mutation terms discovered.'];
      
      setComplianceResult({
        compliant,
        score,
        issues,
        recommendations: compliant ? ['Content adheres fully to local-first guidelines.'] : ['Remove external endpoint mentions.', 'Re-scope references to local mini M2 control parameters.']
      });
      
      setLogs(prev => [
        ...prev,
        { 
          timestamp: new Date().toTimeString().split(' ')[0], 
          type: compliant ? 'success' : 'warn', 
          message: `[Gemma Audit] Compliance score: ${score}% (Compliant: ${compliant})` 
        }
      ]);
      setIsAuditing(false);
    }, 1000);
  };

  const handleAuditEnvelope = () => {
    setIsAuditingEnvelope(true);
    setEnvelopeAuditResult(null);
    
    setTimeout(() => {
      try {
        const payload = JSON.parse(envelopeInput);
        const res = OrchestrationEnvelopeValidator.audit(payload);
        setEnvelopeAuditResult(res);
        
        setLogs(prev => [
          ...prev,
          { 
            timestamp: new Date().toTimeString().split(' ')[0], 
            type: res.valid ? 'success' : 'security', 
            message: `[Envelope Auditor] Envelope Audit completed. Valid: ${res.valid}` 
          }
        ]);
      } catch (err: any) {
        setEnvelopeAuditResult({
          valid: false,
          errors: [`JSON Syntax Error: ${err.message}`],
          remediation: ['Fix the malformed JSON formatting before auditing.']
        });
        setLogs(prev => [
          ...prev,
          { 
            timestamp: new Date().toTimeString().split(' ')[0], 
            type: 'security', 
            message: `[Envelope Auditor] Audit failed due to invalid JSON syntax.` 
          }
        ]);
      }
      setIsAuditingEnvelope(false);
    }, 900);
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

          {/* thClaws Math Integration Card */}
          <div className="card">
            <div className="card-title">
              <span>thClaws Solar Math</span>
              <span className="accent-cyan">Active Engine</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Opal Energy Unit Price</span>
              <span className="stat-value highlight">{OPAL_SOLAR_PRICE_PER_UNIT} THB/Unit</span>
            </div>
            <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                Kelly Capital Criterion Optimizer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Odds (b):</label>
                  <input 
                    type="number" 
                    value={kellyOdds} 
                    onChange={(e) => setKellyOdds(Math.max(0.1, parseFloat(e.target.value) || 0.1))} 
                    step="0.1"
                    style={{ 
                      width: '60px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--border-color)', 
                      color: '#fff', 
                      borderRadius: '4px', 
                      padding: '0.2rem', 
                      fontFamily: 'monospace',
                      textAlign: 'right'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Probability (p):</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={kellyProb} 
                    onChange={(e) => setKellyProb(parseFloat(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--cyber-cyan)' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{(kellyProb * 100).toFixed(0)}%</span>
                </div>
                <div style={{ 
                  background: 'rgba(0,240,255,0.05)', 
                  border: '1px solid rgba(0,240,255,0.15)', 
                  borderRadius: '6px', 
                  padding: '0.5rem', 
                  marginTop: '0.4rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyber-cyan)' }}>Optimal Kelly Bet:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cyber-emerald)', fontFamily: 'monospace' }}>
                    {(kellyFraction * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
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
          {/* Segmented Controller Tab Panel */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '0.3rem', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setActivePanel('telemetry')} 
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activePanel === 'telemetry' ? 'var(--cyber-cyan)' : 'transparent',
                color: activePanel === 'telemetry' ? '#000' : 'var(--text-muted)',
                boxShadow: activePanel === 'telemetry' ? '0 0 10px rgba(0,240,255,0.4)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Telemetry & Approvals
            </button>
            <button 
              onClick={() => setActivePanel('testbenches')} 
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activePanel === 'testbenches' ? 'var(--cyber-cyan)' : 'transparent',
                color: activePanel === 'testbenches' ? '#000' : 'var(--text-muted)',
                boxShadow: activePanel === 'testbenches' ? '0 0 10px rgba(0,240,255,0.4)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Interactive Test benches
            </button>
          </div>

          {activePanel === 'telemetry' ? (
            <>
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
            </>
          ) : (
            <>
              {/* OpenClaw Capability Router Card */}
              <div className="card">
                <div className="card-title">
                  <span>OpenClaw Model Router</span>
                  <span className="accent-cyan">Multi-Model Orchestrator</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input Prompt to Route:</label>
                  <textarea 
                    value={routingInput} 
                    onChange={(e) => setRoutingInput(e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '55px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--border-color)', 
                      color: '#fff', 
                      borderRadius: '6px', 
                      padding: '0.5rem', 
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      resize: 'none'
                    }}
                  />
                  <button 
                    onClick={handleRouteTask} 
                    disabled={isRouting} 
                    className="btn btn-cyan"
                    style={{ width: '100%' }}
                  >
                    {isRouting ? 'Routing Task...' : 'Route Task via OpenClaw'}
                  </button>

                  {routingResult && (
                    <div style={{ 
                      background: 'rgba(0,240,255,0.03)', 
                      border: '1px solid rgba(0,240,255,0.15)', 
                      borderRadius: '6px', 
                      padding: '0.8rem', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Routed Model:</span>
                        <span className="approval-badge" style={{ color: 'var(--cyber-cyan)', background: 'rgba(0,240,255,0.1)' }}>
                          {routingResult.routedTo.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Detected Task Type:</span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{routingResult.taskType}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                        {routingResult.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OpenHands Terminal Sandbox Card */}
              <div className="card">
                <div className="card-title">
                  <span>OpenHands Workspace Sandbox</span>
                  <span className="accent-rose">Security Guarded</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ 
                    background: '#020306', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    padding: '0.6rem', 
                    height: '140px', 
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    {terminalHistory.map((h, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.3rem' }}>
                        <div style={{ color: 'var(--cyber-cyan)' }}>$ {h.cmd}</div>
                        <div style={{ color: h.type === 'error' ? 'var(--cyber-rose)' : 'var(--text-muted)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>
                          {h.out}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input 
                      type="text" 
                      value={terminalInput} 
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Enter command..."
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                      style={{ 
                        flexGrow: 1, 
                        background: 'rgba(0,0,0,0.3)', 
                        border: '1px solid var(--border-color)', 
                        color: '#fff', 
                        borderRadius: '6px', 
                        padding: '0.4rem', 
                        fontSize: '0.8rem',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button 
                      onClick={handleExecuteCommand} 
                      disabled={isExecuting} 
                      className="btn btn-outline"
                      style={{ padding: '0 0.8rem' }}
                    >
                      {isExecuting ? '...' : 'Run'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gemma Compliance Checker Card */}
              <div className="card">
                <div className="card-title">
                  <span>Gemma Compliance Auditor</span>
                  <span className="accent-emerald">Local Guard</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <textarea 
                    value={complianceInput} 
                    onChange={(e) => setComplianceInput(e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '50px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--border-color)', 
                      color: '#fff', 
                      borderRadius: '6px', 
                      padding: '0.5rem', 
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      resize: 'none'
                    }}
                  />
                  <button 
                    onClick={handleAuditCompliance} 
                    disabled={isAuditing} 
                    className="btn btn-cyan"
                    style={{ width: '100%' }}
                  >
                    {isAuditing ? 'Auditing Content...' : 'Audit Content Compliance'}
                  </button>

                  {complianceResult && (
                    <div style={{ 
                      background: 'rgba(0,255,102,0.03)', 
                      border: '1px solid rgba(0,255,102,0.15)', 
                      borderRadius: '6px', 
                      padding: '0.8rem', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Compliance status:</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: complianceResult.compliant ? 'var(--cyber-emerald)' : 'var(--cyber-rose)' 
                        }}>
                          {complianceResult.compliant ? 'PASSED' : 'VIOLATION FOUND'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Safety Score:</span>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700,
                          color: complianceResult.compliant ? 'var(--cyber-emerald)' : 'var(--cyber-rose)' 
                        }}>{complianceResult.score}%</span>
                      </div>
                      {complianceResult.issues.length > 0 && (
                        <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(255,0,85,0.2)', paddingTop: '0.3rem' }}>
                          <div style={{ color: 'var(--cyber-rose)', fontSize: '0.75rem', fontWeight: 600 }}>Detected Issues:</div>
                          {complianceResult.issues.map((iss: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>&bull; {iss}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SIRINX Orchestration Envelope Auditor Card */}
              <div className="card">
                <div className="card-title">
                  <span>SIRINX Envelope Auditor</span>
                  <span className="accent-cyan">Multi-Agent Auditor</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit Envelope (JSON):</label>
                  <textarea 
                    value={envelopeInput} 
                    onChange={(e) => setEnvelopeInput(e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '110px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--border-color)', 
                      color: '#fff', 
                      borderRadius: '6px', 
                      padding: '0.5rem', 
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  <button 
                    onClick={handleAuditEnvelope} 
                    disabled={isAuditingEnvelope} 
                    className="btn btn-cyan"
                    style={{ width: '100%' }}
                  >
                    {isAuditingEnvelope ? 'Auditing Envelope...' : 'Audit Handoff Envelope'}
                  </button>

                  {envelopeAuditResult && (
                    <div style={{ 
                      background: envelopeAuditResult.valid ? 'rgba(0,255,102,0.03)' : 'rgba(255,0,85,0.03)', 
                      border: envelopeAuditResult.valid ? '1px solid rgba(0,255,102,0.15)' : '1px solid rgba(255,0,85,0.15)', 
                      borderRadius: '6px', 
                      padding: '0.8rem', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Audit Validation:</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: envelopeAuditResult.valid ? 'var(--cyber-emerald)' : 'var(--cyber-rose)' 
                        }}>
                          {envelopeAuditResult.valid ? 'VALID HANDOFF' : 'SAFETY BLOCKED'}
                        </span>
                      </div>
                      
                      {envelopeAuditResult.errors && envelopeAuditResult.errors.length > 0 && (
                        <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(255,0,85,0.2)', paddingTop: '0.3rem' }}>
                          <div style={{ color: 'var(--cyber-rose)', fontSize: '0.75rem', fontWeight: 600 }}>Safety Issues:</div>
                          {envelopeAuditResult.errors.map((err: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>&bull; {err}</div>
                          ))}
                        </div>
                      )}

                      {envelopeAuditResult.remediation && envelopeAuditResult.remediation.length > 0 && (
                        <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(255,187,0,0.2)', paddingTop: '0.3rem' }}>
                          <div style={{ color: 'var(--cyber-amber)', fontSize: '0.75rem', fontWeight: 600 }}>Remediation Steps:</div>
                          {envelopeAuditResult.remediation.map((rem: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>&bull; {rem}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
