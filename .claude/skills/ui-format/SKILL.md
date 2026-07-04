---
name: ui-format
description: Concrete visual design tokens (colors, spacing, shadows, typography) and component patterns (card, form, button, badge, star rating) extracted from the Mini App Platform's base UI. Use as the default look when styling a new mini app or the platform itself, so every screen shares one visual language. Pairs with ui-guidelines (abstract principles) and app-template (starter markup).
---

# UI Format

The concrete style tokens and component patterns behind the Mini App Platform's UI. `ui-guidelines` says *what* qualities a screen should have (responsive, accessible, minimal); this skill gives the *actual values* to reuse so new screens look like they belong to the same app.

## Color Palette

| Role | Value | Used for |
|---|---|---|
| Page background | `#f5f5f5` | `body` |
| Surface / card background | `#fff` | cards, form panels |
| Body text | `#333` | default text |
| Secondary text | `#666` | subheading/intro text |
| Muted label text | `#888` | small labels, captions |
| Faint text | `#aaa` | dates, footnotes |
| Border (default) | `#ccc` | input borders |
| Border (divider) | `#f0f0f0` | thin section separators inside a card |
| Primary accent (blue) | `#4a90e2` (hover `#357abd`) | primary actions, links, one content type |
| Primary accent tint | `rgba(74,144,226,0.15)` / `#eef4fc` | focus ring / hover background for blue elements |
| Secondary accent (green) | `#34c759` | a second, distinct content type (e.g. submitted apps vs. requests) |
| Secondary accent tint | `#f0faf3` (hover `#d6f5e0`) | background for green badges/links |
| Rating gold | `#f5a623` | star ratings only |

Pattern: pick one accent color per distinct "kind of thing" on the page (e.g. requests = blue, apps = green) and reuse it consistently for that kind's links, badges, and left-border accents.

## Typography

- `font-family: sans-serif` throughout, no custom font loading.
- Page title (`h1`): 28px, bold by default, margin-bottom 4px.
- Section heading (`h2`): 20px, margin-bottom 16px.
- Body/card text: default size (~15-16px), `line-height: 1.5`.
- Small labels (`.card-label`): 12px, bold, `text-transform: uppercase`, color `#888`.
- Helper text under form labels (`small`): 13px, color `#888`.
- Faint metadata (dates): 12px, color `#aaa`.

## Spacing Scale

Use these increments consistently instead of arbitrary values: **4, 8, 12, 16, 20, 24, 40px**.

- Tight gaps (icon+text, inline groups): 4-8px
- Element-to-element inside a component (label→input, card internal spacing): 12-16px
- Component internal padding (card, form panel): 20-24px
- Section-to-section gaps (margin-bottom on major sections): 40px
- Page margin: `40px 20px`, content max-width `680px`, centered (`margin: 0 auto`)

## Shape & Elevation

- Border radius: 6px for inputs/buttons/badges, 8px for cards and panels.
- Card/panel shadow: `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` — one soft, low shadow, never stacked or darker.
- No borders on cards — separation comes from the shadow + white-on-gray contrast against the `#f5f5f5` page background.

## Component Patterns

**Form group** — repeatable unit for every input:
```
<div class="form-group">
  <label for="id">Label</label>
  <small>One-line hint about what to enter</small>
  <input id="id" placeholder="e.g. concrete example" required />
</div>
```
Inputs/textareas/selects: full width, `padding: 10px 12px`, 1px `#ccc` border, 6px radius, blue border on focus (no shadow needed on inputs, unlike the search bar).

**Card** — repeatable unit for a list item:
- White background, 8px radius, 20px padding, soft shadow, 16px margin-bottom.
- Optional 4px colored left border (`border-left`) to mark which "kind" of card it is.
- Internal structure: title/accent line → repeated (label → text) pairs → thin `#f0f0f0` top-border divider before footer areas (metadata, actions, linked items).

**Primary button**: filled accent color, white text, no border, `padding: 12px 24px`, 6px radius, darker shade on hover, `cursor: pointer`.

**Secondary/outline button**: white background, accent-colored border and text, tinted background on hover (e.g. `.want-btn`).

**Badge / pill link**: small tinted-background chip with accent-colored bold text, 4px radius, used for cross-links between items (e.g. `.linked-app-link`).

**Star rating**: gold (`#f5a623`) filled/outline stars (★/☆), an average row (rounded average + "X.X (N ratings)" / "No ratings yet") above an interactive rate row that highlights on hover and commits on click.

**Search input**: full-width, larger padding (`12px 16px`), 16px font, and — unlike other inputs — gets a visible focus glow (`box-shadow: 0 0 0 3px` of the accent tint) since it's the primary page-level action.

## Empty / Search States

Every list has both:
- A "nothing here yet" message when the list is genuinely empty (encourage the first action).
- A distinct "no results found" message when a search query filters everything out.

## When to Deviate

These are defaults for visual consistency across the platform, not hard rules — deviate when a mini app's purpose genuinely calls for a different accent color or layout, but keep the spacing scale, shadow style, and radius values unless there's a specific reason not to.
