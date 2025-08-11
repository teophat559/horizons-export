import React from 'react';

export const ImageAsIcon = ({ src, alt, className, ...props }) => (
  <img src={src} alt={alt} className={className} {...props} />
);