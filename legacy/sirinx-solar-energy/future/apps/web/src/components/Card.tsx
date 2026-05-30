import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-slate-800 bg-navy-800 text-slate-100',
        hover && 'cursor-pointer transition-all duration-150 hover:border-slate-700 hover:bg-navy-700',
        onClick && 'cursor-pointer',
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('mt-4', className)}>{children}</div>
}

// KPI card variant
interface KpiCardProps {
  title: string
  value: string | number
  change?: string
  changePositive?: boolean
  icon: ReactNode
  iconColor?: string
  className?: string
}

export function KpiCard({ title, value, change, changePositive, icon, iconColor, className }: KpiCardProps) {
  return (
    <Card className={clsx('flex flex-col gap-3', className)} padding="md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <span
          className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            iconColor ?? 'bg-electric-500/10 text-electric-400',
          )}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {change && (
          <p
            className={clsx(
              'mt-0.5 text-xs font-medium',
              changePositive ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {change}
          </p>
        )}
      </div>
    </Card>
  )
}
