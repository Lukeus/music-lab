# Astro Migration Patch Plan — `music-site`

This document contains **copy‑paste ready** commands and file stubs to migrate the existing HTML/CSS/JS site to an **Astro + Vite + TypeScript** app with minimal friction.

> **Goal:** Keep your current CSS tokens and vanilla JS, progressively componentize the audio player and journal widgets, and ship a production build with CI/CD.

---

## 0) Prereqs

- Node 20+ (or 22+)
- PNPM or NPM (examples show `npm`)
- GitHub repo connected (already true for `music-site`)

---

## 1) Scaffold Astro (in-place)

From the repo root:

```bash
# stay in the existing repo folder
npm create astro@latest -- --template minimal
# Answer the prompts:
#  - Typescript: Yes (Strict)
#  - ESLint/Prettier: Yes
#  - Add example files: No
npm i
```

This creates:

```
astro.config.mjs
package.json
tsconfig.json
src/
  pages/
    index.astro
public/
```

> If you want to keep your current static site while migrating, create an `astro/` subfolder instead and run the same command inside it.

---

## 2) Bring over styles and assets

1) Create styles:

```
src/styles/tokens.css      # your CSS variables (copy from :root in your site)
src/styles/base.css        # resets, typography, layout
src/styles/components.css  # buttons, cards, player, etc.
```

Paste your current tokens into `src/styles/tokens.css`:

```css
:root {
  --bg: #0B0F14;
  --bg-elev: #121821;
  --text: #EAF2FF;
  --muted: #A9B6CC;
  --accent: #7CD2FF;
  --accent-2: #A3FFB0;

  --bg-dark: var(--bg);
  --bg-secondary: var(--bg-elev);
  --text-primary: var(--text);
  --text-secondary: var(--muted);
  --accent-secondary: var(--accent);
}
```

2) Move images, icons, and audio to `public/` (they’ll be served at `/<name>`).

---

## 3) Convert your HTML → `index.astro`

Open `src/pages/index.astro` and replace with your current page HTML, then import the styles at the top:

```astro
---
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/components.css";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lukeus Music Lab | Experimental Sound &amp; Creative Process</title>
  </head>
  <body>
    <!-- Paste your existing body markup here -->
  </body>
</html>
```

> You can keep your class names as-is. No framework rewrite is required.

---

## 4) Modularize your JS (vanilla + TS)

Create `src/scripts/` and split utilities:

```
src/scripts/
  audio.ts
  dom.ts
  journal.ts
```

Example `audio.ts` with a single shared Audio element and “only one track at a time” behavior:

```ts
let currentAudio: HTMLAudioElement | null = null;
let currentButton: HTMLElement | null = null;

export function initSharedAudio() {
  if (!currentAudio) {
    currentAudio = new Audio();
    currentAudio.preload = "metadata";
    currentAudio.addEventListener("ended", () => {
      if (currentButton) {
        currentButton.dataset.state = "paused";
        currentButton = null;
      }
    });
  }
  return currentAudio!;
}

export function bindPlayButtons(selector = "[data-audio]") {
  const audio = initSharedAudio();
  document.querySelectorAll<HTMLElement>(selector).forEach(btn => {
    if ((btn as any).__bound) return;
    (btn as any).__bound = true;

    btn.addEventListener("click", async () => {
      const src = btn.dataset.audio!;
      if (!src) return;

      // swap source if this is a different track
      if (audio.src !== new URL(src, location.origin).href) {
        audio.pause();
        audio.src = src;
      }

      // toggle
      if (audio.paused || currentButton !== btn) {
        try {
          await audio.play();
          if (currentButton && currentButton !== btn) {
            currentButton.dataset.state = "paused";
          }
          btn.dataset.state = "playing";
          currentButton = btn;
        } catch (e) {
          console.warn(e);
          alert("Tap to enable audio");
        }
      } else {
        audio.pause();
        btn.dataset.state = "paused";
      }
    });
  });
}
```

In your page, load it as an ESM script:

```astro
<script type="module">
  import { bindPlayButtons } from "../scripts/audio.ts";
  window.addEventListener("DOMContentLoaded", () => bindPlayButtons());
</script>
```

> Keep other features like “Read more” and filters in `journal.ts` and `dom.ts` with the same pattern: no globals, export functions, bind once.

---

## 5) PostCSS + Autoprefixer

```bash
npm i -D postcss autoprefixer
```

Create `postcss.config.cjs`:

```js
module.exports = { plugins: { autoprefixer: {} } };
```

---

## 6) Strict TypeScript & ESLint

In `tsconfig.json`, ensure:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "types": ["vite/client"]
  }
}
```

Add ESLint:

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

`.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/", "node_modules/"]
};
```

---

## 7) PWA (optional)

```bash
npm i -D @vite-pwa/astro
```

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import { VitePWA } from "@vite-pwa/astro";

export default defineConfig({
  integrations: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Lukeus Music Lab",
        short_name: "Music Lab",
        start_url: "/",
        display: "standalone",
        background_color: "#0B0F14",
        theme_color: "#0B0F14",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
```

---

## 8) Build and preview

```bash
npm run build
npm run preview
```

The static output lands in `dist/`.

---

## 9) GitHub Action for deploy (Azure Static Web Apps)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          app_location: "/"
          output_location: "dist"
```

Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in your repo settings.

---

## 10) Optional: MD/MDX for Journal

```bash
npm i -D @astrojs/mdx
```

In `astro.config.mjs`:

```js
import mdx from "@astrojs/mdx";
export default defineConfig({ integrations: [mdx()] });
```

Create `src/content/journal/*.mdx` and map them to a `JournalList.astro` component.

---

## 11) Quick Health Checklist

- [ ] Page renders with your CSS tokens
- [ ] Audio buttons control a single shared player
- [ ] “Read more” and filters are bound once (no duplicate listeners)
- [ ] Lighthouse ≥ 95 for Performance/Best Practices/SEO
- [ ] No console errors in dev or preview
- [ ] CI deploys on push to `main`

---

## Appendix: Minimal CSS/HTML hooks

**Button markup expected by `bindPlayButtons`:**
```html
<button class="play" data-audio="/audio/track1.mp3" data-state="paused" aria-label="Play/Pause">▶</button>
```

**State styling:**
```css
.play[data-state="playing"] { /* show pause icon */ }
.play[data-state="paused"]  { /* show play icon  */ }
```

---

**Need me to also stub the actual files (`index.astro`, `audio.ts`, styles, workflow) as a ready-to-commit patch?** Say “generate file stubs” and I’ll produce a patch you can apply.
