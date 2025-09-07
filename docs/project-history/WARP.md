# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Astro development server at `http://localhost:4321`
- `npm run build` - Build production site to `dist/` directory
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Lint TypeScript and JavaScript files with ESLint (auto-fix enabled)
- `npm run format` - Format all code files with Prettier

### Testing Single Features
- Test audio playback: Navigate to dev server and click any play button in Current Projects
- Test drum machine: Click the avatar in the hero section to toggle drum machine visibility
- Test journal: Use filter buttons and "Read more" functionality in journal section
- Test waveform visualization: Play any audio track to see real-time frequency analysis

## Architecture Overview

This is an **Astro + TypeScript** music portfolio site with interactive audio features and modular TypeScript scripts.

### Project Structure

**Core Astro Setup:**
- `src/pages/index.astro` - Main homepage with all content sections
- `src/layouts/base.astro` - Base layout with meta tags, fonts, and global scripts
- `src/components/` - Reusable Astro components (AudioPlayer, DrumMachine, JournalList, etc.)

**Content Management:**
- `src/data/content.json` - Single source of truth for all site content (projects, experiments, journal entries)
- `src/content/journal/` - MDX files for detailed journal posts (configured via `content.config.ts`)

**Interactive Features (TypeScript modules):**
- `src/scripts/audio.ts` - Shared audio player with single-instance playback, waveform visualization
- `src/scripts/drumMachine.ts` - Interactive drum pad system triggered by avatar click
- `src/scripts/site.ts` - Main orchestrator that initializes all interactive features
- `src/scripts/journal.ts` - Journal filtering and "read more" functionality
- `src/scripts/parallax.ts` - Smooth scrolling effects and background animations

**Styling Architecture:**
- `src/styles/tokens.css` - CSS custom properties (design system variables)
- `src/styles/base.css` - Typography, resets, and foundational styles
- `src/styles/components.css` - Component-specific styles
- `src/styles/layout.css` - Grid and layout systems
- Feature-specific CSS files: `drumMachine.css`, `mini-player.css`, `journal.css`

### Key Technical Patterns

**Audio System:**
- Single shared `HTMLAudioElement` instance prevents multiple tracks playing simultaneously
- Web Audio API integration for real-time frequency visualization on canvas elements
- Mini-player component appears when audio plays, with seek controls and current track info
- Play buttons use `data-audio` attribute and are bound via `bindPlayButtons()`

**Content-Driven Development:**
- All dynamic content is defined in `src/data/content.json`
- Astro components map over JSON data to generate sections
- Journal entries can be either JSON objects or separate MDX files in `src/content/journal/`

**Interactive Components:**
- Avatar click toggles drum machine visibility with lazy initialization
- Drum machine creates audio context on first interaction for Web Audio API compliance
- Journal entries support filtering by tags and expandable "read more" functionality
- Waveform visualizations are canvas-based with requestAnimationFrame loops

**TypeScript Module System:**
- Each feature has its own TypeScript module (audio, drumMachine, journal, etc.)
- `src/scripts/site.ts` imports and initializes all features on DOM ready
- Functions are exported/imported rather than using global variables
- Event listeners use `__bound` flag to prevent duplicate binding

### Development Workflow

**Adding New Audio Content:**
1. Add audio files to `public/audio/` or `public/assets/audio/`
2. Update `src/data/content.json` with new project/experiment including `audioUrl`
3. Audio player and waveform visualization will automatically bind to new buttons

**Adding Journal Entries:**
- Option 1: Add to `creativeJournal` array in `src/data/content.json`
- Option 2: Create new `.mdx` file in `src/content/journal/` with frontmatter

**Modifying Styles:**
- Edit design tokens in `src/styles/tokens.css` for global changes
- Component styles are organized in separate CSS files for maintainability
- Dark theme is the primary design with CSS custom properties for easy theming

**Firebase Deployment:**
- Site deploys to Firebase Hosting via `firebase deploy`
- Build output in `dist/` directory is automatically deployed
- Configuration in `firebase.json` and `.firebaserc`

### Performance Considerations

- Audio files are loaded with `preload="metadata"` to minimize initial bandwidth
- Waveform visualizations only initialize when audio plays (lazy loading)
- Canvas animations use `requestAnimationFrame` with proper cleanup
- Static site generation via Astro provides excellent initial page load performance

### Browser Compatibility

- Web Audio API requires HTTPS or localhost for security
- Audio playback requires user gesture activation (handled by click events)
- Modern ES2022 features used throughout TypeScript code
- PostCSS with Autoprefixer handles CSS compatibility
