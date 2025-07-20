// Main JavaScript for Lukeus Music Lab
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the music lab interface
    initializePlayButtons();
    initializeProgressBars();
    initializeParallaxEffect();
});

/**
 * Initialize play button interactions
 */
function initializePlayButtons() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            togglePlayButton(this);
        });
    });
}

/**
 * Toggle play/pause state for buttons with enhanced animations
 * @param {HTMLElement} button - The play button element
 */
function togglePlayButton(button) {
    if (button.textContent === '▶') {
        // Play state
        button.textContent = '⏸';
        button.classList.add('playing');
        button.style.background = 'var(--accent-secondary)';
        
        // Add ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'button-ripple';
        button.appendChild(ripple);
        
        // Simulate audio feedback
        navigator.vibrate && navigator.vibrate(50);
        console.log('Playing audio...');
        
        // Auto-pause after demo duration (optional)
        setTimeout(() => {
            if (button.classList.contains('playing')) {
                togglePlayButton(button);
            }
        }, 3000);
        
    } else {
        // Pause state
        button.textContent = '▶';
        button.classList.remove('playing');
        button.style.background = 'var(--accent)';
        
        // Remove any ripple elements
        const ripples = button.querySelectorAll('.button-ripple');
        ripples.forEach(ripple => ripple.remove());
        
        console.log('Pausing audio...');
    }
}

/**
 * Animate progress bars when they come into view
 */
function initializeProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target instanceof HTMLElement) {
                animateProgressBar(entry.target);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    });

    progressBars.forEach(bar => observer.observe(bar));
}

/**
 * Animate a progress bar
 * @param {HTMLElement} progressBar - The progress bar element
 */
function animateProgressBar(progressBar) {
    const targetWidth = progressBar.style.width;
    progressBar.style.width = '0';
    
    setTimeout(() => {
        progressBar.style.width = targetWidth;
    }, 100);
}

/**
 * Add subtle parallax effect to hero section
 */
function initializeParallaxEffect() {
    const hero = document.querySelector('.hero');
    
    if (hero instanceof HTMLElement) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.3;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }
}

/**
 * Utility function to add smooth scrolling to anchor links
 */
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Add theme toggle functionality (for future enhancement)
 */
function initializeThemeToggle() {
    // Placeholder for theme switching functionality
    // Could be implemented to switch between dark/light modes
}

// Export functions for potential use in other modules
window.MusicLab = {
    togglePlayButton,
    animateProgressBar
};
