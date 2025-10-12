/**
 * Lazy Image Hook
 * 
 * Uses Intersection Observer API to lazy load images when they approach the viewport.
 * Provides graceful degradation for browsers without IO support.
 */

import { useEffect, useRef, useState } from 'react';

interface UseLazyImageOptions {
  /**
   * Root margin for Intersection Observer (distance before viewport to start loading)
   * @default '200px'
   */
  rootMargin?: string;
  
  /**
   * Threshold for intersection (0 = any pixel visible, 1 = fully visible)
   * @default 0.01
   */
  threshold?: number;
  
  /**
   * Fallback to immediate loading if IO is unavailable
   * @default true
   */
  fallbackToImmediate?: boolean;
}

interface UseLazyImageReturn {
  /** Ref to attach to the image container element */
  ref: React.RefObject<HTMLElement>;
  
  /** Whether the image should be loaded (is visible or approaching) */
  isVisible: boolean;
  
  /** Whether the image is currently loading */
  isLoading: boolean;
  
  /** Set to true once image has loaded successfully */
  hasLoaded: boolean;
  
  /** Callback to mark image as loaded */
  onLoad: () => void;
}

/**
 * Hook to lazy load images using Intersection Observer
 * 
 * @example
 * const { ref, isVisible, isLoading, hasLoaded, onLoad } = useLazyImage();
 * 
 * return (
 *   <div ref={ref}>
 *     {isVisible && <img src={src} onLoad={onLoad} />}
 *   </div>
 * );
 */
export const useLazyImage = (options: UseLazyImageOptions = {}): UseLazyImageReturn => {
  const {
    rootMargin = '200px',
    threshold = 0.01,
    fallbackToImmediate = true
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Graceful degradation: load immediately if IO not supported
      if (fallbackToImmediate) {
        console.warn('IntersectionObserver not supported, loading image immediately');
        setIsVisible(true);
      }
      return;
    }

    // Create observer
    let observer: IntersectionObserver;
    
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              setIsLoading(true);
              
              // Once visible, disconnect observer (we don't need to observe anymore)
              observer.disconnect();
            }
          });
        },
        {
          rootMargin,
          threshold
        }
      );

      observer.observe(element);
    } catch (error) {
      // Error creating observer - fallback to immediate loading
      console.error('Error creating IntersectionObserver:', error);
      if (fallbackToImmediate) {
        setIsVisible(true);
      }
    }

    // Cleanup
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [rootMargin, threshold, fallbackToImmediate, isVisible]);

  const onLoad = () => {
    setHasLoaded(true);
    setIsLoading(false);
  };

  return {
    ref,
    isVisible,
    isLoading,
    hasLoaded,
    onLoad
  };
};

