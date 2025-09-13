import { useState, useCallback, useRef } from 'react';
import { useAnimations } from './useAnimations';

/**
 * useMeetList Hook
 * Manages meet list state with proper animation integration
 * Refactored to use centralized animation system
 */
export const useMeetList = (initialMeetList = []) => {
  const [meetList, setMeetList] = useState(initialMeetList);
  const meetListButtonRef = useRef(null);
  const { 
    isAnimating, 
    triggerBusinessCardFlyAnimation, 
    triggerCounterPulse, 
    triggerRemoveAnimation 
  } = useAnimations();

  const addToMeetList = useCallback((attendee, event) => {
    // Check if already in meet list
    if (meetList.some(person => person.id === attendee.id)) {
      return;
    }

    // Prevent multiple animations
    if (isAnimating) return;

    // Add to meet list
    setMeetList(prev => [...prev, { ...attendee, addedAt: Date.now() }]);
    
    // Trigger business card fly animation
    if (event && meetListButtonRef.current) {
      triggerBusinessCardFlyAnimation(event.currentTarget, meetListButtonRef.current);
    }
    
    // Trigger counter animation
    if (meetListButtonRef.current) {
      triggerCounterPulse(meetListButtonRef.current);
    }
  }, [meetList, isAnimating, triggerBusinessCardFlyAnimation, triggerCounterPulse]);

  const removeFromMeetList = useCallback((attendee) => {
    setMeetList(prev => prev.filter(person => person.id !== attendee.id));
  }, []);

  const isInMeetList = useCallback((attendee) => {
    return meetList.some(person => person.id === attendee.id);
  }, [meetList]);

  const handleRemoveWithAnimation = useCallback((attendee, event) => {
    if (event && meetListButtonRef.current) {
      triggerRemoveAnimation(event.currentTarget, () => {
        removeFromMeetList(attendee);
      });
    } else {
      removeFromMeetList(attendee);
    }
  }, [removeFromMeetList, triggerRemoveAnimation]);

  return {
    meetList,
    addToMeetList,
    removeFromMeetList,
    handleRemoveWithAnimation,
    isInMeetList,
    isAnimating,
    meetListCount: meetList.length,
    meetListButtonRef
  };
};
