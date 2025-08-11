import React from 'react';

export function Skeleton({ className = '', style }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
