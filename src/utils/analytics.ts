import { track as vercelTrack } from '@vercel/analytics';

// Define a more specific type for analytics parameters
type AnalyticsParameters = Record<string, string | number | boolean>;

// Google Analytics event tracking
export const trackGA = (eventName: string, parameters?: AnalyticsParameters) => {
    
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Vercel Analytics event tracking
export const trackVercel = (eventName: string, parameters?: AnalyticsParameters) => {
  vercelTrack(eventName, parameters);
};

// Combined tracking function that sends to both analytics platforms
export const track = (eventName: string, parameters?: AnalyticsParameters) => {
  // Track to Vercel Analytics
  trackVercel(eventName, parameters);
  
  // Track to Google Analytics
  trackGA(eventName, parameters);
};

// Specific tracking functions for common events
export const trackButtonClick = (buttonName: string, location?: string, additionalParams?: AnalyticsParameters) => {
  track('button_click', {
    button_name: buttonName,
    location: location || 'unknown',
    ...additionalParams
  });
};

export const trackPageView = (pageName: string, additionalParams?: AnalyticsParameters) => {
  track('page_view', {
    page_name: pageName,
    ...additionalParams
  });
};

export const trackProjectInteraction = (projectName: string, interactionType: string, additionalParams?: AnalyticsParameters) => {
  track('project_interaction', {
    project_name: projectName,
    interaction_type: interactionType,
    ...additionalParams
  });
};

export const trackProcrastinateAction = (actionType: string, additionalParams?: AnalyticsParameters) => {
  track('procrastinate_action', {
    action_type: actionType,
    ...additionalParams
  });
};

// Type definitions for better TypeScript support
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
} 