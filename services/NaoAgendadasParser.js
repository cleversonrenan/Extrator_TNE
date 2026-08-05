/**
 * NaoAgendadasParser.js
 * -----------------------------------------------------------------------
 * Planilha "Atividades-TNE_FMMT_Não-agendada_*.xlsx" — intervenções não
 * programadas (reativas). Ver comentário em AgendadasParser.js sobre por
 * que os dois parsers existem separados mesmo com regra hoje idêntica.
 * -----------------------------------------------------------------------
 */

import { BaseParser } from './BaseParser.js';

export class NaoAgendadasParser extends BaseParser {
  constructor() {
    super('naoagendadas');
  }
}
