import { scroll, inView, animate } from "https://esm.sh/motion@10.18.0";

window.addEventListener('load', function() {
    if (sessionStorage.getItem('welcomeGateShown')) {
        const welcomeGate = document.querySelector('.welcome-gate');
        if (welcomeGate) {
            welcomeGate.style.display = 'none';
        }
        document.body.classList.remove('scroll-lock');
    }

    initializeWelcomeGate();
    initializeHeaderLink();
    initializePlayButtons();
    loadContent().then(() => {
        initializeScrollAnimations();
        initializeParallax();
    });
});

function initializeWelcomeGate() {
    const welcomeGate = document.querySelector('.welcome-gate');
    const enterButton = document.querySelector('.enter-button');

    if (enterButton) {
        enterButton.addEventListener('click', () => {
            if (welcomeGate) {
                welcomeGate.style.opacity = '0';
                setTimeout(() => {
                    welcomeGate.style.display = 'none';
                }, 500);
            }
            document.body.classList.remove('scroll-lock');
            sessionStorage.setItem('welcomeGateShown', 'true');
        });
    }
}

function initializeHeaderLink() {
    const logoLink = document.querySelector('header .logo');
    const welcomeGate = document.querySelector('.welcome-gate');

    if (logoLink && welcomeGate) {
        logoLink.addEventListener('click', (event) => {
            event.preventDefault();
            welcomeGate.style.display = 'flex';
            setTimeout(() => {
                welcomeGate.style.opacity = '1';
            }, 10);
            document.body.classList.add('scroll-lock');
            sessionStorage.removeItem('welcomeGateShown');
        });
    }
}

async function loadContent() {
    try {
        const response = await fetch('/content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.json();

        if (content.welcomeGate) {
            document.getElementById('welcome-heading').textContent = content.welcomeGate.heading || '';
            document.getElementById('welcome-message').textContent = content.welcomeGate.message || '';
        }

        document.title = content.pageTitle || document.title;
        document.getElementById('status-message').textContent = content.statusMessage || '';
        document.getElementById('logo-text').textContent = content.logoText || '';
        document.getElementById('hero-heading').textContent = content.heroSection.heading || '';
        document.getElementById('hero-paragraph').textContent = content.heroSection.paragraph || '';

        populateProjects(content.currentProjects);
        populateExperiments(content.soundExperiments);
        populateJournalEntries(content.creativeJournal);
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

function initializePlayButtons() {
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            togglePlayButton(this);
        });
    });
}

function togglePlayButton(button) {
    if (button.textContent === '▶') {
        button.textContent = '⏸';
        button.classList.add('playing');
        button.style.background = 'var(--accent-secondary)';
    } else {
        button.textContent = '▶';
        button.classList.remove('playing');
        button.style.background = 'var(--accent)';
    }
}

function populateProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
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

function populateExperiments(experiments) {
    const experimentsGrid = document.querySelector('.experiments-grid');
    if (!experimentsGrid) return;
    experimentsGrid.innerHTML = '';
    experiments.forEach(experiment => {
        const experimentCard = `
            <div class="experiment-card">
                <div class="experiment-header">
                    <span class="experiment-type">${experiment.type}</span>
                    <h4>${experiment.title}</h4>
                </div>
                <div class="waveform"></div>
                <p>${experiment.description}</p>
                <div class.project-meta"><span>${experiment.meta}</span><button class="play-button">▶</button></div>
            </div>
        `;
        experimentsGrid.innerHTML += experimentCard;
    });
}

function populateJournalEntries(entries) {
    const journalEntriesContainer = document.getElementById('creative-journal-entries');
    if (!journalEntriesContainer) return;
    journalEntriesContainer.innerHTML = '';
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

function initializeScrollAnimations() {
    const hero = document.querySelector('.hero');
    if (hero) {
        scroll(
            ({ y }) => {
                hero.style.backgroundPositionY = `${y.progress * 50}%`;
            },
            { target: hero }
        );
    }

    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        inView(bar, () => {
            animate(bar, { width }, { duration: 1 });
        });
    });

    const cards = document.querySelectorAll('.project-card, .experiment-card, .journal-entry');
    cards.forEach(card => {
        inView(card, 
            () => {
                animate(card, { opacity: 1, transform: 'translateY(0)' }, { duration: 0.5, delay: 0.1 });
            },
            { amount: 0.2 }
        );
    });
}

function initializeParallax() {
    const icons = document.querySelectorAll('.parallax-icon');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        icons.forEach(icon => {
            const speed = icon.dataset.speed;
            const yPos = -(scrollY * speed / 10);
            icon.style.transform = `translateY(${yPos}px)`;
        });
    });
}