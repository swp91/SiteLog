'use client'

import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'white' | 'kakao'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
  full?: boolean
  loading?: boolean
}

const variantCls: Record<Variant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-blue active:bg-blue-700',
  secondary: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100',
  outline:   'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600',
  danger:    'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white',
  white:     'bg-white text-slate-700 shadow hover:shadow-md',
  kakao:     'bg-kakao-bg text-kakao-text hover:opacity-90',
}

const sizeCls: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-[14px] gap-2 rounded',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        full && 'w-full',
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}
