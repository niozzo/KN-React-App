import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useMeetList Hook
 * Manages meet list state and animations using React refs
 */
export const useMeetList = (initialMeetList = []) => {
  const [meetList, setMeetList] = useState(initialMeetList);
  const [isAnimating, setIsAnimating] = useState(false);
  const meetListButtonRef = useRef(null);

  const addToMeetList = useCallback((attendee, event) => {
    // Check if already in meet list
    if (meetList.some(person => person.id === attendee.id)) {
      return;
    }

    // Prevent multiple animations
    if (isAnimating) return;

    setIsAnimating(true);
    
    // Add to meet list
    setMeetList(prev => [...prev, { ...attendee, addedAt: Date.now() }]);
    
    // Trigger counter animation after state update
    setTimeout(() => {
      updateMeetListCounter();
    }, 50); // Small delay to ensure DOM is updated
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 1000);
  }, [meetList, isAnimating]);

  const removeFromMeetList = useCallback((attendee, event) => {
    setMeetList(prev => prev.filter(person => person.id !== attendee.id));
  }, []);

  const isInMeetList = useCallback((attendee) => {
    return meetList.some(person => person.id === attendee.id);
  }, [meetList]);


  const updateMeetListCounter = useCallback(() => {
    // Use ref if available, fallback to DOM selector
    const targetButton = meetListButtonRef.current || 
      document.querySelector('.nav-item:nth-child(3)'); // Meet is 3rd tab
    
    if (targetButton) {
      targetButton.classList.add('counter-pulse', 'tab-flash');
      setTimeout(() => {
        targetButton.classList.remove('counter-pulse', 'tab-flash');
      }, 1200);
    }
  }, []);

  return {
    meetList,
    addToMeetList,
    removeFromMeetList,
    isInMeetList,
    isAnimating,
    meetListCount: meetList.length,
    meetListButtonRef
  };
};
