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
 * Toggle play/pause state for buttons
 * @param {HTMLElement} button - The play button element
 */
function togglePlayButton(button) {
    if (button.textContent === '▶') {
        button.textContent = '⏸';
        button.style.background = '#ff6b6b';
        // Here you could add actual audio playback functionality
        console.log('Playing audio...');
    } else {
        button.textContent = '▶';
        button.style.background = 'var(--accent)';
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
            if (entry.isIntersecting) {
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
    
    if (hero) {
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
