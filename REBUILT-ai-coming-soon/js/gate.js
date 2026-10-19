/* ============================================================
   REBUILT — gate.js
   The real first-run flow: Welcome → Auth → Onboarding. Runs in
   #gate-root, in front of the normal app shell, and hands control
   back via onComplete() once the user has an account and has
   finished onboarding. Answers are held in a local draft and only
   committed to state at the very end, so backing out mid-flow
   never half-corrupts real data.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Gate = (function () {
  const ONBOARD_STEPS = ["onboard-basic", "onboard-life", "onboard-skills", "onboard-hobbies", "onboard-goals", "onboard-challenges", "onboard-summary"];
  const TAG_STEP_CONFIG = {
    "onboard-skills": { title: "إيه مهاراتك؟", subtitle: "اختار اللي يناسبك، وتقدر تضيف غيرها.", presets: () => REBUILT.Data.PRESET_SKILLS, key: "skills" },
    "onboard-hobbies": { title: "بتحب تعمل إيه في وقتك؟", subtitle: "اختار حاجة أو أكتر.", presets: () => REBUILT.Data.PRESET_HOBBIES, key: "hobbies" },
    "onboard-goals": { title: "إيه أهم حاجة عايز تحققها الفترة الجاية؟", subtitle: "اختار هدف أو أكتر، وتقدر تضيف هدفك الخاص.", presets: () => REBUILT.Data.PRESET_GOALS, key: "goals" },
  };

  let state, onComplete, step, authMode, draft, authErrors;

  function start(_state, _onComplete) {
    state = _state;
    onComplete = _onComplete;
    authErrors = {};
    authMode = "signup";

    if (!state.meta.hasLocalAccount) {
      step = "welcome";
    } else if (!state.meta.isOnboarded) {
      step = "onboard-basic";
    } else {
      document.getElementById("app").style.display = "";
      onComplete();
      return;
    }

    draft = {
      name: state.user.name || "",
      email: state.user.email || "",
      age: "",
      occupation: "",
      occupationCustom: "",
      lifeDescription: "",
      skills: [],
      hobbies: [],
      goals: [],
      challenges: "",
    };

    document.getElementById("app").style.display = "none";
    render();
  }

  function root() {
    return document.getElementById("gate-root");
  }

  function render() {
    const el = root();
    el.style.display = "flex";
    el.innerHTML = stepHTML();
    bindStep();
  }

  function finishGate() {
    root().style.display = "none";
    root().innerHTML = "";
    document.getElementById("app").style.display = "";
    onComplete();
  }

  /* ---------------- Step content ---------------- */

  function stepHTML() {
    if (step === "welcome") return welcomeHTML();
    if (step === "auth") return authHTML();
    if (step === "confirm-email") return confirmEmailHTML();
    if (step === "onboard-summary") return summaryHTML();
    if (TAG_STEP_CONFIG[step]) return tagStepHTML(TAG_STEP_CONFIG[step]);
    if (step === "onboard-basic") return basicHTML();
    if (step === "onboard-life") return lifeHTML();
    if (step === "onboard-challenges") return challengesHTML();
    return welcomeHTML();
  }

  function shell(inner) {
    const idx = ONBOARD_STEPS.indexOf(step);
    const dots = idx >= 0
      ? `<div class="gate-dots">${ONBOARD_STEPS.map((s, i) => `<span class="gate-dot ${i <= idx ? "is-active" : ""}"></span>`).join("")}</div>`
      : "";
    return `
      <div class="gate-card">
        <div class="gate-brand">REBUILT</div>
        ${dots}
        ${inner}
      </div>
    `;
  }

  function welcomeHTML() {
    return shell(`
      <h1 class="gate-title">أهلاً بيك في REBUILT 👋</h1>
      <p class="gate-sub">هنا مش بنحاول نعمل يوم مثالي… إحنا بنبني يوم أحسن كل مرة.</p>
      <button class="btn btn--primary gate-cta" data-go="auth">يلا نبدأ</button>
    `);
  }

  function authHTML() {
    const isSignup = authMode === "signup";
    return shell(`
      <div class="segmented gate-tabs">
        <button type="button" class="segmented__opt ${isSignup ? "is-active" : ""}" data-authmode="signup">إنشاء حساب</button>
        <button type="button" class="segmented__opt ${!isSignup ? "is-active" : ""}" data-authmode="signin">تسجيل الدخول</button>
      </div>
      <form class="form" id="auth-form">
        ${isSignup ? field("name", "الاسم", "text", draft.name, authErrors.name) : ""}
        ${field("email", "الإيميل", "email", draft.email, authErrors.email)}
        ${field("password", "الباسورد", "password", "", authErrors.password)}
        ${isSignup ? field("confirmPassword", "تأكيد الباسورد", "password", "", authErrors.confirmPassword) : ""}
        ${authErrors.general ? `<p class="gate-error">${authErrors.general}</p>` : ""}
        <p class="gate-note">${REBUILT.Auth.isRealAuth()
          ? "🔐 حسابك محفوظ على سيرفر REBUILT، وهتوصلك رسالة تأكيد على إيميلك."
          : "🔒 وضع محلي على جهازك دلوقتي — مفيش اتصال بالسيرفر، فالبيانات بتتخزن على المتصفح بس." +
            (REBUILT.SupabaseClient && REBUILT.SupabaseClient.getError()
              ? `<br/><span class="gate-note__reason">السبب: ${REBUILT.SupabaseClient.getError()}</span>`
              : "")}</p>
        <button type="submit" class="btn btn--primary gate-cta" id="auth-submit">${isSignup ? "إنشاء الحساب" : "دخول"}</button>
      </form>
    `);
  }

  function confirmEmailHTML() {
    return shell(`
      <h2 class="gate-title">بص في إيميلك 📬</h2>
      <p class="gate-sub">
        بعتنا رسالة تأكيد على <bdi>${escapeAttr(draft.email)}</bdi>.
        افتحها واضغط على اللينك، وبعدها ارجع هنا وسجّل دخول عشان نكمل.
      </p>
      <p class="gate-note">لو مالقتهاش، بص في الـ Spam أو الـ Promotions.</p>
      <button class="btn btn--primary gate-cta" data-go="signin-after-confirm">سجّلت؟ يلا ندخل</button>
    `);
  }

  function basicHTML() {
    return shell(`
      <h2 class="gate-title">نعرفك أكتر 👋</h2>
      ${field("name", "الاسم", "text", draft.name)}
      ${field("age", "السن (اختياري)", "number", draft.age)}
      <div class="field">
        <span class="field__label">بتعمل إيه في حياتك؟</span>
        <div class="chip-picker" id="occupation-picker">
          ${REBUILT.Data.OCCUPATIONS.map((o) => `<button type="button" class="chip ${draft.occupation === o.id ? "is-selected" : ""}" data-occ="${o.id}">${o.label}</button>`).join("")}
        </div>
        <input class="field__input" id="occupation-custom" type="text" placeholder="حدد أكتر لو حابب" value="${escapeAttr(draft.occupationCustom)}" style="margin-top:8px" />
      </div>
      ${nav(true)}
    `);
  }

  function lifeHTML() {
    return shell(`
      <h2 class="gate-title">احكيلنا شوية عن حياتك 🙂</h2>
      <p class="gate-sub">أيامك عادةً بتكون إزاي؟</p>
      <textarea class="field__input gate-textarea" id="life-desc" rows="4" placeholder="مثلاً: طالب وبشتغل بعد الجامعة وبتعلم برمجة...">${draft.lifeDescription}</textarea>
      ${nav(true)}
    `);
  }

  function tagStepHTML(cfg) {
    const presets = cfg.presets();
    const selected = draft[cfg.key];
    return shell(`
      <h2 class="gate-title">${cfg.title}</h2>
      ${cfg.subtitle ? `<p class="gate-sub">${cfg.subtitle}</p>` : ""}
      <div class="chip-picker" id="tag-picker">
        ${presets.map((p) => `<button type="button" class="chip ${selected.includes(p) ? "is-selected" : ""}" data-tag="${escapeAttr(p)}">${p}</button>`).join("")}
        ${selected.filter((s) => !presets.includes(s)).map((p) => `<button type="button" class="chip is-selected" data-tag="${escapeAttr(p)}">${p}</button>`).join("")}
      </div>
      <div class="gate-custom-add">
        <input class="field__input" id="tag-custom-input" type="text" placeholder="ضيف حاجة تانية" />
        <button type="button" class="btn btn--secondary" id="tag-custom-add">${REBUILT.Icons.plus}</button>
      </div>
      ${nav(false)}
    `);
  }

  function challengesHTML() {
    return shell(`
      <h2 class="gate-title">إيه أكتر حاجة بتصعّب عليك تنظم حياتك؟ 🤔</h2>
      <p class="gate-sub">اكتب بصراحة، ده بيساعد REBUILT يفهمك أكتر.</p>
      <textarea class="field__input gate-textarea" id="challenges" rows="4" placeholder="مثلاً: بابدأ حاجات كتير وما بكملهاش...">${draft.challenges}</textarea>
      ${nav(true)}
    `);
  }

  function summaryHTML() {
    return shell(`
      <h2 class="gate-title">تمام يا ${draft.name || "بطل"} 🔥</h2>
      <p class="gate-sub">جاهزين نبدأ نبني يومك. تقدر تعدّل أي حاجة من الإعدادات بعدين.</p>
      <ul class="gate-summary">
        <li>🎯 أهدافك: ${draft.goals.length ? draft.goals.join("، ") : "—"}</li>
        <li>🧩 مهاراتك: ${draft.skills.length ? draft.skills.join("، ") : "—"}</li>
        <li>🎨 اهتماماتك: ${draft.hobbies.length ? draft.hobbies.join("، ") : "—"}</li>
      </ul>
      <button class="btn btn--primary gate-cta" id="gate-finish">يلا نبني يومك</button>
      ${nav(false, true)}
    `);
  }

  function nav(showBack, hideNext) {
    return `
      <div class="gate-nav">
        ${showBack ? `<button type="button" class="btn btn--secondary" data-go="back">رجوع</button>` : "<span></span>"}
        ${hideNext ? "" : `<button type="button" class="btn btn--primary" data-go="next">التالي</button>`}
      </div>
    `;
  }

  function field(name, label, type, value, error) {
    return `
      <label class="field">
        <span class="field__label">${label}</span>
        <input class="field__input" name="${name}" id="field-${name}" type="${type}" value="${escapeAttr(value || "")}" />
        ${error ? `<span class="gate-error">${error}</span>` : ""}
      </label>
    `;
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  /* ---------------- Step navigation ---------------- */

  function nextOnboardStep() {
    const idx = ONBOARD_STEPS.indexOf(step);
    step = ONBOARD_STEPS[idx + 1] || "onboard-summary";
    render();
  }

  function prevOnboardStep() {
    const idx = ONBOARD_STEPS.indexOf(step);
    if (idx <= 0) return;
    step = ONBOARD_STEPS[idx - 1];
    render();
  }

  function commitOnboarding() {
    state.user.name = draft.name.trim() || state.user.name;
    state.userProfile.occupation = draft.occupation;
    state.userProfile.occupationCustom = draft.occupationCustom.trim();
    state.userProfile.lifeDescription = draft.lifeDescription.trim();
    state.userProfile.skills = draft.skills.slice();
    state.userProfile.hobbies = draft.hobbies.slice();
    state.userProfile.goals = draft.goals.slice();
    state.userProfile.challenges = draft.challenges.trim();
    if (state.userProfile.challenges) {
      state.aiProfile.knownChallenges = [state.userProfile.challenges];
    }
    state.meta.isOnboarded = true;
    REBUILT.Storage.syncOnboarding(state.user.id, state.userProfile, state.aiProfile.knownChallenges);
    REBUILT.Storage.save(state);
    finishGate();
  }

  function bindStep() {
    const el = root();

    el.querySelectorAll("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const go = btn.dataset.go;
        if (go === "auth") return (step = "auth"), render();
        if (go === "signin-after-confirm") {
          authMode = "signin";
          authErrors = {};
          step = "auth";
          return render();
        }
        if (go === "next") return handleNext();
        if (go === "back") return handleBack();
      });
    });

    if (step === "auth") bindAuthForm();
    if (step === "onboard-basic") bindOccupationPicker();
    if (TAG_STEP_CONFIG[step]) bindTagPicker(TAG_STEP_CONFIG[step]);
    if (step === "onboard-summary") {
      const finishBtn = document.getElementById("gate-finish");
      if (finishBtn) finishBtn.addEventListener("click", commitOnboarding);
    }
  }

  function handleNext() {
    if (step === "onboard-basic") {
      draft.name = (document.getElementById("field-name") || {}).value || draft.name;
      draft.age = (document.getElementById("field-age") || {}).value || "";
      draft.occupationCustom = (document.getElementById("occupation-custom") || {}).value || "";
      if (!draft.name.trim()) {
        REBUILT.Toast.error("محتاجين اسمك الأول.");
        return;
      }
    }
    if (step === "onboard-life") {
      draft.lifeDescription = (document.getElementById("life-desc") || {}).value || "";
    }
    if (step === "onboard-challenges") {
      draft.challenges = (document.getElementById("challenges") || {}).value || "";
    }
    nextOnboardStep();
  }

  function handleBack() {
    if (step === "auth") {
      step = "welcome";
      render();
      return;
    }
    prevOnboardStep();
  }

  function bindOccupationPicker() {
    elQsa("#occupation-picker .chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        draft.occupation = btn.dataset.occ;
        elQsa("#occupation-picker .chip").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });
  }

  function bindTagPicker(cfg) {
    function toggle(tag) {
      const list = draft[cfg.key];
      const idx = list.indexOf(tag);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(tag);
    }
    elQsa("#tag-picker .chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggle(btn.dataset.tag);
        btn.classList.toggle("is-selected");
      });
    });
    const addBtn = document.getElementById("tag-custom-add");
    const input = document.getElementById("tag-custom-input");
    if (addBtn && input) {
      const addFn = () => {
        const val = input.value.trim();
        if (!val) return;
        if (!draft[cfg.key].includes(val)) draft[cfg.key].push(val);
        input.value = "";
        render();
      };
      addBtn.addEventListener("click", addFn);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addFn();
        }
      });
    }
  }

  function bindAuthForm() {
    elQsa("[data-authmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        authMode = btn.dataset.authmode;
        authErrors = {};
        render();
      });
    });

    document.getElementById("auth-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        name: (fd.get("name") || "").toString(),
        email: (fd.get("email") || "").toString(),
        password: (fd.get("password") || "").toString(),
        confirmPassword: (fd.get("confirmPassword") || "").toString(),
      };

      const isSignup = authMode === "signup";
      const check = isSignup ? REBUILT.Auth.validateSignUp(payload) : REBUILT.Auth.validateSignIn(payload);
      if (!check.valid) {
        authErrors = check.errors;
        render();
        return;
      }

      const submitBtn = document.getElementById("auth-submit");
      setLoading(submitBtn, true, isSignup ? "بنعمل الحساب..." : "بنسجّل دخولك...");

      let result;
      try {
        result = isSignup
          ? await REBUILT.Auth.signUp(state, payload)
          : await REBUILT.Auth.signIn(state, payload);
      } catch (err) {
        result = { ok: false, error: "حصلت مشكلة صغيرة 😅 جرّب تاني." };
      }

      setLoading(submitBtn, false);

      if (!result.ok) {
        authErrors = { general: result.error };
        render();
        return;
      }

      draft.name = payload.name || draft.name;
      draft.email = payload.email;

      // Email confirmation is enabled: there's no session yet, so park them
      // on the "check your inbox" screen instead of letting them in.
      if (result.needsEmailConfirmation) {
        REBUILT.Storage.save(state);
        step = "confirm-email";
        render();
        return;
      }

      REBUILT.Storage.save(state);
      if (state.meta.isOnboarded) return finishGate();
      step = "onboard-basic";
      render();
    });
  }

  function setLoading(btn, isLoading, label) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalLabel = btn.textContent;
      btn.textContent = label || "لحظة...";
      btn.disabled = true;
      btn.classList.add("is-loading");
    } else {
      if (btn.dataset.originalLabel) btn.textContent = btn.dataset.originalLabel;
      btn.disabled = false;
      btn.classList.remove("is-loading");
    }
  }

  function elQsa(sel) {
    return Array.prototype.slice.call(root().querySelectorAll(sel));
  }

  return { start };
})();
