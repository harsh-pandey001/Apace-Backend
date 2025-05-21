import React from 'react';
import { visuallyHidden } from '@mui/utils';
import { Box } from '@mui/material';

/**
 * A utility component to add an accessible label that is visually hidden
 * This helps screen readers announce elements without visual text
 * 
 * @param {string} id - The id attribute to associate with label
 * @param {string} label - The text that screen readers will announce
 */
export const ScreenReaderOnly = ({ id, children }) => (
  <Box
    component="span"
    id={id}
    sx={visuallyHidden}
  >
    {children}
  </Box>
);

/**
 * A utility function to generate aria-labelledby with a prefix
 * to ensure unique IDs throughout the application
 */
export const generateUniqueId = (base) => `apace-${base}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * A utility function to skip navigation for keyboard users
 * Adds a visually hidden link that becomes visible on focus
 */
export const SkipLink = ({ target }) => (
  <a
    href={`#${target}`}
    style={{
      position: 'absolute',
      top: '-40px',
      left: 0,
      padding: '8px',
      backgroundColor: '#3498db',
      color: 'white',
      fontWeight: 'bold',
      zIndex: 9999,
      textDecoration: 'none',
      transition: 'top 0.2s ease-in-out',
      ':focus': {
        top: 0,
      },
    }}
    onFocus={(e) => {
      e.target.style.top = '0';
    }}
    onBlur={(e) => {
      e.target.style.top = '-40px';
    }}
  >
    Skip to main content
  </a>
);

/**
 * Accessibility helpers for commonly used ARIA attributes and patterns
 */
export const a11yProps = {
  // For tabs
  tab: (index) => ({
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  }),
  
  // For tab panels
  tabPanel: (index) => ({
    id: `tabpanel-${index}`,
    'aria-labelledby': `tab-${index}`,
  }),
  
  // For accordions
  accordion: (index) => ({
    id: `accordion-${index}`,
    'aria-controls': `accordion-content-${index}`,
  }),
  
  // For accordion panels
  accordionPanel: (index) => ({
    id: `accordion-content-${index}`,
    'aria-labelledby': `accordion-${index}`,
  }),
};

/**
 * Adds aria-live attributes for dynamic content regions
 * - assertive: Announces changes immediately (high priority)
 * - polite: Announces changes when user is idle (low priority)
 * - off: Does not announce changes
 */
export const LiveRegion = ({ children, mode = 'polite' }) => (
  <div aria-live={mode} aria-atomic="true">
    {children}
  </div>
);

export default {
  ScreenReaderOnly,
  generateUniqueId,
  SkipLink,
  a11yProps,
  LiveRegion,
};