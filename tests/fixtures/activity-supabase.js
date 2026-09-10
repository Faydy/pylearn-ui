const activity = [{ activity_date: '2026-09-09', problems_solved_count: 3 }];
export const supabase = {
  async rpc(name, args) {
    if (name === 'get_public_user_activity_month') {
      return { data: args.p_year === 2026 && args.p_month === 9 ? activity : [], error: null };
    }
    if (name === 'get_own_activity_week') return { data: activity, error: null };
    if (name === 'get_own_activity_summary') return { data: [{ total_xp: 100, current_streak: 0 }], error: null };
    throw new Error(`Unexpected fixture RPC: ${name}`);
  },
};
