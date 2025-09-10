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
- **Test Chord Finder: Go to `/tools/chord-finder` or click "Launch Tool" from dashboard**
- **Test scale visualizations: Switch between keyboard, fretboard, and circle modes in Scale Explorer**
- **Test scale finder: Select notes in Scale Explorer to find matching scales**
- **Test enhanced tooltips: Hover over interactive elements to see context-aware help and music theory information**
- **Test about page enhancements: Visit `/about` to see improved image effects and visual design**

## Architecture Overview

This is an **Astro + TypeScript** music portfolio site with interactive audio features and modular TypeScript scripts, built as a **monorepo** with shared packages.

### Monorepo Structure

**Apps:**
- `apps/website/` - Main Astro website application

**Packages:**
- **`packages/music-tools/` - Core music theory engine with Key Friend, Scale Explorer, and Chord Finder classes**
- `packages/audio-engine/` - Web Audio API abstractions and utilities
- `packages/design-system/` - Shared design tokens, CSS utilities, and component styles
- `packages/shared-components/` - Reusable UI components and TypeScript modules
- `packages/shared-types/` - TypeScript type definitions and interfaces

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
- **`src/scripts/chordFinder.ts` - Chord Finder identification tool (client-side wrapper)**
- **`src/scripts/helpPanel.ts` - Shared help panel system with TypeScript classes and type safety**
- **`src/scripts/tooltips.ts` - Enhanced tooltip system with music theory context and intelligent positioning**
- **`src/scripts/aboutImageEnhancer.ts` - About page image enhancement with particle effects and interactions**
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

**TypeScript-First Development:**
- **All interactive JavaScript should be written in TypeScript** (.ts files) that compiles to JavaScript
- Each feature has its own TypeScript module with proper type definitions
- `src/scripts/site.ts` imports and initializes all features on DOM ready
- Functions are exported/imported rather than using global variables
- Event listeners use `__bound` flag to prevent duplicate binding
- **Class-based architecture** for complex UI components (HelpPanelManager, ChordFinder, etc.)
- **Interface definitions** for configuration objects and API contracts
- **Type safety** enforced across all interactive components

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
- **Shared UI components (like piano keyboard) are defined in `packages/design-system/css/components.css`**

**Adding New Scales to Scale Explorer:**
1. Add scale intervals to `SCALE_INTERVALS` in `packages/music-tools/src/theory.ts`
2. Add scale metadata to `SCALE_INFO` with description and related chords
3. Update the `ScaleType` type union to include new scale
4. Rebuild the music-tools package with `npm run build`

**Working with Shared Piano Keyboard Component:**
1. **HTML Structure:** All tools using piano keyboard must use this exact structure:
   ```html
   <div class="keyboard">
     <div class="white-keys">[white key buttons]</div>
     <div class="black-keys">[black key buttons]</div>
   </div>
   ```
2. **CSS Classes:** Use these exact class names for consistent styling:
   - `.keyboard` - Main container with glassmorphism background
   - `.white-keys` - Flexbox container for white keys
   - `.black-keys` - Absolute positioned container for black keys
   - `.key`, `.white-key`, `.black-key` - Individual key styling
   - `.selected`, `.in-scale`, `.root-note` - State classes for highlighting
3. **Black Key Positioning:** Uses percentage-based positioning (10.7%, 25%, 53.6%, 67.9%, 82.1%) for accurate piano layout
4. **Data Attributes:** Use `data-note="C#"` etc. for JavaScript event handling and CSS targeting
5. **Responsive Behavior:** Automatically adjusts key sizes and spacing on mobile devices

**Working with Shared Help Panel System:**
1. **TypeScript Class:** Import and use `HelpPanelManager` from `src/scripts/helpPanel.ts`
   ```typescript
   import { createHelpPanel } from '../../scripts/helpPanel';
   const helpPanel = createHelpPanel();
   helpPanel.init();
   ```
2. **HTML Structure:** All tools must include these exact elements:
   ```html
   <!-- Floating help button -->
   <button id="help-toggle" class="floating-help-btn" aria-expanded="false">
     <span class="help-icon">❓</span><span class="help-text">Help</span>
   </button>
   
   <!-- Help panel -->
   <div id="help-panel" class="help-panel">
     <div class="help-panel-header">...</div>
     <div class="help-panel-content">...</div>
   </div>
   
   <!-- Overlay -->
   <div id="help-overlay" class="help-overlay"></div>
   ```
3. **CSS Classes:** All styling handled by shared design system in `components.css`:
   - `.floating-help-btn` - Fixed positioned help button with gradient styling
   - `.help-panel` - Slide-in panel from right side
   - `.help-overlay` - Backdrop overlay with blur effect
   - `.help-section-item` - Individual help content sections
4. **Consistent Content Structure:** Use standardized help content layout:
   - Tool-specific instructions with emoji headers
   - Example interactions (chords, progressions, scales)
   - Keyboard shortcuts and tips
5. **Analytics Integration:** Automatic Google Analytics tracking for help panel usage

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

### Common Pitfalls and Lessons Learned

**Keyboard Component Integration Issues:**
- **Problem:** New tools (like Chord Finder) often implement their own keyboard styling, leading to inconsistent appearance and positioning bugs
- **Solution:** Always use the shared keyboard component in `packages/design-system/css/components.css`
- **Key Lesson:** When copying keyboard structure from one tool to another, ensure both HTML structure and CSS class names match exactly
- **Black Key Positioning:** Must use percentage-based positioning (`left: 7.14%` etc.) rather than pixel calculations for responsive behavior

**Design System Consistency:**
- **Problem:** Each tool implementing its own version of common UI components
- **Solution:** Establish shared components in design system package first, then consume in tools
- **Pattern:** When adding a new tool, identify reusable UI patterns and extract them to the design system
- **Glassmorphism Theme:** All tools should use consistent blur effects, transparencies, and color schemes from CSS custom properties

**Tool Development Workflow:**
1. **Start with Design System:** Before building tool-specific styles, check if shared components exist
2. **Copy Proven Patterns:** Use working tools (like Scale Explorer) as reference for keyboard, button, and layout patterns
3. **TypeScript First:** Write all interactive code in TypeScript with proper interfaces and type definitions
4. **Shared Components:** Extract reusable UI logic into TypeScript classes (like HelpPanelManager)
5. **Test Across Tools:** Ensure new shared components work in all existing tools
6. **Mobile-First:** Always test responsive behavior, especially for interactive components like keyboards

**TypeScript Development Best Practices:**
1. **Never write JavaScript inline in .astro files** - Always use separate .ts files
2. **Define interfaces** for all configuration objects and API contracts
3. **Use classes** for stateful UI components (modals, panels, interactive widgets)
4. **Export factory functions** for easy component instantiation (`createHelpPanel()`, `createChordFinder()`)
5. **Include proper error handling** with type guards and null checks
6. **Add JSDoc comments** for public methods and complex logic
7. **Use strict TypeScript config** - all `any` types should be avoided
8. **Import/export pattern:** Prefer named exports over default exports for better tree-shaking

### Browser Compatibility

- Web Audio API requires HTTPS or localhost for security
- Audio playback requires user gesture activation (handled by click events)
- Modern ES2022 features used throughout TypeScript code
- PostCSS with Autoprefixer handles CSS compatibility
