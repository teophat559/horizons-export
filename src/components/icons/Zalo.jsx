import React from "react";

export const Zalo = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.95 15.5h-1.73l-.5-1.5H9.28l-.5 1.5H7.05l3.4-8h3.1l3.4 8zM10.88 12.5h2.24L12 8.3z" />
  </svg>
);