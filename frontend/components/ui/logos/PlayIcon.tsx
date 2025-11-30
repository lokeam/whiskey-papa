import { cn } from '@/components/ui/utils';

type PlayIconProps = {
  className?: string;
};

export function PlayIcon({ className }: PlayIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("icon icon-tabler icons-tabler-outline icon-tabler-player-play", className)}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M7 4v16l13 -8z" />
    </svg>
  )
}
