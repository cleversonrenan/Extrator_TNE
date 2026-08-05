/**
 * Table.js
 * -----------------------------------------------------------------------
 * Renderiza o <tbody> da tabela principal. Nesta primeira entrega
 * (ponta a ponta simples) a renderização ainda é "innerHTML de uma vez",
 * igual ao HTML legado — funciona bem até alguns milhares de linhas.
 * Paginação/scroll virtual ficam para a próxima iteração (ver
 * DIAGNOSTICO_E_ARQUITETURA.md, seção "fica para 2ª rodada").
 * -----------------------------------------------------------------------
 */

import { getSlaInfo } from '../services/SLAService.js';
import { escapeHtml } from '../utils/helpers.js';
import { UF_COLORS, TNE_COLORS, PRIORITY_BADGE_CLASS, PRIORITY_ROW_CLASS, DEFAULT_BADGE_COLOR } from '../utils/colors.js';

const CRUZ_LABEL = { fora: '🔴 Fora', verificar: '🟠 Verificando', concentrador: '🟣 Concentrador' };

function badgeColor(map, key) {
  const [bg, color] = map[key] || DEFAULT_BADGE_COLOR;
  return `background:${bg};color:${color};`;
}

/**
 * @param {HTMLElement} tbodyEl
 * @param {Array<Object>} items - já filtrados e ordenados.
 * @param {number} colCount - usado para o colspan da linha "vazio".
 */
export function renderTable(tbodyEl, items, colCount = 11) {
  if (!tbodyEl) return;

  if (items.length === 0) {
    tbodyEl.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">Nenhum chamado encontrado. Faça upload das planilhas.</td></tr>`;
    return;
  }

  tbodyEl.innerHTML = items
    .map((d) => {
      const sla = getSlaInfo(d);
      const rowClass = d.isConcentrador ? 'row-concentrador' : PRIORITY_ROW_CLASS[d.prioridade] || '';
      const cruzHtml = CRUZ_LABEL[d.cruzamento]
        ? `<span class="badge badge-${d.cruzamento}">${CRUZ_LABEL[d.cruzamento]}</span>`
        : '<span class="muted">—</span>';
      const mgHtml = d.isMissaoCritica ? '<span title="Missão Crítica" class="mc-icon">⚠️</span>' : '';

      return `<tr class="${rowClass}">
        <td><span class="uf-badge" style="${badgeColor(UF_COLORS, d.uf)}">${escapeHtml(d.uf || '—')}</span></td>
        <td><span class="tne-badge" style="${badgeColor(TNE_COLORS, d.tne)}">${escapeHtml(d.tne || '—')}</span></td>
        <td><strong class="${d.isConcentrador ? 'tsk-concentrador' : ''}">${escapeHtml(d.tsk)}</strong></td>
        <td><span class="badge ${PRIORITY_BADGE_CLASS[d.prioridade] || 'badge-p5'}">${escapeHtml(d.prioridade)}</span></td>
        <td><code>${escapeHtml(d.ne)}</code></td>
        <td><code>${escapeHtml(d.end_id)}</code></td>
        <td class="ellipsis" title="${escapeHtml(d.tipoFalha)}">${escapeHtml(d.tipoFalha)}</td>
        <td>${cruzHtml}</td>
        <td class="center">${mgHtml}</td>
        <td><span class="sla-date ${sla.class}">${escapeHtml(sla.label)}</span></td>
        <td>
          <div class="sla-time ${sla.class}">${escapeHtml(sla.timeLeft)}</div>
          <div class="sla-bar"><div class="fill ${sla.class}" style="width:${sla.percent}%;"></div></div>
        </td>
      </tr>`;
    })
    .join('');
}

/**
 * Ordena um array de itens por uma coluna (mutação zero — devolve novo array).
 * @param {Array<Object>} items
 * @param {string} field
 * @param {boolean} asc
 * @returns {Array<Object>}
 */
export function sortItems(items, field, asc) {
  const sorted = [...items].sort((a, b) => {
    const va = a[field] ?? '';
    const vb = b[field] ?? '';
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
  return sorted;
}
