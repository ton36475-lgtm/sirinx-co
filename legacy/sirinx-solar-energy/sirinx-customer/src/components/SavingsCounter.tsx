'use client'

import { useEffect, useState, useRef } from 'react'

interface Props {
  target: number
  duration?: number // ms
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function SavingsCounter({
  target,
  duration = 1800,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
}: Props) {
  const [current, setCurrent] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutQuart(progress)
      setCurrent(+(eased * target).toFixed(decimals))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, decimals])

  const formatted = decimals > 0
    ? current.toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(current).toLocaleString('th-TH')

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
