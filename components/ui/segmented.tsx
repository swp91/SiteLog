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
        'inline-flex p-1 bg-slate-100 rounded-sm',
        full && 'w-full',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-8 px-3 rounded-xs text-[0.8125rem] font-semibold transition-all',
            value === opt.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
