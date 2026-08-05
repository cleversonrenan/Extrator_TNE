/**
 * AgendadasParser.js
 * -----------------------------------------------------------------------
 * Planilha "Atividades-TNE_FMMT_*.xlsx" — intervenções programadas.
 * Hoje o formato é idêntico ao de Não Agendadas; a classe existe
 * separada porque, na prática operacional, os dois arquivos têm ciclo
 * de atualização e regras de negócio diferentes (agendada tem SLA de
 * execução, por exemplo) e é questão de tempo até divergirem em campos.
 * Mantê-los sem se aproveitar de uma só função com `if` evita que uma
 * mudança na regra de uma quebre a outra silenciosamente.
 * -----------------------------------------------------------------------
 */

import { BaseParser } from './BaseParser.js';

export class AgendadasParser extends BaseParser {
  constructor() {
    super('agendadas');
  }
}
