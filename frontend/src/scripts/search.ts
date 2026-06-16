export function initSearch(): void {
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  const empty = document.getElementById('doc-empty');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    let anyVisible = false;

    document.querySelectorAll<HTMLElement>('[data-doc-row]').forEach(row => {
      const name    = (row.dataset.docName    ?? '').toLowerCase();
      const concept = (row.dataset.docConcept ?? '').toLowerCase();
      const visible = !q || name.includes(q) || concept.includes(q);
      row.style.display = visible ? '' : 'none';
      if (visible) anyVisible = true;
    });

    if (empty) empty.style.display = anyVisible ? 'none' : '';
  });
}
