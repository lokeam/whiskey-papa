import { cn } from "@/components/ui/utils";
import Link from 'next/link';

import { WhiskeyPapaLogo } from "../ui/logos/WhiskeyPapaLogo";


interface TopNavigationProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>
}

export function TopNavigation({
  className,
  children,
  fixed,
  ...props
}: TopNavigationProps) {

  return (
    <header
      id="top-nav"
      className="hidden items-center justify-between px-4 py-4 md:flex border-b border-border"
      {...props}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <WhiskeyPapaLogo className="size-10" />
      </Link>

      <div className="flex items-center gap-2">
        <Link href="https://github.com/lokeam/tango-charlie" target="_blank"></Link>
      </div>
      {children}
    </header>
  );
};