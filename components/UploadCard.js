/**
 * UploadCard.js
 * -----------------------------------------------------------------------
 * Um único componente reaproveitado para os 4 cards de upload (Agendadas,
 * Não Agendadas, Eventos/Genesis, Base Auxiliar). Cada card só muda de
 * configuração (ícone, texto, modo file/texto e callback de import).
 *
 * Drag-and-drop: o prompt mestre pede atenção especial aqui porque é a
 * causa mais comum de "funciona no Chrome mas não no Firefox". Os dois
 * pontos que mais quebram implementações amadoras:
 *   1. Esquecer `e.preventDefault()` no `dragover` — sem isso o navegador
 *      assume que você não quer soltar nada ali e cancela o drop.
 *   2. Não tratar `dragenter`/`dragleave` corretamente, o que faz a borda
 *      "piscar" quando o mouse passa sobre elementos filhos.
 * Este componente trata os dois casos.
 * -----------------------------------------------------------------------
 */

/**
 * @param {Object} options
 * @param {HTMLElement} options.root - elemento raiz do card (label ou div).
 * @param {'file'|'textarea'} options.mode
 * @param {(fileOrText: File|string) => Promise<void>|void} options.onInput
 * @param {() => void} [options.onClear]
 */
export function mountUploadCard({ root, mode, onInput, onClear }) {
  if (!root) return;

  if (mode === 'file') {
    const input = root.querySelector('input[type="file"]');

    input?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) onInput(file);
    });

    // dragover precisa de preventDefault em TODO frame do arraste, senão
    // o navegador recusa o drop silenciosamente.
    root.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      root.classList.add('drag-over');
    });
    root.addEventListener('dragenter', (e) => {
      e.preventDefault();
      root.classList.add('drag-over');
    });
    root.addEventListener('dragleave', (e) => {
      e.preventDefault();
      // só remove o destaque quando o mouse realmente sai do card (não de um filho)
      if (!root.contains(e.relatedTarget)) root.classList.remove('drag-over');
    });
    root.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      root.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) onInput(file);
    });
  }

  if (mode === 'textarea') {
    const textarea = root.querySelector('textarea');
    let debounceTimer = null;
    textarea?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onInput(e.target.value), 400);
    });
  }

  const clearBtn = root.querySelector('.slot-clear');
  clearBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = root.querySelector('input[type="file"]');
    const textarea = root.querySelector('textarea');
    if (input) input.value = '';
    if (textarea) textarea.value = '';
    onClear?.();
  });
}

/**
 * Atualiza o texto de status de um card, seguindo a regra do prompt
 * mestre: nunca mostrar só "Upload concluído", sempre a contagem real.
 * @param {HTMLElement} statusEl
 * @param {{total:number, validos:number, ignorados:number, duplicados:number, erros:number}} stats
 */
export function renderUploadStatus(statusEl, stats) {
  if (!statusEl) return;
  const partes = [`${stats.validos.toLocaleString('pt-BR')} registros carregados`];
  if (stats.ignorados > 0) partes.push(`${stats.ignorados} ignorados`);
  if (stats.duplicados > 0) partes.push(`${stats.duplicados} duplicados`);
  if (stats.erros > 0) partes.push(`${stats.erros} com erro`);
  statusEl.textContent = `✅ ${partes.join(' • ')}`;
  statusEl.classList.remove('waiting');
  statusEl.classList.add('done');
}

/**
 * @param {HTMLElement} statusEl
 * @param {string} message
 */
export function renderUploadError(statusEl, message) {
  if (!statusEl) return;
  statusEl.textContent = `❌ ${message}`;
  statusEl.classList.remove('waiting', 'done');
  statusEl.classList.add('error');
}
