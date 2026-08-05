/**
 * FilterService.js
 * -----------------------------------------------------------------------
 * Toda a lógica de filtragem, resolução de região TNE, normalização do
 * campo "Estado" e o merge/cruzamento das 4 fontes em um único array de
 * itens (o que no HTML legado se chamava `combinedData`). Funções puras:
 * recebem estado + filtros, devolvem um novo array — nunca mutam o
 * dataStore diretamente.
 * -----------------------------------------------------------------------
 */

import { TNE_MAP, UF_FULLNAME_MAP, ESTADOS_EXCLUIDOS } from '../utils/constants.js';
import { stripAccentsUpper, dedupeKey, normalizeEndId } from '../utils/helpers.js';

/**
 * Resolve a sub-região TNE (tne1/tne2) a partir da UF da atividade.
 * Aceita sigla ("BA") ou nome completo ("Bahia"), com ou sem acento.
 * Retorna 'N/A' para qualquer UF fora do TNE (ex.: RJ, MG) — isso é
 * esperado e correto, não é bug: essas planilhas às vezes trazem itens
 * de fora da região por dependência de concentrador.
 * @param {string} uf
 * @returns {'TNE1'|'TNE2'|'N/A'}
 */
export function resolveTneRegion(uf) {
  if (!uf) return 'N/A';
  let u = stripAccentsUpper(uf);
  if (u.length > 2 && UF_FULLNAME_MAP[u]) u = UF_FULLNAME_MAP[u];
  for (const [region, ufs] of Object.entries(TNE_MAP)) {
    if (ufs.includes(u)) return region.toUpperCase();
  }
  return 'N/A';
}

/**
 * Normaliza o valor bruto da coluna "Estado" (com variações reais de
 * gênero/maiúsculas observadas nas planilhas: "Iniciado"/"Iniciada",
 * "pendente"/"Pendente", "Não iniciado"/"Não iniciada") em uma de 5
 * chaves fixas.
 * @param {string} status
 * @returns {'concluida'|'pendente'|'iniciada'|'cancelada'|'naoiniciada'|null}
 */
export function normalizeEstadoStatus(status) {
  if (!status) return null;
  const s = stripAccentsUpper(status).toLowerCase();
  if (!s) return null;
  if (s.includes('cancel')) return 'cancelada';
  if (s.includes('conclu')) return 'concluida';
  if (s.includes('nao iniciad')) return 'naoiniciada';
  if (s.includes('pendente')) return 'pendente';
  if (s.includes('iniciad')) return 'iniciada';
  return null;
}

/**
 * Junta os itens de Agendadas + Não Agendadas + Eventos em um único
 * array, removendo duplicados (mesma TSK + END_ID) e já excluindo
 * permanentemente os itens com Estado "Concluída"/"Cancelada".
 * @param {{agendadas: Array, naoagendadas: Array, genesis: Array}} sources
 * @returns {Array<Object>}
 */
export function mergeSources(sources) {
  const combined = [];
  const seen = new Set();

  for (const list of [sources.agendadas, sources.naoagendadas, sources.genesis]) {
    if (!list || !list.length) continue;
    for (const item of list) {
      const estadoKey = normalizeEstadoStatus(item.status);
      if (ESTADOS_EXCLUIDOS.includes(estadoKey)) continue;

      const key = dedupeKey(item);
      if (seen.has(key)) continue;
      seen.add(key);

      combined.push({ ...item, estadoKey });
    }
  }
  return combined;
}

/**
 * Marca cada item com isConcentrador/isMissaoCritica a partir dos sets
 * calculados pela BaseAuxiliarParser. Retorna um novo array (imutável).
 * @param {Array<Object>} items
 * @param {Set<string>} concentradorIds
 * @param {Set<string>} missaoCriticaIds
 * @returns {Array<Object>}
 */
export function applyCrossReference(items, concentradorIds, missaoCriticaIds) {
  return items.map((item) => {
    const idsToCheck = [normalizeEndId(item.tsk), item.end_id_norm, normalizeEndId(item.ne)];
    const isConcentrador = idsToCheck.some((id) => concentradorIds.has(id));
    const isMissaoCritica = idsToCheck.some((id) => missaoCriticaIds.has(id));
    return {
      ...item,
      isConcentrador,
      isMissaoCritica,
      cruzamento: isConcentrador ? 'concentrador' : item.cruzamento,
    };
  });
}

/**
 * @typedef {Object} FilterState
 * @property {Set<string>} uf
 * @property {Set<string>} prioridades
 * @property {Set<string>} sla
 * @property {Set<string>} cruzamento
 * @property {string|null} tneRegion
 * @property {Set<string>} estado
 * @property {string} searchTerm
 */

/** @returns {FilterState} um estado de filtro vazio (usado no boot e no "Limpar filtros"). */
export function emptyFilterState() {
  return {
    uf: new Set(),
    prioridades: new Set(),
    sla: new Set(),
    cruzamento: new Set(),
    tneRegion: null,
    estado: new Set(),
    searchTerm: '',
  };
}

/**
 * Aplica todos os filtros acumulativos sobre o array de itens.
 * @param {Array<Object>} items
 * @param {FilterState} filters
 * @param {(item: Object) => {class: string}} getSlaInfo - injeta o SLAService, evita import circular.
 * @returns {Array<Object>}
 */
export function applyFilters(items, filters, getSlaInfo) {
  let data = items;

  if (filters.uf.size > 0) data = data.filter((d) => filters.uf.has(d.uf));
  if (filters.prioridades.size > 0) data = data.filter((d) => filters.prioridades.has(d.prioridade));
  if (filters.cruzamento.size > 0) data = data.filter((d) => filters.cruzamento.has(d.cruzamento));
  if (filters.estado.size > 0) data = data.filter((d) => filters.estado.has(d.estadoKey));

  if (filters.tneRegion) {
    const allowedUF = TNE_MAP[filters.tneRegion] || [];
    data = data.filter((d) => allowedUF.includes(stripAccentsUpper(d.uf)));
  }

  if (filters.sla.size > 0) {
    data = data.filter((d) => {
      const info = getSlaInfo(d);
      const vencido = info.class === 'estourado';
      if (filters.sla.has('vencidos') && vencido) return true;
      if (filters.sla.has('noprazo') && !vencido) return true;
      return false;
    });
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    data = data.filter((d) =>
      [d.tsk, d.ne, d.end_id, d.cidade, d.tecnico, d.tipoFalha, d.uf].some((field) =>
        String(field || '').toLowerCase().includes(term)
      )
    );
  }

  return data;
}
