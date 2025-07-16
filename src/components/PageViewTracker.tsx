'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/utils/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view when pathname changes
    if (pathname) {
      const pageName = pathname === '/' ? 'home' : pathname.slice(1);
      trackPageView(pageName, {
        path: pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [pathname]);

  return null; // This component doesn't render anything
} 