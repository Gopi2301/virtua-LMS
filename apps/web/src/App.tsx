import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { Button } from '@virtua-lms/ui';
import './App.css';

export const App: React.FC = () => {
  const { initialized, authenticated, user, login, logout, apiFetch } = useAuth();
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);

  const testApi = async (endpoint: string) => {
    setLoadingEndpoint(endpoint);
    try {
      const res = await apiFetch(`http://localhost:4000${endpoint}`);
      setApiStatus(res.status);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiStatus(0);
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingEndpoint(null);
    }
  };

  if (!initialized) {
    return (
      <div className="lms-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Connecting to Keycloak SSO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <div className="logo-badge">V</div>
          <div className="brand-text">
            <h1>Virtua LMS</h1>
            <p>Learner & Student Portal</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className="sso-badge">
            <span className={`status-dot ${authenticated ? 'connected' : 'disconnected'}`} />
            <span>Keycloak: <strong>virtualogin</strong></span>
          </div>

          {authenticated ? (
            <Button variant="destructive" onClick={logout}>
              Sign Out
            </Button>
          ) : (
            <Button onClick={login}>
              Sign In with SSO
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      {!authenticated ? (
        <section className="hero-login">
          <h2 className="hero-title">Unified Learning Platform</h2>
          <p className="hero-desc">
            Access your courses, interactive workshops, and video lessons with single sign-on across the entire Virtua ecosystem.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '14px 28px', fontSize: 16 }} onClick={login}>
              Log In with Keycloak SSO
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 24 }}>
            Secured via OpenID Connect (PKCE S256) &bull; Realm: virtualogin &bull; Client: virtua-lms
          </p>
        </section>
      ) : (
        <div>
          <div className="grid-two">
            {/* User Profile Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>👤</span> Authenticated Student Profile
                </div>
                <span className="role-pill student">ACTIVE SESSION</span>
              </div>

              <div className="user-profile-header">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-meta">
                  <h3>{user?.name || user?.username}</h3>
                  <p>{user?.email || 'No email provided'}</p>
                </div>
              </div>

              <div className="meta-row">
                <span className="meta-label">Username</span>
                <span className="meta-val">{user?.username}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Keycloak Sub ID</span>
                <span className="meta-val" title={user?.id}>{user?.id}</span>
              </div>

              <div style={{ marginTop: 16 }}>
                <span className="meta-label" style={{ display: 'block', marginBottom: 6 }}>Realm & Client Roles:</span>
                <div className="roles-container">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className={`role-pill ${
                          role === 'SUPER_ADMIN' || role === 'admin' ? 'admin' : role === 'STUDENT' ? 'student' : ''
                        }`}
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>No roles assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Backend API Integration Tester */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>⚡</span> Live API Keycloak JWT Verification
                </div>
                {apiStatus !== null && (
                  <span
                    className={`role-pill ${
                      apiStatus === 200 ? 'student' : apiStatus === 403 || apiStatus === 401 ? 'admin' : ''
                    }`}
                  >
                    HTTP {apiStatus}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Test token exchange with the NestJS API (<code style={{ color: '#a5b4fc' }}>http://localhost:4000</code>).
              </p>

              <div className="api-actions">
                <button
                  className="btn-secondary"
                  disabled={!!loadingEndpoint}
                  onClick={() => testApi('/api/auth/me')}
                >
                  {loadingEndpoint === '/api/auth/me' && <span className="loading-spinner" />}
                  GET /api/auth/me
                </button>

                <button
                  className="btn-secondary"
                  disabled={!!loadingEndpoint}
                  onClick={() => testApi('/api/auth/student-test')}
                >
                  {loadingEndpoint === '/api/auth/student-test' && <span className="loading-spinner" />}
                  GET /student-test (Role: STUDENT)
                </button>

                <button
                  className="btn-secondary"
                  disabled={!!loadingEndpoint}
                  onClick={() => testApi('/api/auth/admin-test')}
                >
                  {loadingEndpoint === '/api/auth/admin-test' && <span className="loading-spinner" />}
                  GET /admin-test (Role: SUPER_ADMIN)
                </button>
              </div>

              {apiResponse ? (
                <pre className="response-box">{apiResponse}</pre>
              ) : (
                <div className="response-box" style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '30px 10px' }}>
                  Click an endpoint button above to test authenticated API requests.
                </div>
              )}
            </div>
          </div>

          {/* Quick SSO Navigation Card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 15, marginBottom: 4 }}>Single Sign-On Seamless Switch</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Because SSO is active, opening the Admin Console will instantly recognize your session without re-authenticating.
              </p>
            </div>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Open Admin Console <span>&rarr;</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
