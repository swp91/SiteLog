import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

const toneCls: Record<Tone, string> = {
  blue:  'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-500',
  red:   'bg-red-50 text-red-500',
  slate: 'bg-slate-100 text-slate-500',
}

const dotCls: Record<Tone, string> = {
  blue:  'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
  slate: 'bg-slate-400',
}

export function Badge({ tone = 'slate', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold',
        toneCls[tone],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotCls[tone])} />}
      {children}
    </span>
  )
}
