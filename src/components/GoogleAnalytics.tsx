'use client';

import { GoogleAnalytics as GA } from '@next/third-parties/google';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  gaId: string;
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Initialize gtag function if it doesn't exist
    if (typeof window !== 'undefined' && !window.gtag) {
      window.gtag = function(...args) {
        (window.dataLayer = window.dataLayer || []).push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
    }
  }, [gaId]);

  return <GA gaId={gaId} />;
} 