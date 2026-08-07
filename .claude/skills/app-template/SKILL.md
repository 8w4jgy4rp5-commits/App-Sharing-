---
name: app-template
description: Starter file skeleton and boilerplate code for scaffolding a brand-new mini app under apps/{app-slug}/ — HTML structure, the safe localStorage read/write helper pattern, and base CSS variables. Use when creating the first version of a new mini app's files.
---

# App Template

Boilerplate to copy when starting a new mini app. Keeps every app consistent with platform-rules (security, storage keys) and ui-guidelines (visual style) without re-deriving them each time.

## File Skeleton

```text
apps/{app-slug}/
  index.html
  style.css
  script.js
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{App Name}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <header>
      <h1>{App Name}</h1>
      <p>{One-line description of what it does}</p>
    </header>

    <main>
      <!-- sections go here -->
    </main>

    <script src="script.js"></script>
  </body>
</html>
```

### "How to use" guide (standard for every app)

Every app includes a short usage guide, visible without scrolling, right after the header (before the main content). Use a native `<details>` so it needs no JS and is keyboard-accessible; leave it `open` by default so first-time users see it immediately, and it doubles as a place to note any non-obvious constraint (e.g. "only works during market hours") that would otherwise look like a bug.

```html
<details class="how-to-use" open>
  <summary>How to use this app</summary>
  <ol>
    <li>{Step 1}</li>
    <li>{Step 2}</li>
    <li>{...}</li>
  </ol>
</details>
```

```css
.how-to-use {
  margin: 16px 0 0;
  padding: 12px 16px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 10px;
  font-size: 13px;
}
.how-to-use summary { cursor: pointer; font-weight: 600; }
.how-to-use ol { margin: 10px 0 0; padding-left: 20px; line-height: 1.6; }
```

Keep it to a few short steps (English text, per ui-guidelines) — this is a quick orientation, not full documentation.

### script.js — safe localStorage helper pattern

Always parse defensively (per platform-rules) — this is the default pattern, don't write a bare `JSON.parse`:

```js
const STORAGE_KEY = '{appSlug}:{entity}:v1';

// Reads all items from localStorage; returns [] if missing or corrupted
function getItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
```

### style.css — base variables

```css
:root {
  --color-primary: #4a90e2;
  --color-text: #333;
  --color-muted: #888;
  --color-bg: #f5f5f5;
}

body {
  font-family: sans-serif;
  margin: 0;
  padding: 40px 20px;
  background-color: var(--color-bg);
  color: var(--color-text);
}

header, main {
  max-width: 680px;
  margin: 0 auto;
}
```

## Naming Conventions

- App slug: kebab-case, matches the folder name (e.g. `company-watchlist`).
- Storage key: `{appSlug-camelCase}:{entity}:v1` — bump the version suffix (`v2`, ...) if the stored data shape changes incompatibly.
- File names stay exactly `index.html`, `style.css`, `script.js` for every app, so tooling and habits stay predictable.
