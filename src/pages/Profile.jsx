import { AlertTriangle, ArrowRight, Loader2, LogOut, Mail, Save, User, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import SubmittedSolutions from '../components/profile/SubmittedSolutions';
import { supabase } from '../supabaseClient';
import { AVATAR_OPTIONS, getAvatarUrl, normalizeProfileRole, PROFILE_ROLES } from '../utils/profile';
import { normalizeUsername } from '../utils/username';

const SUBMISSIONS_PREVIEW_SIZE = 5;
const PUBLIC_SUBMISSIONS_PAGE_SIZE = 12;

export default function Profile() {
  const { user, refreshAuth } = useAuth();
  const { userId: routeUserId } = useParams();
  const ownProfile = !routeUserId || routeUserId === user?.id;
  const viewedUserId = ownProfile ? user?.id : routeUserId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profileError, setProfileError] = useState('');
  const [solvedCount, setSolvedCount] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [publicSubmissions, setPublicSubmissions] = useState([]);
  const [publicSubmissionsLoading, setPublicSubmissionsLoading] = useState(false);
  const [publicSubmissionsError, setPublicSubmissionsError] = useState('');
  const [hasMorePublicSubmissions, setHasMorePublicSubmissions] = useState(false);
  const normalizedPreview = normalizeUsername(username);

  const loadSolvedCount = useCallback(async () => {
    if (!viewedUserId) return;

    const { data, error } = await supabase
      .rpc('get_public_solved_problem_count', { p_profile_id: viewedUserId });

    if (!error) setSolvedCount(Number(data) || 0);
  }, [viewedUserId]);

  const loadOwnSubmissions = useCallback(async () => {
    if (!ownProfile || !user) return;

    setSubmissionsLoading(true);
    setSubmissionsError('');
    const { data, error } = await supabase.rpc('get_own_recent_submissions', {
      p_offset: 0,
      p_limit: SUBMISSIONS_PREVIEW_SIZE,
    });

    if (error) {
      setSubmissionsError('Soluțiile trimise nu au putut fi încărcate.');
      setSubmissionsLoading(false);
      return;
    }

    setSubmissions(data || []);
    setSubmissionsLoading(false);
  }, [ownProfile, user]);

  const loadPublicSubmissions = useCallback(async ({ offset = 0, append = false } = {}) => {
    if (ownProfile || !user || !viewedUserId) return;

    setPublicSubmissionsLoading(true);
    setPublicSubmissionsError('');
    const { data, error } = await supabase.rpc('get_public_user_submissions', {
      p_profile_user_id: viewedUserId,
      p_offset: offset,
      p_limit: PUBLIC_SUBMISSIONS_PAGE_SIZE + 1,
    });

    if (error) {
      setPublicSubmissionsError('Nu am putut încărca soluțiile.');
      setPublicSubmissionsLoading(false);
      return;
    }

    const receivedSubmissions = data || [];
    const nextSubmissions = receivedSubmissions.slice(0, PUBLIC_SUBMISSIONS_PAGE_SIZE);
    setPublicSubmissions((current) => {
      if (!append) return nextSubmissions;

      const knownIds = new Set(current.map((submission) => submission.submission_id));
      return [...current, ...nextSubmissions.filter((submission) => !knownIds.has(submission.submission_id))];
    });
    setHasMorePublicSubmissions(receivedSubmissions.length > PUBLIC_SUBMISSIONS_PAGE_SIZE);
    setPublicSubmissionsLoading(false);
  }, [ownProfile, user, viewedUserId]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!user || !viewedUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setProfileError('');
      setPublicProfile(null);
      setSolvedCount(0);
      setSubmissions([]);
      setSubmissionsError('');
      setPublicSubmissions([]);
      setPublicSubmissionsError('');
      setHasMorePublicSubmissions(false);

      try {
        if (ownProfile) {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!authData.user) throw new Error('Nu ești autentificat.');

          let { data: ownRecord, error: ownProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (ownProfileError?.code === 'PGRST116') {
            const temporaryUsername = `user_${authData.user.id.substring(0, 5)}`;
            const { error: createError } = await supabase
              .from('profiles')
              .upsert({ id: authData.user.id, username: temporaryUsername }, { onConflict: 'id' });
            if (createError) throw createError;

            const { data: createdRecord, error: reloadError } = await supabase
              .from('profiles')
              .select()
              .eq('id', authData.user.id)
              .single();
            if (reloadError) throw reloadError;
            ownRecord = createdRecord;
          } else if (ownProfileError) {
            throw ownProfileError;
          }

          if (!cancelled) {
            setUserAuth(authData.user);
            setProfileData(ownRecord);
            setUsername(ownRecord.username || '');
            setAvatar(ownRecord.avatar || authData.user.user_metadata?.avatar || '');
            setRole(normalizeProfileRole(ownRecord.role || authData.user.user_metadata?.role || ''));
          }
        } else if (!cancelled) {
          setUserAuth(null);
          setProfileData(null);
        }

        const { data: publicRows, error: publicProfileError } = await supabase
          .rpc('get_public_profile', { p_profile_id: viewedUserId });
        if (publicProfileError) throw publicProfileError;
        if (!publicRows?.[0]) throw new Error('Utilizatorul nu a fost găsit.');

        if (!cancelled) setPublicProfile(publicRows[0]);
      } catch (error) {
        if (!cancelled) setProfileError(error.message || 'Utilizatorul nu a fost găsit.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [ownProfile, user, viewedUserId]);

  useEffect(() => {
    if (!user || !viewedUserId) return undefined;
    loadSolvedCount();
    return undefined;
  }, [loadSolvedCount, user, viewedUserId]);

  useEffect(() => {
    if (!ownProfile || !user) return undefined;
    loadOwnSubmissions();
    return undefined;
  }, [loadOwnSubmissions, ownProfile, user]);

  useEffect(() => {
    if (ownProfile || !user) return undefined;
    loadPublicSubmissions();
    return undefined;
  }, [loadPublicSubmissions, ownProfile, user]);

  const loadSubmissionSolution = async (submissionId) => {
    const { data, error } = await supabase.rpc('get_own_submission', {
      p_submission_id: submissionId,
    });

    if (error) throw error;
    if (!data?.[0]) throw new Error('Soluția nu a fost găsită.');
    return data[0];
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!userAuth || !profileData) return;

    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const normalizedUsername = normalizeUsername(username);
      if (normalizedUsername.length < 3) throw new Error('Username-ul trebuie să aibă minim 3 caractere.');
      if (!avatar) throw new Error('Alege un avatar.');
      if (!PROFILE_ROLES.some((option) => option.value === role)) throw new Error('Alege rolul tău.');

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ username: normalizedUsername, avatar, role })
        .eq('id', userAuth.id);
      if (profileUpdateError) {
        if (profileUpdateError.code === '23505') throw new Error('Acest username este deja luat. Te rugăm să alegi altul.');
        throw profileUpdateError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({ data: { avatar, role } });
      if (metadataError) throw new Error(`Datele profilului au fost salvate, dar avatarul nu a putut fi actualizat. ${metadataError.message}`);

      const nextProfile = { ...profileData, username: normalizedUsername, avatar, role };
      setProfileData(nextProfile);
      setPublicProfile((current) => (current ? { ...current, username: normalizedUsername, avatar, role } : current));
      setUsername(normalizedUsername);
      const refreshedUser = await refreshAuth();
      setUserAuth(refreshedUser);
      setMessage({ text: 'Profil actualizat cu succes!', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center lg:min-h-[calc(100dvh-4rem)]"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  if (profileError || !publicProfile) {
    return <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8"><section className="rounded-2xl border border-hard/20 bg-hard/10 p-6 text-center sm:p-8"><AlertTriangle className="mx-auto h-8 w-8 text-hard" /><h1 className="mt-4 text-xl font-bold text-text-main">Utilizatorul nu a fost găsit.</h1><p className="mt-2 text-sm text-muted">{profileError || 'Profilul nu este disponibil.'}</p><Link to="/scoruri" className="mt-5 inline-flex font-bold text-accent transition-colors hover:text-text-main">Înapoi la clasament</Link></section></div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <ProfileHeader profile={publicProfile} ownProfile={ownProfile} />
      <div className="mt-6"><ProfileStats profile={publicProfile} solvedCount={solvedCount} /></div>

      {ownProfile && (
        <div className="mt-6">
          <SubmittedSolutions
            submissions={submissions}
            loading={submissionsLoading}
            error={submissionsError}
            hasMore={false}
            onLoadSolution={loadSubmissionSolution}
            description="Ultimele 5 soluții pe care le-ai trimis."
          />
          <div className="mt-4 text-center">
            <Link to="/profil/solutii" className="inline-flex items-center gap-2 rounded-xl border border-border bg-ink px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent">
              Vezi toate soluțiile trimise
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {!ownProfile && (
        <div className="mt-6">
          <SubmittedSolutions
            submissions={publicSubmissions}
            loading={publicSubmissionsLoading}
            error={publicSubmissionsError}
            hasMore={hasMorePublicSubmissions}
            onLoadMore={() => loadPublicSubmissions({ offset: publicSubmissions.length, append: true })}
            title="Soluții încercate"
            description="Vezi activitatea recentă de rezolvare a problemelor."
            codePresentation="modal"
            emptyTitle="Nicio soluție încercată încă."
            emptyDescription="Acest utilizator nu a trimis încă soluții la probleme."
          />
        </div>
      )}

      {ownProfile && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-ink p-4 sm:p-6 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-text-main"><User className="h-5 w-5 text-accent" />Informații personale</h2>
            <p className="mt-2 text-sm text-muted">Gestionează datele contului și preferințele profilului tău.</p>
            {message.text && <div className={`mt-5 rounded-xl border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{message.text}</div>}
            <form onSubmit={handleUpdate} className="mt-6 space-y-5">
              <div><label className="mb-2 block text-sm font-bold text-muted">Adresă email</label><div className="relative"><Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type="email" value={userAuth?.email || ''} disabled className="w-full cursor-not-allowed rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-muted opacity-70" /></div></div>
              <div><label htmlFor="username" className="mb-2 block text-sm font-bold text-muted">Nume de utilizator</label><div className="relative"><User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent" /></div><p className="mt-2 text-xs text-muted">Poți scrie cu spații și litere mari. La salvare, username-ul devine lowercase și spațiile se transformă în <span className="font-mono">_</span>.</p>{normalizedPreview && <p className="mt-1 text-xs text-accent">Va fi salvat ca: <span className="font-mono">{normalizedPreview}</span></p>}</div>
              <fieldset><legend className="mb-3 block text-sm font-bold text-muted">Avatar</legend><div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{AVATAR_OPTIONS.map((seed) => { const selected = avatar === seed; return <button key={seed} type="button" onClick={() => setAvatar(seed)} aria-label={`Alege avatarul ${seed}`} aria-pressed={selected} className={`rounded-xl border p-2 transition-all ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-background hover:border-muted'}`}><img src={getAvatarUrl(seed)} alt="" className="aspect-square w-full rounded-lg bg-sidebar" /></button>; })}</div></fieldset>
              <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-bold text-muted"><Users className="h-4 w-4 text-accent" />Rolul tău</legend><div className="grid gap-3 sm:grid-cols-3">{PROFILE_ROLES.map((option) => { const selected = role === option.value; return <button key={option.value} type="button" onClick={() => setRole(option.value)} aria-pressed={selected} className={`rounded-xl border p-4 text-left transition-all ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-background hover:border-muted'}`}><span className="block font-bold text-text-main">{option.label}</span><span className="mt-1 block text-xs text-muted">{option.description}</span></button>; })}</div></fieldset>
              <div className="flex justify-end"><button type="submit" disabled={saving || (normalizedPreview === profileData?.username && avatar === (profileData?.avatar || userAuth?.user_metadata?.avatar || '') && role === normalizeProfileRole(profileData?.role || userAuth?.user_metadata?.role || ''))} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvează modificările</button></div>
            </form>
          </section>
          <section className="h-fit rounded-2xl border border-border bg-ink p-5 sm:p-6"><h2 className="text-lg font-bold text-text-main">Contul meu</h2><p className="mt-2 text-sm text-muted">Deloghează-te în siguranță de pe acest dispozitiv.</p><button type="button" onClick={handleLogout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-hard/40 py-2.5 font-bold text-hard transition-colors hover:bg-hard/10"><LogOut className="h-4 w-4" />Ieși din cont</button></section>
        </div>
      )}
    </div>
  );
}
