export function initWelcomeGate() {
  const welcomeGate = document.querySelector('.welcome-gate') as HTMLElement;
  const enterButton = document.querySelector('.enter-button');
  
  if (!welcomeGate) return;
  
  // Check if user has already entered before
  const hasEntered = localStorage.getItem('lukeus-music-lab-entered');
  
  if (hasEntered) {
    // User has already entered, hide the welcome gate immediately
    welcomeGate.setAttribute('aria-hidden', 'true');
    welcomeGate.style.display = 'none';
    document.body.classList.remove('scroll-lock');
    return;
  }
  
  // Show welcome gate and bind enter button
  if (enterButton && welcomeGate) {
    enterButton.addEventListener('click', () => {
      // Mark that user has entered
      localStorage.setItem('lukeus-music-lab-entered', 'true');
      
      // Hide the welcome gate
      welcomeGate.setAttribute('aria-hidden', 'true');
      welcomeGate.style.display = 'none';
      document.body.classList.remove('scroll-lock');
    });
  }
}
