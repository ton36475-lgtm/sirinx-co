import { WorkflowExecution } from '@/lib/api-client';

interface RecentActivityProps {
  executions: WorkflowExecution[];
}

export default function RecentActivity({ executions }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⏳';
      default:
        return '⏸️';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-800">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {executions.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400 text-sm">No recent activity</p>
        ) : (
          executions.map((execution) => (
            <div key={execution.id} className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0">
              <span className="text-xl">{getStatusIcon(execution.status)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Workflow {execution.workflow_id.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {new Date(execution.started_at).toLocaleTimeString()}
                </p>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {execution.duration}ms
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
