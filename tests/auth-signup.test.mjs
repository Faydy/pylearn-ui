import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthErrorMessage, isExistingSignup } from '../src/utils/auth.js';

test('detects the obfuscated duplicate-account signup response', () => {
  assert.equal(isExistingSignup({ user: { id: 'obfuscated', identities: [] }, session: null }), true);
});

test('allows new and pending signups and does not infer duplicates from missing data', () => {
  for (const data of [
    { user: { identities: [{ provider: 'email' }] }, session: null },
    { user: { identities: [{ provider: 'email' }] }, session: { access_token: 'test' } },
    { user: { identities: [] }, session: { access_token: 'test' } },
    { user: {} }, { user: null }, {}, null, undefined,
  ]) assert.equal(isExistingSignup(data), false);
});

test('explicit and obfuscated duplicates share an actionable Romanian message', () => {
  const expected = 'Există deja un cont cu această adresă de email. Autentifică-te sau resetează parola dacă ai uitat-o.';
  for (const error of [
    { code: 'user_already_exists' }, { code: 'email_exists' },
    new Error('User already registered'), new Error('User has already been registered'),
  ]) assert.equal(getAuthErrorMessage(error), expected);
  assert.equal(getAuthErrorMessage(new Error('Network failure'), 'Încearcă din nou.'), 'Încearcă din nou.');
});
