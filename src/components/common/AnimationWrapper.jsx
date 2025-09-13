import React, { useState, useEffect } from 'react';

/**
 * AnimationWrapper Component
 * Provides consistent animation behavior with proper cleanup
 * Handles page transitions and loading states
 */
const AnimationWrapper = ({ 
  children, 
  animationType = 'fadeIn',
  delay = 0,
  duration = 300,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setAnimationClass(animationType);
    }, delay);

    return () => clearTimeout(timer);
  }, [animationType, delay]);

  const animationStyle = {
    animationDuration: `${duration}ms`,
    ...props.style
  };

  return (
    <div 
      className={`animation-wrapper ${animationClass} ${className}`}
      style={animationStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimationWrapper;
