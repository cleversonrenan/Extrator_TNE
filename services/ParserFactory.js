/**
 * ParserFactory.js
 * -----------------------------------------------------------------------
 * Ponto único de decisão de "qual parser usar". Hoje a decisão é feita
 * pelo slot de upload (o usuário já diz "isso é Agendadas"), mas a
 * fábrica existe para que, no futuro, o `ImportService` possa também
 * tentar detectar o tipo pela assinatura de colunas do arquivo
 * (`detectByColumns`), sem precisar mexer em nenhum outro módulo.
 * -----------------------------------------------------------------------
 */

import { AgendadasParser } from './AgendadasParser.js';
import { NaoAgendadasParser } from './NaoAgendadasParser.js';

/** @type {Record<string, () => import('./BaseParser.js').BaseParser>} */
const PARSER_REGISTRY = {
  agendadas: () => new AgendadasParser(),
  naoagendadas: () => new NaoAgendadasParser(),
};

/**
 * @param {'agendadas'|'naoagendadas'} tipo
 * @returns {import('./BaseParser.js').BaseParser}
 */
export function getParser(tipo) {
  const factory = PARSER_REGISTRY[tipo];
  if (!factory) {
    throw new Error(`Nenhum parser registrado para o tipo "${tipo}".`);
  }
  return factory();
}

/**
 * Heurística de detecção automática por assinatura de colunas.
 * Reservado para uma próxima etapa (permitir soltar qualquer planilha
 * em qualquer card e o sistema identificar sozinho o tipo).
 * @param {string[]} _columnNames
 * @returns {string|null}
 */
export function detectByColumns(_columnNames) {
  // TODO: comparar contra assinaturas conhecidas de cada planilha.
  return null;
}
