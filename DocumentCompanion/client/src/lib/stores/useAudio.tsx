import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: false, // Start unmuted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    try {
      const { hitSound, isMuted } = get();
      
      // If sound is muted or not loaded, show visual feedback instead
      if (isMuted || !hitSound) {
        console.log("💥 Hit!");
        return;
      }
      
      // Try to play the sound
      hitSound.currentTime = 0;
      hitSound.play().catch(error => {
        // Silent fail (just log)
        console.log("Hit sound play prevented:", error);
      });
    } catch (error) {
      // Fail gracefully - just log
      console.log("Error playing hit sound");
    }
  },
  
  playSuccess: () => {
    try {
      const { successSound, isMuted } = get();
      
      // If sound is muted or not loaded, show visual feedback instead
      if (isMuted || !successSound) {
        console.log("🎉 Success!");
        return;
      }
      
      // Try to play the sound
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        // Silent fail (just log)
        console.log("Success sound play prevented:", error);
      });
    } catch (error) {
      // Fail gracefully - just log
      console.log("Error playing success sound");
    }
  }
}));
