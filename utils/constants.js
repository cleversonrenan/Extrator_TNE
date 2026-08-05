/**
 * constants.js
 * -----------------------------------------------------------------------
 * Constantes de domínio do CSM Dashboard (TNE). Nenhuma lógica aqui —
 * só dados fixos, pra evitar "números/strings mágicos" espalhados pelo
 * resto do código (regra de Clean Code pedida no prompt mestre).
 * -----------------------------------------------------------------------
 */

/** Nomes possíveis de coluna, por planilha, pra cada campo normalizado. */
export const COLUMN_MAP = {
  TSK: ['Número de Ordem', 'TSK', 'Ordem', 'Ticket'],
  NE: ['Nome do NE', 'NE', 'NE ID', 'Elemento', 'Network Element'],
  END_ID: ['END_ID', 'End ID', 'END ID'],
  CIDADE: ['Cidade'],
  UF: ['UF', 'Estado'],
  PRIORIDADE: ['Faixa Priorização Dispatching', 'Prioridade'],
  STATUS: ['Estado', 'Status'],
  TECNICO: ['Nome do colaborador do iSOC', 'Técnico', 'Colaborador'],
  FALHA: ['Descrição da Falha'],
  SOLUCAO: ['Descrição da Solução'],
  SUSPENSAO: ['Motivo da Suspensão'],
  SEGMENTO: ['Segmento de Atendimento'],
  REPETIDO: ['Repetido'],
  SLA_FIM: ['Fim SLA', 'SLA Fim', 'Fim do SLA'],
  TIPO_FALHA: ['Tipo da Falha'],
  SITES_DEPENDENTES: ['Sites Dependentes por Tx', 'Sites Dependentes por TX', 'Sites Dependentes'],
  ID_EVENTO: ['Número de Ordem', 'TSK', 'Ordem', 'Ticket', 'NE ID', 'END_ID', 'end_id', 'id'],
};

/** Prioridades válidas do sistema, na ordem de criticidade. */
export const PRIORITY_KEYS = ['P1', 'P2', 'P3', 'P4', 'P5'];

/** Chaves usadas no filtro de SLA. */
export const SLA_KEYS = ['noprazo', 'vencidos'];

/** Chaves usadas no filtro de cruzamento (Fora / Verificando / Concentrador). */
export const CRUZ_KEYS = ['fora', 'verificar', 'concentrador'];

/**
 * Estados de andamento (coluna "Estado" das planilhas de atividade) que
 * continuam visíveis no dashboard. "Concluída" e "Cancelada" são
 * permanentemente excluídos — ver FilterService.excludeFinalizados().
 */
export const ESTADO_KEYS = ['pendente', 'iniciada', 'naoiniciada'];
export const ESTADOS_EXCLUIDOS = ['concluida', 'cancelada'];

/** Regra de negócio: quais UFs pertencem a cada sub-região do TNE. */
export const TNE_MAP = {
  tne1: ['AL', 'BA', 'SE', 'PI'],
  tne2: ['PE', 'PB', 'RN', 'CE'],
};

/** Aceita o nome por extenso do estado além da sigla, na coluna UF. */
export const UF_FULLNAME_MAP = {
  ALAGOAS: 'AL', BAHIA: 'BA', SERGIPE: 'SE', PIAUI: 'PI',
  PERNAMBUCO: 'PE', PARAIBA: 'PB', 'RIO GRANDE DO NORTE': 'RN', CEARA: 'CE',
};

/** Regra de negócio do marcador "Missão Crítica" (MC). */
export const MISSAO_CRITICA_MIN_SITES_DEPENDENTES = 4;
export const MISSAO_CRITICA_TIPO_FALHA = 'energia';
