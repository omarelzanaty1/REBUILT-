/* ============================================================
   REBUILT — modal.js
   One reusable modal shell. Pages hand it a title + inner HTML
   and get a callback once it's in the DOM to wire up their form.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Modal = (function () {
  let root;

  function ensureRoot() {
    if (!root) root = document.getElementById("modal-root");
    return root;
  }

  function open(opts) {
    const el = ensureRoot();
    if (!el) return;
    el.innerHTML = `
      <div class="modal-overlay" data-modal-overlay>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title">${opts.title || ""}</h2>
            <button class="icon-btn" data-modal-close aria-label="إغلاق">${REBUILT.Icons.close}</button>
          </div>
          <div class="modal__body">${opts.body}</div>
        </div>
      </div>
    `;
    requestAnimationFrame(() => el.querySelector(".modal-overlay").classList.add("is-visible"));

    el.querySelector("[data-modal-overlay]").addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-modal-overlay")) close();
    });
    el.querySelector("[data-modal-close]").addEventListener("click", close);
    document.addEventListener("keydown", escHandler);

    if (typeof opts.onMount === "function") opts.onMount(el.querySelector(".modal"));
  }

  function escHandler(e) {
    if (e.key === "Escape") close();
  }

  function close() {
    const el = ensureRoot();
    if (!el) return;
    const overlay = el.querySelector(".modal-overlay");
    if (overlay) overlay.classList.remove("is-visible");
    document.removeEventListener("keydown", escHandler);
    setTimeout(() => {
      if (el) el.innerHTML = "";
    }, 200);
  }

  return { open, close };
})();
