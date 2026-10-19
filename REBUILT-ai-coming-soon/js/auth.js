/* ============================================================
   REBUILT — auth.js
   One auth interface, two providers behind it:

   • SupabaseProvider — real authentication (Supabase Auth). Used
     whenever supabase-js is loaded and configured.
   • LocalProvider    — the original device-only fallback. Used when
     Supabase can't be reached (offline / CDN blocked). It is NOT
     real security and says so; it exists so the app still opens.

   Callers only ever touch REBUILT.Auth.* — they never care which
   provider is active. All account operations are async.
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Auth = (function () {

  /* ---------------- Validation (shared, synchronous) ---------------- */

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function validateSignUp({ name, email, password, confirmPassword }) {
    const errors = {};
    if (!name || !name.trim()) errors.name = "محتاجين اسمك.";
    if (!validateEmail(email)) errors.email = "الإيميل مش صحيح.";
    if (!password || password.length < 6) errors.password = "الباسورد لازم يكون 6 حروف على الأقل.";
    if (password !== confirmPassword) errors.confirmPassword = "الباسورد وتأكيده مش متطابقين.";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateSignIn({ email, password }) {
    const errors = {};
    if (!validateEmail(email)) errors.email = "الإيميل مش صحيح.";
    if (!password) errors.password = "اكتب الباسورد.";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  /* ---------------- Provider: Supabase (real auth) ---------------- */

  const SupabaseProvider = {
    id: "supabase",

    async signUp(state, { name, email, password }) {
      const sb = REBUILT.SupabaseClient.get();
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (error) return { ok: false, error: translateError(error) };

      state.user.name = name.trim();
      state.user.email = email.trim();
      if (data.user) state.user.id = data.user.id;

      // Email confirmation is ON, so signUp gives us a user but no session
      // until they click the link. Don't pretend they're signed in.
      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true, session: null };
      }

      state.meta.hasLocalAccount = true;
      return { ok: true, needsEmailConfirmation: false, session: data.session };
    },

    async signIn(state, { email, password }) {
      const sb = REBUILT.SupabaseClient.get();
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { ok: false, error: translateError(error) };

      state.user.id = data.user.id;
      state.user.email = data.user.email;
      const metaName = data.user.user_metadata && data.user.user_metadata.name;
      if (metaName && !state.user.name) state.user.name = metaName;
      state.meta.hasLocalAccount = true;

      return { ok: true, session: data.session };
    },

    async signOut(state) {
      const sb = REBUILT.SupabaseClient.get();
      await sb.auth.signOut();
      state.meta.hasLocalAccount = false;
    },

    async getSession(state) {
      const sb = REBUILT.SupabaseClient.get();
      const { data } = await sb.auth.getSession();
      if (!data.session) return { loggedIn: false, localOnly: false };
      return {
        loggedIn: true,
        userId: data.session.user.id,
        email: data.session.user.email,
        name: state.user.name,
        localOnly: false,
      };
    },
  };

  /** Turn Supabase's English auth errors into REBUILT's own Egyptian-Arabic voice. */
  function translateError(error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login credentials")) return "الإيميل أو الباسورد غلط.";
    if (msg.includes("email not confirmed")) return "لسه مأكدتش الإيميل. بص في بريدك على رسالة التأكيد.";
    if (msg.includes("user already registered") || msg.includes("already been registered")) return "الإيميل ده مسجل قبل كده. جرّب تسجيل الدخول.";
    if (msg.includes("password")) return "الباسورد مش قوي كفاية.";
    if (msg.includes("rate limit") || msg.includes("too many")) return "جرّب تاني كمان شوية.";
    if (msg.includes("failed to fetch") || msg.includes("network")) return "مفيش اتصال بالنت دلوقتي.";
    return "حصلت مشكلة صغيرة 😅 جرّب تاني.";
  }

  /* ---------------- Provider: Local (device-only fallback) ---------------- */

  const LocalProvider = {
    id: "local",

    async signUp(state, { name, email }) {
      state.user.name = name.trim();
      state.user.email = email.trim();
      state.meta.hasLocalAccount = true;
      return { ok: true, needsEmailConfirmation: false, session: { localOnly: true } };
    },

    async signIn(state, { email }) {
      const known = (state.user.email || "").trim().toLowerCase();
      const attempt = (email || "").trim().toLowerCase();
      if (!known || known !== attempt) {
        return { ok: false, error: "مفيش حساب محلي متسجل بالإيميل ده على الجهاز ده." };
      }
      state.meta.hasLocalAccount = true;
      return { ok: true, session: { localOnly: true } };
    },

    async signOut(state) {
      state.meta.hasLocalAccount = false;
    },

    async getSession(state) {
      return {
        loggedIn: !!state.meta.hasLocalAccount,
        name: state.user.name,
        email: state.user.email,
        localOnly: true,
      };
    },
  };

  /* ---------------- Provider selection ---------------- */

  function provider() {
    return REBUILT.SupabaseClient && REBUILT.SupabaseClient.isAvailable()
      ? SupabaseProvider
      : LocalProvider;
  }

  function mode() {
    return provider().id;
  }

  /** True when accounts are backed by a real server rather than this device only. */
  function isRealAuth() {
    return mode() === "supabase";
  }

  return {
    validateEmail,
    validateSignUp,
    validateSignIn,
    mode,
    isRealAuth,
    signUp: (state, payload) => provider().signUp(state, payload),
    signIn: (state, payload) => provider().signIn(state, payload),
    signOut: (state) => provider().signOut(state),
    getSession: (state) => provider().getSession(state),
  };
})();
