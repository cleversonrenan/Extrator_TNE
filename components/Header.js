/**
 * Header.js
 * -----------------------------------------------------------------------
 * Cabeçalho do dashboard: título + hora da última atualização.
 * Componente propositalmente simples nesta primeira entrega.
 * -----------------------------------------------------------------------
 */

/**
 * @param {HTMLElement} el
 * @param {number} recordCount
 */
export function renderHeader(el, recordCount) {
  if (!el) return;
  const now = new Date().toLocaleString('pt-BR');
  el.querySelector('[data-last-update]').textContent = now;
  el.querySelector('[data-record-count]').textContent = recordCount.toLocaleString('pt-BR');
}
