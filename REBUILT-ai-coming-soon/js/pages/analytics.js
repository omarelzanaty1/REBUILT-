/* ============================================================
   REBUILT — pages/analytics.js
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.analytics = (function () {
  const { Charts, Data } = REBUILT;

  function lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) days.push(Data.todayISO(-i));
    return days;
  }

  function entryOf(state, date) {
    return state.history[date] || { habitsCompleted: 0, totalHabits: 0, tasksCompleted: 0, xpEarned: 0 };
  }

  function render(state) {
    if (!REBUILT.Helpers.hasEnoughHistoryForAnalytics(state)) {
      return `
        <section class="page-header">
          <h1 class="page-header__title">الإحصائيات</h1>
        </section>
        <section class="card">
          <div class="empty-state">
            <p class="empty-state__text">لسه محتاجين شوية بيانات عشان نطلعلك تحليل محترم 👀<br/>كمّل عاداتك ومهامك كام يوم وارجع تاني.</p>
          </div>
        </section>
      `;
    }

    const week = lastNDays(7);
    const month = lastNDays(30);

    const weeklyCompletion = week.map((date) => {
      const e = entryOf(state, date);
      const day = new Date(date + "T00:00:00").getDay();
      const pct = e.totalHabits > 0 ? Math.round((e.habitsCompleted / e.totalHabits) * 100) : 0;
      return { label: Data.WEEKDAY_LABELS[day], value: pct };
    });

    const weeklyXP = week.map((date) => {
      const e = entryOf(state, date);
      const day = new Date(date + "T00:00:00").getDay();
      return { label: Data.WEEKDAY_LABELS[day], value: e.xpEarned };
    });

    // Overall completion rate across everything we've tracked.
    let totalPossible = 0;
    let totalDone = 0;
    Object.values(state.history).forEach((e) => {
      totalPossible += e.totalHabits || 0;
      totalDone += e.habitsCompleted || 0;
    });
    const overallRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    const monthCompleted = month.reduce((sum, d) => sum + entryOf(state, d).habitsCompleted, 0);
    const monthXP = month.reduce((sum, d) => sum + entryOf(state, d).xpEarned, 0);
    const weekXP = week.reduce((sum, d) => sum + entryOf(state, d).xpEarned, 0);

    const tasksCompletedTotal = state.tasks.filter((t) => t.completed).length;
    const tasksCompletedWeek = state.tasks.filter((t) => t.completed && week.includes(t.completedAt)).length;

    const topHabits = state.habits
      .map((h) => ({ habit: h, count: (h.completionHistory || []).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Most productive weekday, aggregated across all recorded history.
    const xpByWeekday = [0, 0, 0, 0, 0, 0, 0];
    Object.keys(state.history).forEach((date) => {
      const day = new Date(date + "T00:00:00").getDay();
      xpByWeekday[day] += state.history[date].xpEarned || 0;
    });
    const bestDayIndex = xpByWeekday.indexOf(Math.max(...xpByWeekday));
    const bestDayLabel = Math.max(...xpByWeekday) > 0 ? Data.WEEKDAY_LABELS[bestDayIndex] : "—";

    return `
      <section class="page-header">
        <h1 class="page-header__title">الإحصائيات</h1>
      </section>

      <section class="grid grid--stats">
        ${statCard("⚡", "XP الكلي", fmt(state.xp.total))}
        ${statCard("🔥", "أطول سلسلة", state.streak.longest + " يوم")}
        ${statCard("✅", "مهام مكتملة", fmt(tasksCompletedTotal))}
        ${statCard("📆", "أكتر يوم إنتاجية", bestDayLabel)}
      </section>

      <section class="grid grid--2">
        <div class="card">
          <div class="card__header"><h2 class="card__title">تقدم آخر 7 أيام</h2></div>
          ${Charts.barChart(weeklyCompletion, { color: "var(--accent)", suffix: "%" })}
          <p class="card__submeta">متوسط الأسبوع بيعتمد على العادات المفعّلة في كل يوم.</p>
        </div>
        <div class="card">
          <div class="card__header"><h2 class="card__title">XP آخر 7 أيام</h2></div>
          ${Charts.barChart(weeklyXP, { color: "var(--accent-2)" })}
          <p class="card__submeta">إجمالي الأسبوع: <bdi>${fmt(weekXP)} XP</bdi></p>
        </div>
      </section>

      <section class="grid grid--2">
        <div class="card card--center">
          <div class="card__header"><h2 class="card__title">نسبة إنجاز العادات</h2></div>
          <div class="rate-ring">
            ${Charts.radialProgress({ pct: overallRate, size: 140, strokeWidth: 12, color: "var(--good)", ariaLabel: "نسبة الإنجاز" })}
            <div class="rate-ring__center">
              <span class="rate-ring__value">${overallRate}%</span>
            </div>
          </div>
          <p class="card__submeta">من إجمالي ${fmt(totalPossible)} فرصة إنجاز مسجّلة.</p>
        </div>

        <div class="card">
          <div class="card__header"><h2 class="card__title">أفضل عاداتك</h2></div>
          ${topHabits.length ? `
            <ol class="ranked-list">
              ${topHabits.map((t, i) => `
                <li class="ranked-list__item">
                  <span class="ranked-list__rank">${i + 1}</span>
                  <span class="ranked-list__icon">${t.habit.icon}</span>
                  <span class="ranked-list__name">${t.habit.title}</span>
                  <span class="ranked-list__count">${t.count} مرة</span>
                </li>
              `).join("")}
            </ol>
          ` : `<p class="card__note">لسه مفيش بيانات كفاية.</p>`}
        </div>
      </section>

      <section class="card">
        <div class="card__header"><h2 class="card__title">آخر 30 يوم</h2></div>
        <ul class="stat-list stat-list--inline">
          <li>${monthCompleted} عادة اتعملت</li>
          <li><bdi>${fmt(monthXP)} XP</bdi> اتكسبت</li>
          <li>${tasksCompletedWeek} مهام الأسبوع ده</li>
        </ul>
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

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  return { render };
})();
