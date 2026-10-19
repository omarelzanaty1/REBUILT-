/* ============================================================
   REBUILT — icons.js
   Minimal 20x20 stroke icons for functional controls. Habit and
   achievement icons are emoji on purpose — that's REBUILT's voice.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Icons = (function () {
  const base = (paths, viewBox) => `
    <svg viewBox="${viewBox || "0 0 20 20"}" width="1em" height="1em" fill="none" stroke="currentColor"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>
  `;

  return {
    plus: base('<path d="M10 4v12M4 10h12"/>'),
    edit: base('<path d="M13.5 3.5l3 3L6 17l-3.5.5L3 14l10.5-10.5z"/>'),
    trash: base('<path d="M4 6h12M8 6V4h4v2M6 6l.7 10a1 1 0 001 .9h4.6a1 1 0 001-1L14 6"/>'),
    close: base('<path d="M5 5l10 10M15 5L5 15"/>'),
    chevronDown: base('<path d="M5 8l5 5 5-5"/>'),
    check: base('<path d="M4 10l4 4 8-9"/>'),
    calendar: base('<path d="M4 8h12M6 3v3M14 3v3M4 6a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V6z"/>'),
    flag: base('<path d="M5 3v14M5 4h8l-2 3 2 3H5"/>'),
    menu: base('<path d="M3 6h14M3 10h14M3 14h14"/>'),
    more: base('<circle cx="4" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none"/>'),
    fire: base('<path d="M10 2c1 3-3 4-3 7a3 3 0 006 0c0-1-.5-1.5-1-2 1.5.5 3 2 3 4a5 5 0 01-10 0c0-4 3-4 5-9z"/>'),
    x_circle: base('<circle cx="10" cy="10" r="7"/><path d="M8 8l4 4M12 8l-4 4"/>'),
  };
})();
