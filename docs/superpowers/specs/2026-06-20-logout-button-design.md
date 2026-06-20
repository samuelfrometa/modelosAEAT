# Logout Button Design

**Date:** 2026-06-20
**Status:** Approved

## Overview

Add a logout button next to the avatar button in the app's top navigation bar (`AppLayout.astro`). Clicking it clears the stored JWT tokens and redirects the user to `/login`.

## Change

**File:** `frontend/src/layouts/AppLayout.astro`

Add a logout button immediately before the existing `<button class="avatar">`. The button uses the existing `navlink` class so it inherits the appbar's button styling without extra CSS. An arrow-right icon (`→`) serves as the visual indicator.

In the `<script>` block, add a click handler that:
1. Removes `access` and `refresh` from `localStorage`
2. Redirects to `/login`

## Behaviour

- Tokens cleared: `localStorage.removeItem("access")` and `localStorage.removeItem("refresh")`
- Redirect: `window.location.href = "/login"`
- No confirmation dialog — logout is immediate
- Works without any backend call (tokens are simply discarded client-side)
