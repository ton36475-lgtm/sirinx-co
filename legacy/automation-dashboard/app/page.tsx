'use client';

import { useEffect, useState } from 'react';
import { apiClient, Metrics, Workflow, WorkflowExecution } from '@/lib/api-client';
import { useDashboardStore } from '@/lib/store';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import MetricsCard from '@/components/dashboard/MetricsCard';
import WorkflowChart from '@/components/dashboard/WorkflowChart';
import ExecutionTable from '@/components/dashboard/ExecutionTable';
import RecentActivity from '@/components/dashboard/RecentActivity';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, workflowsData, executionsData] = await Promise.all([
          apiClient.getMetrics(),
          apiClient.getWorkflows(),
          apiClient.getExecutions(),
        ]);
        setMetrics(metricsData);
        setWorkflows(workflowsData);
        setExecutions(executionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Welcome to Automation System</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricsCard
                    title="Active Workflows"
                    value={metrics?.activeWorkflows || 0}
                    icon="⚙️"
                    color="bg-blue-500"
                  />
                  <MetricsCard
                    title="Success Rate"
                    value={`${metrics?.successRate || 0}%`}
                    icon="✅"
                    color="bg-green-500"
                  />
                  <MetricsCard
                    title="Pending Tasks"
                    value={metrics?.pendingTasks || 0}
                    icon="⏳"
                    color="bg-yellow-500"
                  />
                  <MetricsCard
                    title="Total Executions"
                    value={metrics?.totalExecutions || 0}
                    icon="📊"
                    color="bg-purple-500"
                  />
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <WorkflowChart workflows={workflows} />
                  </div>
                  <div>
                    <RecentActivity executions={executions.slice(0, 5)} />
                  </div>
                </div>

                {/* Execution Table */}
                <ExecutionTable executions={executions} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
