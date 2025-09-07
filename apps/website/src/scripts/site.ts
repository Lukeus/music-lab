import { bindPlayButtons, bindMiniPlayer, bindWaveform } from './audio';
import { bindJournalFeatures } from './journal';
import { initParallax } from './parallax';
import { initWelcomeGate } from './welcomeGate';
import { initDashboard } from './dashboard';
import { initCinematicBackground } from './cinematic';
import { initializeDrumMachine } from './drumMachine';

window.addEventListener('DOMContentLoaded', () => {
  bindPlayButtons();
  bindMiniPlayer();
  bindWaveform();
  bindJournalFeatures();
  initParallax();
  initWelcomeGate();
  initDashboard();
  initAvatarClickHandler();
  initCinematicBackground();
});

// Avatar click handler to show/hide drum machine
function initAvatarClickHandler() {
  const avatar = document.getElementById('hero-avatar');
  const drumContainer = document.getElementById('drum-machine-container');
  const avatarContainer = document.querySelector('.avatar-container');
  
  if (!avatar || !drumContainer) return;
  
  // Ensure drum machine starts hidden
  drumContainer.classList.remove('show');
  
  // Force initial hidden styles
  drumContainer.style.opacity = '0';
  drumContainer.style.visibility = 'hidden';
  drumContainer.style.maxHeight = '0';
  drumContainer.style.transform = 'translateY(20px)';
  
  let drumMachineInitialized = false;
  let isVisible = false;
  let isToggling = false; // Prevent rapid clicks
  
  // Add click cursor to avatar
  avatar.style.cursor = 'pointer';
  if (avatarContainer) {
    (avatarContainer as HTMLElement).style.cursor = 'pointer';
  }
  
  // Add click event to avatar
  const toggleDrumMachine = async () => {
    // Prevent rapid clicks
    if (isToggling) {
      console.log('🚫 Click ignored - already toggling');
      return;
    }
    isToggling = true;
    console.log('🥁 Avatar clicked! Initializing drum machine...');
    
    if (!drumMachineInitialized) {
      // Initialize drum machine on first click
      try {
        await initializeDrumMachine();
        drumMachineInitialized = true;
        console.log('✅ Drum machine initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize drum machine:', error);
        return;
      }
    }
    
    // Toggle visibility
    isVisible = !isVisible;
    console.log(`🎵 Toggling drum machine visibility: ${isVisible ? 'SHOW' : 'HIDE'}`);
    
    if (isVisible) {
      drumContainer.classList.add('show');
      console.log('✅ Drum machine shown');
      
      // Force styles with inline CSS as fallback
      drumContainer.style.opacity = '1';
      drumContainer.style.visibility = 'visible';
      drumContainer.style.maxHeight = '800px';
      drumContainer.style.transform = 'translateY(0)';
      
      // Smooth scroll to drum machine after animation
      setTimeout(() => {
        drumContainer.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    } else {
      drumContainer.classList.remove('show');
      console.log('✅ Drum machine hidden');
      
      // Force hidden styles with inline CSS as fallback
      drumContainer.style.opacity = '0';
      drumContainer.style.visibility = 'hidden';
      drumContainer.style.maxHeight = '0';
      drumContainer.style.transform = 'translateY(20px)';
      
      // Stop any playing drums
      if ((window as any).drumMachine && (window as any).drumMachine.stop) {
        (window as any).drumMachine.stop();
      }
    }
    
    // Reset toggle lock after animation completes
    setTimeout(() => {
      isToggling = false;
    }, 600); // Match CSS transition duration
  };
  
  // Only bind to avatar image to prevent double-firing
  avatar.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDrumMachine();
  });
}
