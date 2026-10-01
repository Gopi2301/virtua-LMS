import { useRef, useState } from "react";
import {
  useDrawerFocus,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from "@virtua-lms/ui";

type Page =
  | "catalog"
  | "detail"
  | "learning"
  | "player"
  | "verify"
  | "instructor"
  | "profile";
interface Props {
  activeTab: Page;
  authenticated: boolean;
  displayName: string;
  avatarChar: string;
  onNavigate: (page: Page) => void;
  login: () => void;
  logout: () => void;
}

export function LearnerHeader({
  activeTab,
  authenticated,
  displayName,
  avatarChar,
  onNavigate,
  login,
  logout,
}: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useDrawerFocus(open, setOpen, navigation, 1000);
  const items = [
    {
      id: "catalog" as const,
      label: "Explore",
      icon: BookOpen,
      protected: false,
    },
    {
      id: "learning" as const,
      label: "My Learning",
      icon: GraduationCap,
      protected: true,
    },
    {
      id: "verify" as const,
      label: "Verify credential",
      icon: ShieldCheck,
      protected: false,
    },
    {
      id: "instructor" as const,
      label: "Become an instructor",
      icon: GraduationCap,
      protected: true,
    },
    ...(authenticated
      ? [
          {
            id: "profile" as const,
            label: "Profile & settings",
            icon: User,
            protected: true,
          },
        ]
      : []),
  ];
  return (
    <header className="learner-header">
      <div className="learner-header-inner">
        <button
          className="learning-brand"
          onClick={() => {
            onNavigate("catalog");
            setOpen(false);
          }}
          aria-label="Virtua Academy home"
        >
          <span className="learning-brand-mark">v.</span>
          <span>
            virtua<small>academy</small>
          </span>
        </button>
        {open && (
          <button
            className="learner-nav-scrim"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <nav
          ref={navigation}
          id="learner-navigation"
          aria-label="Main navigation"
          className={`learner-nav ${open ? "is-open" : ""}`}
        >
          <button
            className="learner-nav-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              aria-current={
                activeTab === item.id ||
                (item.id === "catalog" && activeTab === "detail")
                  ? "page"
                  : undefined
              }
              onClick={() => {
                setOpen(false);
                if (item.protected && !authenticated) login();
                else onNavigate(item.id);
              }}
            >
              <item.icon
                size={18}
                className="mobile-nav-icon"
                aria-hidden="true"
              />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="learner-account">
          {authenticated ? (
            <>
              <button
                className="learner-avatar"
                title={displayName}
                aria-label={`Profile for ${displayName}`}
                onClick={() => onNavigate("profile")}
              >
                {avatarChar}
              </button>
              <button
                className="account-signout"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button className="learning-button secondary" onClick={login}>
              Sign in
            </button>
          )}
          <button
            ref={toggle}
            className="learner-menu"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="learner-navigation"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
