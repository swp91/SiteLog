'use client'

import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

interface StepperProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeCls = {
  sm: { btn: 'w-7 h-7', text: 'w-8 text-[14px]', icon: 14 },
  md: { btn: 'w-9 h-9', text: 'w-10 text-[16px]', icon: 16 },
  lg: { btn: 'w-11 h-11', text: 'w-12 text-[20px]', icon: 18 },
}

export function Stepper({ value, onChange, min = 0, max = 99, size = 'md', className }: StepperProps) {
  const cls = sizeCls[size]
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          'flex items-center justify-center rounded-sm border border-slate-200 bg-white',
          'text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600',
          'disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
          cls.btn,
        )}
      >
        <Minus size={cls.icon} />
      </button>
      <span className={cn('text-center font-bold tabular-nums text-ink', cls.text)}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          'flex items-center justify-center rounded-sm border border-slate-200 bg-white',
          'text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600',
          'disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
          cls.btn,
        )}
      >
        <Plus size={cls.icon} />
      </button>
    </div>
  )
}
