import React, { useState } from 'react';

export default function AudioUnlockOverlay({ onStart }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleStart = () => {
    // 1. Resume the AudioContext or play a silent sound to "unlock"
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // 2. Hide the overlay
    setIsVisible(false);
    
    // 3. Trigger any logic needed in the parent
    if (onStart) onStart();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Belimo ShadowByte 2026</h1>
      <button 
        onClick={handleStart}
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          cursor: 'pointer',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#007bff',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        START EXPERIENCE
      </button>
      <p style={{ marginTop: '15px', opacity: 0.7 }}>
        Click to enable audio and full experience
      </p>
    </div>
  );
}