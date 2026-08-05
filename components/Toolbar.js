/**
 * Toolbar.js
 * -----------------------------------------------------------------------
 * Campo de busca (com debounce) e botões de exportação. Recebe sempre
 * uma função `getVisibleItems()` para pegar o dataset filtrado atual no
 * momento do clique (evita capturar um array desatualizado por closure).
 * -----------------------------------------------------------------------
 */

import { exportXLSX, exportCSV, copyToClipboard } from '../services/ExportService.js';
import { showToast } from './Toast.js';

/**
 * @param {Object} options
 * @param {HTMLInputElement} options.searchInput
 * @param {HTMLButtonElement} options.btnXlsx
 * @param {HTMLButtonElement} options.btnCsv
 * @param {HTMLButtonElement} options.btnCopy
 * @param {(term: string) => void} options.onSearch
 * @param {() => Array<Object>} options.getVisibleItems
 */
export function initToolbar({ searchInput, btnXlsx, btnCsv, btnCopy, onSearch, getVisibleItems }) {
  let debounceTimer = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onSearch(e.target.value), 250);
  });

  btnXlsx?.addEventListener('click', () => {
    const items = getVisibleItems();
    if (items.length === 0) return showToast('Nada para exportar com os filtros atuais.', 'warn');
    exportXLSX(items);
    showToast(`${items.length} registros exportados (.xlsx)`, 'success');
  });

  btnCsv?.addEventListener('click', () => {
    const items = getVisibleItems();
    if (items.length === 0) return showToast('Nada para exportar com os filtros atuais.', 'warn');
    exportCSV(items);
    showToast(`${items.length} registros exportados (.csv)`, 'success');
  });

  btnCopy?.addEventListener('click', async () => {
    const items = getVisibleItems();
    if (items.length === 0) return showToast('Nada para copiar com os filtros atuais.', 'warn');
    await copyToClipboard(items);
    showToast(`${items.length} registros copiados para a área de transferência`, 'success');
  });
}
