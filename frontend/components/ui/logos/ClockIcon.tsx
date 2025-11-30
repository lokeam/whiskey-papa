

import { cn } from '@/components/ui/utils';

type ClockIconProps = {
  className?: string;
};

export function ClockIcon({ className }: ClockIconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={cn("h-6 w-6", className)}
    >
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
