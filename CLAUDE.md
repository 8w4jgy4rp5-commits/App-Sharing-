# Project Rules

- Always communicate with the user in natural Japanese. All application UI must be in English.
- The user is a beginner programmer — explain changes simply and in small steps (see beginner-guide skill).
- Before editing files, explain what will change and why, then wait for approval (see mini-app-builder skill).
- Don't modify the platform root (`index.html` / `style.css` / `script.js`) unless integration is explicitly requested (see platform-rules skill).
- Mini apps live under `apps/{app-slug}/` (index.html, style.css, script.js).
- Keep output concise; don't restate unchanged code (see token-optimizer skill).

## Skill Map

| Task | Skill |
|---|---|
| Building or extending a mini app (entry point) | mini-app-builder |
| Project structure, security, localStorage, git rules | platform-rules |
| Visual design, responsiveness, accessibility | ui-guidelines |
| Concrete colors/spacing/component patterns to reuse | ui-format |
| Scaffolding a brand-new app's files | app-template |
| Fixing a bug / investigating an error | debugging |
| How to phrase explanations to the user | beginner-guide |
| Keeping responses/tool use lean | token-optimizer |

mini-app-builder is the usual starting point for build tasks; it references the others by name instead of duplicating their rules.
