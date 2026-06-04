class AudioManager {
  constructor() {
    this.audioElements = new Map();
    this.channelMutes = { music: false, sfx: false, dialogue: false };
    this.pitchVariance = 0.15; 
  }

  handleEvent(properties) {
    const type = properties.type;
    const action = properties.action || 'play';

    // --- NEW: Handle Channel-Wide Actions (Like your StopDialogue event) ---
    if (type === 'channel') {
      const channelName = properties.target; // Grabs "dialogue" from your Rive event
      
      if (action === 'stop') {
        this.stopChannel(channelName);
      }
      return; // Exit out, so it doesn't try to play a file named "dialogue"
    }

    // --- EXISTING: Handle Individual Audio Files ---
    const filename = properties.target; 
    const channel = properties.channel || 'sfx'; 

    if (!filename) return;

    switch (action) {
      case 'play':
        this.play(filename, false, channel, channel === 'sfx');
        break;
      case 'loop':
        this.play(filename, true, channel, false); 
        break;
      case 'stop':
        this.stop(filename);
        break;
      case 'fade':
        this.fadeOut(filename);
        break;
    }
  }

  // --- NEW: Loops through the Map and stops audio for the requested channel ---
  stopChannel(channelName) {
    console.log(`🛑 Instant stop applied to channel: ${channelName}`);
    this.audioElements.forEach((audio, filename) => {
      if (audio.dataset.channel === channelName && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        console.log(`🔇 Killed overlapping file: ${filename}`);
      }
    });
  }

  play(filename, loop, channel, usePitchShift = false) {
    let audio = this.audioElements.get(filename);
    
    if (!audio) {
      audio = new Audio(`audio/${filename}`);
      audio.dataset.channel = channel; 
      this.audioElements.set(filename, audio);
    }

    console.log(`🔊 Playing: ${filename} on Channel: ${channel}`);

    audio.pause();
    audio.currentTime = 0;

    // --- HARDCODED LOOP LOGIC ---
    // If the channel is 'music', force loop to true. 
    // Otherwise, use the 'loop' value sent from the event.
    audio.loop = (channel === 'music') ? true : loop;

    audio.muted = this.channelMutes[channel];
    audio.volume = 1;

    if (usePitchShift) {
      audio.preservesPitch = false; 
      const randomPitch = 1 + (Math.random() * (this.pitchVariance * 2) - this.pitchVariance);
      audio.playbackRate = randomPitch;
    } else {
      audio.preservesPitch = true;
      audio.playbackRate = 1.0;
    }
    
    audio.play().catch(e => {
        console.warn("Audio blocked by browser. Click the screen to enable sound.");
    });
  }

  fadeOutChannel(channelName, duration = 2000) {
    console.log(`🎬 Fading out channel: ${channelName}`);
    
    this.audioElements.forEach((audio, filename) => {
      // Check if sound is on the channel and is actually playing
      if (audio.dataset.channel === channelName && !audio.paused) {
        console.log(`📉 Fading file: ${filename}`);
        
        const initialVolume = audio.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = initialVolume / steps;

        const interval = setInterval(() => {
          if (audio.volume > volumeStep) {
            audio.volume -= volumeStep;
          } else {
            audio.pause();
            audio.volume = initialVolume;
            clearInterval(interval);
            console.log(`🔇 ${filename} fade complete.`);
          }
        }, stepTime);
      }
    });
  }

  setChannelMute(channelName, isMuted) {
    this.channelMutes[channelName] = isMuted;
    this.audioElements.forEach((audio) => {
      if (audio.dataset.channel === channelName) {
        audio.muted = isMuted;
      }
    });
  }

  stop(filename) {
    const audio = this.audioElements.get(filename);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  fadeOut(filename) {
    const audio = this.audioElements.get(filename);
    if (!audio) return;
    const interval = setInterval(() => {
      if (audio.volume > 0.1) audio.volume -= 0.1;
      else {
        audio.pause();
        audio.volume = 1; 
        clearInterval(interval);
      }
    }, 100);
  }
}

export const audioManager = new AudioManager();