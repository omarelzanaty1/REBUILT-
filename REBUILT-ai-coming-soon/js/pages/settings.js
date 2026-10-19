/* ============================================================
   REBUILT — pages/settings.js
   ============================================================ */

window.REBUILT = window.REBUILT || {};
REBUILT.Pages = REBUILT.Pages || {};

REBUILT.Pages.settings = (function () {
  const AVATAR_OPTIONS = ["🧑", "👩", "👨", "🧔", "👩‍🦱", "👨‍🦱", "🧑‍🎓", "🦸", "🧗", "🏃"];
  const RESPONSE_LENGTHS = [
    { id: "short", label: "مختصر" },
    { id: "medium", label: "متوسط" },
    { id: "detailed", label: "تفصيلي" },
  ];

  function render(state) {
    return `
      <section class="page-header">
        <h1 class="page-header__title">الإعدادات</h1>
      </section>

      <section class="card">
        <h2 class="card__title">الحساب</h2>
        <p class="card__note">${state.user.email ? "مسجل بإيميل: <bdi>" + state.user.email + "</bdi>" : "لسه معملتش حساب."} — وضع محلي على الجهاز ده حاليًا.</p>
        <div class="settings-actions">
          <button class="btn btn--ghost-danger" id="sign-out-btn">تسجيل الخروج</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card__title">بيانات الملف الشخصي</h2>
        <form class="form" id="profile-form">
          <label class="field">
            <span class="field__label">الاسم</span>
            <input class="field__input" type="text" name="name" maxlength="30" value="${escapeAttr(state.user.name)}" />
          </label>
          <div class="field">
            <span class="field__label">الصورة الرمزية</span>
            <div class="icon-picker" id="avatar-picker">
              ${AVATAR_OPTIONS.map((a) => `<button type="button" class="icon-picker__opt ${a === state.user.avatar ? "is-selected" : ""}" data-avatar="${a}">${a}</button>`).join("")}
            </div>
          </div>
          <div class="form__actions">
            <span></span>
            <button type="submit" class="btn btn--primary">حفظ</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h2 class="card__title">تفضيلات REBUILT AI</h2>
        <p class="card__note">هتتطبق أول ما نفعّل المحادثة الحقيقية.</p>
        <label class="field">
          <span class="field__label">طول الردود المفضّل</span>
          <select class="field__input" id="response-length-select">
            ${RESPONSE_LENGTHS.map((r) => `<option value="${r.id}" ${state.aiProfile.preferredResponseLength === r.id ? "selected" : ""}>${r.label}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="card">
        <h2 class="card__title">الإشعارات</h2>
        ${toggleRow("notifications-toggle", "تذكير يومي بالعادات والمهام", state.settings.notifications)}
      </section>

      <section class="card">
        <h2 class="card__title">المظهر</h2>
        <p class="card__note">REBUILT في وضع Dark دايمًا — ده جزء من هوية المنتج.</p>
        ${toggleRow("motion-toggle", "تقليل الحركة والأنيميشن", state.settings.reduceMotion)}
      </section>

      <section class="card">
        <h2 class="card__title">بيانات تجريبية</h2>
        <p class="card__note">عايز تجرب REBUILT بشكل سريع؟ حمّل بيانات تجريبية جاهزة (هتستبدل بياناتك الحالية).</p>
        <button class="btn btn--secondary" id="load-demo-btn">تحميل بيانات تجريبية</button>
      </section>

      <section class="card">
        <h2 class="card__title">إدارة البيانات</h2>
        <p class="card__note">صدّر بياناتك كنسخة احتياطية، أو رجّعها من ملف قديم.</p>
        <div class="settings-actions">
          <button class="btn btn--secondary" id="export-data-btn">تصدير البيانات</button>
          <label class="btn btn--secondary" for="import-data-input">استيراد البيانات</label>
          <input type="file" id="import-data-input" accept="application/json" class="visually-hidden" />
        </div>
      </section>

      <section class="card card--danger">
        <h2 class="card__title">بدء من الصفر</h2>
        <p class="card__note">هيمسح كل بياناتك الحالية (عادات، مهام، XP، تاريخ) نهائيًا.</p>
        <button class="btn btn--ghost-danger" id="reset-empty-btn">مسح كل البيانات والبدء من جديد</button>
      </section>
    `;
  }

  function toggleRow(id, label, checked) {
    return `
      <label class="toggle-row" for="${id}">
        <span>${label}</span>
        <span class="switch">
          <input type="checkbox" id="${id}" ${checked ? "checked" : ""} />
          <span class="switch__track"><span class="switch__thumb"></span></span>
        </span>
      </label>
    `;
  }

  function afterRender(container, state) {
    let selectedAvatar = state.user.avatar;
    container.querySelectorAll("#avatar-picker .icon-picker__opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll("#avatar-picker .icon-picker__opt").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedAvatar = btn.dataset.avatar;
      });
    });

    container.querySelector("#profile-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = new FormData(e.target).get("name").toString().trim();
      if (!name) {
        REBUILT.Toast.error("محتاج اسم مش فاضي.");
        return;
      }
      REBUILT.Actions.updateProfile({ name, avatar: selectedAvatar });
      REBUILT.Toast.show({ icon: "✅", text: "اتحفظ 👌", tone: "success", duration: 1800 });
    });

    container.querySelector("#response-length-select").addEventListener("change", (e) => {
      state.aiProfile.preferredResponseLength = e.target.value;
      REBUILT.Storage.save(state);
    });

    container.querySelector("#notifications-toggle").addEventListener("change", (e) => {
      REBUILT.Actions.updateSettings({ notifications: e.target.checked });
    });

    container.querySelector("#motion-toggle").addEventListener("change", (e) => {
      REBUILT.Actions.updateSettings({ reduceMotion: e.target.checked });
    });

    container.querySelector("#load-demo-btn").addEventListener("click", () => {
      REBUILT.Actions.loadDemoData();
    });

    container.querySelector("#export-data-btn").addEventListener("click", () => {
      REBUILT.Actions.exportData();
    });

    container.querySelector("#import-data-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) REBUILT.Actions.importData(file);
      e.target.value = "";
    });

    container.querySelector("#reset-empty-btn").addEventListener("click", () => {
      REBUILT.Actions.resetToEmpty();
    });

    container.querySelector("#sign-out-btn").addEventListener("click", () => {
      REBUILT.Actions.signOut();
    });
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  return { render, afterRender };
})();
