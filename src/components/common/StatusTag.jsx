import React from 'react';

/**
 * Status Tag Component
 * Displays status indicators with consistent styling
 */
const StatusTag = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'status-tag';
  const variantClasses = {
    default: '',
    now: 'status-now',
    next: 'status-next',
    past: 'status-past',
    sponsor: 'status-sponsor'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default StatusTag;
