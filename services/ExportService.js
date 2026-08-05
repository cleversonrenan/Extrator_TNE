/**
 * ExportService.js
 * -----------------------------------------------------------------------
 * Converte o array de itens atualmente exibido (já filtrado) em um
 * arquivo para download, ou copia para a área de transferência.
 * A Fase seguinte adiciona JSON e PDF; hoje cobre XLSX/CSV/Clipboard,
 * que é o que o fluxo diário do Cleverson já usa.
 * -----------------------------------------------------------------------
 */

const EXPORT_COLUMNS = [
  { key: 'uf', label: 'UF' },
  { key: 'tne', label: 'TNE' },
  { key: 'tsk', label: 'TSK' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'ne', label: 'NE ID' },
  { key: 'end_id', label: 'END_ID' },
  { key: 'tipoFalha', label: 'Tipo Falha' },
  { key: 'cruzamento', label: 'Cruzamento' },
  { key: 'isMissaoCritica', label: 'Missão Crítica' },
  { key: 'slaFim', label: 'SLA (Fim)' },
];

function toExportRows(items) {
  return items.map((item) =>
    EXPORT_COLUMNS.reduce((row, col) => {
      row[col.label] = item[col.key] ?? '';
      return row;
    }, {})
  );
}

/**
 * Gera e baixa um arquivo .xlsx com os itens informados.
 * @param {Array<Object>} items
 * @param {string} [fileName]
 */
export function exportXLSX(items, fileName = 'csm_export.xlsx') {
  if (!window.XLSX) throw new Error('Biblioteca SheetJS (XLSX) não carregada.');
  const rows = toExportRows(items);
  const sheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, sheet, 'Chamados');
  window.XLSX.writeFile(workbook, fileName);
}

/**
 * Gera e baixa um arquivo .csv com os itens informados.
 * @param {Array<Object>} items
 * @param {string} [fileName]
 */
export function exportCSV(items, fileName = 'csm_export.csv') {
  const rows = toExportRows(items);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(';'), ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(';'))];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copia os itens informados para a área de transferência, em formato
 * de tabela (separado por TAB), pronto para colar no Excel.
 * @param {Array<Object>} items
 * @returns {Promise<void>}
 */
export async function copyToClipboard(items) {
  const rows = toExportRows(items);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join('\t'), ...rows.map((row) => headers.map((h) => row[h]).join('\t'))];
  await navigator.clipboard.writeText(lines.join('\n'));
}
