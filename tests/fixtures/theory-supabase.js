export const supabase = {
  auth: { async getSession() { return { data: { session: null } }; } },
  async rpc() { return { data: [{ input: '5\\n7', expected_output: '12' }], error: null }; },
  from() {
    const query = {
      select() { return query; }, eq() { return query; },
      async single() {
        return { data: { id: 1, title: 'Test execuție problemă', description: 'Verificare /run existent.', difficulty: 'usor', xp_reward: 10, time_limit: 1000, memory_limit: 128, starting_code: 'print(input())', chapters: { title: 'Capitol', section: 'Secțiune', grade_id: 1 } }, error: null };
      },
    };
    return query;
  },
};
