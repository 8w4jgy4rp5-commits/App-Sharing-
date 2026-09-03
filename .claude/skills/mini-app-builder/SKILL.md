---
name: mini-app-builder
description: Use when creating a new mini app or adding a significant feature to an existing one under apps/. Orchestrates the planning checklist and the before/after coding workflow (explain → approve → code → summarize). This is the entry point for mini app build work — also invoke platform-rules, ui-guidelines, and app-template alongside it.
---

# Mini App Builder

Entry point for building or extending a mini app. This skill owns the *workflow*; it delegates specifics to sibling skills:

- Project structure, security, storage keys → **platform-rules**
- Visual design, responsiveness, accessibility → **ui-guidelines**
- Starter file skeleton / boilerplate → **app-template** (new apps only)
- Fixing bugs found along the way → **debugging**
- Communication style with the user → **beginner-guide**
- Keeping output lean → **token-optimizer**

When a task clearly needs one of those, invoke it via the Skill tool alongside this one rather than re-deriving its rules here.

## Mini App Planning Checklist

Before creating a new mini app, define:

1. App name and app slug
2. Target users
3. Problem it solves (and which request it answers, if any — see platform-rules' request-to-app principle)
4. MVP features for this first version
5. Features intentionally not included yet
6. Files to create or modify
7. localStorage key name (see app-template's naming convention)
8. How to test it
9. Usage guide — a short in-app help/about section explaining what the app does and how to use it (see ui-guidelines' standard features checklist). Build this **with the first version**, not tacked on later.

Keep the first version small — resist adding features beyond the MVP list without the user asking.

## Choosing the Look — Show, Don't Assume

The look of a new app is the user's call, not yours. Reaching for the CobbleWorks
palette every time is what makes forty apps look like one app.

So for a **new app** (not a small change to an existing one), before writing the
real `style.css`:

1. Work out what the one screen needs — the fields, the list, the buttons.
2. Write one throwaway HTML file in the scratchpad that draws that same screen
   **three times, side by side**, one per visual direction. Use the app's real
   labels and sample rows, never lorem ipsum.
3. Make the three genuinely different. Vary the palette, the type (system
   stacks only — serif vs sans vs monospace; mini apps load no web fonts), the
   corner radius (sharp / soft / pill), the density (airy / compact), and what
   carries the structure (hairline borders / soft shadows / flat blocks of
   colour). Three shades of one idea is not a choice.
4. Name each one and say how it should feel in one line — e.g.
   「1. ノート — クリーム色の紙、セリフ体の見出し、手描きのチェック」.
5. **Render it and send the picture.** Screenshot it with Chromium/Playwright at
   a phone width and send it with `SendUserFile`, then ask which number.
   Describing the three in words is not enough — a beginner cannot picture the
   difference from prose. Say that 「2番、でも色は3番」 is a fine answer.
6. Write the real `style.css` only after the user has answered.

If the user says they do not mind, pick the direction that suits the problem —
a budget tracker and a bedtime reminder should not look alike — and say which
one you picked and why.

`ui-format` is one of the three options, not the automatic default. Keep the
site-wide rules from `ui-guidelines` (tap-target sizes, 16px form text,
contrast, empty states) in **all three** directions — those are usability, not
taste, and are never up for a vote.

## Workflow Before Coding

Before making changes, briefly explain (in Japanese, per beginner-guide):

- The goal of the change
- Why the change is necessary
- Which files will be created or modified
- Any terminal commands needed

Then wait for the user's approval before editing files. Do not make large changes without confirmation.

## Workflow After Coding

After coding, briefly summarize (in Japanese):

- Files changed
- What was implemented
- How to run it
- How to test it
- What the next small step should be

## Definition of Done

A mini app task is done only when:

- The app opens in the browser with no console errors
- The main user flow works end-to-end
- Data persists after reload (if using localStorage)
- Empty state and basic validation both work (see ui-guidelines)
- For a new app, the visual direction was **chosen by the user from three
  rendered options** (see "Choosing the Look"), not defaulted to `ui-format`
- A usage guide is present (see Planning Checklist item 9)
- UI text is English
- `node tools/seo.js` has been run, so the new app gets its search description,
  canonical URL, share card and CobbleWorks footer, and joins `apps.html` and
  `sitemap.xml`. The script reads the app's own `<title>` and its subtitle
  paragraph — if the app has no usable subtitle, add one to
  `DESCRIPTION_OVERRIDES` in that script instead of leaving it blank
- The user knows how to test it, and what the next small step is

For localStorage apps, test at minimum: add item, display item, reload page, search/filter (if present), delete item (if present), empty state, and mobile width.
