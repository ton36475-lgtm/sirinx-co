import { WorkflowExecution } from '@/lib/api-client';

interface ExecutionTableProps {
  executions: WorkflowExecution[];
}

export default function ExecutionTable({ executions }: ExecutionTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Executions</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Workflow</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {executions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                  No executions yet
                </td>
              </tr>
            ) : (
              executions.map((execution) => (
                <tr key={execution.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-mono">
                    {execution.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    {execution.workflow_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    {execution.duration}ms
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(execution.started_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
