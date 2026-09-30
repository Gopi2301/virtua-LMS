import { useLoad } from './useLoad';
import { safeUrl } from './helpers';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthorApplication, UserRole, ApplicationStatus } from '@virtua-lms/types';
import { adminUsersService } from '../services/adminUsers.service';
import { adminAuthorApplicationsService } from '../services/adminAuthorApplications.service';
import { usersService } from '../services/users.service';
import type { LMSUser } from '../services/users.service';
import { useAuth } from '../auth/context';
import { Empty, ErrorNotice, Field, Modal, Pager, StatusBadge } from './ui';

export function UsersPage() {
  const { user, refreshUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<LMSUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [confirm, setConfirm] = useState<LMSUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const result = useLoad(() => adminUsersService.getUsers({ page, limit: 10, search: query, role, isActive: status }), [page, query, role, status]);
  async function mutate(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(null);
    try { await action(); setEditing(null); setConfirm(null); setNotice(message); result.reload(); await refreshUser(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update user'); }
    finally { setBusy(false); }
  }
  return <><div className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Users & access</h1><p>Manage the people who teach, learn, and run your academy.</p></div><button className="btn secondary" onClick={result.reload}>Refresh users</button></div>
    {notice && <div className="notice" role="status">{notice}</div>}
    <section className="panel"><form className="toolbar" onSubmit={e => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search users" placeholder="Search name, email, or username" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filter by role" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option>{['SUPER_ADMIN','MANAGER','AUTHOR','STUDENT'].map(r => <option key={r}>{r}</option>)}</select><select aria-label="Filter by account status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option></select><button className="btn secondary">Search</button></form>
    <ErrorNotice error={result.error} retry={result.reload} />
    {result.loading ? <div className="loading" role="status">Loading users…</div> : !result.error && result.data && <><div className="table-scroll"><table><thead><tr><th>Name</th><th>Roles</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead><tbody>{result.data.items.map(u => <tr key={u.id}><td><strong>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Unnamed user'}</strong><small>{u.email}</small></td><td><div className="tag-list">{u.roles.map(r => <span className="tag" key={r}>{r.replaceAll('_', ' ')}</span>)}</div></td><td><StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} /></td><td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td><td><div className="actions">{user?.roles.includes('SUPER_ADMIN') && <button className="text-button" onClick={() => { setEditing(u); setRoles(u.roles); setError(null); }}>Edit roles</button>}<button className="text-button" onClick={() => { setConfirm(u); setError(null); }}>{u.isActive ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>{!result.data.items.length && <Empty title="No users found">Try a different name or clear your filters.</Empty>}<Pager page={page} pages={result.data.totalPages} total={result.data.total} onChange={setPage} /></>}
    </section>
    {editing && <Modal title="Edit user roles" onClose={() => setEditing(null)} busy={busy}><p className="muted">{editing.email}</p><form onSubmit={e => { e.preventDefault(); void mutate(() => adminUsersService.updateRoles(editing.id, roles), 'Roles updated.'); }}><fieldset disabled={busy} className="form-stack">{(['SUPER_ADMIN','MANAGER','AUTHOR','STUDENT'] as UserRole[]).map(r => <label className="check-card" key={r}><input type="checkbox" checked={roles.includes(r)} onChange={e => setRoles(e.target.checked ? [...roles, r] : roles.filter(v => v !== r))} /><span>{r.replaceAll('_', ' ')}</span></label>)}<ErrorNotice error={error} /><div className="dialog-actions"><button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn" disabled={!roles.length || busy}>{busy ? 'Saving…' : 'Save roles'}</button></div></fieldset></form></Modal>}
    {confirm && <Modal title={`${confirm.isActive ? 'Deactivate' : 'Activate'} account?`} onClose={() => setConfirm(null)} busy={busy}><p>{confirm.email}</p><p className="muted">{confirm.isActive ? 'This person will lose access to the LMS until their account is activated again.' : 'This person will be able to access the LMS again.'}</p><ErrorNotice error={error} /><div className="dialog-actions"><button className="btn secondary" disabled={busy} onClick={() => setConfirm(null)}>Cancel</button><button className="btn" disabled={busy} onClick={() => void mutate(() => adminUsersService.updateStatus(confirm.id, !confirm.isActive), 'Account status updated.')}>{busy ? 'Saving…' : 'Confirm'}</button></div></Modal>}
  </>;
}

export function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | ''>('PENDING');
  const [review, setReview] = useState<{ application: AuthorApplication; decision: 'APPROVED' | 'REJECTED' } | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const result = useLoad(() => adminAuthorApplicationsService.getApplications({ page, limit: 10, status: status || undefined }), [page, status]);
  async function submit(e: FormEvent) { e.preventDefault(); if (!review) return; setBusy(true); setError(null); try { await adminAuthorApplicationsService.review(review.application.id, { status: review.decision, reviewNotes: notes.trim() || undefined }); setReview(null); setPage(1); result.reload(); } catch (err) { setError(err instanceof Error ? err.message : 'Review could not be saved'); } finally { setBusy(false); } }
  return <><div className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Instructor applications</h1><p>Meet your next instructors. Review their experience and teaching approach.</p></div></div><div className="toolbar"><select aria-label="Application status" value={status} onChange={e => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1); }}><option value="">All applications</option><option value="PENDING">Pending review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select><button className="btn secondary" onClick={result.reload}>Refresh</button></div><ErrorNotice error={result.error} retry={result.reload} />
    {result.loading ? <div className="loading" role="status">Loading applications…</div> : !result.error && result.data && <><div className="application-list">{result.data.items.map(a => <article className="panel application" key={a.id}><div className="section-heading"><div><h2>{[a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ') || a.user?.email}</h2><p>{a.headline}</p></div><StatusBadge status={a.status} /></div><p className="prose">{a.bio}</p><div className="tag-list">{a.expertise.map(t => <span className="tag" key={t}>{t}</span>)}</div><div className="actions">{a.portfolioUrl && <a className="text-button" href={safeUrl(a.portfolioUrl)} target="_blank" rel="noreferrer">View portfolio ↗</a>}{a.sampleVideo && <a className="text-button" href={safeUrl(a.sampleVideo)} target="_blank" rel="noreferrer">Sample lesson ↗</a>}</div>{a.reviewNotes && <div className="notice">{a.reviewNotes}</div>}{a.status === 'PENDING' && <div className="dialog-actions">{(['REJECTED','APPROVED'] as const).map(decision => <button className={`btn ${decision === 'REJECTED' ? 'secondary' : ''}`} key={decision} onClick={() => { setReview({ application: a, decision }); setNotes(''); setError(null); }}>{decision === 'APPROVED' ? 'Approve instructor' : 'Reject'}</button>)}</div>}</article>)}</div>{!result.data.items.length && <Empty title="You're all caught up">No applications match this status.</Empty>}<Pager page={page} pages={result.data.totalPages} total={result.data.total} onChange={setPage} /></>}
    {review && <Modal title={review.decision === 'APPROVED' ? 'Approve instructor' : 'Reject application'} onClose={() => setReview(null)} busy={busy}><form onSubmit={submit}><fieldset disabled={busy} className="form-stack"><p className="muted">{review.decision === 'APPROVED' ? 'Approval gives this person access to create and submit their own courses.' : 'Explain your decision so the applicant knows what to improve.'}</p><Field label="Review notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} required={review.decision === 'REJECTED'} rows={4} /></Field><ErrorNotice error={error} /><div className="dialog-actions"><button type="button" className="btn secondary" onClick={() => setReview(null)}>Cancel</button><button className="btn">{busy ? 'Saving…' : 'Confirm decision'}</button></div></fieldset></form></Modal>}
  </>;
}


export function ProfilePage() {
  const result = useLoad(() => usersService.getProfile(), []);
  return <><div className="page-heading"><div><p className="eyebrow">ACCOUNT</p><h1>Your profile</h1><p>The details your colleagues and learners see.</p></div></div><ErrorNotice error={result.error} retry={result.reload} />{result.loading ? <div className="loading">Loading profile…</div> : !result.error && result.data && <ProfileForm profile={result.data} />}</>;
}
function ProfileForm({ profile }: { profile: LMSUser }) {
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  return <form className="panel profile-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setSaved(false); setError(null); try { await usersService.updateProfile({ firstName, lastName, bio }); await refreshUser(); setSaved(true); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save profile'); } finally { setBusy(false); } }}><fieldset disabled={busy} className="form-stack"><div className="profile-avatar">{(firstName || profile.email).charAt(0).toUpperCase()}</div><p className="muted">{profile.email}</p><div className="form-grid"><Field label="First name"><input value={firstName} onChange={e => setFirstName(e.target.value)} /></Field><Field label="Last name"><input value={lastName} onChange={e => setLastName(e.target.value)} /></Field></div><Field label="About you"><textarea rows={5} value={bio} onChange={e => setBio(e.target.value)} /></Field><ErrorNotice error={error} />{saved && <p className="notice" role="status">Profile saved.</p>}<div className="dialog-actions"><button className="btn">{busy ? 'Saving…' : 'Save profile'}</button></div></fieldset></form>;
}


