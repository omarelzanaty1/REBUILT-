/* ============================================================
   REBUILT — router.js
   No history/URL routing needed for a single-screen app shell —
   just swap which page section is rendered into #page-content.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Router = (function () {
  const PAGE_ORDER = ["dashboard", "habits", "tasks", "planner", "analytics", "achievements", "ai", "profile", "settings"];
  let current = "dashboard";

  function pageModule(name) {
    return REBUILT.Pages[name] || REBUILT.Pages.dashboard;
  }

  /** Page named by the URL hash (e.g. "#ai"), or null. Anything else — such as
   *  Supabase's "#access_token=..." after an email-confirmation redirect — is ignored. */
  function pageFromHash() {
    const name = (window.location.hash || "").replace(/^#\/?/, "");
    return PAGE_ORDER.includes(name) ? name : null;
  }

  /** Keep the address bar in step with the page, without adding history entries. */
  function syncHash(name) {
    try {
      if (window.location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
    } catch (err) {
      // Some sandboxed/embedded contexts refuse this — the URL is a convenience only.
    }
  }

  function navigateTo(name) {
    if (!PAGE_ORDER.includes(name)) name = "dashboard";
    current = name;
    syncHash(name);
    renderCurrent();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.nav === name);
    });
    const moreBtn = document.getElementById("mobile-more-btn");
    if (moreBtn) moreBtn.classList.toggle("is-active", ["achievements", "settings", "planner", "ai"].includes(name));
    const content = document.getElementById("page-content");
    if (content) content.scrollTop = 0;
    document.querySelectorAll(".mobile-more-sheet").forEach((el) => el.remove());
  }

  function renderCurrent() {
    const state = REBUILT.App.state;
    const mod = pageModule(current);
    const content = document.getElementById("page-content");
    if (!content) return;
    content.innerHTML = mod.render(state);
    content.classList.remove("page-enter");
    void content.offsetWidth; // restart animation
    content.classList.add("page-enter");
    if (typeof mod.afterRender === "function") mod.afterRender(content, state);
    renderGlobalWidgets(state);
  }

  /** Bits that live outside #page-content but still depend on state (sidebar user card, mobile nav badge). */
  function renderGlobalWidgets(state) {
    const streakBadge = document.getElementById("sidebar-streak");
    if (streakBadge) streakBadge.textContent = state.streak.current;

    const nameEl = document.getElementById("sidebar-username");
    if (nameEl) nameEl.textContent = state.user.name;

    const avatarEl = document.getElementById("sidebar-avatar");
    if (avatarEl) avatarEl.textContent = state.user.avatar;

    const levelInfo = REBUILT.XP.getLevelInfo(state.xp.total);
    const levelEl = document.getElementById("sidebar-level");
    if (levelEl) levelEl.textContent = levelInfo.level;
  }

  function getCurrent() {
    return current;
  }

  // Typing/pasting a route (e.g. ".../#ai") while the app is already open.
  // Ignored at the sign-in gate: the existing gate still comes first, and the
  // hash is honoured once the user is through it (see App.onGatePassed).
  window.addEventListener("hashchange", () => {
    const target = pageFromHash();
    const app = document.getElementById("app");
    const appVisible = app && window.getComputedStyle(app).display !== "none";
    if (target && target !== current && appVisible && REBUILT.App && REBUILT.App.state) navigateTo(target);
  });

  return { navigateTo, renderCurrent, getCurrent, pageFromHash, PAGE_ORDER };
})();
