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
import type { UserRole, AuthorApplication, ApplicationStatus } from '@virtua-lms/types';
import { usersService, type LMSUser } from './services/users.service';
import { adminUsersService } from './services/adminUsers.service';
import { adminAuthorApplicationsService } from './services/adminAuthorApplications.service';
import './App.css';

const AVAILABLE_ROLES: UserRole[] = ['SUPER_ADMIN', 'MANAGER', 'AUTHOR', 'STUDENT'];

export const App: React.FC = () => {
  const { initialized, authenticated, user, login, logout } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'users' | 'applications' | 'profile'>('users');

  // User Management State
  const [users, setUsers] = useState<LMSUser[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [usersError, setUsersError] = useState<string | null>(null);

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<LMSUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [savingRoles, setSavingRoles] = useState<boolean>(false);

  // Instructor Applications State
  const [applications, setApplications] = useState<AuthorApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState<boolean>(false);
  const [totalApps, setTotalApps] = useState<number>(0);
  const [appsPage, setAppsPage] = useState<number>(1);
  const [appsStatusFilter, setAppsStatusFilter] = useState<ApplicationStatus | ''>('');
  const [appsError, setAppsError] = useState<string | null>(null);
  const [reviewingApp, setReviewingApp] = useState<AuthorApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Profile Edit State
  const [profileData, setProfileData] = useState<LMSUser | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const hasAdminRole = user?.roles?.some((r) =>
    ['SUPER_ADMIN', 'MANAGER', 'AUTHOR', 'admin'].includes(r)
  );

  // Fetch users for admin
  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!authenticated) return;
      setUsersLoading(true);
      setUsersError(null);
      try {
        const data = await adminUsersService.getUsers({
          page,
          limit: 10,
          search: searchKeyword.trim() || undefined,
          role: selectedRoleFilter || undefined,
          isActive: selectedStatusFilter || undefined,
        });
        setUsers(data.items);
        setTotalUsers(data.total);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
      } catch (err: any) {
        setUsersError(err.message || 'Error fetching users');
      } finally {
        setUsersLoading(false);
      }
    },
    [authenticated, searchKeyword, selectedRoleFilter, selectedStatusFilter]
  );

  // Fetch author applications
  const fetchApplications = useCallback(
    async (page = 1) => {
      if (!authenticated) return;
      setAppsLoading(true);
      setAppsError(null);
      try {
        const data = await adminAuthorApplicationsService.getApplications({
          page,
          limit: 10,
          status: appsStatusFilter ? appsStatusFilter : undefined,
        });
        setApplications(data.items);
        setTotalApps(data.total);
        setAppsPage(data.page || 1);
      } catch (err: any) {
        setAppsError(err.message || 'Error loading instructor applications');
      } finally {
        setAppsLoading(false);
      }
    },
    [authenticated, appsStatusFilter]
  );

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

  useEffect(() => {
    if (authenticated) {
      if (activeTab === 'users') {
        fetchUsers(1);
      } else if (activeTab === 'applications') {
        fetchApplications(1);
      } else if (activeTab === 'profile') {
        fetchProfile();
      }
    }
  }, [authenticated, activeTab, fetchUsers, fetchApplications, fetchProfile]);

  // Toggle user active status
  const handleToggleStatus = async (targetUser: LMSUser) => {
    const newStatus = !targetUser.isActive;
    try {
      await adminUsersService.updateStatus(targetUser.id, newStatus);
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  // Open role editor
  const handleOpenRoleModal = (targetUser: LMSUser) => {
    setEditingUser(targetUser);
    setSelectedRoles([...targetUser.roles]);
  };

  const handleToggleRoleSelection = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        alert('A user must possess at least one role.');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Save roles
  const handleSaveRoles = async () => {
    if (!editingUser) return;
    setSavingRoles(true);
    try {
      await adminUsersService.updateRoles(editingUser.id, selectedRoles);
      setEditingUser(null);
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(`Error updating roles: ${err.message || 'Requires SUPER_ADMIN'}`);
    } finally {
      setSavingRoles(false);
    }
  };

  // Handle application review submission
  const handleSubmitReview = async () => {
    if (!reviewingApp) return;
    setSubmittingReview(true);
    try {
      await adminAuthorApplicationsService.review(reviewingApp.id, {
        status: reviewAction,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setReviewingApp(null);
      setReviewNotes('');
      fetchApplications(appsPage);
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(`Error reviewing application: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

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
      setProfileMessage('Profile successfully saved!');
    } catch (err: any) {
      setProfileMessage(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
        <div className="text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#F3E700] border-t-transparent" />
          <p className="text-sm font-medium text-[#b3b3b3] tracking-wide">
            Connecting to Keycloak Admin SSO...
          </p>
        </div>
      </div>
    );
  }

  // Fresh Login Screen when not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#272727] bg-[#181818]/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E700] text-black font-extrabold text-xl shadow-[0_0_16px_rgba(243,231,0,0.3)]">
              V
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                Virtua Admin
              </span>
              <span className="text-[11px] text-[#7c7c7c] tracking-wider uppercase block">
                Management Console
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
            portalTitle="Virtua Admin"
            portalSubtitle="Operations & Governance Console"
            badgeText="Restricted Access"
            badgeVariant="warning"
            description="Centralized administration center for user role assignment, session governance, and platform curriculum publishing."
            features={[
              {
                title: "Fine-Grained RBAC Roles",
                description: "Full control over SUPER_ADMIN, MANAGER, AUTHOR, and STUDENT scopes.",
              },
              {
                title: "Learner Directory & Status",
                description: "Real-time user state tracking and instantaneous account deactivation.",
              },
              {
                title: "Zero-Trust Identity Bridge",
                description: "Automatic Just-In-Time synchronization with Keycloak OpenID tokens.",
              },
              {
                title: "Course Authoring Governance",
                description: "Review curriculum submissions and publish production-ready content.",
              },
            ]}
            onLogin={login}
            loginButtonText="Sign In to Admin Console"
            realmName="virtualogin"
            footerNote="Secured via OpenID Connect (PKCE S256) &bull; Realm: virtualogin &bull; Restricted to Authorized Staff"
          />
        </main>
      </div>
    );
  }

  const staffName =
    profileData?.firstName && profileData?.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : user?.name || user?.username || 'Staff Administrator';

  const avatarChar = staffName.charAt(0).toUpperCase();

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
              Virtua LMS Admin
            </h1>
            <p className="text-[11px] text-[#7c7c7c] tracking-wider uppercase mt-1">
              Operations & RBAC Console
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
            <div className="h-9 w-9 rounded-full bg-[#F3E700] text-black flex items-center justify-center text-sm font-bold">
              {avatarChar}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {staffName}
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

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#272727] pb-3">
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'users'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('users')}
          >
            User Directory & Roles
          </button>
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'applications'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('applications')}
          >
            Instructor Applications
          </button>
          <button
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              activeTab === 'profile'
                ? 'bg-[#F3E700] text-black shadow-[0_2px_12px_rgba(243,231,0,0.3)]'
                : 'text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f]'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Staff Profile
          </button>
        </div>

        {/* TAB 1: User Management & RBAC */}
        {activeTab === 'users' && (
          <Card className="border-[#272727] bg-[#181818] shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#272727] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Registered Platform Users ({totalUsers})
                </CardTitle>
                <CardDescription className="text-xs text-[#b3b3b3] mt-1">
                  Manage assigned roles, view login telemetry, and deactivate user accounts.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => fetchUsers(currentPage)}
                disabled={usersLoading}
              >
                {usersLoading ? 'Syncing...' : 'Refresh Users'}
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Filters toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="max-w-md w-full">
                  <Input
                    placeholder="Search by name, email, or username..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="h-11 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 text-xs text-white outline-none focus:border-[#FFF200]"
                    value={selectedRoleFilter}
                    onChange={(e) => {
                      setSelectedRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="AUTHOR">AUTHOR</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>

                  <select
                    className="h-11 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 text-xs text-white outline-none focus:border-[#FFF200]"
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active Only</option>
                    <option value="false">Deactivated Only</option>
                  </select>

                  <Button variant="secondary" size="sm" onClick={() => fetchUsers(1)}>
                    Filter
                  </Button>
                </div>
              </div>

              {usersError && (
                <div className="p-3 rounded-lg bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f] text-xs font-semibold">
                  {usersError}
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-xl border border-[#272727] bg-[#121212]/80 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#272727] bg-[#181818] text-[#7c7c7c] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Roles</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Login</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272727]">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#7c7c7c]">
                          <div className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 rounded-full border-2 border-[#F3E700] border-t-transparent animate-spin" />
                            Loading users from database...
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#7c7c7c]">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#181818]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-bold text-[#F3E700]">
                                {u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">
                                  {u.firstName || u.lastName
                                    ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                    : u.username || 'Unnamed'}
                                </div>
                                <div className="text-[11px] text-[#7c7c7c]">
                                  @{u.username || u.id.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#b3b3b3]">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => (
                                <Badge
                                  key={r}
                                  variant={
                                    r === 'SUPER_ADMIN'
                                      ? 'default'
                                      : r === 'MANAGER'
                                      ? 'warning'
                                      : r === 'AUTHOR'
                                      ? 'info'
                                      : 'secondary'
                                  }
                                  className="text-[10px]"
                                >
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.isActive ? (
                              <Badge variant="success" className="text-[10px]">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#7c7c7c]">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenRoleModal(u)}
                                className="h-7 px-3 text-[11px]"
                              >
                                Roles
                              </Button>
                              <Button
                                variant={u.isActive ? 'destructive' : 'secondary'}
                                size="sm"
                                onClick={() => handleToggleStatus(u)}
                                className="h-7 px-3 text-[11px]"
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2 text-xs text-[#7c7c7c]">
                <div>
                  Page {currentPage} of {totalPages} ({totalUsers} total users)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1 || usersLoading}
                    onClick={() => fetchUsers(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages || usersLoading}
                    onClick={() => fetchUsers(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: Instructor Applications */}
        {activeTab === 'applications' && (
          <Card className="border-[#272727] bg-[#181818] shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#272727] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Instructor Applications ({totalApps})
                </CardTitle>
                <CardDescription className="text-xs text-[#b3b3b3] mt-1">
                  Review applicant teaching portfolios and grant authoring privileges.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 text-xs text-white outline-none focus:border-[#FFF200]"
                  value={appsStatusFilter}
                  onChange={(e) => {
                    setAppsStatusFilter(e.target.value as ApplicationStatus | '');
                    setAppsPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Button size="sm" onClick={() => fetchApplications(appsPage)}>
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {appsError && (
                <div className="p-3 rounded-lg bg-[#f3727f]/10 border border-[#f3727f]/30 text-[#f3727f] text-xs font-semibold">
                  {appsError}
                </div>
              )}

              {appsLoading ? (
                <div className="py-12 text-center text-[#7c7c7c]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-[#F3E700] border-t-transparent animate-spin" />
                    Loading applications...
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-12 text-center text-[#7c7c7c] text-xs">
                  No instructor applications found for the selected filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-[#272727] bg-[#121212]/90 p-5 space-y-3 transition-all hover:border-[#3a3a3a]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#272727] pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-bold text-[#F3E700]">
                            {app.user?.firstName ? app.user.firstName.charAt(0).toUpperCase() : app.user?.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">
                              {app.user?.firstName || app.user?.lastName
                                ? `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim()
                                : app.user?.username || 'Applicant'}
                            </span>
                            <span className="text-xs text-[#7c7c7c] font-mono">
                              {app.user?.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              app.status === 'APPROVED'
                                ? 'success'
                                : app.status === 'REJECTED'
                                ? 'destructive'
                                : 'warning'
                            }
                            className="text-[11px] font-bold uppercase tracking-wider"
                          >
                            {app.status}
                          </Badge>
                          <span className="text-[11px] text-[#7c7c7c]">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#7c7c7c] font-bold uppercase tracking-wider block">
                            Headline
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {app.headline}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#7c7c7c] font-bold uppercase tracking-wider block">
                            Teaching Background & Bio
                          </span>
                          <p className="text-[#b3b3b3] leading-relaxed pt-0.5">
                            {app.bio}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#7c7c7c] font-bold uppercase tracking-wider block mb-1">
                            Technical Expertise
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.expertise?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                          {app.portfolioUrl && (
                            <a
                              href={app.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#F3E700] hover:underline flex items-center gap-1"
                            >
                              🔗 Portfolio / Profile ↗
                            </a>
                          )}
                          {app.sampleVideo && (
                            <a
                              href={app.sampleVideo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#539df5] hover:underline flex items-center gap-1"
                            >
                              🎥 Sample Lecture Video ↗
                            </a>
                          )}
                        </div>

                        {app.reviewNotes && (
                          <div className="p-3 rounded-lg bg-[#181818] border border-[#272727] text-[11px] text-[#b3b3b3]">
                            <strong className="text-white">Reviewer Note:</strong> {app.reviewNotes}
                          </div>
                        )}
                      </div>

                      {app.status === 'PENDING' && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#272727]">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setReviewingApp(app);
                              setReviewAction('REJECTED');
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewingApp(app);
                              setReviewAction('APPROVED');
                            }}
                          >
                            Approve as Instructor
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Staff Profile */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-5 border-[#272727] bg-[#181818]">
              <CardHeader className="p-6 border-b border-[#272727]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white">
                    Administrator Profile
                  </CardTitle>
                  <Badge variant={hasAdminRole ? 'default' : 'secondary'} className="text-[10px]">
                    {hasAdminRole ? 'ELEVATED ACCESS' : 'LIMITED ACCESS'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#F3E700] text-black flex items-center justify-center text-2xl font-bold shadow-lg">
                    {avatarChar}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {staffName}
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
                    <span className="text-[#7c7c7c]">Keycloak Sub ID:</span>
                    <span className="font-mono text-[#b3b3b3] max-w-[180px] truncate" title={user?.id}>
                      {user?.id}
                    </span>
                  </div>
                  {profileData?.lastLoginAt && (
                    <div className="flex justify-between py-2 border-b border-[#272727]">
                      <span className="text-[#7c7c7c]">Last Synchronized:</span>
                      <span className="text-[#b3b3b3]">
                        {new Date(profileData.lastLoginAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-[#7c7c7c] uppercase tracking-wider block mb-2">
                    Granted Staff Privileges
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={role === 'SUPER_ADMIN' ? 'default' : 'warning'}
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

            <Card className="md:col-span-7 border-[#272727] bg-[#181818]">
              <CardHeader className="p-6 border-b border-[#272727]">
                <CardTitle className="text-lg font-bold text-white">
                  Edit Staff Details
                </CardTitle>
                <CardDescription className="text-xs text-[#b3b3b3]">
                  Update database records associated with this administrator account.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {profileLoading ? (
                  <div className="py-8 text-center text-xs text-[#7c7c7c]">
                    Loading profile from database...
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
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                          Last Name
                        </label>
                        <Input
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="Last name"
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
                        placeholder="Administrator headline, responsibilities, or contact note..."
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
                        {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal for Reviewing Author Application */}
        {reviewingApp && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
            onClick={() => setReviewingApp(null)}
          >
            <Card
              className="max-w-md w-full border-[#3a3a3a] bg-[#181818] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="p-6 border-b border-[#272727] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    {reviewAction === 'APPROVED' ? 'Approve Instructor' : 'Reject Application'}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#b3b3b3]">
                    {reviewingApp.user?.email}
                  </CardDescription>
                </div>
                <button
                  onClick={() => setReviewingApp(null)}
                  className="text-[#7c7c7c] hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-xs text-[#b3b3b3] leading-relaxed">
                  {reviewAction === 'APPROVED'
                    ? 'Approving this application will immediately assign the AUTHOR role to this user and grant access to the Course Authoring Studio.'
                    : 'Provide constructive feedback explaining why this application was not approved.'}
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                    Review Notes / Feedback (Optional)
                  </label>
                  <textarea
                    className="flex min-h-[96px] w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder:text-[#7c7c7c] focus-visible:outline-none focus-visible:border-[#FFF200] focus-visible:ring-2 focus-visible:ring-[#FFF200]/20 transition-colors"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter review notes for the applicant..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setReviewingApp(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'}
                    size="sm"
                    disabled={submittingReview}
                    onClick={handleSubmitReview}
                  >
                    {submittingReview
                      ? 'Processing...'
                      : reviewAction === 'APPROVED'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal for editing user roles */}
        {editingUser && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
            onClick={() => setEditingUser(null)}
          >
            <Card
              className="max-w-md w-full border-[#3a3a3a] bg-[#181818] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="p-6 border-b border-[#272727] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Assign Roles: {editingUser.email}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#b3b3b3]">
                    Modify privilege tiers for this registered identity.
                  </CardDescription>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-[#7c7c7c] hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedRoles.includes(role)
                          ? 'border-[#F3E700]/60 bg-[#1f1f1f]'
                          : 'border-[#272727] bg-[#181818] hover:border-[#3a3a3a]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-[#F3E700]"
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleToggleRoleSelection(role)}
                      />
                      <div>
                        <div className="font-semibold text-xs text-white flex items-center gap-2">
                          {role}
                          {role === 'SUPER_ADMIN' && (
                            <Badge variant="default" className="text-[9px] h-4">
                              Platform Root
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7c7c7c] mt-0.5">
                          {role === 'SUPER_ADMIN' && 'Full unconstrained platform control and user role assignment'}
                          {role === 'MANAGER' && 'Course review, approval, publishing and metrics telemetry'}
                          {role === 'AUTHOR' && 'Course curriculum authoring, assignments & student feedback'}
                          {role === 'STUDENT' && 'Course discovery, video player, coding labs & certificates'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={savingRoles} onClick={handleSaveRoles}>
                    {savingRoles ? 'Saving...' : 'Save Roles'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
