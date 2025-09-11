import { useState, useCallback } from 'react';

/**
 * useMeetList Hook
 * Manages meet list state and animations
 */
export const useMeetList = (initialMeetList = []) => {
  const [meetList, setMeetList] = useState(initialMeetList);
  const [isAnimating, setIsAnimating] = useState(false);

  const addToMeetList = useCallback((attendee) => {
    // Check if already in meet list
    if (meetList.some(person => person.id === attendee.id)) {
      return;
    }

    setIsAnimating(true);
    
    // Add to meet list
    setMeetList(prev => [...prev, { ...attendee, addedAt: Date.now() }]);
    
    // Trigger business card animation
    triggerBusinessCardAnimation();
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 800);
  }, [meetList]);

  const removeFromMeetList = useCallback((attendee) => {
    setMeetList(prev => prev.filter(person => person.id !== attendee.id));
  }, []);

  const isInMeetList = useCallback((attendee) => {
    return meetList.some(person => person.id === attendee.id);
  }, [meetList]);

  const triggerBusinessCardAnimation = () => {
    // This would trigger the business card fly animation
    // For now, we'll just update the counter
    updateMeetListCounter();
  };

  const updateMeetListCounter = () => {
    const meetListButton = document.querySelector('.tab-button:nth-child(2)');
    if (meetListButton) {
      meetListButton.classList.add('counter-pulse', 'tab-flash');
      setTimeout(() => {
        meetListButton.classList.remove('counter-pulse', 'tab-flash');
      }, 1200);
    }
  };

  return {
    meetList,
    addToMeetList,
    removeFromMeetList,
    isInMeetList,
    isAnimating,
    meetListCount: meetList.length
  };
};
