'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title?: string
  back?: boolean
  className?: string
}

export function TopBar({ title, back, className }: TopBarProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'wide:hidden sticky top-0 z-20 flex items-center h-14 px-4 bg-white border-b border-slate-100',
        className,
      )}
    >
      {back ? (
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center -ml-1 rounded-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Building2 size={15} className="text-white" />
        </div>
      )}
      <h1 className="flex-1 text-center text-base font-bold text-ink px-2 truncate">
        {title ?? '현장출근기록'}
      </h1>
      <div className="w-9" /> {/* spacer */}
    </header>
  )
}
