/* ============================================================
   REBUILT — app.js
   Holds the live state object, runs the first-run gate (auth +
   onboarding) before the app shell, wires up navigation + the
   single delegated click/change listener, and implements every
   action that mutates state.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.App = (function () {
  let state = null;

  function save() {
    REBUILT.Storage.save(state);
  }

  /** Mirror today's recomputed history entry + any newly unlocked achievements to Supabase (no-ops in local mode). */
  function syncDerivedState(unlocked) {
    const today = REBUILT.Data.todayISO(0);
    REBUILT.Storage.syncDailyHistory(state.user.id, today, state.history[today]);
    unlocked.forEach((def) => {
      const record = state.achievements.find((a) => a.id === def.id);
      REBUILT.Storage.syncUnlockAchievement(state.user.id, def.id, (record && record.unlockedAt) || today, def.xpBonus || 0);
    });
  }

  /** Run the standard "something changed" pipeline: refresh today, streak, achievements, persist, re-render. */
  function settle() {
    REBUILT.Streak.refreshToday(state);
    REBUILT.Streak.recomputeStreak(state);
    const unlocked = REBUILT.Achievements.checkAll(state);
    syncDerivedState(unlocked);
    save();
    REBUILT.Router.renderCurrent();
    unlocked.forEach((def) => {
      REBUILT.Toast.achievement(def.name, def.icon);
      REBUILT.Toast.confetti();
    });
    return unlocked;
  }

  function migrateAchievements() {
    REBUILT.Data.ACHIEVEMENTS.forEach((def) => {
      if (!state.achievements.find((a) => a.id === def.id)) {
        state.achievements.push({ id: def.id, unlocked: false, unlockedAt: null });
      }
    });
  }

  /** Fill in any fields an older saved state (pre-Phase-2) wouldn't have, so we never crash on load. */
  function migrateShape() {
    if (!state.meta) state.meta = { isDemo: false, isOnboarded: true, hasLocalAccount: true }; // pre-existing saves are treated as already onboarded
    if (state.meta.isOnboarded === undefined) state.meta.isOnboarded = true;
    if (state.meta.hasLocalAccount === undefined) state.meta.hasLocalAccount = true;
    if (!state.userProfile) state.userProfile = { occupation: "", occupationCustom: "", lifeDescription: "", skills: [], hobbies: [], goals: [], challenges: "" };
    if (!state.aiProfile) {
      state.aiProfile = { userType: null, communicationStyle: null, motivationStyle: null, preferredResponseLength: "medium", productivityStyle: null, disciplineLevel: null, planningPreference: null, commonPatterns: [], knownChallenges: [] };
    }
    if (!state.scheduleItems) state.scheduleItems = [];
    if (!state.aiConversation) state.aiConversation = [];
    if (state.user.email === undefined) state.user.email = "";
    if (!state.lastMessageIndex) state.lastMessageIndex = {};
    migrateAchievements();
  }

  async function init() {
    const saved = await REBUILT.Storage.load();
    state = saved || REBUILT.Data.buildEmptyState();
    migrateShape();

    // When real auth is active, the server is the source of truth for "am I
    // signed in?" — this is also what picks up a session created by clicking
    // the email-confirmation link.
    if (REBUILT.Auth.isRealAuth()) {
      try {
        const session = await REBUILT.Auth.getSession(state);
        if (session.loggedIn) {
          state.meta.hasLocalAccount = true;
          state.user.id = session.userId;
          state.user.email = session.email;
        } else if (state.meta.hasLocalAccount) {
          // Local flag claims signed-in but the server disagrees (expired /
          // signed out elsewhere) — send them back through the gate.
          state.meta.hasLocalAccount = false;
        }
        REBUILT.Storage.save(state);
      } catch (err) {
        // Offline or Supabase unreachable: fall back to whatever local state says.
        console.warn("REBUILT: could not verify session, continuing offline", err);
      }
    }

    REBUILT.Gate.start(state, onGatePassed);
  }

  function onGatePassed() {
    REBUILT.Streak.refreshToday(state);
    REBUILT.Streak.recomputeStreak(state);
    const unlocked = REBUILT.Achievements.checkAll(state); // reconcile silently — no toasts for history that predates this session
    syncDerivedState(unlocked);
    document.body.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
    save();

    bindNav();
    bindGlobalActions();
    bindMobileMore();
    REBUILT.Router.navigateTo(REBUILT.Router.pageFromHash() || "dashboard");

    // Catch a day rollover if the tab is left open across midnight.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") settle();
    });
  }

  function bindNav() {
    document.body.addEventListener("click", (e) => {
      const navEl = e.target.closest("[data-nav]");
      if (navEl) {
        e.preventDefault();
        REBUILT.Router.navigateTo(navEl.dataset.nav);
      }
    });
  }

  function bindGlobalActions() {
    document.body.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const action = el.dataset.action;
      const id = el.dataset.id;
      Actions.dispatch(action, id, el);
    });
  }

  /** Mobile bottom nav only fits 5 primary icons; "⋯" opens a small sheet for Achievements + Settings. */
  function bindMobileMore() {
    const btn = document.getElementById("mobile-more-btn");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = document.querySelector(".mobile-more-sheet");
      if (existing) {
        existing.remove();
        return;
      }
      const sheet = document.createElement("div");
      sheet.className = "mobile-more-sheet";
      sheet.innerHTML = `
        <button class="mobile-more-sheet__item" data-nav="planner">🗓️ <span>يومي</span></button>
        <button class="mobile-more-sheet__item" data-nav="achievements">🏆 <span>الإنجازات</span></button>
        <button class="mobile-more-sheet__item" data-nav="ai">✨ <span>REBUILT AI</span></button>
        <button class="mobile-more-sheet__item" data-nav="settings">⚙️ <span>الإعدادات</span></button>
      `;
      document.body.appendChild(sheet);
      requestAnimationFrame(() => sheet.classList.add("is-visible"));

      function closeOnOutside(evt) {
        if (!sheet.contains(evt.target) && evt.target !== btn) {
          sheet.remove();
          document.removeEventListener("click", closeOnOutside);
        }
      }
      setTimeout(() => document.addEventListener("click", closeOnOutside), 0);
    });
  }

  /* ---------------- Actions ---------------- */

  const Actions = {
    dispatch(action, id) {
      switch (action) {
        case "toggle-habit": return Actions.toggleHabit(id);
        case "edit-habit": return REBUILT.Pages.habits.openForm(state, id);
        case "delete-habit": return Actions.deleteHabit(id);
        case "open-add-habit": return REBUILT.Pages.habits.openForm(state);
        case "toggle-task": return Actions.toggleTask(id);
        case "edit-task": return REBUILT.Pages.tasks.openForm(state, id);
        case "delete-task": return Actions.deleteTask(id);
        case "open-add-task": return REBUILT.Pages.tasks.openForm(state);
        case "toggle-schedule-item": return Actions.toggleScheduleItem(id);
        case "edit-schedule-item": return REBUILT.Pages.planner.openForm(state, id);
        case "delete-schedule-item": return Actions.deleteScheduleItem(id);
        case "open-add-schedule-item": return REBUILT.Pages.planner.openForm(state);
        default: return;
      }
    },

    /* ---- Habits ---- */

    toggleHabit(id) {
      const habit = state.habits.find((h) => h.id === id);
      if (!habit) return;
      const today = REBUILT.Data.todayISO(0);
      const alreadyDone = habit.completionHistory.includes(today);

      if (alreadyDone) {
        habit.completionHistory = habit.completionHistory.filter((d) => d !== today);
        REBUILT.XP.addXP(state, -habit.xp);
        REBUILT.Streak.logXPToday(state, -habit.xp);
        REBUILT.Streak.computeHabitStreak(habit);
        REBUILT.Storage.syncHabitCompletion(state.user.id, habit.id, today, habit.xp, false);
        settle();
        return;
      }

      habit.completionHistory.push(today);
      if (new Date().getHours() < 8) state.earlyCompletionEver = true;
      REBUILT.Streak.computeHabitStreak(habit);
      const levelResult = REBUILT.XP.addXP(state, habit.xp);
      REBUILT.Streak.logXPToday(state, habit.xp);
      REBUILT.Storage.syncHabitCompletion(state.user.id, habit.id, today, habit.xp, true);

      settle();

      REBUILT.Toast.xpGain(habit.xp);
      REBUILT.Toast.show({ icon: "✅", text: REBUILT.Messages.habitCompleted(state), tone: "success", duration: 2200 });

      if (levelResult.leveledUp) {
        REBUILT.Toast.levelUp(levelResult.toLevel, REBUILT.Messages.levelUp(state, levelResult.toLevel));
      }
    },

    deleteHabit(id) {
      const habit = state.habits.find((h) => h.id === id);
      if (!habit) return;
      if (!window.confirm(REBUILT.Messages.confirmDelete(habit.title))) return;
      // Revoke this habit's historical XP so the total never outlives its record.
      const historicalXP = (habit.completionHistory || []).length * habit.xp;
      if (historicalXP > 0) REBUILT.XP.addXP(state, -historicalXP);
      state.habits = state.habits.filter((h) => h.id !== id);
      REBUILT.Storage.syncDeleteHabit(id);
      REBUILT.Modal.close();
      settle();
      REBUILT.Toast.show({ icon: "🗑️", text: "اتمسحت العادة.", tone: "default" });
    },

    addHabit(payload) {
      const habit = {
        id: REBUILT.Data.generateId("habit"),
        title: payload.title,
        description: payload.description || "",
        icon: payload.icon,
        xp: payload.xp,
        frequency: payload.frequency,
        targetDays: payload.targetDays || [],
        time: payload.time || null,
        createdAt: REBUILT.Data.todayISO(0),
        completionHistory: [],
        currentStreak: 0,
        longestStreak: 0,
      };
      state.habits.push(habit);
      REBUILT.Storage.syncAddHabit(state.user.id, habit);
      settle();
      REBUILT.Toast.show({ icon: "🎉", text: "عادة جديدة أتضافت، يلا نبدأ فيها!", tone: "success" });
    },

    updateHabit(id, payload) {
      const habit = state.habits.find((h) => h.id === id);
      if (!habit) return;
      Object.assign(habit, payload);
      REBUILT.Streak.computeHabitStreak(habit);
      REBUILT.Storage.syncUpdateHabit(id, payload);
      settle();
      REBUILT.Toast.show({ icon: "✏️", text: "اتعدلت العادة.", tone: "default" });
    },

    /* ---- Tasks ---- */

    toggleTask(id) {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      const today = REBUILT.Data.todayISO(0);

      if (task.completed) {
        task.completed = false;
        task.completedAt = null;
        REBUILT.XP.addXP(state, -task.xp);
        REBUILT.Streak.logXPToday(state, -task.xp);
        REBUILT.Storage.syncToggleTask(id, false, null, 0);
        settle();
        REBUILT.Toast.show({ icon: "↩️", text: "رجعناها لسه ماخلصتش.", tone: "default", duration: 1800 });
        return;
      }

      task.completed = true;
      task.completedAt = today;
      const levelResult = REBUILT.XP.addXP(state, task.xp);
      REBUILT.Streak.logXPToday(state, task.xp);
      REBUILT.Storage.syncToggleTask(id, true, today, task.xp);
      settle();

      REBUILT.Toast.xpGain(task.xp);
      REBUILT.Toast.show({ icon: "✅", text: REBUILT.Messages.taskCompleted(state), tone: "success", duration: 2200 });
      if (levelResult.leveledUp) {
        REBUILT.Toast.levelUp(levelResult.toLevel, REBUILT.Messages.levelUp(state, levelResult.toLevel));
      }
    },

    deleteTask(id) {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      if (!window.confirm(REBUILT.Messages.confirmDelete(task.title))) return;
      // A completed task's XP is revoked on delete — no XP should exist without a live record backing it.
      if (task.completed) REBUILT.XP.addXP(state, -task.xp);
      state.tasks = state.tasks.filter((t) => t.id !== id);
      REBUILT.Storage.syncDeleteTask(id);
      REBUILT.Modal.close();
      settle();
      REBUILT.Toast.show({ icon: "🗑️", text: "اتمسحت المهمة.", tone: "default" });
    },

    addTask(payload) {
      const task = {
        id: REBUILT.Data.generateId("task"),
        title: payload.title,
        description: payload.description || "",
        priority: payload.priority,
        date: payload.date || null,
        time: payload.time || null,
        xp: payload.xp,
        completed: false,
        completedAt: null,
        createdAt: REBUILT.Data.todayISO(0),
      };
      state.tasks.push(task);
      REBUILT.Storage.syncAddTask(state.user.id, task);
      settle();
      REBUILT.Toast.show({ icon: "📝", text: "تمام، ضفناها للقايمة.", tone: "success" });
    },

    updateTask(id, payload) {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      Object.assign(task, payload);
      REBUILT.Storage.syncUpdateTask(id, payload);
      settle();
      REBUILT.Toast.show({ icon: "✏️", text: "اتعدلت المهمة.", tone: "default" });
    },

    /* ---- Planner / schedule items ---- */

    addScheduleItem(payload) {
      const item = {
        id: REBUILT.Data.generateId("sched"),
        title: payload.title,
        type: payload.type || "event",
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime || null,
        notes: payload.notes || "",
        completed: false,
      };
      state.scheduleItems.push(item);
      REBUILT.Storage.syncAddScheduleItem(state.user.id, item);
      save();
      REBUILT.Router.renderCurrent();
      REBUILT.Toast.show({ icon: "🗓️", text: "اتضاف لخطة يومك.", tone: "success" });
    },

    updateScheduleItem(id, payload) {
      const item = state.scheduleItems.find((s) => s.id === id);
      if (!item) return;
      Object.assign(item, payload);
      REBUILT.Storage.syncUpdateScheduleItem(id, payload);
      save();
      REBUILT.Router.renderCurrent();
      REBUILT.Toast.show({ icon: "✏️", text: "اتعدل العنصر.", tone: "default" });
    },

    deleteScheduleItem(id) {
      const item = state.scheduleItems.find((s) => s.id === id);
      if (!item) return;
      if (!window.confirm(REBUILT.Messages.confirmDelete(item.title))) return;
      state.scheduleItems = state.scheduleItems.filter((s) => s.id !== id);
      REBUILT.Storage.syncDeleteScheduleItem(id);
      REBUILT.Modal.close();
      save();
      REBUILT.Router.renderCurrent();
    },

    toggleScheduleItem(id) {
      const item = state.scheduleItems.find((s) => s.id === id);
      if (!item) return;
      item.completed = !item.completed;
      REBUILT.Storage.syncToggleScheduleItem(id, item.completed);
      save();
      REBUILT.Router.renderCurrent();
    },

    /* ---- Profile / settings ---- */

    updateProfile(payload) {
      Object.assign(state.user, payload);
      REBUILT.Storage.syncProfile(state.user.id, payload);
      save();
      REBUILT.Router.renderCurrent();
    },

    updateSettings(payload) {
      Object.assign(state.settings, payload);
      if ("reduceMotion" in payload) {
        document.body.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
      }
      REBUILT.Storage.syncProfile(state.user.id, { settings: state.settings });
      save();
    },

    async signOut() {
      if (!window.confirm("تسجيل خروج من REBUILT على الجهاز ده؟")) return;
      try {
        await REBUILT.Auth.signOut(state);
      } catch (err) {
        console.warn("REBUILT: sign-out request failed", err);
      }
      save();
      window.location.reload();
    },

    /* ---- Data import/export/demo ---- */

    exportData() {
      try {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rebuilt-backup-${REBUILT.Data.todayISO(0)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        REBUILT.Toast.show({ icon: "📦", text: "اتصدرت البيانات 👌", tone: "success" });
      } catch (err) {
        REBUILT.Toast.error(REBUILT.Messages.genericError());
      }
    },

    importData(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.habits) || !Array.isArray(parsed.tasks)) {
            throw new Error("shape");
          }
          if (!window.confirm("هيستبدل كل بياناتك الحالية ببيانات الملف ده. متأكد؟")) return;
          state = parsed;
          migrateShape();
          save();
          REBUILT.Router.navigateTo("dashboard");
          REBUILT.Toast.show({ icon: "📥", text: "اتضافت البيانات بنجاح.", tone: "success" });
        } catch (err) {
          REBUILT.Toast.error("الملف ده مش متوافق. جرّب ملف تاني.");
        }
      };
      reader.onerror = () => REBUILT.Toast.error(REBUILT.Messages.genericError());
      reader.readAsText(file);
    },

    loadDemoData() {
      if (!window.confirm("هيستبدل بياناتك الحالية ببيانات تجريبية للتجربة بس. متأكد؟")) return;
      state = REBUILT.Data.buildDemoState();
      save();
      REBUILT.Router.navigateTo("dashboard");
      REBUILT.Toast.show({ icon: "🧪", text: "اتحمّلت بيانات تجريبية.", tone: "success" });
    },

    resetToEmpty() {
      if (!window.confirm("هيمسح كل بياناتك نهائيًا وتبدأ من الصفر. متأكد؟")) return;
      const keepAccount = state.meta.hasLocalAccount;
      const name = state.user.name;
      const email = state.user.email;
      state = REBUILT.Data.buildEmptyState();
      if (keepAccount) {
        state.meta.hasLocalAccount = true;
        state.meta.isOnboarded = false; // let them re-run onboarding on a truly clean slate
        state.user.name = name;
        state.user.email = email;
      }
      save();
      window.location.reload();
    },
  };

  return {
    init,
    Actions,
    get state() {
      return state;
    },
  };
})();

REBUILT.Actions = REBUILT.App.Actions;

document.addEventListener("DOMContentLoaded", function () {
  REBUILT.App.init();
});
