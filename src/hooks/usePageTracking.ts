import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Hook to track page views on route changes
 * Add this to App.tsx to automatically track all page views
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location]);
}
