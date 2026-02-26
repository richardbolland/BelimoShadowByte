import React, { useEffect, useRef, useState } from 'react';
import { useRive, EventType, Layout, Fit, Alignment } from '@rive-app/react-webgl2';
import { audioManager } from './AudioManager';

function RiveInstance({ onResetRequest }) {
  const { rive, RiveComponent } = useRive({
    src: '/rive/game.riv', 
    stateMachines: 'State Machine 1', 
    autoplay: true,
    autoBind: true, 
    layout: new Layout({ fit: Fit.Layout, alignment: Alignment.Center }),
  });

  const hasFadedRef = useRef(false);

  // 1. Updated Audio & System Event Listener
  useEffect(() => {
    if (rive) {
      const onRiveEvent = (riveEvent) => {
        // --- DEEP LOG ---
        // This will show us the full structure so we can see where the name is hidden
        console.log("📦 Full Rive Event Object:", riveEvent);

        // In WebGL2, the name is often inside riveEvent.data.name
        const eventData = riveEvent.data;
        const eventName = eventData ? eventData.name : riveEvent.name;

        console.log("🔔 Detected Event Name:", eventName);

        // CHECK FOR RESET EVENT
        if (eventName === 'playAgain') {
          console.log("🔄 MATCH FOUND: Executing Reset...");
          onResetRequest();
          return;
        }

        // Handle Audio Properties
        if (eventData && eventData.properties) {
          const props = eventData.properties;
          if (props.type === 'audio') audioManager.handleEvent(props);
        }
      };

      rive.on(EventType.RiveEvent, onRiveEvent);
      return () => rive.off(EventType.RiveEvent, onRiveEvent);
    }
  }, [rive, onResetRequest]);

  // View Model Syncer
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
          if (voProp) audioManager.setChannelMute("voiceover", !voProp.value);

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

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div key={resetKey} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RiveInstance onResetRequest={handleReset} />
    </div>
  );
}