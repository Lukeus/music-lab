// Mobile-specific enhancements and touch interactions

// Haptic feedback utility (uses Vibration API when available)
export function hapticFeedback(pattern: number | number[] = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Visual haptic feedback fallback
export function visualHaptic(element: HTMLElement) {
  element.classList.add('haptic-feedback');
  setTimeout(() => {
    element.classList.remove('haptic-feedback');
  }, 100);
}

// Enhanced touch interactions for drum machine
export function initMobileDrumMachine() {
  const drumSteps = document.querySelectorAll('.drum-step');
  
  drumSteps.forEach(step => {
    // Enhanced touch feedback for drum pads
    step.addEventListener('touchstart', (e) => {
      e.preventDefault();
      hapticFeedback([30, 30, 30]); // Triple tap pattern
      visualHaptic(step as HTMLElement);
      step.classList.add('touching');
    }, { passive: false });

    step.addEventListener('touchend', (e) => {
      e.preventDefault();
      step.classList.remove('touching');
    });

    step.addEventListener('touchcancel', () => {
      step.classList.remove('touching');
    });
  });
}

// Mobile-optimized waveform canvas
export function initMobileWaveforms() {
  const canvases = document.querySelectorAll('.waveform-canvas');
  
  canvases.forEach(canvas => {
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;

    // High DPI support for mobile
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    (canvas as HTMLCanvasElement).width = rect.width * dpr;
    (canvas as HTMLCanvasElement).height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
  });
}

// Swipe gestures for journal cards
export function initSwipeGestures() {
  const journalCards = document.querySelectorAll('.journal-card');
  
  journalCards.forEach(card => {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;

    card.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isDragging = true;
      card.classList.add('swiping');
    });

    card.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      currentX = touch.clientX - startX;
      const currentY = touch.clientY - startY;
      
      // Only horizontal swipes
      if (Math.abs(currentY) > Math.abs(currentX)) return;
      
      e.preventDefault();
      
      if (Math.abs(currentX) > 20) {
        if (currentX > 0) {
          card.classList.add('swipe-right');
          card.classList.remove('swipe-left');
        } else {
          card.classList.add('swipe-left');
          card.classList.remove('swipe-right');
        }
      }
    }, { passive: false });

    card.addEventListener('touchend', () => {
      isDragging = false;
      card.classList.remove('swiping', 'swipe-left', 'swipe-right');
      
      // Action on significant swipe
      if (Math.abs(currentX) > 100) {
        hapticFeedback(100);
        
        if (currentX > 0) {
          // Swipe right - could trigger "like" or "bookmark"
          showSwipeAction('Bookmarked!', card as HTMLElement);
        } else {
          // Swipe left - could trigger "share" or "next"
          showSwipeAction('Shared!', card as HTMLElement);
        }
      }
      
      currentX = 0;
    });
  });
}

// Show swipe action feedback
function showSwipeAction(message: string, element: HTMLElement) {
  const feedback = document.createElement('div');
  feedback.className = 'swipe-feedback';
  feedback.textContent = message;
  feedback.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--accent);
    color: var(--bg);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    z-index: 1000;
    animation: swipe-pop 0.6s ease;
    pointer-events: none;
  `;

  element.style.position = 'relative';
  element.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 600);
}

// Install PWA prompt
export function initPWAInstall() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button
    showInstallPrompt();
  });

  function showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 100px;
        left: 16px;
        right: 16px;
        background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
        color: var(--bg);
        padding: 16px 20px;
        border-radius: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        animation: slide-up 0.3s ease;
        box-shadow: 0 8px 32px rgba(124, 210, 255, 0.3);
      ">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Install Music Lab</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">Get the full app experience</div>
        </div>
        <button id="install-btn" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: inherit;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        ">Install</button>
        <button id="dismiss-install" style="
          background: none;
          border: none;
          color: inherit;
          padding: 8px;
          margin-left: 8px;
          cursor: pointer;
          opacity: 0.7;
        ">×</button>
      </div>
    `;

    document.body.appendChild(installBanner);

    document.getElementById('install-btn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          hapticFeedback([100, 50, 100]);
        }
        
        deferredPrompt = null;
        installBanner.remove();
      }
    });

    document.getElementById('dismiss-install')?.addEventListener('click', () => {
      installBanner.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.body.contains(installBanner)) {
        installBanner.remove();
      }
    }, 10000);
  }
}

// Mobile audio context optimization
export function optimizeAudioForMobile() {
  // Resume audio context on first user interaction (required by mobile browsers)
  const resumeAudioContext = () => {
    if ((window as any).audioCtx && (window as any).audioCtx.state === 'suspended') {
      (window as any).audioCtx.resume();
    }
  };

  document.addEventListener('touchstart', resumeAudioContext, { once: true });
  document.addEventListener('click', resumeAudioContext, { once: true });
}

// Battery-aware performance
export function initBatteryOptimization() {
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const optimizeForBattery = () => {
        const isLowBattery = battery.level < 0.2;
        const isCharging = battery.charging;

        if (isLowBattery && !isCharging) {
          // Reduce animations and visual effects
          document.documentElement.style.setProperty('--reduced-motion', '1');
          
          // Reduce canvas frame rate
          const canvases = document.querySelectorAll('.waveform-canvas');
          canvases.forEach(canvas => {
            (canvas as HTMLElement).dataset.reducedFramerate = 'true';
          });
        }
      };

      battery.addEventListener('levelchange', optimizeForBattery);
      battery.addEventListener('chargingchange', optimizeForBattery);
      optimizeForBattery();
    });
  }
}

// Connection-aware loading
export function initConnectionOptimization() {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    const optimizeForConnection = () => {
      const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
      
      if (isSlowConnection) {
        // Disable non-essential animations
        document.documentElement.style.setProperty('--reduced-motion', '1');
        
        // Show loading indicators
        document.body.classList.add('slow-connection');
      }
    };

    connection.addEventListener('change', optimizeForConnection);
    optimizeForConnection();
  }
}

// Initialize all mobile enhancements
export function initMobileExperience() {
  // Check if we're on a mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                  (window.innerWidth <= 768 && 'ontouchstart' in window);

  if (!isMobile) return;

  console.log('🔥 Initializing mobile-first experience...');

  // Initialize all mobile features
  initMobileDrumMachine();
  initMobileWaveforms();
  initSwipeGestures();
  initPWAInstall();
  optimizeAudioForMobile();
  initBatteryOptimization();
  initConnectionOptimization();

  // Add CSS animation for swipe feedback
  const style = document.createElement('style');
  style.textContent = `
    @keyframes swipe-pop {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
    
    @keyframes slide-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .touching {
      transform: scale(0.95) !important;
      filter: brightness(1.2) !important;
    }
  `;
  document.head.appendChild(style);

  console.log('✅ Mobile experience enhanced!');
}
