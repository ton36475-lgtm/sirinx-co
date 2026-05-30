'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Workflow } from '@/lib/api-client';

interface WorkflowChartProps {
  workflows: Workflow[];
}

export default function WorkflowChart({ workflows }: WorkflowChartProps) {
  const data = [
    { name: 'Active', value: workflows.filter(w => w.status === 'active').length },
    { name: 'Inactive', value: workflows.filter(w => w.status === 'inactive').length },
    { name: 'Paused', value: workflows.filter(w => w.status === 'paused').length },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-800">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Workflow Status Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="value" fill="#0a7ea4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
