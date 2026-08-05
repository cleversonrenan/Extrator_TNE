/**
 * SLAService.js
 * -----------------------------------------------------------------------
 * Calcula, a partir do campo `slaFim` (ISO) de um item, quanto tempo
 * falta e qual classe visual usar (verde / amarelo / estourado).
 * -----------------------------------------------------------------------
 */

import { formatDateBr } from '../utils/dates.js';

const TRES_HORAS_MS = 3 * 60 * 60 * 1000;

/**
 * @param {{slaFim: string}} item
 * @returns {{label:string, timeLeft:string, class:'verde'|'amarelo'|'estourado', percent:number}}
 */
export function getSlaInfo(item) {
  if (!item.slaFim) {
    return { label: '--', timeLeft: '--', class: 'verde', percent: 100 };
  }

  const fim = new Date(item.slaFim);
  if (isNaN(fim.getTime())) {
    return { label: 'Data inválida', timeLeft: '--', class: 'estourado', percent: 0 };
  }

  const diff = fim.getTime() - Date.now();
  const label = formatDateBr(item.slaFim);

  if (diff > 0) {
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const slaClass = diff > TRES_HORAS_MS ? 'verde' : 'amarelo';
    return { label, timeLeft: `${hours}h ${minutes}m`, class: slaClass, percent: Math.min(100, (diff / 3600000) * 20) };
  }
  return { label, timeLeft: '⏰ Estourado', class: 'estourado', percent: 0 };
}
