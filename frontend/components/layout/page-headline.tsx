import React from 'react';
import { cn } from '@/components/ui/utils';

interface PageHeadlineProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
};

export function PageHeadline({
  className,
  children,
  ...props
}: PageHeadlineProps) {
  return (
    <div
      className={cn(
        'mb-2 flex flex-row items-center justify-between space-y-2', className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
