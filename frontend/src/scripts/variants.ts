const VALID = ['sereno', 'calido', 'estructurado'] as const;
type Variant = typeof VALID[number];

export function setVariant(v: Variant): void {
  document.documentElement.dataset.variant = v;
  localStorage.setItem('variant', v);
  syncButtons(v);
}

export function initVariants(): void {
  const current = (document.documentElement.dataset.variant ?? 'sereno') as Variant;
  syncButtons(current);

  document.querySelectorAll<HTMLButtonElement>('[data-variant-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.variantBtn as Variant;
      if (VALID.includes(v)) setVariant(v);
    });
  });
}

function syncButtons(v: Variant): void {
  document.querySelectorAll<HTMLButtonElement>('[data-variant-btn]').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.variantBtn === v);
  });
}
