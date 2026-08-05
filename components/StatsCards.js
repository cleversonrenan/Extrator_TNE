/**
 * StatsCards.js
 * -----------------------------------------------------------------------
 * Renderiza a barra de indicadores no topo do dashboard. Recebe sempre
 * o array já filtrado — os números refletem o que está na tabela, não
 * o total absoluto (comportamento já validado no HTML legado).
 * -----------------------------------------------------------------------
 */

import { getSlaInfo } from '../services/SLAService.js';

/**
 * @param {HTMLElement} container
 * @param {Array<Object>} items
 */
export function renderStatsCards(container, items) {
  if (!container) return;

  const total = items.length;
  const porPrioridade = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
  let vencidos = 0;
  let concentradores = 0;
  let missaoCritica = 0;

  for (const item of items) {
    if (porPrioridade[item.prioridade] !== undefined) porPrioridade[item.prioridade]++;
    if (getSlaInfo(item).class === 'estourado') vencidos++;
    if (item.isConcentrador) concentradores++;
    if (item.isMissaoCritica) missaoCritica++;
  }

  const cards = [
    { label: 'Total', value: total, cls: '' },
    { label: 'P1', value: porPrioridade.P1, cls: 'p1' },
    { label: 'P2', value: porPrioridade.P2, cls: 'p2' },
    { label: 'P3', value: porPrioridade.P3, cls: 'p3' },
    { label: 'P4', value: porPrioridade.P4, cls: 'p4' },
    { label: 'P5', value: porPrioridade.P5, cls: 'p5' },
    { label: 'Vencidos', value: vencidos, cls: 'estourado' },
    { label: '🟣 Concentradores', value: concentradores, cls: '' },
    { label: '⚠️ Missão Crítica', value: missaoCritica, cls: 'estourado' },
  ];

  container.innerHTML = cards
    .map((c) => `<div class="stat-card ${c.cls}"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`)
    .join('');
}
