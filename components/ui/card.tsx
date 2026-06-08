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
        'bg-white border border-slate-200 rounded-lg shadow-sm',
        padding && 'p-4',
        hover && [
          'cursor-pointer transition-all duration-150',
          'hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300',
        ],
        className,
      )}
    >
      {children}
    </div>
  )
}
