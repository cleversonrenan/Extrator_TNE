/**
 * BaseAuxiliarParser.js
 * -----------------------------------------------------------------------
 * Fonte "Base Auxiliar" (planilha u_task_evento): não entra na tabela
 * principal como linhas próprias — serve para CRUZAR com os itens de
 * Agendadas/Não Agendadas/Eventos e marcar dois atributos:
 *
 *   1. isConcentrador  → o site aparece na lista de concentradores.
 *   2. isMissaoCritica → "Sites Dependentes por Tx" >= 4 E o campo
 *      "Falha" contém "energia" (regra combinada, ver constants.js).
 * -----------------------------------------------------------------------
 */

import { findColumn, normalizeEndId } from '../utils/helpers.js';
import { COLUMN_MAP, MISSAO_CRITICA_MIN_SITES_DEPENDENTES, MISSAO_CRITICA_TIPO_FALHA } from '../utils/constants.js';

export class BaseAuxiliarParser {
  /**
   * @param {Array<Object>} rows - linhas brutas da planilha u_task_evento
   * @returns {{concentradorIds: Set<string>, missaoCriticaIds: Set<string>}}
   */
  parse(rows) {
    const concentradorIds = new Set();
    const missaoCriticaIds = new Set();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { concentradorIds, missaoCriticaIds };
    }

    const idField = findColumn(rows[0], COLUMN_MAP.ID_EVENTO);
    const sdField = findColumn(rows[0], COLUMN_MAP.SITES_DEPENDENTES);
    const falhaField = findColumn(rows[0], COLUMN_MAP.FALHA.concat(['Falha']));

    rows.forEach((row) => {
      const idRaw = idField ? String(row[idField] ?? '').trim() : '';
      const idNorm = normalizeEndId(idRaw);
      if (!idNorm) return;

      concentradorIds.add(idNorm);

      const sdNum = parseInt(String(sdField ? row[sdField] : '').replace(/[^\d-]/g, ''), 10);
      const falhaVal = falhaField ? String(row[falhaField] ?? '').trim().toLowerCase() : '';
      if (!isNaN(sdNum) && sdNum >= MISSAO_CRITICA_MIN_SITES_DEPENDENTES && falhaVal.includes(MISSAO_CRITICA_TIPO_FALHA)) {
        missaoCriticaIds.add(idNorm);
      }
    });

    return { concentradorIds, missaoCriticaIds };
  }
}
