import { LearnerHeader } from "./components/LearnerHeader";
import { PageHeading } from "./components/LearningUI";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth/AuthContext";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Toaster,
} from "@virtua-lms/ui";
import { usersService, type LMSUser } from "./services/users.service";
import { authorApplicationService } from "./services/authorApplication.service";
import type { AuthorApplication } from "@virtua-lms/types";
import { CatalogView } from "./components/CatalogView";
import { CourseDetailView } from "./components/CourseDetailView";
import { MyLearningView } from "./components/MyLearningView";
import { CoursePlayerView } from "./components/CoursePlayerView";
import { VerifyCertificateView } from "./components/VerifyCertificateView";
import "./App.css";

export const App: React.FC = () => {
  const { initialized, authenticated, user, login, logout } = useAuth();

  // Active view state
  const [activeTab, setActiveTab] = useState<
    | "catalog"
    | "detail"
    | "learning"
    | "player"
    | "verify"
    | "instructor"
    | "profile"
  >("catalog");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(
    null,
  );
  const [verifyCode, setVerifyCode] = useState<string>("");

  // Profile state
  const [profileData, setProfileData] = useState<LMSUser | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>("");
  const [editLastName, setEditLastName] = useState<string>("");
  const [editBio, setEditBio] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Instructor Application state
  const [application, setApplication] = useState<AuthorApplication | null>(
    null,
  );
  const [loadingApp, setLoadingApp] = useState<boolean>(false);
  const [appHeadline, setAppHeadline] = useState<string>("");
  const [appBio, setAppBio] = useState<string>("");
  const [appExpertise, setAppExpertise] = useState<string>("");
  const [appPortfolio, setAppPortfolio] = useState<string>("");
  const [appSampleVideo, setAppSampleVideo] = useState<string>("");
  const [submittingApp, setSubmittingApp] = useState<boolean>(false);
  const [appMessage, setAppMessage] = useState<string | null>(null);

  const isAuthor =
    user?.roles?.includes("AUTHOR") || profileData?.roles?.includes("AUTHOR");

  // Check URL query parameters for direct links (e.g. ?verify=ABC123 or ?course=slug)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("verify");
    const course = params.get("course");
    if (code) {
      setVerifyCode(code);
      setActiveTab("verify");
    } else if (course) {
      setSelectedCourse(course);
      setActiveTab("detail");
    }
  }, []);

  // Fetch current user DB profile
  const fetchProfile = useCallback(async () => {
    if (!authenticated) return;
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const data = await usersService.getProfile();
      setProfileData(data);
      setEditFirstName(data.firstName || "");
      setEditLastName(data.lastName || "");
      setEditBio(data.bio || "");
    } catch (err: any) {
      console.error("Failed to fetch profile", err);
    } finally {
      setProfileLoading(false);
    }
  }, [authenticated]);

  // Fetch instructor application
  const fetchApplication = useCallback(async () => {
    if (!authenticated) return;
    setLoadingApp(true);
    try {
      const app = await authorApplicationService.getMyApplication();
      setApplication(app);
      if (app) {
        setAppHeadline(app.headline || "");
        setAppBio(app.bio || "");
        setAppExpertise(app.expertise?.join(", ") || "");
        setAppPortfolio(app.portfolioUrl || "");
        setAppSampleVideo(app.sampleVideo || "");
      }
    } catch (err) {
      console.error("Failed to load instructor application", err);
    } finally {
      setLoadingApp(false);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      fetchProfile();
      fetchApplication();
    }
  }, [authenticated, fetchProfile, fetchApplication]);

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const updated = await usersService.updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        bio: editBio,
      });
      setProfileData(updated);
      setProfileMessage("Profile information successfully saved!");
    } catch (err: any) {
      setProfileMessage(`Error: ${err.message || "Failed to update profile"}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit instructor application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingApp(true);
    setAppMessage(null);
    try {
      const tags = appExpertise
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await authorApplicationService.apply({
        headline: appHeadline,
        bio: appBio,
        expertise: tags,
        portfolioUrl: appPortfolio.trim() || undefined,
        sampleVideo: appSampleVideo.trim() || undefined,
      });

      setApplication(created);
      setAppMessage(
        "Application submitted successfully! Our curriculum team will review your profile.",
      );
    } catch (err: any) {
      setAppMessage(`Error: ${err.message || "Failed to submit application"}`);
    } finally {
      setSubmittingApp(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-white">
        <div className="text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm font-medium text-[var(--color-text-secondary)] tracking-wide">
            Connecting to Virtua LMS...
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    profileData?.firstName && profileData?.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : user?.name || user?.username || "Learner";

  const avatarChar = displayName.charAt(0).toUpperCase();

  // Full-screen Course Player View
  if (activeTab === "player" && activeEnrollmentId) {
    return (
      <>
        <Toaster richColors position="top-right" theme="dark" />
        <CoursePlayerView
          enrollmentId={activeEnrollmentId}
          studentName={displayName}
          onExit={() => setActiveTab("learning")}
        />
      </>
    );
  }

  return (
    <div className="learner-app">
      <Toaster richColors position="top-right" theme="dark" />
      <a className="learning-skip" href="#learning-main">
        Skip to content
      </a>
      <LearnerHeader
        activeTab={activeTab}
        authenticated={authenticated}
        displayName={displayName}
        avatarChar={avatarChar}
        onNavigate={setActiveTab}
        login={login}
        logout={logout}
      />
      <main id="learning-main" className="learner-main" tabIndex={-1}>
        {/* TAB: CATALOG */}
        {activeTab === "catalog" && (
          <CatalogView
            onSelectCourse={(courseSlugOrId) => {
              setSelectedCourse(courseSlugOrId);
              setActiveTab("detail");
            }}
          />
        )}

        {/* TAB: COURSE DETAIL */}
        {activeTab === "detail" && selectedCourse && (
          <CourseDetailView
            courseIdOrSlug={selectedCourse}
            authenticated={authenticated}
            onLogin={login}
            onBack={() => setActiveTab("catalog")}
            onStartLearning={(enId) => {
              setActiveEnrollmentId(enId);
              setActiveTab("player");
            }}
          />
        )}

        {/* TAB: MY LEARNING */}
        {activeTab === "learning" && (
          <MyLearningView
            onStartLearning={(enId) => {
              setActiveEnrollmentId(enId);
              setActiveTab("player");
            }}
            onExploreCatalog={() => setActiveTab("catalog")}
            userName={displayName}
          />
        )}

        {/* TAB: VERIFY CERTIFICATE */}
        {activeTab === "verify" && (
          <VerifyCertificateView
            initialCode={verifyCode}
            onBack={() => setActiveTab("catalog")}
          />
        )}

        {/* TAB: INSTRUCTOR ONBOARDING */}
        {activeTab === "instructor" && (
          <div className="instructor-page space-y-6">
            <PageHeading
              title="Become an instructor"
              description="Share your expertise through structured courses at Virtua Academy."
            />
            {loadingApp ? (
              <Card className="border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)] p-8 text-center text-sm text-zinc-400">
                Checking instructor application status...
              </Card>
            ) : isAuthor ? (
              <Card className="border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)] p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="success" className="text-sm font-bold">
                    Author access
                  </Badge>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Your account has access to the author workspace.
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Your author workspace
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-xl">
                  Manage your curricula, upload videos, configure
                  questionnaires, and submit courses for manager approval in the
                  Admin Console.
                </p>
                <div className="pt-2">
                  <a
                    href="http://localhost:5174"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button size="lg">Open author workspace</Button>
                  </a>
                </div>
              </Card>
            ) : application?.status === "PENDING" ? (
              <Card className="border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)]  p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--color-surface-elevated-alt)] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Instructor Application Under Review
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      Submitted on{" "}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning" className="text-sm font-bold  ">
                    Pending review
                  </Badge>
                </div>

                <div className="rounded-md border border-[var(--color-surface-elevated-alt)] bg-[var(--color-background)] p-5 space-y-3 text-sm">
                  <div>
                    <span className="text-[var(--color-text-secondary)]   font-semibold block text-sm">
                      Headline
                    </span>
                    <span className="text-white text-sm font-medium">
                      {application.headline}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]   font-semibold block text-sm">
                      Teaching Philosophy & Background
                    </span>
                    <p className="text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                      {application.bio}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]   font-semibold block text-sm mb-1.5">
                      Expertise Areas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {application.expertise?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Your application is with the review team. Check this page for
                  its status.
                </p>
              </Card>
            ) : (
              <Card className="border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)] ">
                <CardHeader className="p-6 md:p-8 border-b border-[var(--color-surface-elevated-alt)]">
                  <CardTitle className="text-lg font-semibold text-white">
                    Apply to Become a Virtua Instructor
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--color-text-secondary)]">
                    Share your expertise with learners worldwide. Complete the
                    application below for our curriculum team to review.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  {application?.status === "REJECTED" && (
                    <div className="mb-6 p-4 rounded-md bg-[#f3727f]/10 border border-[#f3727f]/30 text-sm text-[#f3727f] space-y-1">
                      <span className="font-bold block">
                        Previous Application Feedback:
                      </span>
                      <p>
                        {application.reviewNotes ||
                          "Please revise your application and provide more detail about your experience."}
                      </p>
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmitApplication}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-field-1"
                        className="text-sm font-bold text-[var(--color-text-secondary)]  "
                      >
                        Professional Headline *
                      </label>
                      <Input
                        id="profile-field-1"
                        required
                        value={appHeadline}
                        onChange={(e) => setAppHeadline(e.target.value)}
                        placeholder="e.g. Staff Distributed Systems Engineer & Open Source Contributor"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-field-2"
                        className="text-sm font-bold text-[var(--color-text-secondary)]  "
                      >
                        Areas of Expertise (Comma-separated) *
                      </label>
                      <Input
                        id="profile-field-2"
                        required
                        value={appExpertise}
                        onChange={(e) => setAppExpertise(e.target.value)}
                        placeholder="e.g. TypeScript, NestJS, PostgreSQL, Kubernetes, System Design"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-field-3"
                        className="text-sm font-bold text-[var(--color-text-secondary)]  "
                      >
                        Teaching Bio & Experience *
                      </label>
                      <textarea
                        id="profile-field-3"
                        required
                        className="flex min-h-[120px] w-full rounded-md border border-[var(--color-divider)] bg-[var(--color-surface-interactive)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:border-[var(--color-primary-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-focus)]/20 transition-colors"
                        value={appBio}
                        onChange={(e) => setAppBio(e.target.value)}
                        placeholder="Tell us about your technical journey, previous teaching or mentoring experience, and what courses you plan to create..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-field-4"
                          className="text-sm font-bold text-[var(--color-text-secondary)]  "
                        >
                          Portfolio / LinkedIn URL
                        </label>
                        <Input
                          id="profile-field-4"
                          type="url"
                          value={appPortfolio}
                          onChange={(e) => setAppPortfolio(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-field-5"
                          className="text-sm font-bold text-[var(--color-text-secondary)]  "
                        >
                          Sample Lecture or Video URL
                        </label>
                        <Input
                          id="profile-field-5"
                          type="url"
                          value={appSampleVideo}
                          onChange={(e) => setAppSampleVideo(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    {appMessage && (
                      <div
                        role="status"
                        className={`p-3 rounded-md text-sm font-medium ${
                          appMessage.includes("Error")
                            ? "bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f]"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {appMessage}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={submittingApp} size="lg">
                        {submittingApp
                          ? "Submitting Application..."
                          : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB: PROFILE & SETTINGS */}
        {activeTab === "profile" && authenticated && (
          <section className="profile-page">
            <PageHeading
              title="Profile & settings"
              description="Manage your personal information and account details."
            />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Identity Card */}
              <Card className="md:col-span-5 border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)]">
                <CardHeader className="p-6 border-b border-[var(--color-surface-elevated-alt)]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white">
                      Learner Profile
                    </CardTitle>
                    <Badge variant="success" className="text-sm  ">
                      Signed in
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md bg-[var(--color-surface-interactive)] border border-[var(--color-divider)] flex items-center justify-center text-2xl font-bold text-[var(--color-primary)] ">
                      {avatarChar}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {displayName}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] font-mono mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-[var(--color-surface-elevated-alt)]">
                      <span className="text-[var(--color-text-secondary)]">
                        Username:
                      </span>
                      <span className="font-mono text-white">
                        {user?.username || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--color-surface-elevated-alt)]">
                      <span className="text-[var(--color-text-secondary)]">
                        Account ID:
                      </span>
                      <span
                        className="font-mono text-[var(--color-text-secondary)] max-w-[180px] truncate"
                        title={user?.id}
                      >
                        {user?.id}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--color-surface-elevated-alt)]">
                      <span className="text-[var(--color-text-secondary)]">
                        Account Status:
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        {profileData
                          ? profileData.isActive
                            ? "Active"
                            : "Inactive"
                          : "Signed in"}
                      </span>
                    </div>
                    {profileData?.lastLoginAt && (
                      <div className="flex justify-between py-2 border-b border-[var(--color-surface-elevated-alt)]">
                        <span className="text-[var(--color-text-secondary)]">
                          Last signed in:
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {new Date(
                            profileData.lastLoginAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)]   block mb-2">
                      Assigned Roles
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {user?.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={
                              role === "AUTHOR"
                                ? "default"
                                : role === "STUDENT"
                                  ? "info"
                                  : "secondary"
                            }
                            className="text-sm"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Edit Form */}
              <Card className="md:col-span-7 border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)]">
                <CardHeader className="p-6 border-b border-[var(--color-surface-elevated-alt)]">
                  <CardTitle className="text-lg font-bold text-white">
                    Personal Details
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--color-text-secondary)]">
                    Update your name and the biography shown on your profile.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {profileLoading ? (
                    <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                      Loading your profile…
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="profile-field-6"
                            className="text-sm font-bold text-[var(--color-text-secondary)]  "
                          >
                            First Name
                          </label>
                          <Input
                            id="profile-field-6"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="e.g. John"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="profile-field-7"
                            className="text-sm font-bold text-[var(--color-text-secondary)]  "
                          >
                            Last Name
                          </label>
                          <Input
                            id="profile-field-7"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="e.g. Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-field-8"
                          className="text-sm font-bold text-[var(--color-text-secondary)]  "
                        >
                          Bio / Headline
                        </label>
                        <textarea
                          id="profile-field-8"
                          className="flex min-h-[96px] w-full rounded-md border border-[var(--color-divider)] bg-[var(--color-surface-interactive)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:border-[var(--color-primary-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-focus)]/20 transition-colors"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Tell mentors and peers about your learning journey..."
                        />
                      </div>

                      {profileMessage && (
                        <div
                          role="status"
                          className={`p-3 rounded-md text-sm font-medium ${
                            profileMessage.includes("Error")
                              ? "bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f]"
                              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          }`}
                        >
                          {profileMessage}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={savingProfile}>
                          {savingProfile ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
