// Google Analytics 4 utility functions

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// GA4 Measurement ID - replace with your actual ID
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Initialize GA4
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not configured');
    return;
  }

  // Update the gtag script src dynamically
  const script = document.querySelector('script[src*="googletagmanager"]');
  if (script) {
    script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
  }

  // Configure GA4
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually for SPA
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', eventName, parameters);
};

// Common event helpers
export const trackSignUp = () => {
  trackEvent('sign_up', { method: 'email' });
};

export const trackComparisonCreated = (comparisonId: string) => {
  trackEvent('comparison_created', { comparison_id: comparisonId });
};

export const trackComparisonViewed = (comparisonId: string) => {
  trackEvent('comparison_viewed', { comparison_id: comparisonId });
};

export const trackRecommendationViewed = (comparisonId: string) => {
  trackEvent('recommendation_viewed', { comparison_id: comparisonId });
};

export const trackExpertVote = (comparisonId: string, votedFor: string) => {
  trackEvent('expert_vote', { comparison_id: comparisonId, voted_for: votedFor });
};
