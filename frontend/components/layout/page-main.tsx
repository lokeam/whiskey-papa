import React from 'react';
import { cn } from '@/components/ui/utils';

interface PageMainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function PageMain({
  fixed,
  ...props
}: PageMainProps) {
  return (
    <main
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        'w-full max-w-7xl mx-auto',
        'px-4 py-6',
        fixed && 'fixed-main flex flex-col grow overflow-hidden'
      )}
      {...props}
    />
  );
}
