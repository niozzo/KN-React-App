import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * Pull-to-Refresh Hook
 * Follows our established hook patterns and integrates with existing data loading
 * Architecture: localStorage-first, leverages existing refresh functions
 */
export interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canPull: boolean;
  pullProgress: number;
}

export interface PullToRefreshOptions {
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
  onRefresh?: () => Promise<void>;
}

export interface PullToRefreshResult extends PullToRefreshState {
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
  resetPull: () => void;
}

export const usePullToRefresh = (options: PullToRefreshOptions = {}): PullToRefreshResult => {
  const {
    threshold = 80,
    resistance = 1.5, // Reduced from 2.5 for better responsiveness
    disabled = false,
    onRefresh
  } = options;

  // Maximum pull distance for rubber-band effect
  const maxPullDistance = 200;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canPull, setCanPull] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const touchStartTime = useRef(0);

  // Calculate pull progress (0-1)
  const pullProgress = Math.min(pullDistance / threshold, 1);

  // Check if we're at the top of the page
  const checkCanPull = useCallback(() => {
    if (disabled || isRefreshing) {
      setCanPull(false);
      return;
    }
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setCanPull(scrollTop === 0);
  }, [disabled, isRefreshing]);

  // Reset pull state
  const resetPull = useCallback(() => {
    setIsPulling(false);
    setPullDistance(0);
    isDragging.current = false;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    checkCanPull();
    if (!canPull) return;

    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isDragging.current = false;
  }, [disabled, isRefreshing, canPull, checkCanPull]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // Only handle downward pulls
    if (deltaY > 0) {
      e.preventDefault();
      isDragging.current = true;
      
      // Rubber-band resistance calculation
      let adjustedDistance;
      if (deltaY <= threshold) {
        // Normal pull - minimal resistance
        adjustedDistance = deltaY * 0.9;
      } else {
        // Rubber-band effect - exponential resistance
        const overThreshold = deltaY - threshold;
        const rubberBandFactor = 1 - Math.min(overThreshold / maxPullDistance, 0.9);
        adjustedDistance = threshold + (overThreshold * rubberBandFactor);
      }
      
      setPullDistance(adjustedDistance);
      setIsPulling(adjustedDistance > 10);
    }
  }, [disabled, isRefreshing, canPull, threshold, maxPullDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isDragging.current) {
      resetPull();
      return;
    }

    const deltaY = currentY.current - startY.current;
    const pullDuration = Date.now() - touchStartTime.current;
    
    // Apply same rubber-band resistance calculation as in touch move
    let adjustedDistance;
    if (deltaY <= threshold) {
      adjustedDistance = deltaY * 0.9;
    } else {
      const overThreshold = deltaY - threshold;
      const rubberBandFactor = 1 - Math.min(overThreshold / maxPullDistance, 0.9);
      adjustedDistance = threshold + (overThreshold * rubberBandFactor);
    }
    
    // Trigger refresh if pulled far enough or fast enough
    const shouldRefresh = adjustedDistance > threshold || 
                        (adjustedDistance > threshold * 0.6 && pullDuration < 300);
    
    if (shouldRefresh && onRefresh) {
      try {
        setIsRefreshing(true);
        logger.debug('Pull-to-refresh triggered', null, 'usePullToRefresh');
        await onRefresh();
        logger.success('Pull-to-refresh completed', null, 'usePullToRefresh');
      } catch (error) {
        logger.error('Pull-to-refresh failed', error, 'usePullToRefresh');
      } finally {
        setIsRefreshing(false);
      }
    }
    
    resetPull();
  }, [disabled, isRefreshing, threshold, maxPullDistance, onRefresh, resetPull]);

  // Set up scroll listener
  useEffect(() => {
    const handleScroll = () => checkCanPull();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    checkCanPull();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [checkCanPull]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    canPull,
    pullProgress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetPull
  };
};
