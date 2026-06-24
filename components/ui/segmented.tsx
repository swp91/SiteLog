'use client'

import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SegmentedProps {
  value: string
  onChange: (v: string) => void
  options: Option[]
  full?: boolean
  className?: string
}

export function Segmented({ value, onChange, options, full, className }: SegmentedProps) {
  return (
    <div
      className={cn(
        'inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-sm transition-colors duration-200',
        full && 'w-full',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-8 px-3 rounded-xs text-[0.8125rem] font-semibold transition-all whitespace-nowrap',
            value === opt.value
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
