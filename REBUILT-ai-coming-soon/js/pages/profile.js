/* ============================================================
   REBUILT — pages/profile.js
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.profile = (function () {
  const { XP, Data, Charts } = REBUILT;

  function render(state) {
    const levelInfo = XP.getLevelInfo(state.xp.total);
    const achievements = REBUILT.Achievements.getEnriched(state);
    const unlockedAchievements = achievements.filter((a) => a.unlocked);
    const habitsCompletedTotal = state.habits.reduce((sum, h) => sum + (h.completionHistory || []).length, 0);
    const tasksCompletedTotal = state.tasks.filter((t) => t.completed).length;
    const daysSinceStart = state.user.createdAt
      ? Math.max(1, Math.round((Date.now() - new Date(state.user.createdAt)) / 86400000))
      : 1;

    return `
      <section class="page-header">
        <h1 class="page-header__title">الملف الشخصي</h1>
      </section>

      <section class="profile-hero">
        <div class="profile-hero__avatar">${state.user.avatar || "🧑"}</div>
        <div class="profile-hero__info">
          <h2 class="profile-hero__name">${state.user.name || "بطل REBUILT"} <button class="icon-btn" id="edit-name-btn" aria-label="تعديل الاسم">${REBUILT.Icons.edit}</button></h2>
          <p class="profile-hero__meta">بيبني نفسه من ${daysSinceStart} يوم 🚀</p>
        </div>
        <div class="profile-hero__level">
          ${Charts.radialProgress({ pct: levelInfo.progressPct, size: 84, strokeWidth: 8, color: "var(--accent)" })}
          <div class="profile-hero__level-num">${levelInfo.level}</div>
        </div>
      </section>

      <section class="grid grid--stats">
        ${statCard("⚡", "XP إجمالي", fmt(state.xp.total))}
        ${statCard("🔥", "السلسلة الحالية", state.streak.current + " يوم")}
        ${statCard("🏆", "أطول سلسلة", state.streak.longest + " يوم")}
        ${statCard("🎯", "إنجازات مفتوحة", `<bdi>${unlockedAchievements.length} / ${achievements.length}</bdi>`)}
      </section>

      <section class="grid grid--2">
        ${statCard("✅", "عادات مكتملة (الكل)", fmt(habitsCompletedTotal))}
        ${statCard("📋", "مهام مكتملة (الكل)", fmt(tasksCompletedTotal))}
      </section>

      <section class="card">
        <div class="card__header">
          <h2 class="card__title">آخر إنجازاتك</h2>
          <a class="link" data-nav="achievements">كل الإنجازات</a>
        </div>
        ${unlockedAchievements.length ? `
          <div class="badge-grid badge-grid--compact">
            ${unlockedAchievements.slice(-6).reverse().map((a) => `
              <div class="badge-card is-unlocked">
                <div class="badge-card__icon">${a.icon}</div>
                <div class="badge-card__name">${a.name}</div>
              </div>
            `).join("")}
          </div>
        ` : `<p class="card__note">لسه رحلتك بادئة، أول إنجاز جاي قريب 👀</p>`}
      </section>
    `;
  }

  function statCard(icon, label, value) {
    return `
      <div class="stat-card">
        <span class="stat-card__icon">${icon}</span>
        <span class="stat-card__value">${value}</span>
        <span class="stat-card__label">${label}</span>
      </div>
    `;
  }

  function afterRender(container, state) {
    const btn = document.getElementById("edit-name-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      REBUILT.Modal.open({
        title: "تعديل الاسم",
        body: `
          <form class="form" id="edit-name-form">
            <label class="field">
              <span class="field__label">الاسم</span>
              <input class="field__input" type="text" name="name" maxlength="30" value="${(state.user.name || "").replace(/"/g, "&quot;")}" />
            </label>
            <div class="form__actions">
              <span></span>
              <button type="submit" class="btn btn--primary">حفظ</button>
            </div>
          </form>
        `,
        onMount: (modalEl) => {
          modalEl.querySelector("#edit-name-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const name = new FormData(e.target).get("name").toString().trim();
            if (!name) {
              REBUILT.Toast.error("محتاج اسم مش فاضي.");
              return;
            }
            REBUILT.Actions.updateProfile({ name });
            REBUILT.Modal.close();
          });
        },
      });
    });
  }

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  return { render, afterRender };
})();
