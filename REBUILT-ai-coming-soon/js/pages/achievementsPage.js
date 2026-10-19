/* ============================================================
   REBUILT — pages/achievementsPage.js
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.achievements = (function () {
  const { Components } = REBUILT;

  function render(state) {
    const list = REBUILT.Achievements.getEnriched(state);
    const unlockedCount = list.filter((a) => a.unlocked).length;

    return `
      <section class="page-header">
        <h1 class="page-header__title">الإنجازات</h1>
        <span class="page-header__meta">${unlockedCount} من ${list.length}</span>
      </section>
      <section class="badge-grid">
        ${list.map(Components.achievementBadge).join("")}
      </section>
    `;
  }

  return { render };
})();
