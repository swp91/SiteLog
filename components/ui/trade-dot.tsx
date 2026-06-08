import { cn } from '@/lib/utils'

interface TradeDotProps {
  color: string
  size?: 'sm' | 'md'
  className?: string
}

export function TradeDot({ color, size = 'md', className }: TradeDotProps) {
  return (
    <span
      className={cn('rounded-full shrink-0', size === 'sm' ? 'w-2 h-2' : 'w-3 h-3', className)}
      style={{ backgroundColor: color }}
    />
  )
}
