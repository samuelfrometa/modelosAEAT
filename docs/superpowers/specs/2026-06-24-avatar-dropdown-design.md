# Avatar Dropdown Design

**Date:** 2026-06-24
**Status:** Approved

## Overview

Add a dropdown menu to the avatar button in `AppLayout.astro`. Clicking the avatar reveals a panel with two navigation items: Perfil and Configuración. Clicking outside or on an item closes the panel.

## File changed

**`frontend/src/layouts/AppLayout.astro`** — only file touched.

## HTML structure

Wrap the existing `.avatar` button in a `<div class="avatar-wrap">` with `position: relative`. Add a hidden `<div id="avatar-menu" class="avatar-menu">` immediately after the button:

```html
<div class="avatar-wrap">
  <button class="avatar" id="btn-avatar">AB</button>
  <div id="avatar-menu" class="avatar-menu">
    <a href="/perfil" class="avatar-menu-item">
      <Icon name="user" size={15} /> Perfil
    </a>
    <a href="/configuracion" class="avatar-menu-item">
      <Icon name="settings" size={15} /> Configuración
    </a>
  </div>
</div>
```

Two new icons must be added to `Icon.astro` (`PATHS` object):
- `user`: `'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'`
- `settings`: `'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'`

## CSS (added to `frontend/src/styles/global.css`, at the end of the file)

```css
.avatar-wrap { position: relative; }

.avatar-menu {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--surface);
  border: var(--border-w) solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 160px;
  z-index: 50;
  overflow: hidden;
}

.avatar-menu.open { display: block; }

.avatar-menu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  font-family: inherit;
}

.avatar-menu-item:hover { background: var(--surface-2); }
```

## Script behaviour

- Remove the existing `showToast('Perfil')` handler on `#btn-avatar`.
- Replace with a toggle: `avatarMenu.classList.toggle('open')`.
- Add a `document` click listener that closes the menu when clicking outside `.avatar-wrap`.
- The logout button handler (`#btn-logout`) is unchanged.

## Constraints

- Routes `/perfil` and `/configuracion` do not need to exist — the links navigate there regardless.
- No new component file — all changes are in `AppLayout.astro`, `Icon.astro`, and `global.css`.
- CSS goes in `global.css` (the project pattern — AppLayout.astro has no `<style>` block, it imports the CSS file).
