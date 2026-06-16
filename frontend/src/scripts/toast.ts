const MAX_TOASTS = 3;

export function showToast(msg: string): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const existing = root.querySelectorAll<HTMLElement>('.toast');
  if (existing.length >= MAX_TOASTS) removeToast(existing[0]);

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.addEventListener('click', () => removeToast(el));
  root.appendChild(el);

  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('toast--visible')));

  setTimeout(() => removeToast(el), 3000);
}

function removeToast(el: HTMLElement): void {
  if (!el.isConnected) return;
  el.classList.remove('toast--visible');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}
