import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
  xl: 'size-14 text-lg',
}

function toInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string
  src?: string
  size?: AvatarSize
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, src, size = 'md', className, ...props }, ref) => (
    <span
      ref={ref}
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        toInitials(name)
      )}
    </span>
  ),
)
Avatar.displayName = 'Avatar'
