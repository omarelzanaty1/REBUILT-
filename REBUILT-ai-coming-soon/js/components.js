/* ============================================================
   REBUILT — components.js
   Shared row/badge markup reused across the Dashboard, Habits,
   Tasks, Planner and Achievements pages.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Components = (function () {
  const { todayISO } = REBUILT.Data;

  function frequencyLabel(habit) {
    if (!habit.frequency || habit.frequency === "daily") return "كل يوم";
    if (habit.frequency === "weekly") return "أسبوعيًا";
    if (Array.isArray(habit.targetDays) && habit.targetDays.length) {
      return habit.targetDays.map((d) => REBUILT.Data.WEEKDAY_LABELS[d]).join("، ");
    }
    return "أيام محددة";
  }

  function habitRow(habit) {
    const today = todayISO(0);
    const done = habit.completionHistory.includes(today);
    return `
      <div class="row row--habit ${done ? "is-done" : ""}" data-habit-id="${habit.id}">
        <button class="row__check" data-action="toggle-habit" data-id="${habit.id}" aria-pressed="${done}" aria-label="تحديد ${habit.title}">
          ${done ? REBUILT.Icons.check : ""}
        </button>
        <span class="row__icon">${habit.icon || "🎯"}</span>
        <div class="row__body">
          <span class="row__title">${habit.title}</span>
          <span class="row__meta">
            <span class="row__freq">${frequencyLabel(habit)}</span>
            ${habit.time ? `<bdi>${habit.time}</bdi>` : ""}
            ${habit.currentStreak > 0 ? `🔥 ${habit.currentStreak}` : ""}
          </span>
        </div>
        <span class="row__xp"><bdi>+${habit.xp} XP</bdi></span>
        <div class="row__actions">
          <button class="icon-btn" data-action="edit-habit" data-id="${habit.id}" aria-label="تعديل">${REBUILT.Icons.edit}</button>
          <button class="icon-btn icon-btn--danger" data-action="delete-habit" data-id="${habit.id}" aria-label="حذف">${REBUILT.Icons.trash}</button>
        </div>
      </div>
    `;
  }

  const PRIORITY_LABEL = { urgent: "عاجلة", high: "عالية", medium: "متوسطة", low: "منخفضة" };

  function priorityBadge(priority) {
    return `<span class="badge badge--priority-${priority}">${PRIORITY_LABEL[priority] || priority}</span>`;
  }

  function taskRow(task) {
    const today = todayISO(0);
    const isOverdue = !task.completed && task.date && task.date < today;
    return `
      <div class="row row--task ${task.completed ? "is-done" : ""}" data-task-id="${task.id}">
        <button class="row__check" data-action="toggle-task" data-id="${task.id}" aria-pressed="${task.completed}" aria-label="تحديد ${task.title}">
          ${task.completed ? REBUILT.Icons.check : ""}
        </button>
        <div class="row__body">
          <span class="row__title">${task.title}</span>
          <span class="row__meta ${isOverdue ? "row__meta--overdue" : ""}">
            ${priorityBadge(task.priority)}
            ${task.date ? `<span class="row__date">${REBUILT.Icons.calendar} ${formatDate(task.date)}${task.time ? " · <bdi>" + task.time + "</bdi>" : ""}</span>` : ""}
            ${isOverdue ? "متأخرة" : ""}
          </span>
        </div>
        <span class="row__xp"><bdi>+${task.xp} XP</bdi></span>
        <div class="row__actions">
          <button class="icon-btn" data-action="edit-task" data-id="${task.id}" aria-label="تعديل">${REBUILT.Icons.edit}</button>
          <button class="icon-btn icon-btn--danger" data-action="delete-task" data-id="${task.id}" aria-label="حذف">${REBUILT.Icons.trash}</button>
        </div>
      </div>
    `;
  }

  function scheduleRow(item, opts) {
    opts = opts || {};
    const typeIcon = { task: "✅", habit: "🔥", event: "📌", break: "☕" }[item.type] || "📌";
    return `
      <div class="row row--schedule ${item.completed ? "is-done" : ""}" data-schedule-id="${item.id}">
        <button class="row__check" data-action="${opts.checkAction || "toggle-schedule-item"}" data-id="${item.id}" aria-pressed="${item.completed}" aria-label="تحديد ${item.title}">
          ${item.completed ? REBUILT.Icons.check : ""}
        </button>
        <span class="row__icon">${typeIcon}</span>
        <div class="row__body">
          <span class="row__title">${item.title}</span>
          <span class="row__meta"><bdi>${item.startTime}${item.endTime ? "–" + item.endTime : ""}</bdi>${item.notes ? " · " + item.notes : ""}</span>
        </div>
        ${opts.editable !== false ? `
        <div class="row__actions">
          <button class="icon-btn" data-action="edit-schedule-item" data-id="${item.id}" aria-label="تعديل">${REBUILT.Icons.edit}</button>
          <button class="icon-btn icon-btn--danger" data-action="delete-schedule-item" data-id="${item.id}" aria-label="حذف">${REBUILT.Icons.trash}</button>
        </div>` : ""}
      </div>
    `;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  }

  function achievementBadge(ach) {
    return `
      <div class="badge-card ${ach.unlocked ? "is-unlocked" : "is-locked"}" data-achievement-id="${ach.id}" tabindex="0" role="button" aria-label="${ach.name}">
        <div class="badge-card__icon">${ach.unlocked ? ach.icon : "🔒"}</div>
        <div class="badge-card__name">${ach.name}</div>
        <div class="badge-card__desc">${ach.unlocked ? ach.description : "لسه مقفول"}</div>
        ${ach.unlocked ? `<div class="badge-card__date">${formatDate(ach.unlockedAt)}</div>` : ""}
      </div>
    `;
  }

  function emptyState(message, ctaLabel, ctaAction) {
    return `
      <div class="empty-state">
        <p class="empty-state__text">${message.replace(/\n/g, "<br/>")}</p>
        ${ctaLabel ? `<button class="btn btn--primary" data-action="${ctaAction}">${ctaLabel}</button>` : ""}
      </div>
    `;
  }

  return { habitRow, taskRow, scheduleRow, priorityBadge, achievementBadge, emptyState, formatDate, frequencyLabel };
})();
