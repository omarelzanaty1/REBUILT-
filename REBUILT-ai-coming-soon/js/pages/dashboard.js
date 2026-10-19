/* ============================================================
   REBUILT — pages/dashboard.js
   Fully dynamic — every number here comes from real state. Brand
   new / emptied-out users get a welcome + CTA view instead of
   dead zeros.
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.dashboard = (function () {
  const { Messages, XP, Streak, Charts, Components, Data, Helpers } = REBUILT;

  function render(state) {
    const today = Data.todayISO(0);
    const levelInfo = XP.getLevelInfo(state.xp.total);

    if (Helpers.isFreshState(state)) {
      return freshHTML(state, levelInfo);
    }

    const entry = Streak.getEntry(state, today);
    const progress = Helpers.calculateDailyProgress(state);
    const activeHabitsToday = Helpers.getTodayHabits(state);
    const remaining = entry.totalHabits - entry.habitsCompleted;

    const todaysTasks = state.tasks
      .filter((t) => !t.completed || t.completedAt === today)
      .filter((t) => !t.date || t.date <= today || t.completed)
      .slice(0, 5);

    const scheduleToday = state.scheduleItems
      .filter((s) => s.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 4);

    const recentAchievements = REBUILT.Achievements.getEnriched(state)
      .filter((a) => a.unlocked)
      .slice(-3)
      .reverse();

    const totalHabitsFinished = state.habits.reduce((sum, h) => sum + (h.completionHistory || []).length, 0);
    const totalTasksFinished = state.tasks.filter((t) => t.completed).length;

    return `
      <section class="hero-card">
        <div class="hero-card__intro">
          <h1 class="hero-card__greeting">${Messages.greeting(state)}</h1>
          <p class="hero-card__sub">${Messages.progressGreeting(state, progress.pct)}</p>
        </div>
        <div class="hero-card__level">
          <div class="level-ring">
            ${Charts.radialProgress({ pct: levelInfo.progressPct, size: 128, strokeWidth: 10, color: "var(--accent)", ariaLabel: "تقدم المستوى" })}
            <div class="level-ring__center">
              <span class="level-ring__label">Level</span>
              <span class="level-ring__value">${levelInfo.level}</span>
            </div>
          </div>
          <div class="level-ring__xp"><bdi>${fmt(levelInfo.currentLevelXP)} / ${fmt(levelInfo.neededForNextLevel)} XP</bdi></div>
        </div>
      </section>

      <section class="grid grid--stats">
        ${statChip("⚡", "XP الكلي", fmt(state.xp.total))}
        ${statChip("✅", "مهام مكتملة", fmt(totalTasksFinished))}
        ${statChip("🔥", "عادات مكتملة", fmt(totalHabitsFinished))}
        ${statChip("🏆", "أطول سلسلة", state.streak.longest + " يوم")}
      </section>

      <section class="grid grid--2">
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">تقدمك النهارده</h2>
            <span class="card__title-value">${progress.pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${progress.pct}%"></div></div>
          <ul class="stat-list">
            <li>${REBUILT.Icons.check} ${entry.habitsCompleted} من ${entry.totalHabits} عادات مكتملة</li>
            <li>${REBUILT.Icons.check} ${entry.tasksCompleted} مهام منجزة</li>
            <li class="stat-list__xp">⚡ <bdi>+${entry.xpEarned} XP</bdi> النهارده</li>
          </ul>
          <p class="card__note">${remaining > 0 ? Messages.fewHabitsLeft(state, remaining) : (entry.totalHabits > 0 ? Messages.allHabitsDone(state) : "")}</p>
        </div>

        <div class="card card--streak">
          <div class="card__header">
            <h2 class="card__title">السلسلة</h2>
          </div>
          <div class="streak-display">
            <span class="streak-display__flame">🔥</span>
            <span class="streak-display__number">${state.streak.current}</span>
            <span class="streak-display__unit">يوم</span>
          </div>
          <p class="card__note">${Messages.streakSubtitle(state, state.streak.current)}</p>
          <p class="card__submeta">أطول سلسلة: ${state.streak.longest} يوم</p>
        </div>
      </section>

      <section class="card">
        <div class="card__header">
          <h2 class="card__title">عادات النهارده</h2>
          <a class="link" data-nav="habits">كل العادات</a>
        </div>
        <div class="row-list">
          ${activeHabitsToday.length ? activeHabitsToday.map(Components.habitRow).join("") : Components.emptyState(Messages.emptyHabits(), "إضافة عادة", "open-add-habit")}
        </div>
      </section>

      <section class="card">
        <div class="card__header">
          <h2 class="card__title">مهام النهارده</h2>
          <a class="link" data-nav="tasks">كل المهام</a>
        </div>
        <div class="row-list">
          ${todaysTasks.length ? todaysTasks.map(Components.taskRow).join("") : Components.emptyState(Messages.emptyTasks(), "إضافة مهمة", "open-add-task")}
        </div>
      </section>

      ${scheduleToday.length ? `
      <section class="card">
        <div class="card__header">
          <h2 class="card__title">خطة يومك</h2>
          <a class="link" data-nav="planner">يومي كامل</a>
        </div>
        <div class="row-list">
          ${scheduleToday.map((s) => Components.scheduleRow(s, { editable: false })).join("")}
        </div>
      </section>` : ""}

      ${recentAchievements.length ? `
      <section class="card">
        <div class="card__header">
          <h2 class="card__title">آخر إنجازاتك</h2>
          <a class="link" data-nav="achievements">كل الإنجازات</a>
        </div>
        <div class="badge-grid badge-grid--compact">
          ${recentAchievements.map((a) => `
            <div class="badge-card is-unlocked">
              <div class="badge-card__icon">${a.icon}</div>
              <div class="badge-card__name">${a.name}</div>
            </div>
          `).join("")}
        </div>
      </section>` : ""}
    `;
  }

  function freshHTML(state, levelInfo) {
    return `
      <section class="hero-card">
        <div class="hero-card__intro">
          <h1 class="hero-card__greeting">${Messages.greeting(state)}</h1>
          <p class="hero-card__sub">${Messages.welcomeFresh().split("\n\n")[1] || ""}</p>
        </div>
        <div class="hero-card__level">
          <div class="level-ring">
            ${Charts.radialProgress({ pct: levelInfo.progressPct, size: 128, strokeWidth: 10, color: "var(--accent)", ariaLabel: "تقدم المستوى" })}
            <div class="level-ring__center">
              <span class="level-ring__label">Level</span>
              <span class="level-ring__value">${levelInfo.level}</span>
            </div>
          </div>
          <div class="level-ring__xp"><bdi>${fmt(levelInfo.currentLevelXP)} / ${fmt(levelInfo.neededForNextLevel)} XP</bdi></div>
        </div>
      </section>

      <section class="card empty-hero">
        <p class="empty-hero__eyebrow">لسه بنبدأ 👀</p>
        <p class="empty-hero__text">ضيف أول عادة أو مهمة وخلي REBUILT يبدأ يبني يومك معاك.</p>
        <div class="empty-hero__actions">
          <button class="btn btn--primary" data-action="open-add-habit">${REBUILT.Icons.plus} إضافة عادة</button>
          <button class="btn btn--secondary" data-action="open-add-task">${REBUILT.Icons.plus} إضافة مهمة</button>
          <button class="btn btn--secondary" data-nav="planner">${REBUILT.Icons.plus} خطط يومك</button>
        </div>
      </section>
    `;
  }

  function statChip(icon, label, value) {
    return `
      <div class="stat-card">
        <span class="stat-card__icon">${icon}</span>
        <span class="stat-card__value">${value}</span>
        <span class="stat-card__label">${label}</span>
      </div>
    `;
  }

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  return { render };
})();
