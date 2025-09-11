import React from 'react';

/**
 * Card Component
 * Reusable card container with variants
 */
const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    now: 'card-now'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
