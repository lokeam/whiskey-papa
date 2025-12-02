'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TopNavigation } from "@/components/navigation/TopNavigation";
import { useBreadcrumbs } from "./BreadCrumbContext";
import { BreadcrumbItem } from '@/components/navigation/TopNavigation';

// Generate breadcrumbs from pathname
function getBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  if (pathname === '/') {
    return [
      { label: 'Home', href: '/' },
      { label: 'Dashboard' },
    ];
  }

  if (pathname.startsWith('/runs/')) {
    const runId = pathname.split('/')[2];
    return [
      { label: 'Home', href: '/' },
      { label: 'Runs', href: '/' },
      { label: runId },
    ];
  }

  return [{ label: 'Home', href: '/' }];
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { breadcrumbs, setBreadcrumbs } = useBreadcrumbs();

  // Set breadcrumbs based on pathname
  useEffect(() => {
    const newBreadcrumbs = getBreadcrumbsFromPath(pathname);
    setBreadcrumbs(newBreadcrumbs);
  }, [pathname, setBreadcrumbs]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavigation breadcrumbs={breadcrumbs} />
        <main className="flex-1">
          {children}
        </main>
    </div>
  );
}
