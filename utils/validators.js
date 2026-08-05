/**
 * validators.js
 * -----------------------------------------------------------------------
 * Validações de entrada. Cada função retorna { valid: boolean, reason?: string }
 * para que o chamador decida como comunicar o problema ao usuário
 * (toast, log, mensagem no card de upload etc.) sem acoplar essa decisão
 * de UI aqui.
 * -----------------------------------------------------------------------
 */

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods'];

/**
 * Valida a extensão do arquivo selecionado/arrastado.
 * @param {File} file
 * @returns {{valid:boolean, reason?:string}}
 */
export function validateFileType(file) {
  if (!file) return { valid: false, reason: 'Nenhum arquivo informado.' };
  const name = file.name.toLowerCase();
  const ok = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!ok) {
    return { valid: false, reason: `Extensão não suportada. Aceitos: ${ACCEPTED_EXTENSIONS.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Valida se o arquivo não está vazio (0 bytes).
 * @param {File} file
 * @returns {{valid:boolean, reason?:string}}
 */
export function validateFileNotEmpty(file) {
  if (!file || file.size === 0) {
    return { valid: false, reason: 'O arquivo está vazio (0 bytes).' };
  }
  return { valid: true };
}

/**
 * Valida se a planilha lida contém ao menos uma linha de dados.
 * @param {Array<Object>} rows
 * @returns {{valid:boolean, reason?:string}}
 */
export function validateHasRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, reason: 'A planilha não contém nenhuma linha de dados.' };
  }
  return { valid: true };
}

/**
 * Confere se as colunas mínimas esperadas existem na primeira linha.
 * @param {Object} firstRow
 * @param {string[]} requiredColumnKeys - Chaves já resolvidas (ex.: saída de findColumn).
 * @returns {{valid:boolean, reason?:string, missing?:string[]}}
 */
export function validateRequiredColumns(firstRow, requiredColumnKeys) {
  const missing = requiredColumnKeys.filter((k) => !k);
  if (missing.length > 0) {
    return { valid: false, reason: 'Colunas obrigatórias ausentes na planilha.', missing };
  }
  return { valid: true };
}
