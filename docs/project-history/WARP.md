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
- **Test music tools dashboard: Navigate to `/tools` to see animated tool cards and navigation**
- **Test Key Friend: Go to `/tools/key-friend` or click "Launch Tool" from dashboard**
- **Test Scale Explorer: Go to `/tools/scale-explorer` or click "Launch Tool" from dashboard**
- **Test scale visualizations: Switch between keyboard, fretboard, and circle modes in Scale Explorer**
- **Test scale finder: Select notes in Scale Explorer to find matching scales**

## Architecture Overview

This is an **Astro + TypeScript** music portfolio site with interactive audio features and modular TypeScript scripts, built as a **monorepo** with shared packages.

### Monorepo Structure

**Apps:**
- `apps/website/` - Main Astro website application

**Packages:**
- **`packages/music-tools/` - Core music theory engine with Key Friend and Scale Explorer classes**
- `packages/audio-engine/` - Web Audio API abstractions and utilities
- `packages/design-system/` - Shared design tokens and CSS utilities
- `packages/shared-types/` - TypeScript type definitions

**Key Benefits:**
- **Shared music theory logic** between potential future apps (mobile, desktop, etc.)
- **Type safety** across package boundaries with TypeScript project references
- **Clean separation** between business logic (packages) and presentation (apps)
- **Independent versioning** and development of core functionality

### Project Structure

**Core Astro Setup:**
- `src/pages/index.astro` - Main homepage with all content sections
- `src/pages/tools.astro` - **Music tools dashboard with animated tool cards**
- `src/pages/tools/key-friend.astro` - **Individual Key Friend tool page**
- `src/pages/tools/scale-explorer.astro` - **Individual Scale Explorer tool page**
- `src/layouts/base.astro` - Base layout with meta tags, fonts, and global scripts
- `src/components/` - Reusable Astro components (AudioPlayer, DrumMachine, JournalList, etc.)

**Content Management:**
- `src/data/content.json` - Single source of truth for all site content (projects, experiments, journal entries)
- `src/content/journal/` - MDX files for detailed journal posts (configured via `content.config.ts`)

**Interactive Features (TypeScript modules):**
- `src/scripts/audio.ts` - Shared audio player with single-instance playback, waveform visualization
- `src/scripts/drumMachine.ts` - Interactive drum pad system triggered by avatar click
- **`src/scripts/keyFriend.ts` - Key Friend chord progression explorer (client-side wrapper)**
- **`src/scripts/scaleExplorer.ts` - Scale Explorer with multiple visualization modes (client-side wrapper)**
- `src/scripts/site.ts` - Main orchestrator that initializes all interactive features
- `src/scripts/journal.ts` - Journal filtering and "read more" functionality
- `src/scripts/parallax.ts` - Smooth scrolling effects and background animations

**Styling Architecture:**
- `src/styles/tokens.css` - CSS custom properties (design system variables)
- `src/styles/base.css` - Typography, resets, and foundational styles
- `src/styles/components.css` - Component-specific styles
- `src/styles/layout.css` - Grid and layout systems
- **`src/styles/keyFriend.css` - Key Friend tool styling with chord card animations**
- **`src/styles/scaleExplorer.css` - Scale Explorer comprehensive styling (keyboard, fretboard, circle modes)**
- **`src/styles/toolPages.css` - Tool pages navigation and layout styles**
- Feature-specific CSS files: `drumMachine.css`, `mini-player.css`, `journal.css`, `mobile.css`

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
- **Music Tools Dashboard with animated tool cards, hover effects, and smooth navigation**
- **Key Friend tool with interactive chord progression builder and key selection**
- **Scale Explorer with 3 visualization modes (keyboard, fretboard, circle of fifths)**
- **Scale Explorer supports 14 scale types: major modes, pentatonic, blues, minor variations, exotic scales**
- **Scale Finder feature to discover scales containing specific notes**
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

**Working with Music Tools:**
- **Core functionality lives in `packages/music-tools/` package with TypeScript classes**
- **Client-side wrappers in `src/scripts/` import from the music-tools package**
- **Individual tool pages in `src/pages/tools/` for focused experiences**
- **Dashboard at `src/pages/tools.astro` orchestrates navigation between tools**
- **CSS for tools is modular: `keyFriend.css`, `scaleExplorer.css`, `toolPages.css`**

**Adding New Scales to Scale Explorer:**
1. Add scale intervals to `SCALE_INTERVALS` in `packages/music-tools/src/theory.ts`
2. Add scale metadata to `SCALE_INFO` with description and related chords
3. Update the `ScaleType` type union to include new scale
4. Rebuild the music-tools package with `npm run build`

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
- **Music tools use code splitting - each tool loads independently (Key Friend ~10KB, Scale Explorer ~17KB gzipped)**
- **Scale visualizations (keyboard, fretboard, circle) render efficiently with optimized DOM updates**
- **Music theory calculations are optimized for real-time interaction**
- Canvas animations use `requestAnimationFrame` with proper cleanup
- Static site generation via Astro provides excellent initial page load performance
- **Dashboard animations use CSS transforms for 60fps performance**

### Browser Compatibility

- Web Audio API requires HTTPS or localhost for security
- Audio playback requires user gesture activation (handled by click events)
- Modern ES2022 features used throughout TypeScript code
- PostCSS with Autoprefixer handles CSS compatibility
