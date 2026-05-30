import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileText,
  DollarSign,
  Zap,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { TaskStatusBadge, ApprovalStatusBadge, RiskBadge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { TaskStep, TaskArtifact } from '@/types'
import { clsx } from 'clsx'

function StepIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-rose-400" />
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-electric-400" />
  return <Clock className="h-4 w-4 text-slate-500" />
}

function StepRow({ step }: { step: TaskStep }) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-navy-900">
          <StepIcon status={step.status} />
        </div>
        <div className="mt-1 w-px flex-1 bg-slate-800" />
      </div>

      {/* Content */}
      <div className="mb-4 min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">
            Step {step.step_number}: {step.action}
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
            {step.agent_name}
          </span>
        </div>

        {step.started_at && (
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(step.started_at).toLocaleTimeString()}
            {step.completed_at && ` → ${new Date(step.completed_at).toLocaleTimeString()}`}
          </p>
        )}

        {step.output && (
          <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-navy-950 p-3 text-xs text-slate-400">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        )}

        {step.error && (
          <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
            {step.error}
          </div>
        )}

        {step.tokens_used && (
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {step.tokens_used.toLocaleString()} tokens
            </span>
            {step.cost_usd !== undefined && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />${step.cost_usd.toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtifactCard({ artifact }: { artifact: TaskArtifact }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-navy-900 px-3 py-2.5">
      <FileText className="h-4 w-4 shrink-0 text-electric-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{artifact.name}</p>
        <p className="text-xs text-slate-500">
          {artifact.type}
          {artifact.size_bytes &&
            ` · ${(artifact.size_bytes / 1024).toFixed(1)} KB`}
        </p>
      </div>
      {artifact.url && (
        <a
          href={artifact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-electric-400 hover:underline"
        >
          Download
        </a>
      )}
    </div>
  )
}

export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: task, loading } = useApi(
    () => endpoints.tasks.get(id!),
    [id],
  )

  if (loading) {
    return (
      <Layout title="Task Detail">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      </Layout>
    )
  }

  if (!task) {
    return (
      <Layout title="Task Not Found">
        <div className="py-20 text-center text-slate-400">Task not found.</div>
      </Layout>
    )
  }

  return (
    <Layout title="Task Detail">
      {/* Back + Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/tasks')}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100">{task.title}</h2>
            <TaskStatusBadge status={task.status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Created {new Date(task.created_at).toLocaleString()}
            {task.completed_at && ` · Completed ${new Date(task.completed_at).toLocaleString()}`}
          </p>
        </div>

        {task.status === 'running' && (
          <Button variant="danger" size="sm">Cancel</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Steps Timeline */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Execution Steps</h3>
            {task.steps.length === 0 ? (
              <p className="text-sm text-slate-500">No steps yet.</p>
            ) : (
              <div className="flex flex-col">
                {task.steps.map((step) => (
                  <StepRow key={step.id} step={step} />
                ))}
              </div>
            )}
          </Card>

          {/* Artifacts */}
          {task.artifacts.length > 0 && (
            <Card padding="lg" className="mt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Artifacts</h3>
              <div className="flex flex-col gap-2">
                {task.artifacts.map((a) => (
                  <ArtifactCard key={a.id} artifact={a} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          {/* Cost */}
          <Card padding="md">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Cost Tracking</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tokens used</span>
                <span className="font-mono text-slate-200">
                  {task.tokens_used?.toLocaleString() ?? '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Estimated cost</span>
                <span className="font-mono text-slate-200">
                  {task.cost_usd !== undefined ? `$${task.cost_usd.toFixed(4)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Steps</span>
                <span className="text-slate-200">
                  {task.steps_completed ?? 0} / {task.steps_total ?? task.steps.length}
                </span>
              </div>
            </div>
          </Card>

          {/* Approval */}
          {task.approval && (
            <Card padding="md">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Approval</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <ApprovalStatusBadge status={task.approval.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk</span>
                  <RiskBadge level={task.approval.risk_level} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Action</span>
                  <span
                    className={clsx(
                      'max-w-[160px] truncate text-right text-xs text-slate-300',
                    )}
                  >
                    {task.approval.requested_action}
                  </span>
                </div>
                {task.approval.reviewer_note && (
                  <div className="mt-1 rounded border border-slate-700 bg-navy-900 px-2.5 py-2 text-xs text-slate-400">
                    "{task.approval.reviewer_note}"
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
