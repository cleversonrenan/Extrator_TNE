/**
 * colors.js
 * -----------------------------------------------------------------------
 * Paletas de cor usadas nos badges da tabela e nos futuros gráficos.
 * Mantidas centralizadas para permitir, no futuro, um tema por cliente
 * ou por regional sem tocar em CSS nem em Table.js.
 * -----------------------------------------------------------------------
 */

export const DEFAULT_BADGE_COLOR = ['#f0f0f5', '#333336'];

/** [background, texto] por UF do TNE. */
export const UF_COLORS = {
  AL: ['#e8f5e9', '#2e7d32'],
  BA: ['#e3f2fd', '#1565c0'],
  SE: ['#fff3e0', '#e65100'],
  PI: ['#f3e5f5', '#6a1b9a'],
  PE: ['#e0f7fa', '#00695c'],
  PB: ['#fce4ec', '#ad1457'],
  RN: ['#ede7f6', '#4527a0'],
  CE: ['#fff8e1', '#f57f17'],
};

/** [background, texto] por sub-região TNE. */
export const TNE_COLORS = {
  TNE1: ['#f3e5f5', '#6a1b9a'],
  TNE2: ['#e0f2f1', '#00695c'],
};

/** Classe CSS por prioridade (ligada a badge-p1..badge-p5 no tables.css). */
export const PRIORITY_BADGE_CLASS = {
  P1: 'badge-p1',
  P2: 'badge-p2',
  P3: 'badge-p3',
  P4: 'badge-p4',
  P5: 'badge-p5',
};

/** Classe da linha (background bem claro) por prioridade. */
export const PRIORITY_ROW_CLASS = {
  P1: 'row-p1',
  P2: 'row-p2',
  P3: 'row-p3',
  P4: 'row-p4',
  P5: 'row-p5',
};
