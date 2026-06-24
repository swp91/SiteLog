'use client'

import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: boolean
}

export function Card({ hover, padding = true, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'bg-white border border-slate-200 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-800/80 transition-colors duration-200',
        padding && 'p-4',
        hover && [
          'cursor-pointer transition-all duration-150',
          'hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-700',
        ],
        className,
      )}
    >
      {children}
    </div>
  )
}
