/**
 * EventosParser.js
 * -----------------------------------------------------------------------
 * Fonte "Eventos": texto colado diretamente do sistema G.E.N.E.S.I.S
 * (alarmes de rede em tempo real, formato tabular separado por TAB).
 * Não é um arquivo Excel — por isso não herda de BaseParser (o contrato
 * de entrada é texto puro, não um array de linhas já parseadas pelo
 * SheetJS) — mas devolve o mesmo formato de item normalizado que os
 * demais parsers, para o resto da aplicação não precisar saber a origem.
 * -----------------------------------------------------------------------
 */

import { normalizeEndId } from '../utils/helpers.js';
import { resolveTneRegion } from './FilterService.js';

export class EventosParser {
  constructor() {
    this.origem = 'genesis';
  }

  /**
   * @param {string} text - Texto colado do Gênesis (Ctrl+V).
   * @returns {Array<Object>} itens normalizados
   */
  parseText(text) {
    const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const lower = lines[i].toLowerCase();
      if (
        (lower.includes('data/hora') || lower.includes('datahora') || lower.includes('ne_id')) &&
        (lower.includes('end_id') || lower.includes('tecnologia'))
      ) {
        headerIdx = i;
        break;
      }
    }

    const headers = lines[headerIdx].split('\t').map((h) => h.trim());
    const items = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      if (cols.length < 3) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (cols[idx] || '').trim();
      });

      const ne_id = row['NE_ID'] || row['NE ID'] || '';
      const end_id = row['END_ID'] || row['End ID'] || '';
      const cidadeUf = row['Cidade/UF'] || row['Cidade'] || '';
      const [cidade, uf] = cidadeUf.includes('/')
        ? cidadeUf.split('/').map((s) => s.trim())
        : [cidadeUf, ''];

      items.push({
        tsk: end_id || ne_id || 'N/I',
        ne: ne_id || 'N/I',
        end_id: end_id || 'N/I',
        end_id_norm: normalizeEndId(end_id || ne_id),
        cidade: cidade || '',
        uf: uf || '',
        tne: resolveTneRegion(uf),
        prioridade: 'N/A',
        status: row['Status'] || 'Desconhecido',
        tecnico: 'Não atribuído',
        tipoFalha: row['Classif. Infra'] || row['Tecnologia'] || 'Não classificado',
        slaFim: '',
        origem: this.origem,
        cruzamento: '—',
        isConcentrador: false,
        isMissaoCritica: false,
        estadoKey: null,
        _preprocessed: true,
      });
    }
    return items;
  }
}
