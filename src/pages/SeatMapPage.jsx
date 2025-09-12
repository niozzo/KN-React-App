import React, { useState, useRef, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';

/**
 * Seat Map Page Component
 * Interactive seat map with zoom, pan, and reset functionality
 * Refactored from seat-map.html (555 lines) to ~200 lines
 */
const SeatMapPage = () => {
  const mapContainerRef = useRef(null);
  const mapImageRef = useRef(null);
  
  // State for map interactions
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Constants
  const minScale = 0.5;
  const maxScale = 3;

  // Mock data
  const locationInfo = {
    name: "Grand Ballroom A",
    table: "Your Table: 12"
  };

  // Update transform function
  const updateTransform = () => {
    if (mapImageRef.current) {
      mapImageRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
  };

  // Reset function
  const resetImage = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX - translateX);
      setStartY(e.touches[0].clientY - translateY);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      mapContainerRef.current.dataset.initialDistance = distance;
      mapContainerRef.current.dataset.initialScale = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      setTranslateX(e.touches[0].clientX - startX);
      setTranslateY(e.touches[0].clientY - startY);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialDistance = parseFloat(mapContainerRef.current.dataset.initialDistance);
      const initialScale = parseFloat(mapContainerRef.current.dataset.initialScale);
      const newScale = Math.max(minScale, Math.min(maxScale, initialScale * (distance / initialDistance)));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX - translateX);
    setStartY(e.clientY - translateY);
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTranslateX(e.clientX - startX);
      setTranslateY(e.clientY - startY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = 'grab';
    }
  };

  // Wheel handler for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(minScale, Math.min(maxScale, scale * delta));
    setScale(newScale);
  };

  // Back handler
  const handleBackClick = () => {
    window.history.back();
  };

  // Update transform when state changes
  useEffect(() => {
    updateTransform();
  }, [translateX, translateY, scale]);

  // Set up event listeners
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    mapContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    mapContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    mapContainer.addEventListener('mousedown', handleMouseDown);
    mapContainer.addEventListener('mousemove', handleMouseMove);
    mapContainer.addEventListener('mouseup', handleMouseUp);
    mapContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      mapContainer.removeEventListener('touchstart', handleTouchStart);
      mapContainer.removeEventListener('touchmove', handleTouchMove);
      mapContainer.removeEventListener('touchend', handleTouchEnd);
      mapContainer.removeEventListener('mousedown', handleMouseDown);
      mapContainer.removeEventListener('mousemove', handleMouseMove);
      mapContainer.removeEventListener('mouseup', handleMouseUp);
      mapContainer.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, startX, startY, translateX, translateY, scale]);

  return (
    <PageLayout>
      {/* Header with back button and location info */}
      <div 
        className="bottom-info"
        style={{
          position: 'fixed',
          top: '55px',
          left: 0,
          right: 0,
          background: 'var(--white)',
          padding: 'var(--space-md) var(--space-lg)',
          boxShadow: 'inset 0 4px 8px rgba(14,24,33,0.08), 0 2px 8px rgba(14,24,33,0.1)',
          zIndex: 100
        }}
      >
        <div 
          className="back-link-container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-sm)'
          }}
        >
          <button 
            className="back-link"
            onClick={handleBackClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              color: 'var(--purple-700)',
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
        <div 
          className="location-info"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--ink-900)',
            marginBottom: '4px'
          }}
        >
          {locationInfo.name}
        </div>
        <div 
          className="table-assignment"
          style={{
            fontSize: '18px',
            color: 'var(--ink-500)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{locationInfo.table}</span>
          <span 
            className="zoom-instruction"
            style={{
              color: 'var(--ink-500)',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Pinch to zoom
          </span>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div
        ref={mapContainerRef}
        className="map-container"
        id="mapContainer"
        style={{
          position: 'fixed',
          top: '203px', // 91px nav + ~88px location info + 24px gutter
          left: 'var(--space-md)',
          right: 'var(--space-md)',
          bottom: 'calc(91px + var(--space-lg))', // Nav height + gutter
          background: 'var(--white)',
          backgroundImage: `
            linear-gradient(rgba(124, 76, 196, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 76, 196, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          borderRadius: '16px',
          boxShadow: `
            inset 0 2px 8px rgba(14,24,33,0.1),
            0 4px 16px rgba(14,24,33,0.15)
          `,
          overflow: 'hidden',
          zIndex: 10,
          cursor: 'grab'
        }}
      >
        <img
          ref={mapImageRef}
          src="/mockups/assets/maps/locationName_14.jpg"
          alt="Venue Floor Plan"
          className="map-image"
          id="mapImage"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            cursor: 'grab',
            userSelect: 'none',
            transformOrigin: 'center center',
            transition: isAnimating ? 'transform 0.2s ease' : 'none'
          }}
        />
        
        {/* Reset Button */}
        <button
          className="reset-button"
          id="resetButton"
          onClick={resetImage}
          title="Reset view"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            background: 'var(--white)',
            border: '2px solid var(--purple-700)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(14,24,33,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <svg
            className="reset-icon"
            style={{
              width: '20px',
              height: '20px',
              color: 'var(--purple-700)'
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </button>
      </div>
    </PageLayout>
  );
};

export default SeatMapPage;
