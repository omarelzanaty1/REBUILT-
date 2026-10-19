/* ============================================================
   REBUILT — pages/tasks.js
   Tabs (Today/Upcoming/Overdue/Completed) + priority filter + sort.
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.tasks = (function () {
  const { Messages, Components, Data } = REBUILT;
  let ui = { tab: "today", filter: "all", sort: "priority" };

  const TABS = [
    { id: "today", label: "النهارده" },
    { id: "upcoming", label: "قادمة" },
    { id: "overdue", label: "متأخرة" },
    { id: "completed", label: "مكتملة" },
  ];
  const FILTERS = [
    { id: "all", label: "الكل" },
    { id: "urgent", label: "عاجلة" },
    { id: "high", label: "عالية" },
    { id: "medium", label: "متوسطة" },
    { id: "low", label: "منخفضة" },
  ];
  const SORTS = [
    { id: "priority", label: "الأولوية" },
    { id: "time", label: "الوقت" },
    { id: "created", label: "تاريخ الإضافة" },
  ];

  function render(state) {
    if (state.tasks.length === 0) {
      return `
        <section class="page-header">
          <h1 class="page-header__title">المهام</h1>
          <button class="btn btn--primary" data-action="open-add-task">${REBUILT.Icons.plus} مهمة جديدة</button>
        </section>
        <section class="card">${Components.emptyState(Messages.emptyTasks(), "إضافة مهمة", "open-add-task")}</section>
      `;
    }

    const today = Data.todayISO(0);
    let list = state.tasks.filter((t) => {
      if (ui.tab === "today") return !t.completed && t.date === today;
      if (ui.tab === "upcoming") return !t.completed && (!t.date || t.date > today);
      if (ui.tab === "overdue") return !t.completed && t.date && t.date < today;
      return t.completed;
    });
    if (ui.filter !== "all") list = list.filter((t) => t.priority === ui.filter);
    list = list.slice().sort(sorter(ui.sort));

    return `
      <section class="page-header">
        <h1 class="page-header__title">المهام</h1>
        <button class="btn btn--primary" data-action="open-add-task">${REBUILT.Icons.plus} مهمة جديدة</button>
      </section>

      <section class="tabs-bar">
        ${TABS.map((t) => `<button class="tabs-bar__opt ${ui.tab === t.id ? "is-active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("")}
      </section>

      <section class="filter-bar">
        <div class="filter-bar__group">
          ${FILTERS.map((f) => `<button class="chip chip--sm ${ui.filter === f.id ? "is-selected" : ""}" data-filter="${f.id}">${f.label}</button>`).join("")}
        </div>
        <select class="field__input filter-bar__sort" id="task-sort">
          ${SORTS.map((s) => `<option value="${s.id}" ${ui.sort === s.id ? "selected" : ""}>ترتيب: ${s.label}</option>`).join("")}
        </select>
      </section>

      <section class="card">
        <div class="row-list">
          ${list.length ? list.map(Components.taskRow).join("") : `<p class="card__note">مفيش حاجة هنا دلوقتي 🎉</p>`}
        </div>
      </section>
    `;
  }

  function sorter(mode) {
    const weight = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (mode === "time") return (a, b) => (a.time || "99:99").localeCompare(b.time || "99:99");
    if (mode === "created") return (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "");
    return (a, b) => (weight[a.priority] ?? 2) - (weight[b.priority] ?? 2);
  }

  function afterRender(container) {
    container.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => { ui.tab = btn.dataset.tab; REBUILT.Router.renderCurrent(); });
    });
    container.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => { ui.filter = btn.dataset.filter; REBUILT.Router.renderCurrent(); });
    });
    const sortSel = document.getElementById("task-sort");
    if (sortSel) sortSel.addEventListener("change", (e) => { ui.sort = e.target.value; REBUILT.Router.renderCurrent(); });
  }

  /* ---------------- Add / Edit form ---------------- */

  function openForm(state, taskId) {
    const editing = taskId ? state.tasks.find((t) => t.id === taskId) : null;
    const priorities = [
      { id: "low", label: "منخفضة" },
      { id: "medium", label: "متوسطة" },
      { id: "high", label: "عالية" },
      { id: "urgent", label: "عاجلة" },
    ];

    const body = `
      <form class="form" id="task-form">
        <label class="field">
          <span class="field__label">اسم المهمة</span>
          <input class="field__input" type="text" name="title" maxlength="80" required
            value="${editing ? escapeAttr(editing.title) : ""}" placeholder="مثلاً: تجهيز العرض" />
        </label>

        <label class="field">
          <span class="field__label">وصف (اختياري)</span>
          <input class="field__input" type="text" name="description" value="${editing ? escapeAttr(editing.description || "") : ""}" placeholder="تفاصيل إضافية" />
        </label>

        <div class="field">
          <span class="field__label">الأولوية</span>
          <div class="segmented" id="priority-toggle">
            ${priorities.map((p) => `<button type="button" class="segmented__opt ${(editing ? editing.priority === p.id : p.id === "medium") ? "is-active" : ""}" data-priority="${p.id}">${p.label}</button>`).join("")}
          </div>
        </div>

        <div class="grid grid--2">
          <label class="field">
            <span class="field__label">التاريخ (اختياري)</span>
            <input class="field__input" type="date" name="date" value="${editing && editing.date ? editing.date : ""}" />
          </label>
          <label class="field">
            <span class="field__label">الوقت (اختياري)</span>
            <input class="field__input" type="time" name="time" value="${editing && editing.time ? editing.time : ""}" />
          </label>
        </div>

        <label class="field">
          <span class="field__label">مكافأة XP</span>
          <input class="field__input" type="number" name="xp" min="5" max="100" step="5" value="${editing ? editing.xp : 25}" />
        </label>

        <div class="form__actions">
          ${editing ? `<button type="button" class="btn btn--ghost-danger" data-action="delete-task" data-id="${editing.id}">حذف</button>` : "<span></span>"}
          <button type="submit" class="btn btn--primary">${editing ? "حفظ التعديلات" : "إضافة المهمة"}</button>
        </div>
      </form>
    `;

    REBUILT.Modal.open({
      title: editing ? "تعديل المهمة" : "مهمة جديدة",
      body,
      onMount: (modalEl) => {
        const priorityButtons = modalEl.querySelectorAll("#priority-toggle .segmented__opt");
        priorityButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            priorityButtons.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
          });
        });

        modalEl.querySelector("#task-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const activePriorityBtn = modalEl.querySelector("#priority-toggle .is-active");
          const payload = {
            title: (fd.get("title") || "").toString().trim(),
            description: (fd.get("description") || "").toString().trim(),
            priority: activePriorityBtn ? activePriorityBtn.dataset.priority : "medium",
            date: fd.get("date") || null,
            time: fd.get("time") || null,
            xp: Math.max(5, Number(fd.get("xp")) || 25),
          };
          if (!payload.title) {
            REBUILT.Toast.error(Messages.genericError());
            return;
          }
          if (editing) {
            REBUILT.Actions.updateTask(editing.id, payload);
          } else {
            REBUILT.Actions.addTask(payload);
          }
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
