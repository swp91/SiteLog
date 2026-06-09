'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

export function TextInput({ icon, className, ...props }: TextInputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={cn(
          'w-full h-11 px-3 rounded-sm border border-slate-200 bg-white',
          'text-[0.9375rem] text-ink placeholder:text-slate-400',
          'outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100',
          'transition-colors',
          icon && 'pl-10',
          className,
        )}
      />
    </div>
  )
}

interface FieldProps {
  label?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-[0.8125rem] font-semibold text-slate-700">{label}</label>}
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
