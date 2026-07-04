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

Keep the first version small — resist adding features beyond the MVP list without the user asking.

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
- UI text is English
- The user knows how to test it, and what the next small step is

For localStorage apps, test at minimum: add item, display item, reload page, search/filter (if present), delete item (if present), empty state, and mobile width.
