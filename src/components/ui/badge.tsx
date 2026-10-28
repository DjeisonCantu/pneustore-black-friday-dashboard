import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-ds-sm font-medium leading-none',
  {
    variants: {
      variant: {
        neutral: 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)]',
        primary: 'border-transparent bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
        success: 'border-transparent bg-[var(--color-success-soft)] text-[var(--color-success)]',
        error: 'border-transparent bg-[var(--color-error-soft)] text-[var(--color-error)]',
        warning: 'border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
        info: 'border-transparent bg-[var(--color-info-soft)] text-[var(--color-info)]',
        fictitious: 'border-transparent bg-[var(--color-fictitious-soft)] text-[var(--color-fictitious)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
