
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getCookieConsentValue } from '@/components/CookieConsent';
import { captureUtmFromSearchParams, trackPurocontenidoInboundIfNeeded } from '@/lib/analytics';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check for analytics-specific consent
    setConsentGiven(getCookieConsentValue('analytics'));
  }, []);

  useEffect(() => {
    captureUtmFromSearchParams(searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (!consentGiven || !GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
      return;
    }

    trackPurocontenidoInboundIfNeeded();
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams, consentGiven]);
  
  if (!GA_MEASUREMENT_ID || !consentGiven) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        onLoad={() => {
          trackPurocontenidoInboundIfNeeded();
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('consent', 'update', {
              'analytics_storage': 'granted'
            });

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
