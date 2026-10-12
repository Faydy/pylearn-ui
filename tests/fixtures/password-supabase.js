const listeners = new Set();
let session;
export const state = { updates: 0, signouts: 0, samePassword: false, signoutFails: false };
export function reset(options = {}) {
  Object.assign(state, { updates: 0, signouts: 0, samePassword: false, signoutFails: false }, options);
  session = options.expired ? null : { user: { id: 'recovery-test' } };
}
const emit = event => { for (const listener of listeners) listener(event, session); };
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    onAuthStateChange(callback) {
      listeners.add(callback);
      queueMicrotask(() => { if (listeners.has(callback)) callback('PASSWORD_RECOVERY', session); });
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
    },
    async updateUser() {
      state.updates++;
      if (state.samePassword) return { error: { code: 'same_password', message: 'same password' } };
      emit('USER_UPDATED');
      // Force React to process the auth event before the request resolves.
      await new Promise(resolve => setTimeout(resolve, 30));
      return { error: null };
    },
    async signOut() {
      state.signouts++;
      if (state.signoutFails) return { error: new Error('Network unavailable') };
      session = null;
      emit('SIGNED_OUT');
      await new Promise(resolve => setTimeout(resolve, 30));
      return { error: null };
    },
  },
  from() {
    return { select: () => ({ eq: () => ({ maybeSingle: async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: { id: 'recovery-test' }, error: null };
    } }) }) };
  },
};
