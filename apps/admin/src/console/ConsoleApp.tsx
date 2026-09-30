import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/context';
import { ApplicationsPage, ProfilePage, UsersPage } from './Administration';
import { CategoriesPage } from './Categories';
import { CoursesPage, CourseWorkspace, Dashboard, ReviewQueue } from './Courses';
import { ErrorNotice } from './ui';
import './console.css';

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    courses: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-5a3 3 0 0 0-3 2" /></>,
    categories: <><path d="M4 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><line x1="9" y1="13" x2="15" y2="13" /></>,
    reviews: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9zM8 13l3 3 5-6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5" /></>,
    applications: <><rect x="3" y="5" width="18" height="15" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M5 17a4 4 0 0 1 8 0M15 10h3M15 14h3" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="panel detail-panel"><h1>This page couldn’t load</h1><p className="muted">Refresh the page to try again.</p><button className="btn" onClick={() => window.location.reload()}>Refresh page</button></div> : this.props.children; }
}

export default function ConsoleApp() {
  const auth = useAuth();
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/overview');
  const [menu, setMenu] = useState(false);
  useEffect(() => { const update = () => { setRoute(window.location.hash.slice(1) || '/overview'); setMenu(false); window.scrollTo(0, 0); }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  if (!auth.initialized) return <div className="console-auth"><div className="brand-icon">v.</div><p role="status">Opening your workspace…</p></div>;
  if (!auth.authenticated || !auth.user) return <div className="console-auth"><div className="auth-panel"><div className="brand"><span className="brand-icon">v.</span><span>virtua<span className="brand-suffix"> academy</span></span></div><p className="eyebrow">YOUR TEACHING WORKSPACE</p><h1>Great learning<br />starts with you.</h1><p className="muted">Create courses, support your instructors, and bring your academy to life.</p><ErrorNotice error={auth.error} retry={auth.authenticated ? () => void auth.refreshUser() : undefined} /><button className="btn" onClick={auth.login}>{auth.authenticated ? 'Sign in again' : 'Sign in to your workspace'} →</button>{auth.authenticated && <button className="text-button" onClick={auth.logout}>Sign out</button>}</div></div>;
  const manager = auth.user.roles.some(r => ['SUPER_ADMIN','MANAGER'].includes(r));
  const staff = manager || auth.user.roles.includes('AUTHOR');
  if (!staff) return <div className="console-auth"><div className="auth-panel"><h1>A workspace for your teaching team</h1><p className="muted">Your account doesn’t have instructor or staff access. Contact your academy administrator if you need access.</p><button className="btn secondary" onClick={auth.logout}>Sign out</button><button className="text-button" onClick={() => void auth.refreshUser()}>Check access again</button></div></div>;
  const [path, query] = route.split('?');
  const section = path.split('/')[1];
  const links = [{ id: 'overview', title: 'Overview', group: 'WORKSPACE' }, { id: 'courses', title: manager ? 'All courses' : 'My courses', group: 'WORKSPACE' }, ...(manager ? [{ id: 'categories', title: 'Categories', group: 'WORKSPACE' }] : []), ...(manager ? [{ id: 'reviews', title: 'Course reviews', group: 'WORKSPACE' }, { id: 'users', title: 'Users & access', group: 'PEOPLE' }, { id: 'applications', title: 'Instructor applications', group: 'PEOPLE' }] : []), { id: 'profile', title: 'Your profile', group: 'ACCOUNT' }];
  let page: ReactNode;
  if (['users','applications','reviews','categories'].includes(section) && !manager) page = <div className="panel detail-panel"><h1>Staff access required</h1><p className="muted">This page is available to managers and administrators.</p><a href="#/courses" className="btn">Go to my courses</a></div>;
  else if (section === 'overview') page = <Dashboard />;
  else if (section === 'courses' && (!path.split('/')[2] || path.split('/')[2] === 'new')) page = <CoursesPage key={query || 'courses'} initialStatus={new URLSearchParams(query).get('status') || ''} create={path.endsWith('/new')} />;
  else if (section === 'courses' && path.split('/')[2]) page = <CourseWorkspace key={path.split('/')[2]} id={encodeURIComponent(path.split('/')[2])} />;
  else if (section === 'categories') page = <CategoriesPage />;
  else if (section === 'reviews') page = <ReviewQueue />;
  else if (section === 'users') page = <UsersPage />;
  else if (section === 'applications') page = <ApplicationsPage />;
  else if (section === 'profile') page = <ProfilePage />;
  else page = <div className="panel detail-panel"><h1>Page not found</h1><a className="btn" href="#/overview">Back to overview</a></div>;
  return <div className="console"><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    {menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside id="console-navigation" className={`sidebar ${menu ? 'is-open' : ''}`}><a className="brand" href="#/overview"><span className="brand-icon">v.</span><span>virtua<span className="brand-suffix"> academy</span></span></a><div className="workspace-name"><span className="workspace-avatar">V</span><div><strong>Virtua Academy</strong><small>{manager ? 'Administration workspace' : 'Author workspace'}</small></div></div><nav aria-label="Main navigation">{links.map((link, i) => <div key={link.id}>{links[i - 1]?.group !== link.group && <p className="nav-label">{link.group}</p>}<a href={`#/${link.id}`} aria-current={section === link.id ? 'page' : undefined} className={section === link.id ? 'active' : ''}><Icon name={link.id} /><span>{link.title}</span>{section === link.id && <span className="nav-dot" />}</a></div>)}</nav><div className="sidebar-bottom"><span className="small muted">A little knowledge.<br />A world of possibilities.</span><div className="sidebar-account"><span className="account-avatar">{(auth.user.name || auth.user.email).charAt(0).toUpperCase()}</span><div><strong>{auth.user.name || auth.user.username}</strong><small>{auth.user.roles.includes('SUPER_ADMIN') ? 'Administrator' : manager ? 'Manager' : 'Author'}</small></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={auth.logout}>↪</button></div></div></aside>
    <div className="console-body"><header className="console-header"><div className="actions"><button className="icon-button menu-toggle" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="console-navigation" onClick={() => setMenu(!menu)}>☰</button><span>Workspace</span><span className="muted">/</span><strong>{links.find(l => l.id === section)?.title || 'Course'}</strong></div><a className="header-account" href="#/profile"><span className="status-dot" />{manager ? 'Admin console' : 'Author console'}<span className="account-avatar">{(auth.user.name || auth.user.email).charAt(0).toUpperCase()}</span></a></header><main id="main-content" tabIndex={-1} className="console-main"><PageBoundary key={route}>{page}</PageBoundary></main><footer className="console-footer"><span>Virtua Academy</span><span>Built for better learning.</span></footer></div>
  </div>;
}

