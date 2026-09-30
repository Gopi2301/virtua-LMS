# Internal console implementation review

Reviewed 30 September 2026. Scope: admin, manager, and author internal pages. Landing page excluded. Review only; application source was not changed.

## Assessment

The frontend is an early identity-management console, not yet a complete LMS operations or authoring console. It has three connected screens: user directory and roles, instructor applications, and staff profile. The backend contains substantially more LMS functionality than the frontend exposes, but API presence does not establish end-to-end readiness.

The existing React/TypeScript/Vite application and shared UI package are a usable starting point. Keep the documented dark surfaces and yellow accent. The next phase should establish role-aware navigation and complete the author-to-manager course publishing workflow before expanding into secondary operations pages.

## Current coverage

| Area | Frontend implementation | Backend evidence / limits |
| --- | --- | --- |
| Authentication | Keycloak SSO initialization, login, logout, token refresh | JWT strategy, database user synchronization, active-account check |
| Users | Search, role/status filters, pagination, role editing, activate/deactivate | User administration endpoints exist; role updates restricted to Super Admin |
| Instructor applications | Status filtering, applicant details, approve/reject modal, review notes | Approval updates the database AUTHOR role in a transaction; frontend pagination missing |
| Profile | First name, last name, bio editing | Profile read/update endpoints exist |
| Admin/manager dashboard | Missing | No dedicated analytics module found in AppModule |
| Author workspace / My Courses | Missing | Course services exist; authentication and API contract issues need resolution |
| Course builder | Missing | Sections, sessions, videos, resources, and questionnaires have controllers/services |
| Course review and publishing | Missing | Review queue and submit/approve/request-changes/publish/archive endpoints exist |
| Categories, bundles, workshops | Missing | Controllers/services exist; authorization needs attention |
| Student/enrollment operations | Missing as dedicated pages | Enrollment, progress, and certificate modules exist |
| Payments, messages, enquiries, tickets, announcements, reporting | Missing | Not registered as dedicated modules in the current AppModule; later roadmap scope |

Inventory evidence: [App.tsx](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:26), [API modules](/C:/Users/gopin/work/virtua_LMS/apps/api/src/app.module.ts:26), [shared types](/C:/Users/gopin/work/virtua_LMS/packages/types/index.ts:1).

## Prioritized findings

### P1 — Course editing cannot rely on the current authentication wiring

CoursesController calls `req.user.id` for create/update/delete without applying JwtAuthGuard. No global guard or authentication middleware was found. Sending a bearer token alone does not populate `req.user`, so these actions will fail before reaching the service. The same pattern appears in sections, sessions, videos, resources, questionnaires, bundles, and workshops. CategoriesController also exposes write operations without guards and does not depend on `req.user`, leaving those operations without authentication enforcement in the inspected code.

Apply authentication, role checks, and resource ownership checks consistently before connecting the authoring UI. This finding is from source inspection, not a live API exploit test.

Evidence: [course controller](/C:/Users/gopin/work/virtua_LMS/apps/api/src/courses/courses.controller.ts:11), [category controller](/C:/Users/gopin/work/virtua_LMS/apps/api/src/categories/categories.controller.ts:10), [bootstrap](/C:/Users/gopin/work/virtua_LMS/apps/api/src/main.ts:8), [auth module](/C:/Users/gopin/work/virtua_LMS/apps/api/src/auth/auth.module.ts:8).

### P1 — Removing a role in the console does not necessarily revoke it

User role edits update only the database. JwtStrategy subsequently unions database roles with token roles, so a role still assigned in Keycloak remains effective after the console removes it. Conversely, the frontend reads token roles only, so database-granted author privileges are absent from its auth context. The displayed roles and API permissions can disagree in both directions.

Choose and implement one effective-permissions contract. The frontend should load the server's effective user permissions, and role revocation must account for the identity provider's assignments.

Evidence: [role update](/C:/Users/gopin/work/virtua_LMS/apps/api/src/users/users.service.ts:99), [role union](/C:/Users/gopin/work/virtua_LMS/apps/api/src/auth/jwt.strategy.ts:113), [frontend role extraction](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/auth/AuthContext.tsx:24).

### P1 — Authors enter an admin screen they cannot use

Every authenticated user starts on the user directory and sees all three navigation tabs and user actions. `hasAdminRole` changes a profile badge only. Authors and students therefore trigger forbidden user-directory requests; managers see the Roles action even though only Super Admin can submit it. There is no author-specific starting page or route guard.

Provide role-appropriate entry routes, navigation, actions, and a proper access-denied state. Keep server authorization in place independently.

