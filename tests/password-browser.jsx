import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/AuthContext';
import ResetPassword from '../src/pages/ResetPassword';
import { reset, state } from './fixtures/password-supabase';

// Real provider + page, isolated fake service. Never changes real credentials.
window.IS_REACT_ACT_ENVIRONMENT = true;
const host = document.getElementById('root');
const results = document.getElementById('results');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function LoginResult() { return <p>{useLocation().state?.successMessage || 'Login'}</p>; }
function TestApp() {
  const { loading } = useAuth();
  // Same loading gate as App: catches accidental unmounts on USER_UPDATED.
  if (loading) return <p>Loading auth</p>;
  return <MemoryRouter initialEntries={['/reset-password']}><Routes>
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/login" element={<LoginResult />} />
  </Routes></MemoryRouter>;
}
let root;
function assert(condition, message) { if (!condition) throw new Error(message); }
async function mount(options) {
  if (root) await act(async () => root.unmount());
  reset(options);
  root = createRoot(host);
  await act(async () => root.render(<AuthProvider><TestApp /></AuthProvider>));
  await act(async () => delay(50));
}
async function submit(password, confirmation = password) {
  const fields = host.querySelectorAll('input');
  assert(fields.length === 2, 'Password form must remain mounted');
  await act(async () => {
    [password, confirmation].forEach((value, index) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(fields[index], value);
      fields[index].dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  await act(async () => {
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await delay(100);
  });
}
const checks = [
  ['short password then valid password completes successfully', async () => {
    await mount(); await submit('short');
    assert(state.updates === 0 && host.textContent.includes('minimum 8'), 'Short password must stay local');
    await submit('Different-password-123');
    assert(state.updates === 1 && state.signouts === 1, 'Must update and clean up once');
    assert(host.textContent.includes('Parola a fost modificată cu succes.') && !host.textContent.includes('expirat'), 'Must show success after auth events');
  }],
  ['same password can be corrected using the same recovery session', async () => {
    await mount({ samePassword: true }); await submit('Current-password-123');
    assert(state.signouts === 0 && host.textContent.includes('Alege o altă parolă'), 'Must retain recovery session');
    state.samePassword = false; await submit('Different-password-123');
    assert(host.textContent.includes('Parola a fost modificată cu succes.'), 'Retry must succeed');
  }],
  ['cleanup failure preserves successful save and retries only logout', async () => {
    await mount({ signoutFails: true }); await submit('Different-password-123');
    assert(host.textContent.includes('deconectarea nu a reușit') && !host.querySelector('form'), 'Must not offer another password update');
    state.signoutFails = false;
    await act(async () => { host.querySelector('button').click(); await delay(100); });
    assert(state.updates === 1 && state.signouts === 2, 'Retry must only log out');
    assert(host.textContent.includes('Parola a fost modificată cu succes.'), 'Must finish at login');
  }],
  ['expired session never offers password update', async () => {
    await mount({ expired: true });
    assert(host.textContent.includes('expirat') && !host.querySelector('form') && state.updates === 0, 'Missing session must be rejected');
  }],
];
results.textContent = '';
for (const [name, run] of checks) {
  try { await run(); results.textContent += `PASS: ${name}\n`; }
  catch (error) { results.textContent += `FAIL: ${name}: ${error.message}\n`; }
}
