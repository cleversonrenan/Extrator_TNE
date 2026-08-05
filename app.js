/**
 * app.js
 * -----------------------------------------------------------------------
 * Ponto de entrada. Mantém o único objeto de estado da aplicação
 * (substituindo as ~25 variáveis globais soltas do HTML legado) e
 * orquestra os componentes/serviços a cada mudança (novo upload ou
 * clique em filtro).
 * -----------------------------------------------------------------------
 */

import { importAtividades, importBaseAuxiliar, importEventosTexto } from './services/ImportService.js';
import { mergeSources, applyCrossReference, applyFilters, emptyFilterState } from './services/FilterService.js';
import { getSlaInfo } from './services/SLAService.js';
import { mountUploadCard, renderUploadStatus, renderUploadError } from './components/UploadCard.js';
import { initFilters, renderUfButtons, refreshActiveStates } from './components/Filters.js';
import { renderTable, sortItems } from './components/Table.js';
import { renderStatsCards } from './components/StatsCards.js';
import { renderHeader } from './components/Header.js';
import { initToolbar } from './components/Toolbar.js';
import { showToast } from './components/Toast.js';
import { StorageService } from './services/StorageService.js';

/** Estado único da aplicação (substitui as variáveis globais do HTML legado). */
const state = {
  raw: { agendadas: [], naoagendadas: [], genesis: [] },
  crossData: { concentradorIds: new Set(), missaoCriticaIds: new Set() },
  combined: [],
  filters: emptyFilterState(),
  sort: { field: 'uf', asc: true },
};

const dom = {
  header: document.getElementById('appHeader'),
  filterBar: document.getElementById('filterBar'),
  ufFilterGroup: document.getElementById('ufFilterGroup'),
  statsCards: document.getElementById('statsCards'),
  tableBody: document.getElementById('tableBody'),
  searchInput: document.getElementById('searchInput'),
  btnXlsx: document.getElementById('btnExportXlsx'),
  btnCsv: document.getElementById('btnExportCsv'),
  btnCopy: document.getElementById('btnExportCopy'),
  rowCount: document.getElementById('rowCount'),
};

/** Recalcula o dataset combinado (merge + cruzamento) a partir do estado bruto. */
function recomputeCombined() {
  const merged = mergeSources(state.raw);
  state.combined = applyCrossReference(merged, state.crossData.concentradorIds, state.crossData.missaoCriticaIds);
}

/** Aplica filtros + ordenação e redesenha tabela, stats e header. */
function renderAll() {
  let visible = applyFilters(state.combined, state.filters, getSlaInfo);
  visible = sortItems(visible, state.sort.field, state.sort.asc);

  renderTable(dom.tableBody, visible);
  renderStatsCards(dom.statsCards, visible);
  renderHeader(dom.header, visible.length);
  renderUfButtons(dom.ufFilterGroup, state.combined, state.filters, renderAll);
  refreshActiveStates(dom.filterBar, state.filters);
  dom.rowCount.textContent = visible.length.toLocaleString('pt-BR');

  StorageService.setLastFilters({
    uf: [...state.filters.uf],
    prioridades: [...state.filters.prioridades],
    sla: [...state.filters.sla],
    cruzamento: [...state.filters.cruzamento],
    tneRegion: state.filters.tneRegion,
    estado: [...state.filters.estado],
  });
}

function getVisibleItemsNow() {
  return sortItems(applyFilters(state.combined, state.filters, getSlaInfo), state.sort.field, state.sort.asc);
}

/** Liga um card de upload de planilha de Atividades (Agendadas/Não Agendadas). */
function wireAtividadesCard(slotId, tipo) {
  const root = document.getElementById(slotId);
  const statusEl = root.querySelector('.slot-status');
  mountUploadCard({
    root,
    mode: 'file',
    onInput: async (file) => {
      try {
        const result = await importAtividades(file, tipo);
        state.raw[tipo] = result.items;
        renderUploadStatus(statusEl, result.stats);
        recomputeCombined();
        renderAll();
        showToast(`${result.stats.validos} registros de ${tipo === 'agendadas' ? 'Agendadas' : 'Não Agendadas'} carregados`, 'success');
      } catch (err) {
        renderUploadError(statusEl, err.message);
        showToast(err.message, 'error');
      }
    },
    onClear: () => {
      state.raw[tipo] = [];
      recomputeCombined();
      renderAll();
    },
  });
}

/** Liga o card de Base Auxiliar (u_task_evento: concentradores + missão crítica). */
function wireBaseAuxiliarCard() {
  const root = document.getElementById('slotBaseAuxiliar');
  const statusEl = root.querySelector('.slot-status');
  mountUploadCard({
    root,
    mode: 'file',
    onInput: async (file) => {
      try {
        const result = await importBaseAuxiliar(file);
        state.crossData = result.crossData;
        renderUploadStatus(statusEl, result.stats);
        recomputeCombined();
        renderAll();
        showToast(`${result.stats.validos} concentradores • ${result.stats.missaoCritica} em Missão Crítica`, 'success');
      } catch (err) {
        renderUploadError(statusEl, err.message);
        showToast(err.message, 'error');
      }
    },
    onClear: () => {
      state.crossData = { concentradorIds: new Set(), missaoCriticaIds: new Set() };
      recomputeCombined();
      renderAll();
    },
  });
}

/** Liga o card de Eventos (texto colado do Gênesis). */
function wireEventosCard() {
  const root = document.getElementById('slotEventos');
  const statusEl = root.querySelector('.slot-status');
  mountUploadCard({
    root,
    mode: 'textarea',
    onInput: (text) => {
      try {
        const result = importEventosTexto(text);
        state.raw.genesis = result.items;
        renderUploadStatus(statusEl, result.stats);
        recomputeCombined();
        renderAll();
      } catch (err) {
        renderUploadError(statusEl, err.message);
        showToast(err.message, 'error');
      }
    },
    onClear: () => {
      state.raw.genesis = [];
      recomputeCombined();
      renderAll();
    },
  });
}

function wireSortableHeaders() {
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      state.sort.asc = state.sort.field === field ? !state.sort.asc : true;
      state.sort.field = field;
      renderAll();
    });
  });
}

function wireResetButton() {
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    state.filters = emptyFilterState();
    dom.searchInput.value = '';
    renderAll();
  });
}

function wireThemeToggle() {
  const btn = document.getElementById('themeToggle');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Escuro';
  };
  const current = StorageService.getTheme();
  applyTheme(current);
  btn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    StorageService.setTheme(next);
  });
}

function init() {
  wireThemeToggle();
  wireAtividadesCard('slotAgendadas', 'agendadas');
  wireAtividadesCard('slotNaoAgendadas', 'naoagendadas');
  wireEventosCard();
  wireBaseAuxiliarCard();

  initFilters(dom.filterBar, state.filters, renderAll);
  wireSortableHeaders();
  wireResetButton();

  initToolbar({
    searchInput: dom.searchInput,
    btnXlsx: dom.btnXlsx,
    btnCsv: dom.btnCsv,
    btnCopy: dom.btnCopy,
    onSearch: (term) => {
      state.filters.searchTerm = term;
      renderAll();
    },
    getVisibleItems: getVisibleItemsNow,
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
