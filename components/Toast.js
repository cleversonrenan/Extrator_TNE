/**
 * Toast.js
 * -----------------------------------------------------------------------
 * Notificação temporária no canto da tela. Sem dependências externas.
 * -----------------------------------------------------------------------
 */

let containerEl = null;

function getContainer() {
  if (!containerEl) {
    containerEl = document.createElement('div');
    containerEl.className = 'toast-container';
    document.body.appendChild(containerEl);
  }
  return containerEl;
}

/**
 * @param {string} message
 * @param {'success'|'warn'|'error'|'info'} [type]
 * @param {number} [durationMs]
 */
export function showToast(message, type = 'info', durationMs = 3500) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  getContainer().appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast-visible'));
  setTimeout(() => {
    el.classList.remove('toast-visible');
    setTimeout(() => el.remove(), 300);
  }, durationMs);
}
