import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeCls = {
  sm: 'w-7 h-7 text-[12px]',
  md: 'w-9 h-9 text-[14px]',
  lg: 'w-11 h-11 text-[16px]',
  xl: 'w-14 h-14 text-[20px]',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-blue-600 text-white font-bold shrink-0',
        sizeCls[size],
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  )
}
