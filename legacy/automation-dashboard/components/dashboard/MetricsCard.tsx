interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: number;
}

export default function MetricsCard({ title, value, icon, color, trend }: MetricsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
        <span className={`text-2xl ${color} p-2 rounded-lg text-white`}>{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
