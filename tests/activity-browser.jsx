import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

const NativeDate = Date;
const params = new URLSearchParams(window.location.search);
const instant = params.get('instant') || '2026-09-08T23:00:00Z';
window.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static now() { return new NativeDate(instant).getTime(); }
};

const [calendar, weekly, dashboard, header, stats] = await Promise.all([
  import('../src/components/profile/ProfileActivityCalendar'),
  import('../src/components/RightPanel/CalendarActivitate'),
  import('../src/components/MainArea/Grid/ActivitateComponent'),
  import('../src/components/profile/ProfileHeader'),
  import('../src/components/profile/ProfileStats'),
]);
const ProfileCalendar = calendar.default;
const WeeklyCalendar = weekly.default;
const DashboardActivity = dashboard.default;
const ProfileHeader = header.default;
const ProfileStats = stats.default;
const profile = { username: 'Fixture', total_xp: 100, current_streak: 0, longest_streak: 8 };

createRoot(document.getElementById('root')).render(<MemoryRouter><main className="mx-auto max-w-5xl space-y-6 p-4 text-text-main">
  <h1>Activity regression: {instant}</h1>
  <p>Isolated RPC fixtures. September 9: three first solves. September 8: none.</p>
  <ProfileCalendar userId="fixture-user" />
  <WeeklyCalendar />
  <p>Expired streak fixture: all three displays below must show 0; longest stays 8.</p>
  <DashboardActivity />
  <ProfileHeader profile={profile} ownProfile={false} />
  <ProfileStats profile={profile} solvedCount={3} />
</main></MemoryRouter>);
