/**
 * ExcelService.js
 * -----------------------------------------------------------------------
 * Único lugar da aplicação que toca a lib SheetJS (window.XLSX, carregada
 * via CDN no index.html). Garante a regra de performance do prompt
 * mestre "nunca ler o Excel duas vezes": o resultado (linhas em JSON) é
 * cacheado por arquivo (nome + tamanho + data de modificação), então se
 * o usuário reprocessar sem trocar o arquivo, não lê de novo do disco.
 * -----------------------------------------------------------------------
 */

import { validateFileType, validateFileNotEmpty, validateHasRows } from '../utils/validators.js';

const cache = new Map();

function cacheKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/**
 * Lê um arquivo (xlsx/xls/csv) e devolve as linhas da primeira planilha
 * como array de objetos (cabeçalho vira chave).
 * @param {File} file
 * @returns {Promise<{rows: Array<Object>, sheetName: string, fromCache: boolean}>}
 */
export async function readWorkbook(file) {
  const typeCheck = validateFileType(file);
  if (!typeCheck.valid) throw new Error(typeCheck.reason);

  const emptyCheck = validateFileNotEmpty(file);
  if (!emptyCheck.valid) throw new Error(emptyCheck.reason);

  const key = cacheKey(file);
  if (cache.has(key)) {
    return { ...cache.get(key), fromCache: true };
  }

  if (!window.XLSX) {
    throw new Error('Biblioteca SheetJS (XLSX) não carregada. Verifique a tag <script> no index.html.');
  }

  const buffer = await file.arrayBuffer();
  let workbook;
  try {
    workbook = window.XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch (err) {
    throw new Error(`Arquivo corrompido ou em formato inválido: ${err.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('A planilha não contém nenhuma aba.');

  const sheet = workbook.Sheets[sheetName];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const rowsCheck = validateHasRows(rows);
  if (!rowsCheck.valid) throw new Error(rowsCheck.reason);

  const result = { rows, sheetName };
  cache.set(key, result);
  return { ...result, fromCache: false };
}

/** Limpa o cache (usado no botão "remover" de um card de upload). */
export function clearCache(file) {
  if (file) cache.delete(cacheKey(file));
  else cache.clear();
}
