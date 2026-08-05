/**
 * ImportService.js
 * -----------------------------------------------------------------------
 * Orquestra o fluxo completo de um upload: ExcelService (lê) →
 * ParserFactory (normaliza) → estatísticas detalhadas para o card de
 * upload mostrar (prompt mestre: nunca só "Upload concluído" — sempre
 * "X registros carregados", com válidos/ignorados/duplicados/erros).
 * -----------------------------------------------------------------------
 */

import { readWorkbook } from './ExcelService.js';
import { getParser } from './ParserFactory.js';
import { BaseAuxiliarParser } from './BaseAuxiliarParser.js';
import { EventosParser } from './EventosParser.js';
import { dedupeKey } from '../utils/helpers.js';

/**
 * @typedef {Object} ImportResult
 * @property {Array<Object>} items - itens normalizados (vazio para baseAuxiliar)
 * @property {Object} [crossData] - { concentradorIds, missaoCriticaIds } (só para baseAuxiliar)
 * @property {Object} stats - { total, validos, ignorados, duplicados, erros }
 * @property {string} fileName
 */

/**
 * @param {File} file
 * @param {'agendadas'|'naoagendadas'} tipo
 * @returns {Promise<ImportResult>}
 */
export async function importAtividades(file, tipo) {
  const { rows } = await readWorkbook(file);
  const parser = getParser(tipo);

  const seen = new Set();
  let ignorados = 0;
  let duplicados = 0;

  const items = [];
  for (const row of rows) {
    let item;
    try {
      item = parser.parseRow(row);
    } catch (_err) {
      ignorados++;
      continue;
    }
    if (!item || item.tsk === 'N/I') {
      ignorados++;
      continue;
    }
    const key = dedupeKey(item);
    if (seen.has(key)) {
      duplicados++;
      continue;
    }
    seen.add(key);
    items.push(item);
  }

  return {
    items,
    stats: { total: rows.length, validos: items.length, ignorados, duplicados, erros: 0 },
    fileName: file.name,
  };
}

/**
 * @param {File} file
 * @returns {Promise<ImportResult>}
 */
export async function importBaseAuxiliar(file) {
  const { rows } = await readWorkbook(file);
  const { concentradorIds, missaoCriticaIds } = new BaseAuxiliarParser().parse(rows);
  return {
    items: [],
    crossData: { concentradorIds, missaoCriticaIds },
    stats: {
      total: rows.length,
      validos: concentradorIds.size,
      ignorados: rows.length - concentradorIds.size,
      duplicados: 0,
      erros: 0,
      missaoCritica: missaoCriticaIds.size,
    },
    fileName: file.name,
  };
}

/**
 * @param {string} text - texto colado do Gênesis
 * @returns {ImportResult}
 */
export function importEventosTexto(text) {
  const items = new EventosParser().parseText(text);
  return {
    items,
    stats: { total: items.length, validos: items.length, ignorados: 0, duplicados: 0, erros: 0 },
    fileName: '(texto colado)',
  };
}
