/**
 * Filters.js
 * -----------------------------------------------------------------------
 * Liga os cliques da barra de filtros ao estado de filtro (FilterService)
 * e mantém os botões com a classe `.active` sincronizada. Os botões de
 * prioridade/SLA/cruzamento/TNE/estado já existem no HTML estático
 * (index.html); os de UF são gerados dinamicamente a partir dos dados
 * carregados, porque a lista de UFs só é conhecida depois do upload.
 * -----------------------------------------------------------------------
 */

import { toggleSet } from '../utils/helpers.js';
import { PRIORITY_KEYS, SLA_KEYS, CRUZ_KEYS, TNE_KEYS, ESTADO_KEYS } from '../utils/constants.js';

/**
 * @param {HTMLElement} filterBarEl
 * @param {import('../services/FilterService.js').FilterState} filters
 * @param {() => void} onChange - chamado depois de qualquer alteração no estado.
 */
export function initFilters(filterBarEl, filters, onChange) {
  filterBarEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    const val = btn.dataset.filter;

    if (val === 'all') {
      filters.uf.clear();
      filters.prioridades.clear();
      filters.sla.clear();
      filters.cruzamento.clear();
      filters.estado.clear();
      filters.tneRegion = null;
    } else if (PRIORITY_KEYS.includes(val)) {
      toggleSet(filters.prioridades, val);
    } else if (SLA_KEYS.includes(val)) {
      toggleSet(filters.sla, val);
    } else if (CRUZ_KEYS.includes(val)) {
      toggleSet(filters.cruzamento, val);
    } else if (TNE_KEYS.includes(val)) {
      filters.tneRegion = filters.tneRegion === val ? null : val;
    } else if (ESTADO_KEYS.includes(val)) {
      toggleSet(filters.estado, val);
    } else {
      // UF (valor é a sigla, ex.: "BA")
      toggleSet(filters.uf, val);
    }

    refreshActiveStates(filterBarEl, filters);
    onChange();
  });
}

/**
 * Regenera os botões de UF disponíveis a partir dos dados carregados.
 * @param {HTMLElement} ufContainerEl
 * @param {Array<Object>} allItems - dataset completo (não filtrado), para listar todas as UFs possíveis.
 * @param {import('../services/FilterService.js').FilterState} filters
 * @param {() => void} onChange
 */
export function renderUfButtons(ufContainerEl, allItems, filters, onChange) {
  const ufs = [...new Set(allItems.map((i) => i.uf).filter(Boolean))].sort();
  ufContainerEl.innerHTML = ufs
    .map((uf) => `<button class="filter-btn${filters.uf.has(uf) ? ' active' : ''}" data-filter="${uf}">${uf}</button>`)
    .join('');
  // O clique é capturado pelo listener delegado em initFilters (event bubbling),
  // não precisa registrar um novo listener aqui.
  void onChange; // reservado (mantido na assinatura por simetria com outras render*)
}

/**
 * @param {HTMLElement} filterBarEl
 * @param {import('../services/FilterService.js').FilterState} filters
 */
export function refreshActiveStates(filterBarEl, filters) {
  filterBarEl.querySelectorAll('button[data-filter]').forEach((btn) => {
    const v = btn.dataset.filter;
    let isActive = false;
    if (PRIORITY_KEYS.includes(v)) isActive = filters.prioridades.has(v);
    else if (SLA_KEYS.includes(v)) isActive = filters.sla.has(v);
    else if (CRUZ_KEYS.includes(v)) isActive = filters.cruzamento.has(v);
    else if (TNE_KEYS.includes(v)) isActive = filters.tneRegion === v;
    else if (ESTADO_KEYS.includes(v)) isActive = filters.estado.has(v);
    else if (v !== 'all') isActive = filters.uf.has(v);
    btn.classList.toggle('active', isActive);
  });
}
