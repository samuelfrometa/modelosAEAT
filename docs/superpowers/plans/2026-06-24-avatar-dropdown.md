# Avatar Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dropdown menu to the avatar button with links to Perfil and Configuración.

**Architecture:** Single task — three tightly coupled files change together. HTML wrapper + menu in AppLayout.astro, two new icon paths in Icon.astro, dropdown CSS in global.css.

**Tech Stack:** Astro 6, vanilla JS, CSS custom properties

## Global Constraints

- CSS goes in `frontend/src/styles/global.css`, not in a `<style>` block in AppLayout.astro
- All colours and spacing use CSS tokens (`var(--surface)`, `var(--line)`, `var(--shadow-lg)`, `var(--radius)`, `var(--surface-2)`, `var(--ink)`, `var(--border-w)`)
- Do not commit — user controls all commits
- Verify build: `cd frontend && pnpm build` must succeed with no errors

---

### Task 1: Avatar dropdown

**Files:**
- Modify: `frontend/src/components/Icon.astro` — add `user` and `settings` icon paths
- Modify: `frontend/src/styles/global.css` — add dropdown CSS at end of file
- Modify: `frontend/src/layouts/AppLayout.astro` — wrap avatar, add menu HTML, update script

---

- [ ] **Step 1: Add `user` and `settings` icons to Icon.astro**

In `frontend/src/components/Icon.astro`, add two entries to the `PATHS` object after the `logOut` entry:

```js
  logOut:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
```

- [ ] **Step 2: Add dropdown CSS to global.css**

Append at the very end of `frontend/src/styles/global.css`:

```css
/* ============ AVATAR DROPDOWN ============ */
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

- [ ] **Step 3: Update AppLayout.astro HTML**

Replace this section in `frontend/src/layouts/AppLayout.astro`:

```html
      <button class="avatar" id="btn-avatar">{MOCK_USER.initials}</button>
```

With:

```html
      <div class="avatar-wrap">
        <button class="avatar" id="btn-avatar">{MOCK_USER.initials}</button>
        <div id="avatar-menu" class="avatar-menu">
          <a href="/perfil" class="avatar-menu-item">
            <Icon name="user" size={15} />Perfil
          </a>
          <a href="/configuracion" class="avatar-menu-item">
            <Icon name="settings" size={15} />Configuración
          </a>
        </div>
      </div>
```

- [ ] **Step 4: Update the script in AppLayout.astro**

Replace this line in the `<script>` block:

```js
  document.getElementById('btn-avatar')?.addEventListener('click', () => showToast('Perfil'));
```

With:

```js
  const avatarBtn = document.getElementById('btn-avatar');
  const avatarMenu = document.getElementById('avatar-menu');

  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu?.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!avatarBtn?.closest('.avatar-wrap')?.contains(e.target as Node)) {
      avatarMenu?.classList.remove('open');
    }
  });
```

- [ ] **Step 5: Verify build succeeds**

```bash
cd /home/selnull/projects/modelosAEAT/frontend
pnpm build
```

Expected: build completes with no errors. If there are TypeScript errors, fix them before proceeding.
