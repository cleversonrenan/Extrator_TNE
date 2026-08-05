/**
 * dates.js
 * -----------------------------------------------------------------------
 * Tudo relacionado a interpretar e formatar datas vindas de planilha.
 * As planilhas do Genesis/Atividades TNE misturam três formatos: texto
 * "dd/mm/aaaa hh:mm[:ss]", data serial do Excel (número) e ISO.
 * -----------------------------------------------------------------------
 */

/**
 * Converte "dd/mm/aaaa hh:mm[:ss]" (ou aaaa com 2 dígitos) em Date.
 * @param {string} valor
 * @returns {Date|null}
 */
export function parseBrDateTime(valor) {
  if (!valor) return null;
  const str = String(valor).trim();
  if (!str) return null;

  const regex = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
  const match = str.match(regex);
  if (match) {
    let [, dia, mes, ano, hora, minuto, segundo] = match;
    dia = parseInt(dia, 10);
    mes = parseInt(mes, 10) - 1;
    ano = parseInt(ano, 10);
    if (ano < 100) ano += 2000;
    const data = new Date(ano, mes, dia, parseInt(hora, 10), parseInt(minuto, 10), parseInt(segundo || '0', 10));
    if (!isNaN(data.getTime())) return data;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  } catch (_e) {
    /* ignora */
  }
  return null;
}

/**
 * Converte uma data serial do Excel (dias desde 1899-12-30) em Date.
 * @param {number} serial
 * @returns {Date|null}
 */
export function excelSerialToDate(serial) {
  const n = parseFloat(serial);
  if (!(n > 0 && n < 100000)) return null;
  const date = new Date((n - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Normaliza um valor bruto de "SLA Fim" (texto BR, serial Excel ou ISO)
 * para uma string ISO 8601, pronta para `new Date(...)`.
 * @param {string|number} rawValue
 * @returns {string} ISO string, ou string vazia se não for possível interpretar.
 */
export function normalizeSlaFim(rawValue) {
  let slaFim = rawValue ? String(rawValue).trim() : '';
  if (!slaFim) return '';

  if (!isNaN(slaFim) && slaFim.length > 0) {
    const asDate = excelSerialToDate(slaFim);
    if (asDate) return asDate.toISOString();
  }
  if (!slaFim.includes('T')) {
    const parsed = parseBrDateTime(slaFim);
    if (parsed) return parsed.toISOString();
  }
  return slaFim;
}

/**
 * Formata uma data ISO no padrão pt-BR (dd/mm/aaaa, hh:mm).
 * @param {string} isoString
 * @returns {string}
 */
export function formatDateBr(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Data inválida';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
