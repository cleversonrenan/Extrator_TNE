/**
 * BaseParser.js
 * -----------------------------------------------------------------------
 * Contrato e lógica comum a todos os parsers de planilha de atividades
 * (Agendadas e Não Agendadas hoje; qualquer nova planilha no mesmo
 * formato no futuro). Parsers específicos (AgendadasParser,
 * NaoAgendadasParser) herdam esta classe e só sobrescrevem o que muda
 * de fato (ex.: nome de origem).
 *
 * Um parser de planilha "diferente" (ex.: Genesis, texto colado) NÃO
 * deve herdar daqui — ele implementa o mesmo contrato (parseRows) do
 * zero, como o EventosParser faz.
 * -----------------------------------------------------------------------
 */

import { COLUMN_MAP } from '../utils/constants.js';
import { findColumn, normalizeEndId, parsePriority } from '../utils/helpers.js';
import { normalizeSlaFim } from '../utils/dates.js';
import { resolveTneRegion } from './FilterService.js';

export class BaseParser {
  /** @param {string} origem - identificador da fonte (ex.: 'agendadas') */
  constructor(origem) {
    this.origem = origem;
  }

  /**
   * Recebe as linhas brutas (array de objetos, uma linha do Excel cada)
   * e devolve um array de itens normalizados, no formato interno único
   * usado pelo resto da aplicação (Table, FilterService, ExportService...).
   * @param {Array<Object>} rows
   * @returns {Array<Object>}
   */
  parseRows(rows) {
    return rows.map((row) => this.parseRow(row)).filter(Boolean);
  }

  /**
   * Normaliza uma única linha. Pode ser sobrescrito por subclasses caso
   * a planilha tenha alguma regra específica além do mapeamento padrão.
   * @param {Object} row
   * @returns {Object}
   */
  parseRow(row) {
    const colMap = {};
    for (const [key, names] of Object.entries(COLUMN_MAP)) {
      colMap[key] = findColumn(row, names);
    }
    const get = (key) => {
      const col = colMap[key];
      return col ? String(row[col] ?? '').trim() : '';
    };

    const uf = get('UF');
    const end_id = get('END_ID');

    return {
      tsk: get('TSK') || 'N/I',
      ne: get('NE') || 'N/I',
      end_id: end_id || 'N/I',
      end_id_norm: normalizeEndId(end_id),
      cidade: get('CIDADE') || '',
      uf,
      tne: resolveTneRegion(uf),
      prioridade: parsePriority(get('PRIORIDADE')),
      status: get('STATUS') || 'Desconhecido',
      tecnico: get('TECNICO') || 'Não atribuído',
      tipoFalha: get('TIPO_FALHA') || get('FALHA') || 'Não classificado',
      slaFim: normalizeSlaFim(get('SLA_FIM')),
      origem: this.origem,
      cruzamento: '—',
      isConcentrador: false,
      isMissaoCritica: false,
      estadoKey: null,
      _preprocessed: true,
    };
  }
}