Evidence: [initial tab](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:26), [unconditional navigation](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:369), [role action](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:564), [API restrictions](/C:/Users/gopin/work/virtua_LMS/apps/api/src/users/admin-users.controller.ts:14).

### P2 — Applications beyond the first ten are inaccessible

The application request uses `limit: 10`. The UI tracks a page number but renders no pagination or load-more control; filters reset the request to page one. With more than ten applications in a selected status, older applications cannot be reached.

Evidence: [application fetch](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:97), [application list ending](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:772).

### P2 — Failed profile loading leaves a saveable empty form

Profile-load errors are logged only to the browser console. Loading then ends and the edit form becomes available with initial empty values. Saving after an initial load failure can overwrite existing profile fields with empty strings. Show a visible error and retry action; enable editing only after loading the profile successfully.

Evidence: [load failure](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:120), [form rendering](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:886).

### P2 — User search can display stale results

Each search keystroke changes `fetchUsers`, which retriggers the effect. Requests have no cancellation or latest-request check. A slower earlier response can overwrite a later query's results. Enter and Filter also initiate requests, duplicating the automatic behavior. Use a deliberate search interaction and prevent stale responses from updating the table.

Evidence: [request and state updates](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:70), [effect](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:138), [search input](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:428).

### P2 — Dialogs and form controls lack accessibility behavior

The role and review dialogs are ordinary overlay divs with no dialog semantics, focus trap, initial focus, Escape handling, or focus restoration. Several form labels have no associated input ID; filters rely on visible option text rather than explicit labels. Build these behaviors into reusable dialog and field components before adding more forms.

Evidence: [profile labels](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:894), [review modal](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:951), [role modal](/C:/Users/gopin/work/virtua_LMS/apps/admin/src/App.tsx:1018).

## Frontend structure and product design gaps

- The entire console lives in a roughly 1,100-line App.tsx. Split the application shell, pages, dialogs, and data hooks as part of building the internal console.
- Navigation is local React state. Pages have no independent URLs, deep links, browser-history behavior, or preserved location after refresh.
- The documented desktop sidebar and mobile navigation are not implemented. Existing table scrolling and responsive profile columns provide a start, but narrow-screen usability remains unverified.
- The interface contains implementation terminology such as RBAC, Keycloak realm, database records, and synchronization. Use task-oriented language for staff and authors.
- Approval copy promises access to a Course Authoring Studio that does not exist. Role descriptions also mention assignments and coding labs, which are not delivered here; assignments are explicitly excluded from V1 in the project guide.
- Shared UI currently provides buttons, inputs, cards, badges, and login presentation. Add navigation, accessible dialogs, form fields, tables, pagination, feedback, and consistent empty/error states as the new pages require them.
- Existing API paths are inconsistent: identity endpoints use `/api/...`, while courses and publishing use root paths. The admin client defaults to a base URL ending in `/api`; settle this contract before adding course services.

## Recommended internal-page build order

1. **Console foundation:** effective permissions, URL routing, desktop/sidebar and mobile navigation, author/admin entry pages, session errors, reusable forms/dialogs/tables.
2. **Author workflow:** My Courses, create/edit course details, curriculum sections and sessions, Vimeo attachment, resources, questionnaires, preview, validation, submission, review feedback/history.
3. **Manager workflow:** course review queue, full course preview, request changes, approve, publish, archive, and author application pagination.
4. **Core administration:** improve users and roles, then categories, bundles, workshops, enrollment operations, and activity history where APIs support it.
5. **Later roadmap areas:** meaningful dashboards and reports, commerce, communications, and support integrations once their backend contracts are ready.

The first completion milestone should be a real course created by an author, submitted, reviewed by a manager, revised if needed, and published, with each role seeing only its permitted actions.

## Verification and limitations

- `pnpm --filter @virtua-lms/admin build`: passed, including TypeScript compilation and production bundling.
- `pnpm --filter @virtua-lms/admin lint`: exited successfully with two warnings: mixed component/hook exports in AuthContext and state updates initiated from the App effect.
- No frontend test files or frontend test script were found. The root test command is a placeholder; CI currently runs lint and build, not tests.
- Local preview started successfully at `http://127.0.0.1:5174`. Keycloak rejected that preview origin with `Invalid parameter: redirect_uri`. This limits the review; it is not evidence that the intended deployed origin fails. No identity-provider settings were changed.
- Internal screen findings are source-based. Authenticated browser workflows, real API/database behavior, and responsive visual quality were not verified end to end.
- No application source changes were made. This report is the only authored file; the pre-existing untracked `lms-openapi.json` was left untouched.
