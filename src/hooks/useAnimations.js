import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useAnimations Hook
 * Centralized animation management with proper React patterns
 * Replaces direct DOM manipulation with React state management
 */
export const useAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRefs = useRef(new Map());
  const cleanupFunctions = useRef(new Set());

  // Cleanup function to prevent memory leaks
  const addCleanupFunction = useCallback((cleanupFn) => {
    cleanupFunctions.current.add(cleanupFn);
  }, []);

  // Remove cleanup function when no longer needed
  const removeCleanupFunction = useCallback((cleanupFn) => {
    cleanupFunctions.current.delete(cleanupFn);
  }, []);

  // Cleanup all animations on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      animationRefs.current.clear();
    };
  }, []);

  // Business card fly animation with proper cleanup
  const triggerBusinessCardFlyAnimation = useCallback((startElement, endElement) => {
    if (isAnimating) return;

    setIsAnimating(true);

    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Create business card element
    const businessCard = document.createElement('div');
    businessCard.className = 'business-card-icon';
    businessCard.innerHTML = '📇';
    businessCard.style.position = 'fixed';
    businessCard.style.fontSize = '24px';
    businessCard.style.zIndex = '1000';
    businessCard.style.pointerEvents = 'none';
    businessCard.style.left = startX + 'px';
    businessCard.style.top = startY + 'px';
    businessCard.style.setProperty('--delta-x', deltaX + 'px');
    businessCard.style.setProperty('--delta-y', deltaY + 'px');

    document.body.appendChild(businessCard);

    // Cleanup function
    const cleanup = () => {
      if (businessCard.parentNode) {
        businessCard.parentNode.removeChild(businessCard);
      }
      setIsAnimating(false);
    };

    addCleanupFunction(cleanup);

    // Remove after animation completes
    const timeoutId = setTimeout(() => {
      cleanup();
      removeCleanupFunction(cleanup);
    }, 800);

    // Store timeout for potential early cleanup
    animationRefs.current.set('businessCard', { timeoutId, cleanup });

    return cleanup;
  }, [isAnimating, addCleanupFunction, removeCleanupFunction]);

  // Counter pulse animation
  const triggerCounterPulse = useCallback((element) => {
    if (!element) return;

    element.classList.add('counter-pulse', 'tab-flash');
    
    const cleanup = () => {
      element.classList.remove('counter-pulse', 'tab-flash');
    };

    const timeoutId = setTimeout(cleanup, 1200);
    
    // Store for potential cleanup
    animationRefs.current.set('counterPulse', { timeoutId, cleanup });

    return cleanup;
  }, []);

  // Remove animation with proper state management
  const triggerRemoveAnimation = useCallback((element, onComplete) => {
    if (!element) return;

    const attendeeCard = element.closest('.attendee-card');
    const attendeeList = attendeeCard?.closest('.attendee-list');
    
    if (!attendeeCard || !attendeeList) return;

    // Reset button state
    element.blur();
    
    // Add animation classes
    attendeeList.classList.add('smooth-scroll');
    attendeeCard.classList.add('removing');
    
    // Trigger counter animation
    triggerCounterPulse(element);
    
    // Complete removal after animation
    const timeoutId = setTimeout(() => {
      if (onComplete) onComplete();
      
      // Clean up classes
      setTimeout(() => {
        if (attendeeList && attendeeList.classList) {
          attendeeList.classList.remove('smooth-scroll');
        }
      }, 100);
    }, 600);

    // Store for cleanup
    animationRefs.current.set('removeAnimation', { timeoutId, cleanup: () => {} });

    return () => {
      clearTimeout(timeoutId);
      attendeeList?.classList.remove('smooth-scroll');
      attendeeCard?.classList.remove('removing');
    };
  }, [triggerCounterPulse]);

  // Cancel all animations
  const cancelAllAnimations = useCallback(() => {
    animationRefs.current.forEach(({ timeoutId, cleanup }) => {
      clearTimeout(timeoutId);
      cleanup();
    });
    animationRefs.current.clear();
    setIsAnimating(false);
  }, []);

  return {
    isAnimating,
    triggerBusinessCardFlyAnimation,
    triggerCounterPulse,
    triggerRemoveAnimation,
    cancelAllAnimations
  };
};
