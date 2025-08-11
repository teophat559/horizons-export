import React from 'react';
export { Apple } from './Apple';
export { Facebook } from './Facebook';
export { Google } from './Google';
export { Instagram } from './Instagram';
export { Email as Mail } from './Mail';
export { Outlook } from './Outlook';
export { Yahoo } from './Yahoo';
export { Zalo } from './Zalo';

export const HelpCircle = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);