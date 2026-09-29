import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  LoginView,
} from '@virtua-lms/ui';
import { usersService, type LMSUser } from './services/users.service';
import { authorApplicationService } from './services/authorApplication.service';
import type { AuthorApplication } from '@virtua-lms/types';
import './App.css';

export const App: React.FC = () => {
  const { initialized, authenticated, user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'instructor' | 'profile'>('dashboard');

  // Profile state
  const [profileData, setProfileData] = useState<LMSUser | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Instructor Application state
  const [application, setApplication] = useState<AuthorApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState<boolean>(false);
  const [appHeadline, setAppHeadline] = useState<string>('');
  const [appBio, setAppBio] = useState<string>('');
  const [appExpertise, setAppExpertise] = useState<string>('');
  const [appPortfolio, setAppPortfolio] = useState<string>('');
  const [appSampleVideo, setAppSampleVideo] = useState<string>('');
  const [submittingApp, setSubmittingApp] = useState<boolean>(false);
  const [appMessage, setAppMessage] = useState<string | null>(null);

  const isAuthor = user?.roles?.includes('AUTHOR') || profileData?.roles?.includes('AUTHOR');

  // Fetch current user DB profile
  const fetchProfile = useCallback(async () => {
    if (!authenticated) return;
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const data = await usersService.getProfile();
      setProfileData(data);
      setEditFirstName(data.firstName || '');
      setEditLastName(data.lastName || '');
      setEditBio(data.bio || '');
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
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
        setAppHeadline(app.headline || '');
        setAppBio(app.bio || '');
        setAppExpertise(app.expertise?.join(', ') || '');
        setAppPortfolio(app.portfolioUrl || '');
        setAppSampleVideo(app.sampleVideo || '');
      }
    } catch (err) {
      console.error('Failed to load instructor application', err);
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
      setProfileMessage('Profile information successfully saved!');
    } catch (err: any) {
      setProfileMessage(`Error: ${err.message || 'Failed to update profile'}`);
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
        .split(',')
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
      setAppMessage('Application submitted successfully! Our team will review your profile.');
    } catch (err: any) {
      setAppMessage(`Error: ${err.message || 'Failed to submit application'}`);
    } finally {
      setSubmittingApp(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
        <div className="text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#F3E700] border-t-transparent" />
          <p className="text-sm font-medium text-[#b3b3b3] tracking-wide">
            Connecting to Keycloak SSO...
          </p>
        </div>
      </div>
    );
  }

  // Fresh Login Screen when not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#272727] bg-[#181818]/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E700] text-black font-extrabold text-xl shadow-[0_0_16px_rgba(243,231,0,0.3)]">
              V
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                Virtua LMS
              </span>
              <span className="text-[11px] text-[#7c7c7c] tracking-wider uppercase block">
                Student & Creator Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] border-[#3a3a3a] text-[#b3b3b3]">
              Keycloak: virtualogin
            </Badge>
            <Button size="sm" onClick={login}>
              Sign In
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <LoginView
            portalTitle="Virtua LMS"
            portalSubtitle="Learner & Student Ecosystem"
            badgeText="Student Portal"
            badgeVariant="default"
            description="Empowering modern learners and instructors with immersive course tracks, interactive workshops, and cryptographically verified certifications."
            features={[
              {
                title: "Curated Course Paths",
                description: "Structured learning tracks crafted by vetted industry practitioners.",
              },
              {
                title: "Interactive Coding Labs",
                description: "Direct hands-on workshops with instant feedback and grading.",
              },
              {
                title: "Milestone & Skill Tracking",
                description: "Real-time synchronization across devices with verifiable proof of work.",
              },
              {
                title: "Collaborative Discussions",
                description: "Ask questions, share code snippets, and engage with mentors.",
              },
            ]}
            onLogin={login}
            loginButtonText="Sign In with Student SSO"
            realmName="virtualogin"
            footerNote="Secured via OpenID Connect (PKCE S256) &bull; Realm: virtualogin &bull; Client: virtua-lms"
          />
        </main>
      </div>
    );
  }

  const displayName =
    profileData?.firstName && profileData?.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : user?.name || user?.username || 'Learner';

  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#272727] bg-[#181818]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E700] text-black font-extrabold text-xl shadow-[0_0_16px_rgba(243,231,0,0.3)]">
            V
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Virtua LMS
            </h1>
            <p className="text-[11px] text-[#7c7c7c] tracking-wider uppercase mt-1">
              Learner Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#b3b3b3]">SSO:</span>
            <span className="font-mono text-white font-medium">virtualogin</span>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-[#272727]">
            <div className="h-9 w-9 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center text-sm font-bold text-[#F3E700]">
              {avatarChar}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {displayName}
              </div>
              <div className="text-[11px] text-[#7c7c7c] leading-tight font-mono">
                {user?.email}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            className="hover:border-[#f3727f]/50 hover:text-[#f3727f]"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#272727] pb-3">
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            My Learning
          </button>
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'instructor'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('instructor')}
          >
            Become an Instructor
          </button>
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'profile'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Settings
          </button>
        </div>

        {/* TAB 1: Student Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="rounded-2xl border border-[#272727] bg-gradient-to-r from-[#181818] via-[#1f1f1f] to-[#181818] p-6 md:p-8 relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-2">
                <Badge variant="default" className="text-[11px] uppercase tracking-wider">
                  Active Enrollment
                </Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Welcome back, {displayName}!
                </h2>
                <p className="text-sm text-[#b3b3b3] max-w-xl leading-relaxed">
                  Continue where you left off. You have active workshops and learning tracks waiting for completion.
                </p>
              </div>
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-[#F3E700]/10 blur-[64px]" />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-[#272727] bg-[#181818]">
                <CardHeader className="p-5 pb-2">
                  <CardDescription className="text-xs text-[#7c7c7c] uppercase tracking-wider">
                    Enrolled Tracks
                  </CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-white">
                    3
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-[#b3b3b3]">
                  All tracks currently in progress
                </CardContent>
              </Card>

              <Card className="border-[#272727] bg-[#181818]">
                <CardHeader className="p-5 pb-2">
                  <CardDescription className="text-xs text-[#7c7c7c] uppercase tracking-wider">
                    Completed Lessons
                  </CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-[#F3E700]">
                    18
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-[#b3b3b3]">
                  +4 completed this week
                </CardContent>
              </Card>

              <Card className="border-[#272727] bg-[#181818]">
                <CardHeader className="p-5 pb-2">
                  <CardDescription className="text-xs text-[#7c7c7c] uppercase tracking-wider">
                    Certifications
                  </CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-emerald-400">
                    1
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-[#b3b3b3]">
                  Full-Stack TypeScript Certified
                </CardContent>
              </Card>
            </div>

            {/* In Progress Courses */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Current Learning Tracks
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-[#272727] bg-[#181818] hover:border-[#4d4d4d] transition-all">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-[#3a3a3a]">
                        Intermediate
                      </Badge>
                      <span className="text-xs font-semibold text-[#F3E700]">65% Done</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-white pt-2">
                      Full-Stack Architecture with NestJS & React
                    </CardTitle>
                    <CardDescription className="text-xs text-[#b3b3b3]">
                      Module 4: Keycloak Single Sign-On and RBAC Infrastructure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    <div className="h-1.5 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F3E700] rounded-full w-[65%]" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-[#7c7c7c]">12 of 18 lessons</span>
                      <Button size="sm">Resume Lesson</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#272727] bg-[#181818] hover:border-[#4d4d4d] transition-all">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-[#3a3a3a]">
                        Advanced
                      </Badge>
                      <span className="text-xs font-semibold text-[#539df5]">30% Done</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-white pt-2">
                      PostgreSQL Data Modeling & Prisma ORM
                    </CardTitle>
                    <CardDescription className="text-xs text-[#b3b3b3]">
                      Module 2: High Performance Indexing and Relational Schemas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    <div className="h-1.5 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
                      <div className="h-full bg-[#539df5] rounded-full w-[30%]" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-[#7c7c7c]">4 of 14 lessons</span>
                      <Button variant="secondary" size="sm">Resume Lesson</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Become an Instructor */}
        {activeTab === 'instructor' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {loadingApp ? (
              <div className="py-16 text-center text-xs text-[#7c7c7c]">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-[#F3E700] border-t-transparent animate-spin" />
                  Loading instructor status...
                </div>
              </div>
            ) : isAuthor ? (
              <Card className="border-[#F3E700]/30 bg-[#181818] shadow-2xl p-8 text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-[#F3E700] text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
                  ★
                </div>
                <Badge variant="default" className="text-xs">
                  Active Author Privileges
                </Badge>
                <h2 className="text-2xl font-extrabold text-white">
                  You Are an Approved Instructor!
                </h2>
                <p className="text-sm text-[#b3b3b3] max-w-md mx-auto leading-relaxed">
                  Your account has authoring and curriculum building privileges. Access the Creator Studio to build courses, upload videos, and mentor learners.
                </p>
                <div className="pt-2">
                  <a
                    href="http://localhost:5174"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button size="lg">
                      Open Author Studio ↗
                    </Button>
                  </a>
                </div>
              </Card>
            ) : application?.status === 'PENDING' ? (
              <Card className="border-[#272727] bg-[#181818] shadow-xl p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-[#272727] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Instructor Application Under Review
                    </h2>
                    <p className="text-xs text-[#7c7c7c] mt-0.5">
                      Submitted on {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning" className="text-xs font-bold uppercase tracking-wider">
                    ● Pending Review
                  </Badge>
                </div>

                <div className="rounded-xl border border-[#272727] bg-[#121212] p-5 space-y-3 text-xs">
                  <div>
                    <span className="text-[#7c7c7c] uppercase tracking-wider font-semibold block text-[10px]">
                      Headline
                    </span>
                    <span className="text-white text-sm font-medium">
                      {application.headline}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7c7c7c] uppercase tracking-wider font-semibold block text-[10px]">
                      Teaching Philosophy & Background
                    </span>
                    <p className="text-[#b3b3b3] mt-1 leading-relaxed">
                      {application.bio}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#7c7c7c] uppercase tracking-wider font-semibold block text-[10px] mb-1.5">
                      Expertise Areas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {application.expertise?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#7c7c7c] leading-relaxed">
                  Our curriculum governance team typically reviews new instructor submissions within 24-48 business hours. You will receive an email upon approval.
                </p>
              </Card>
            ) : (
              <Card className="border-[#272727] bg-[#181818] shadow-2xl">
                <CardHeader className="p-6 md:p-8 border-b border-[#272727]">
                  <Badge variant="default" className="w-fit text-[11px] uppercase tracking-wider mb-2">
                    Creator Onboarding
                  </Badge>
                  <CardTitle className="text-2xl font-extrabold text-white">
                    Apply to Become a Virtua Instructor
                  </CardTitle>
                  <CardDescription className="text-xs text-[#b3b3b3]">
                    Share your expertise with learners worldwide. Complete the application below for our curriculum team to review.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  {application?.status === 'REJECTED' && (
                    <div className="mb-6 p-4 rounded-xl bg-[#f3727f]/10 border border-[#f3727f]/30 text-xs text-[#f3727f] space-y-1">
                      <span className="font-bold block">Previous Application Feedback:</span>
                      <p>{application.reviewNotes || 'Please revise your application and provide more detail about your experience.'}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitApplication} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                        Professional Headline *
                      </label>
                      <Input
                        required
                        value={appHeadline}
                        onChange={(e) => setAppHeadline(e.target.value)}
                        placeholder="e.g. Staff Distributed Systems Engineer & Open Source Contributor"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                        Areas of Expertise (Comma-separated) *
                      </label>
                      <Input
                        required
                        value={appExpertise}
                        onChange={(e) => setAppExpertise(e.target.value)}
                        placeholder="e.g. TypeScript, NestJS, PostgreSQL, Kubernetes, System Design"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                        Teaching Bio & Experience *
                      </label>
                      <textarea
                        required
                        className="flex min-h-[120px] w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder:text-[#7c7c7c] focus-visible:outline-none focus-visible:border-[#FFF200] focus-visible:ring-2 focus-visible:ring-[#FFF200]/20 transition-colors"
                        value={appBio}
                        onChange={(e) => setAppBio(e.target.value)}
                        placeholder="Tell us about your technical journey, previous teaching or mentoring experience, and what courses you plan to create..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                          Portfolio / LinkedIn URL
                        </label>
                        <Input
                          type="url"
                          value={appPortfolio}
                          onChange={(e) => setAppPortfolio(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                          Sample Lecture or Video URL
                        </label>
                        <Input
                          type="url"
                          value={appSampleVideo}
                          onChange={(e) => setAppSampleVideo(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    {appMessage && (
                      <div
                        className={`p-3 rounded-lg text-xs font-medium ${
                          appMessage.includes('Error')
                            ? 'bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f]'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {appMessage}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={submittingApp} size="lg">
                        {submittingApp ? 'Submitting Application...' : 'Submit Application'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: Profile & Account Settings */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Identity Card */}
            <Card className="md:col-span-5 border-[#272727] bg-[#181818]">
              <CardHeader className="p-6 border-b border-[#272727]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white">
                    Learner Profile
                  </CardTitle>
                  <Badge variant="success" className="text-[10px] uppercase tracking-wider">
                    SSO Synchronized
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center text-2xl font-bold text-[#F3E700] shadow-md">
                    {avatarChar}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[#b3b3b3] font-mono mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#272727]">
                    <span className="text-[#7c7c7c]">Username:</span>
                    <span className="font-mono text-white">{user?.username || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#272727]">
                    <span className="text-[#7c7c7c]">SSO Identity ID:</span>
                    <span className="font-mono text-[#b3b3b3] max-w-[180px] truncate" title={user?.id}>
                      {user?.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#272727]">
                    <span className="text-[#7c7c7c]">Account Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active Student
                    </span>
                  </div>
                  {profileData?.lastLoginAt && (
                    <div className="flex justify-between py-2 border-b border-[#272727]">
                      <span className="text-[#7c7c7c]">Last Session Sync:</span>
                      <span className="text-[#b3b3b3]">
                        {new Date(profileData.lastLoginAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-[#7c7c7c] uppercase tracking-wider block mb-2">
                    Assigned Roles
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={role === 'AUTHOR' ? 'default' : role === 'STUDENT' ? 'info' : 'secondary'}
                          className="text-[11px]"
                        >
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-[#7c7c7c]">No roles assigned</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Edit Form */}
            <Card className="md:col-span-7 border-[#272727] bg-[#181818]">
              <CardHeader className="p-6 border-b border-[#272727]">
                <CardTitle className="text-lg font-bold text-white">
                  Personal Details
                </CardTitle>
                <CardDescription className="text-xs text-[#b3b3b3]">
                  Update your contact details and biography saved in the Virtua database.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {profileLoading ? (
                  <div className="py-8 text-center text-xs text-[#7c7c7c]">
                    Loading user profile from database...
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                          First Name
                        </label>
                        <Input
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          placeholder="e.g. John"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                          Last Name
                        </label>
                        <Input
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="e.g. Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                        Bio / Headline
                      </label>
                      <textarea
                        className="flex min-h-[96px] w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder:text-[#7c7c7c] focus-visible:outline-none focus-visible:border-[#FFF200] focus-visible:ring-2 focus-visible:ring-[#FFF200]/20 transition-colors"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell mentors and peers about your learning journey..."
                      />
                    </div>

                    {profileMessage && (
                      <div
                        className={`p-3 rounded-lg text-xs font-medium ${
                          profileMessage.includes('Error')
                            ? 'bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f]'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {profileMessage}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
