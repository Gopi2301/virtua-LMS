import { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/context";
import { ApplicationsPage, ProfilePage, UsersPage } from "./Administration";
import { CategoriesPage } from "./Categories";
import {
  CoursesPage,
  CourseWorkspace,
  Dashboard,
  ReviewQueue,
} from "./Courses";
import { ErrorNotice } from "./ui";
import {
  LayoutDashboard,
  BookOpen,
  Folder,
  ClipboardCheck,
  Users,
  GraduationCap,
  User,
  LogOut,
  Menu,
  X,
  useDrawerFocus,
  Toaster,
} from "@virtua-lms/ui";
import "./console.css";

function Icon({ name }: { name: string }) {
  const icons = {
    overview: LayoutDashboard,
    courses: BookOpen,
    categories: Folder,
    reviews: ClipboardCheck,
    users: Users,
    applications: GraduationCap,
    profile: User,
  };
  const NavIcon = icons[name as keyof typeof icons] || BookOpen;
  return <NavIcon size={20} aria-hidden="true" />;
}

class PageBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="panel detail-panel">
        <h1>This page couldn’t load</h1>
        <p className="muted">Refresh the page to try again.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function ConsoleApp() {
  const auth = useAuth();
  const [route, setRoute] = useState(
    window.location.hash.slice(1) || "/overview",
  );
  const [menu, setMenu] = useState(false);
  const navigation = useRef<HTMLElement>(null);
  useDrawerFocus(menu, setMenu, navigation, 900);
  useEffect(() => {
    const update = () => {
      setRoute(window.location.hash.slice(1) || "/overview");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (!auth.initialized)
    return (
      <div className="console-auth">
        <div className="brand-icon">v.</div>
        <p role="status">Opening your workspace…</p>
      </div>
    );
  if (!auth.authenticated || !auth.user)
    return (
      <div className="console-auth">
        <div className="auth-panel">
          <div className="brand">
            <span className="brand-icon">v.</span>
            <span>
              virtua<span className="brand-suffix"> academy</span>
            </span>
          </div>
          <p className="eyebrow">YOUR TEACHING WORKSPACE</p>
          <h1>Sign in to your workspace</h1>
          <p className="muted">
            Manage courses, curriculum, and publishing at Virtua Academy.
          </p>
          <ErrorNotice
            error={auth.error}
            retry={
              auth.authenticated ? () => void auth.refreshUser() : undefined
            }
          />
          <button className="btn" onClick={auth.login}>
            {auth.authenticated ? "Sign in again" : "Sign in to your workspace"}
          </button>
          {auth.authenticated && (
            <button className="text-button" onClick={auth.logout}>
              Sign out
            </button>
          )}
        </div>
      </div>
    );
  const manager = auth.user.roles.some((r) =>
    ["SUPER_ADMIN", "MANAGER"].includes(r),
  );
  const staff = manager || auth.user.roles.includes("AUTHOR");
  if (!staff)
    return (
      <div className="console-auth">
        <div className="auth-panel">
          <h1>A workspace for your teaching team</h1>
          <p className="muted">
            Your account doesn’t have instructor or staff access. Contact your
            academy administrator if you need access.
          </p>
          <button className="btn secondary" onClick={auth.logout}>
            Sign out
          </button>
          <button
            className="text-button"
            onClick={() => void auth.refreshUser()}
          >
            Check access again
          </button>
        </div>
      </div>
    );
  const [path, query] = route.split("?");
  const section = path.split("/")[1];
  const links = [
    { id: "overview", title: "Overview", group: "WORKSPACE" },
    {
      id: "courses",
      title: manager ? "All courses" : "My courses",
      group: "WORKSPACE",
    },
    ...(manager
      ? [{ id: "categories", title: "Categories", group: "WORKSPACE" }]
      : []),
    ...(manager
      ? [
          { id: "reviews", title: "Course reviews", group: "WORKSPACE" },
          { id: "users", title: "Users & access", group: "PEOPLE" },
          {
            id: "applications",
            title: "Instructor applications",
            group: "PEOPLE",
          },
        ]
      : []),
    { id: "profile", title: "Your profile", group: "ACCOUNT" },
  ];
  let page: ReactNode;
  if (
    ["users", "applications", "reviews", "categories"].includes(section) &&
    !manager
  )
    page = (
      <div className="panel detail-panel">
        <h1>Staff access required</h1>
        <p className="muted">
          This page is available to managers and administrators.
        </p>
        <a href="#/courses" className="btn">
          Go to my courses
        </a>
      </div>
    );
  else if (section === "overview") page = <Dashboard />;
  else if (
    section === "courses" &&
    (!path.split("/")[2] || path.split("/")[2] === "new")
  )
    page = (
      <CoursesPage
        key={query || "courses"}
        initialStatus={new URLSearchParams(query).get("status") || ""}
        create={path.endsWith("/new")}
      />
    );
  else if (section === "courses" && path.split("/")[2])
    page = (
      <CourseWorkspace
        key={path.split("/")[2]}
        id={encodeURIComponent(path.split("/")[2])}
      />
    );
  else if (section === "categories") page = <CategoriesPage />;
  else if (section === "reviews") page = <ReviewQueue />;
  else if (section === "users") page = <UsersPage />;
  else if (section === "applications") page = <ApplicationsPage />;
  else if (section === "profile") page = <ProfilePage />;
  else
    page = (
      <div className="panel detail-panel">
        <h1>Page not found</h1>
        <a className="btn" href="#/overview">
          Back to overview
        </a>
      </div>
    );
  return (
    <>
      <div className="console">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Skip to content
        </a>
        {menu && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}
        <aside
          ref={navigation}
          aria-label="Workspace navigation"
          id="console-navigation"
          className={`sidebar ${menu ? "is-open" : ""}`}
        >
          <button
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
          <a className="brand" href="#/overview">
            <span className="brand-icon">v.</span>
            <span>
              virtua<span className="brand-suffix"> academy</span>
            </span>
          </a>
          <p className="workspace-name">
            {manager ? "Administration" : "Author workspace"}
          </p>
          <nav aria-label="Main navigation">
            {links.map((link, i) => (
              <div key={link.id}>
                {links[i - 1]?.group !== link.group && (
                  <p className="nav-label">{link.group}</p>
                )}
                <a
                  href={`#/${link.id}`}
                  aria-current={section === link.id ? "page" : undefined}
                  className={section === link.id ? "active" : ""}
                >
                  <Icon name={link.id} />
                  <span>{link.title}</span>
                </a>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-account">
              <span className="account-avatar">
                {(auth.user.name || auth.user.email).charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{auth.user.name || auth.user.username}</strong>
                <small>
                  {auth.user.roles.includes("SUPER_ADMIN")
                    ? "Administrator"
                    : manager
                      ? "Manager"
                      : "Author"}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label="Sign out"
                title="Sign out"
                onClick={auth.logout}
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
        <div className="console-body">
          <header className="console-header">
            <div className="actions">
              <button
                className="icon-button menu-toggle"
                aria-label={menu ? "Close navigation" : "Open navigation"}
                aria-expanded={menu}
                aria-controls="console-navigation"
                onClick={() => setMenu(!menu)}
              >
                <Menu size={20} aria-hidden="true" />
              </button>
              <span>Workspace</span>
              <span className="muted">/</span>
              <strong>
                {links.find((l) => l.id === section)?.title || "Course"}
              </strong>
            </div>
            <a className="header-account" href="#/profile">
              {manager ? "Admin console" : "Author console"}
              <span className="account-avatar">
                {(auth.user.name || auth.user.email).charAt(0).toUpperCase()}
              </span>
            </a>
          </header>
          <main id="main-content" tabIndex={-1} className="console-main">
            <PageBoundary key={route}>{page}</PageBoundary>
          </main>
          <footer className="console-footer">
            <span>Virtua Academy</span>
          </footer>
        </div>
      </div>
      <Toaster />
    </>
  );
}
