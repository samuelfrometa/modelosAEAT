import { showToast } from './toast';

let currentStep = 0;

export function initWizard(): void {
  goToStep(0);
  wireStep0();
  wireStep2();
  wireStep3();
}

export function goToStep(n: number): void {
  currentStep = n;

  document.querySelectorAll<HTMLElement>('[data-step]').forEach(el => {
    el.style.display = el.dataset.step === String(n) ? '' : 'none';
  });

  const head = document.getElementById('wizard-head');
  if (head) head.style.display = n === 3 ? 'none' : '';

  document.querySelectorAll<HTMLElement>('[data-step-dot]').forEach(el => {
    const i = Number(el.dataset.stepDot);
    el.classList.toggle('active', i === n);
    el.classList.toggle('done', i < n);
    const dot = el.querySelector<HTMLElement>('.step-dot');
    if (dot) {
      if (i < n) {
        dot.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        dot.textContent = String(i + 1);
      }
    }
  });

  document.querySelectorAll<HTMLElement>('.step-line').forEach((line, i) => {
    line.classList.toggle('filled', i < n);
  });

  if (n === 1) startProcessing();
}

function wireStep0(): void {
  const dropzone = document.getElementById('dropzone');
  const filecardWrap = document.getElementById('filecard-wrap');

  dropzone?.addEventListener('click', () => {
    showToast('Subir archivo');
    if (dropzone) dropzone.style.display = 'none';
    if (filecardWrap) filecardWrap.style.display = '';
  });

  document.getElementById('btn-remove-file')?.addEventListener('click', () => {
    showToast('Archivo eliminado');
    if (dropzone) dropzone.style.display = '';
    if (filecardWrap) filecardWrap.style.display = 'none';
  });

  document.getElementById('btn-procesar')?.addEventListener('click', () => goToStep(1));

  document.getElementById('btn-salir')?.addEventListener('click', () => {
    window.location.href = '/dashboard';
  });
}

function wireStep2(): void {
  document.getElementById('btn-volver')?.addEventListener('click', () => goToStep(0));
  document.getElementById('btn-export')?.addEventListener('click', () => showToast('Exportar Markdown'));
  document.getElementById('btn-confirmar')?.addEventListener('click', () => goToStep(3));

  document.querySelectorAll<HTMLElement>('[data-tab-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tabBtn!;
      document.querySelectorAll('[data-tab-btn]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const pdfPanel = document.getElementById('tab-pdf');
      const mdPanel  = document.getElementById('tab-md');
      if (pdfPanel) pdfPanel.style.display = tab === 'pdf' ? '' : 'none';
      if (mdPanel)  mdPanel.style.display  = tab === 'md'  ? '' : 'none';
      showToast(`Ver: ${tab === 'pdf' ? 'PDF original' : 'Markdown'}`);
    });
  });

  document.querySelectorAll<HTMLInputElement>('[data-field-label]').forEach(input => {
    input.addEventListener('focus', () => showToast(`Editar casilla: ${input.dataset.fieldLabel}`));
  });
}

function wireStep3(): void {
  document.getElementById('btn-panel')?.addEventListener('click', () => {
    window.location.href = '/dashboard';
  });
  document.getElementById('btn-descargar')?.addEventListener('click', () => showToast('Descargar documento'));
  document.getElementById('btn-otro')?.addEventListener('click', () => {
    const dropzone     = document.getElementById('dropzone');
    const filecardWrap = document.getElementById('filecard-wrap');
    if (dropzone)     dropzone.style.display = '';
    if (filecardWrap) filecardWrap.style.display = 'none';
    goToStep(0);
  });
}

function startProcessing(): void {
  const rows     = Array.from(document.querySelectorAll<HTMLElement>('[data-pipe-row]'));
  const progress = document.getElementById('proc-progress');
  const total    = rows.length;

  rows.forEach(row => {
    row.className = 'pipe-row';
    const ico    = row.querySelector<HTMLElement>('[data-pipe-ico]');
    const detail = row.querySelector<HTMLElement>('.pipe-detail');
    if (ico)    setIcoIdle(ico);
    if (detail) detail.style.display = 'none';
  });
  if (progress) progress.style.width = '0%';

  let step = 0;

  function tick(): void {
    if (step >= total) return;
    const curr   = rows[step];
    const ico    = curr.querySelector<HTMLElement>('[data-pipe-ico]');
    const detail = curr.querySelector<HTMLElement>('.pipe-detail');
    curr.classList.add('active');
    if (ico)    setIcoSpin(ico);
    if (detail) detail.style.display = '';
    if (progress) progress.style.width = `${Math.round(((step + 1) / total) * 100)}%`;

    const delay = step === 0 ? 900 : 1050;
    step++;
    setTimeout(advance, delay);
  }

  function advance(): void {
    const prev = rows[step - 1];
    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('done');
      const ico = prev.querySelector<HTMLElement>('[data-pipe-ico]');
      if (ico) setIcoDone(ico);
    }
    if (step >= total) {
      if (progress) progress.style.width = '100%';
      setTimeout(() => goToStep(2), 650);
    } else {
      tick();
    }
  }

  tick();
}

function setIcoIdle(el: HTMLElement): void {
  el.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="4"/></svg>';
}

function setIcoSpin(el: HTMLElement): void {
  el.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spinSlow 1.1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
}

function setIcoDone(el: HTMLElement): void {
  el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
}
