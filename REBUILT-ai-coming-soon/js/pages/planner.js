/* ============================================================
   REBUILT — pages/planner.js
   "يومي" — a timeline view of one day. Native scheduleItems are
   fully editable here; tasks/habits with a time are shown too
   (read-only in this view) so Planner stays a second lens on the
   same data, never a parallel list — completing them here just
   calls the same toggleTask/toggleHabit actions.
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.planner = (function () {
  const { Data, Components } = REBUILT;
  let selectedDate = Data.todayISO(0);

  function render(state) {
    const dayItems = buildTimeline(state, selectedDate);
    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayLabel = dateObj.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
    const isToday = selectedDate === Data.todayISO(0);

    return `
      <section class="page-header">
        <h1 class="page-header__title">يومي</h1>
        <button class="btn btn--primary" data-action="open-add-schedule-item">${REBUILT.Icons.plus} إضافة</button>
      </section>

      <section class="planner-daybar">
        <button class="icon-btn planner-daybar__nav" id="planner-prev" aria-label="اليوم السابق">›</button>
        <div class="planner-daybar__label">
          <span>${dayLabel}</span>
          ${!isToday ? `<button class="link" id="planner-today">النهارده</button>` : ""}
        </div>
        <button class="icon-btn planner-daybar__nav" id="planner-next" aria-label="اليوم التالي">‹</button>
      </section>

      <section class="card">
        ${dayItems.length ? `<div class="timeline">${dayItems.map(timelineRow).join("")}</div>` : Components.emptyState("لسه مفيش حاجة متخططة لليوم ده 👀\n\nضيف عنصر أو خطط يومك.", "إضافة", "open-add-schedule-item")}
      </section>
    `;
  }

  function buildTimeline(state, date) {
    const items = [];

    state.scheduleItems
      .filter((s) => s.date === date)
      .forEach((s) => items.push({ kind: "schedule", time: s.startTime, data: s }));

    state.tasks
      .filter((t) => t.date === date && t.time)
      .forEach((t) => items.push({ kind: "task", time: t.time, data: t }));

    const dateObj = new Date(date + "T00:00:00");
    state.habits
      .filter((h) => h.time && Data.isHabitActiveOn(h, dateObj))
      .forEach((h) => items.push({ kind: "habit", time: h.time, data: h }));

    return items.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }

  function timelineRow(entry) {
    if (entry.kind === "schedule") return Components.scheduleRow(entry.data);
    if (entry.kind === "task") {
      const t = entry.data;
      return `
        <div class="row row--schedule ${t.completed ? "is-done" : ""}">
          <button class="row__check" data-action="toggle-task" data-id="${t.id}" aria-pressed="${t.completed}">${t.completed ? REBUILT.Icons.check : ""}</button>
          <span class="row__icon">✅</span>
          <div class="row__body">
            <span class="row__title">${t.title}</span>
            <span class="row__meta"><bdi>${t.time}</bdi> · مهمة</span>
          </div>
          <div class="row__actions">
            <button class="icon-btn" data-action="edit-task" data-id="${t.id}" aria-label="تعديل">${REBUILT.Icons.edit}</button>
          </div>
        </div>
      `;
    }
    const h = entry.data;
    const today = Data.todayISO(0);
    const done = h.completionHistory.includes(today);
    return `
      <div class="row row--schedule ${done ? "is-done" : ""}">
        <button class="row__check" data-action="toggle-habit" data-id="${h.id}" aria-pressed="${done}">${done ? REBUILT.Icons.check : ""}</button>
        <span class="row__icon">${h.icon}</span>
        <div class="row__body">
          <span class="row__title">${h.title}</span>
          <span class="row__meta"><bdi>${h.time}</bdi> · عادة</span>
        </div>
        <div class="row__actions">
          <button class="icon-btn" data-action="edit-habit" data-id="${h.id}" aria-label="تعديل">${REBUILT.Icons.edit}</button>
        </div>
      </div>
    `;
  }

  function afterRender(container) {
    const prev = document.getElementById("planner-prev");
    const next = document.getElementById("planner-next");
    const todayBtn = document.getElementById("planner-today");
    if (prev) prev.addEventListener("click", () => shiftDay(-1));
    if (next) next.addEventListener("click", () => shiftDay(1));
    if (todayBtn) todayBtn.addEventListener("click", () => { selectedDate = Data.todayISO(0); REBUILT.Router.renderCurrent(); });
  }

  function shiftDay(offset) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    selectedDate = d.toISOString().slice(0, 10);
    REBUILT.Router.renderCurrent();
  }

  /* ---------------- Add / Edit form ---------------- */

  function openForm(state, itemId) {
    const editing = itemId ? state.scheduleItems.find((s) => s.id === itemId) : null;
    const types = [
      { id: "event", label: "حدث" },
      { id: "break", label: "راحة" },
      { id: "task", label: "مهمة" },
      { id: "habit", label: "عادة" },
    ];

    const body = `
      <form class="form" id="schedule-form">
        <label class="field">
          <span class="field__label">العنوان</span>
          <input class="field__input" type="text" name="title" required value="${editing ? escapeAttr(editing.title) : ""}" placeholder="مثلاً: محاضرة" />
        </label>
        <div class="field">
          <span class="field__label">النوع</span>
          <div class="segmented" id="schedule-type-toggle">
            ${types.map((t) => `<button type="button" class="segmented__opt ${(editing ? editing.type : "event") === t.id ? "is-active" : ""}" data-type="${t.id}">${t.label}</button>`).join("")}
          </div>
        </div>
        <label class="field">
          <span class="field__label">التاريخ</span>
          <input class="field__input" type="date" name="date" required value="${editing ? editing.date : selectedDate}" />
        </label>
        <div class="grid grid--2">
          <label class="field">
            <span class="field__label">وقت البداية</span>
            <input class="field__input" type="time" name="startTime" required value="${editing ? editing.startTime : ""}" />
          </label>
          <label class="field">
            <span class="field__label">وقت النهاية (اختياري)</span>
            <input class="field__input" type="time" name="endTime" value="${editing && editing.endTime ? editing.endTime : ""}" />
          </label>
        </div>
        <label class="field">
          <span class="field__label">ملاحظات (اختياري)</span>
          <input class="field__input" type="text" name="notes" value="${editing ? escapeAttr(editing.notes || "") : ""}" />
        </label>
        <div class="form__actions">
          ${editing ? `<button type="button" class="btn btn--ghost-danger" data-action="delete-schedule-item" data-id="${editing.id}">حذف</button>` : "<span></span>"}
          <button type="submit" class="btn btn--primary">${editing ? "حفظ التعديلات" : "إضافة"}</button>
        </div>
      </form>
    `;

    REBUILT.Modal.open({
      title: editing ? "تعديل العنصر" : "إضافة لخطة يومك",
      body,
      onMount: (modalEl) => {
        const typeButtons = modalEl.querySelectorAll("#schedule-type-toggle .segmented__opt");
        typeButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            typeButtons.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
          });
        });

        modalEl.querySelector("#schedule-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const activeType = modalEl.querySelector("#schedule-type-toggle .is-active");
          const startTime = fd.get("startTime");
          const endTime = fd.get("endTime");
          if (endTime && startTime && endTime <= startTime) {
            REBUILT.Toast.error("وقت النهاية لازم يكون بعد وقت البداية.");
            return;
          }
          const payload = {
            title: (fd.get("title") || "").toString().trim(),
            type: activeType ? activeType.dataset.type : "event",
            date: fd.get("date"),
            startTime,
            endTime: endTime || null,
            notes: (fd.get("notes") || "").toString().trim(),
          };
          if (!payload.title) {
            REBUILT.Toast.error(REBUILT.Messages.genericError());
            return;
          }
          if (editing) REBUILT.Actions.updateScheduleItem(editing.id, payload);
          else REBUILT.Actions.addScheduleItem(payload);
          REBUILT.Modal.close();
        });
      },
    });
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  return { render, afterRender, openForm };
})();
