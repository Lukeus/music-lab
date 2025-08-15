// Main JavaScript for Lukeus Music Lab
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the music lab interface
    initializePlayButtons();
    initializeProgressBars();
    initializeParallaxEffect();
    loadContent(); // Load static content from JSON
});

/**
 * Fetch content from content.json and update the page
 */
async function loadContent() {
    try {
        const response = await fetch('/content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.json();

        document.title = content.pageTitle || document.title;
        document.getElementById('status-message').textContent = content.statusMessage || '';
        document.getElementById('logo-text').textContent = content.logoText || '';
        document.getElementById('hero-heading').textContent = content.heroSection.heading || '';
        document.getElementById('hero-paragraph').textContent = content.heroSection.paragraph || '';

        populateProjects(content.currentProjects);
 populateExperiments(content.soundExperiments);
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

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
 * Populate the projects grid with data from the JSON
 * @param {Array<Object>} projects - An array of project objects
 */
function populateProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = ''; // Clear existing content

    projects.forEach(project => {
        const projectCard = `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-icon">${project.icon}</div>
                        <h3 class="project-title">${project.title}</h3>
                    </div>
                    <span class="project-status ${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${project.progress}%"></div></div>
                <div class="project-meta"><span>${project.meta}</span><button class="play-button">▶</button></div>
            </div>
        `;
        projectsGrid.innerHTML += projectCard;
    });
}

/**
 * Populate the experiments grid with data from the JSON
 * @param {Array<Object>} experiments - An array of experiment objects
 */
function populateExperiments(experiments) {
    const experimentsGrid = document.querySelector('.experiments-grid');
    if (!experimentsGrid) return;

    experimentsGrid.innerHTML = ''; // Clear existing content

    experiments.forEach(experiment => {
        const experimentCard = `
            <div class="experiment-card">
                <div class="experiment-header">
                    <span class="experiment-type">${experiment.type}</span>
                    <h4>${experiment.title}</h4>
                </div>
                <div class="waveform"></div>
                <p>${experiment.description}</p>
                <div class="project-meta"><span>${experiment.meta}</span><button class="play-button">▶</button></div>
            </div>
        `;
        experimentsGrid.innerHTML += experimentCard;
    });
}

/**
 * Populate the journal entries with data from the JSON
 * @param {Array<Object>} entries - An array of journal entry objects
 */
function populateJournalEntries(entries) {
    const journalEntriesContainer = document.querySelector('.journal-entries');
    if (!journalEntriesContainer) return;

    journalEntriesContainer.innerHTML = ''; // Clear existing content

    entries.forEach(entry => {
        const journalEntryCard = `
            <div class="journal-entry">
                <div class="journal-date">${entry.date}</div>
                <h4 class="journal-title">${entry.title}</h4>
                <p class="journal-content">${entry.content}</p>
            </div>
        `;
        journalEntriesContainer.innerHTML += journalEntryCard;
    });
}

/**
 * Animate progress bars when they come into view
 */

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
