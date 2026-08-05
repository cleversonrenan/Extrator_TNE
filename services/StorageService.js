/**
 * StorageService.js
 * -----------------------------------------------------------------------
 * Camada fina sobre o LocalStorage. Centralizada aqui para que, se um
 * dia a persistência mudar de LocalStorage para IndexedDB ou API, só
 * este arquivo precise mudar.
 *
 * OBS: por decisão de escopo (ver DIAGNOSTICO_E_ARQUITETURA.md), esta
 * primeira entrega só persiste tema e filtros — não persiste os dados
 * das planilhas em si (esses continuam exigindo novo upload a cada
 * sessão, que é o comportamento atual; persistir dataset inteiro em
 * LocalStorage tem limite de ~5MB e pode não caber em bases grandes).
 * -----------------------------------------------------------------------
 */

const NAMESPACE = 'csm-dashboard::';

function safeGet(key) {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch (_e) {
    /* localStorage indisponível (modo privado, quota etc.) — falha silenciosa */
  }
}

export const StorageService = {
  getTheme: () => safeGet('theme') || 'light',
  setTheme: (theme) => safeSet('theme', theme),

  getLastFilters: () => safeGet('lastFilters'),
  setLastFilters: (filters) => safeSet('lastFilters', filters),

  getVisibleColumns: () => safeGet('visibleColumns'),
  setVisibleColumns: (columns) => safeSet('visibleColumns', columns),
};
