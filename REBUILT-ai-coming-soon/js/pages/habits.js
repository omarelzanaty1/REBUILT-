/* ============================================================
   REBUILT — pages/habits.js
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.habits = (function () {
  const { Messages, Components, Data, Helpers } = REBUILT;

  function render(state) {
    const habits = state.habits;
    if (!habits.length) {
      return `
        <section class="page-header">
          <h1 class="page-header__title">العادات</h1>
          <button class="btn btn--primary" data-action="open-add-habit">${REBUILT.Icons.plus} عادة جديدة</button>
        </section>
        <section class="card">${Components.emptyState(Messages.emptyHabits(), "إضافة عادة", "open-add-habit")}</section>
      `;
    }

    const todayHabits = Helpers.getTodayHabits(state);
    const todayIds = new Set(todayHabits.map((h) => h.id));
    const otherHabits = habits.filter((h) => !todayIds.has(h.id));

    return `
      <section class="page-header">
        <h1 class="page-header__title">العادات</h1>
        <button class="btn btn--primary" data-action="open-add-habit">${REBUILT.Icons.plus} عادة جديدة</button>
      </section>

      <section class="card">
        <div class="card__header"><h2 class="card__title">عادات النهارده</h2></div>
        <div class="row-list">
          ${todayHabits.length ? todayHabits.map(Components.habitRow).join("") : `<p class="card__note">مفيش عادات متفعّلة النهارده.</p>`}
        </div>
      </section>

      ${otherHabits.length ? `
      <section class="card">
        <div class="card__header"><h2 class="card__title">كل العادات</h2></div>
        <div class="row-list">
          ${otherHabits.map(Components.habitRow).join("")}
        </div>
      </section>` : ""}
    `;
  }

  /* ---------------- Add / Edit form ---------------- */

  function openForm(state, habitId) {
    const editing = habitId ? state.habits.find((h) => h.id === habitId) : null;
    const icons = Data.HABIT_ICONS;
    const selectedIcon = editing ? editing.icon : icons[0];
    const targetDays = editing && editing.targetDays ? editing.targetDays : [];
    const freq = editing ? editing.frequency : "daily";

    const body = `
      <form class="form" id="habit-form">
        <label class="field">
          <span class="field__label">اسم العادة</span>
          <input class="field__input" type="text" name="title" maxlength="60" required
            value="${editing ? escapeAttr(editing.title) : ""}" placeholder="مثلاً: شرب المياه" />
        </label>

        <label class="field">
          <span class="field__label">وصف (اختياري)</span>
          <input class="field__input" type="text" name="description" value="${editing ? escapeAttr(editing.description || "") : ""}" />
        </label>

        <div class="field">
          <span class="field__label">الأيقونة</span>
          <div class="icon-picker" id="icon-picker">
            ${icons.map((ic) => `<button type="button" class="icon-picker__opt ${ic === selectedIcon ? "is-selected" : ""}" data-icon="${ic}">${ic}</button>`).join("")}
          </div>
          <input type="hidden" name="icon" id="icon-picker-value" value="${selectedIcon}" />
        </div>

        <div class="grid grid--2">
          <label class="field">
            <span class="field__label">مكافأة XP</span>
            <input class="field__input" type="number" name="xp" min="5" max="100" step="5"
              value="${editing ? editing.xp : 20}" />
          </label>
          <label class="field">
            <span class="field__label">وقت مفضّل (اختياري)</span>
            <input class="field__input" type="time" name="time" value="${editing && editing.time ? editing.time : ""}" />
          </label>
        </div>

        <div class="field">
          <span class="field__label">التكرار</span>
          <div class="segmented" id="frequency-toggle">
            <button type="button" class="segmented__opt ${freq === "daily" ? "is-active" : ""}" data-freq="daily">كل يوم</button>
            <button type="button" class="segmented__opt ${freq === "weekly" ? "is-active" : ""}" data-freq="weekly">أسبوعيًا</button>
            <button type="button" class="segmented__opt ${freq === "custom" ? "is-active" : ""}" data-freq="custom">أيام محددة</button>
          </div>
          <div class="weekday-picker ${freq === "custom" ? "" : "is-hidden"}" id="weekday-picker">
            ${Data.WEEKDAY_LABELS.map((label, idx) => `
              <button type="button" class="weekday-picker__opt ${targetDays.includes(idx) ? "is-selected" : ""}" data-day="${idx}">${label}</button>
            `).join("")}
          </div>
        </div>

        <div class="form__actions">
          ${editing ? `<button type="button" class="btn btn--ghost-danger" data-action="delete-habit" data-id="${editing.id}">حذف</button>` : "<span></span>"}
          <button type="submit" class="btn btn--primary">${editing ? "حفظ التعديلات" : "إضافة العادة"}</button>
        </div>
      </form>
    `;

    REBUILT.Modal.open({
      title: editing ? "تعديل العادة" : "عادة جديدة",
      body,
      onMount: (modalEl) => {
        let currentDays = targetDays.slice();

        modalEl.querySelectorAll("#icon-picker .icon-picker__opt").forEach((btn) => {
          btn.addEventListener("click", () => {
            modalEl.querySelectorAll("#icon-picker .icon-picker__opt").forEach((b) => b.classList.remove("is-selected"));
            btn.classList.add("is-selected");
            modalEl.querySelector("#icon-picker-value").value = btn.dataset.icon;
          });
        });

        const freqButtons = modalEl.querySelectorAll("#frequency-toggle .segmented__opt");
        const weekdayPicker = modalEl.querySelector("#weekday-picker");
        freqButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            freqButtons.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            weekdayPicker.classList.toggle("is-hidden", btn.dataset.freq !== "custom");
          });
        });

        modalEl.querySelectorAll("#weekday-picker .weekday-picker__opt").forEach((btn) => {
          btn.addEventListener("click", () => {
            const day = Number(btn.dataset.day);
            if (currentDays.includes(day)) {
              currentDays = currentDays.filter((d) => d !== day);
              btn.classList.remove("is-selected");
            } else {
              currentDays.push(day);
              btn.classList.add("is-selected");
            }
          });
        });

        modalEl.querySelector("#habit-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const freqType = modalEl.querySelector("#frequency-toggle .is-active").dataset.freq;
          if (freqType === "custom" && currentDays.length === 0) {
            REBUILT.Toast.error("اختار يوم واحد على الأقل.");
            return;
          }
          const payload = {
            title: (fd.get("title") || "").toString().trim(),
            description: (fd.get("description") || "").toString().trim(),
            icon: fd.get("icon"),
            xp: Math.max(5, Number(fd.get("xp")) || 20),
            time: fd.get("time") || null,
            frequency: freqType,
            targetDays: freqType === "custom" ? currentDays : [],
          };
          if (!payload.title) {
            REBUILT.Toast.error(Messages.genericError());
            return;
          }
          if (editing) {
            REBUILT.Actions.updateHabit(editing.id, payload);
          } else {
            REBUILT.Actions.addHabit(payload);
          }
          REBUILT.Modal.close();
        });
      },
    });
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  return { render, openForm };
})();
