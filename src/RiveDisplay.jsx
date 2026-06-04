import React, { useEffect, useRef, useState } from 'react';
import { useRive, EventType, Layout, Fit, Alignment } from '@rive-app/react-webgl2';
import { audioManager } from './AudioManager';

function RiveInstance({ onResetRequest }) {
  const { rive, RiveComponent } = useRive({
    src: 'rive/game.riv', 
    stateMachines: 'State Machine 1', 
    autoplay: true,
    autoBind: true, 
    // Reverted back to Fit.Layout so the Rive Editor controls the responsiveness
    layout: new Layout({ fit: Fit.Layout, alignment: Alignment.Center }),
  });

  const hasFadedRef = useRef(false);

  useEffect(() => {
    if (rive) {
      const onRiveEvent = (riveEvent) => {
        console.log("📦 Full Rive Event Object:", riveEvent);
        const eventData = riveEvent.data;
        const eventName = eventData ? eventData.name : riveEvent.name;
        console.log("🔔 Detected Event Name:", eventName);

        if (eventName === 'playAgain') {
          console.log("🔄 MATCH FOUND: Executing Reset...");
          onResetRequest();
          return;
        }

        if (eventData && eventData.properties) {
          const props = eventData.properties;
          // UPDATED: Now allows both 'audio' and 'channel' events through to the manager
          if (props.type === 'audio' || props.type === 'channel') {
            audioManager.handleEvent(props);
          }
        }
      };

      rive.on(EventType.RiveEvent, onRiveEvent);
      return () => rive.off(EventType.RiveEvent, onRiveEvent);
    }
  }, [rive, onResetRequest]);

  useEffect(() => {
    if (!rive) return;
    const intervalId = setInterval(() => {
      const vm = rive.viewModelInstance;
      if (vm) {
        try {
          const musicProp = vm.boolean ? vm.boolean("music") : null;
          const sfxProp = vm.boolean ? vm.boolean("sfx") : null;
          const voProp = vm.boolean ? vm.boolean("voiceover") : null;
          if (musicProp) audioManager.setChannelMute("music", !musicProp.value);
          if (sfxProp) audioManager.setChannelMute("sfx", !sfxProp.value);
          if (voProp) audioManager.setChannelMute("dialogue", !voProp.value);

          const sceneManager = vm.enum ? vm.enum("sceneManager") : null;
          if (sceneManager) {
            if (sceneManager.value === "CoffeeShopComplete" && !hasFadedRef.current) {
                audioManager.fadeOutChannel("music");
                audioManager.fadeOutChannel("ambience");
                hasFadedRef.current = true; 
            } else if (sceneManager.value !== "CoffeeShopComplete") {
                hasFadedRef.current = false;
            }
          }
        } catch (e) {}
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [rive]);

  return <RiveComponent />;
}

export default function RiveDisplay() {
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null); 

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} key={resetKey} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#FFFFFF' }}>
      <RiveInstance onResetRequest={handleReset} />
      
      {!isFullscreen && (
        <button 
          onClick={toggleFullscreen}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            padding: '10px 15px',
            zIndex: 10,
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.85)',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          ⛶ Fullscreen
        </button>
      )}
    </div>
  );
}