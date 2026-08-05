/**
 * helpers.js
 * -----------------------------------------------------------------------
 * Funções puras (sem efeito colateral, sem acesso a DOM/estado global).
 * Cada função aqui deve poder ser testada isoladamente, passando um
 * valor e conferindo o retorno.
 * -----------------------------------------------------------------------
 */

/**
 * Encontra, em um objeto-linha de planilha, a chave de coluna que melhor
 * corresponde a um dos nomes possíveis (tenta correspondência exata antes
 * de tentar substring, pra evitar falsos positivos).
 * @param {Object} row - Uma linha de dados (objeto chave/valor).
 * @param {string[]} possibleNames - Nomes candidatos para a coluna.
 * @returns {string|null} A chave real encontrada em `row`, ou null.
 */
export function findColumn(row, possibleNames) {
  if (!row) return null;
  const keys = Object.keys(row);

  for (const name of possibleNames) {
    const found = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  for (const name of possibleNames) {
    const found = keys.find(
      (k) => k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}

/**
 * Normaliza um identificador de site/NE para comparação: maiúsculas,
 * sem espaços, hífens ou underscores.
 * @param {string} id
 * @returns {string}
 */
export function normalizeEndId(id) {
  if (!id) return '';
  return String(id).trim().toUpperCase().replace(/[\s\-_]+/g, '');
}

/**
 * Remove acentos e normaliza para maiúsculas — usado para comparar
 * textos vindos de planilhas com grafias inconsistentes (ex: "Pendente"
 * vs "pendente", "Não iniciado" vs "Não iniciada").
 * @param {string} text
 * @returns {string}
 */
export function stripAccentsUpper(text) {
  return String(text || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Interpreta o valor bruto de prioridade da planilha e retorna P1-P5.
 * @param {string} value
 * @returns {'P1'|'P2'|'P3'|'P4'|'P5'|'N/A'}
 */
export function parsePriority(value) {
  if (!value) return 'N/A';
  const s = String(value).trim();
  const match = s.match(/P[1-5]/i);
  if (match) return match[0].toUpperCase();

  const lower = s.toLowerCase();
  if (s.includes('1') || lower.includes('alta') || lower.includes('crit')) return 'P1';
  if (s.includes('2') || lower.includes('urg')) return 'P2';
  if (s.includes('3') || lower.includes('méd') || lower.includes('med')) return 'P3';
  if (s.includes('4')) return 'P4';
  if (s.includes('5') || lower.includes('baixa') || lower.includes('min')) return 'P5';
  return 'N/A';
}

/**
 * Alterna um valor dentro de um Set (adiciona se ausente, remove se presente).
 * Retorna o próprio Set, para permitir encadeamento.
 * @param {Set} set
 * @param {*} value
 * @returns {Set}
 */
export function toggleSet(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return set;
}

/**
 * Gera uma chave de deduplicação estável para uma linha combinada.
 * @param {{tsk:string, end_id:string}} item
 * @returns {string}
 */
export function dedupeKey(item) {
  return `${item.tsk}|${item.end_id}`;
}

/**
 * Escapa texto antes de inserir em innerHTML, para mitigar XSS vindo
 * de conteúdo de planilha (campos livres como "Detalhe"/"Causa").
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}
