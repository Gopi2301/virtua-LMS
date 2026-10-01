# Custom LMS — AI Engineering Agent Guide

## 1. Project Overview

This repository contains a custom Learning Management System (LMS) replacing an existing Graphy-based LMS platform.

The LMS is responsible for:

- Course and bundle management
- Live workshop management
- Student learning experience
- Video learning through Vimeo
- Course progress and completion
- Questionnaires
- Certificates
- Course messaging
- Student support tickets
- Student/pre-sales enquiries
- Email notifications
- Reviews and ratings
- Rich dashboards and analytics
- Public SEO-friendly course pages

External products/services:

- **Vimeo** — video streaming
- **VirtuaPayments** — payment processing
- **Expertisor** — profile/third-party profile integration
- **Leadflow** — sales enquiries and support tickets
- **Google Meet** — live workshops
- **Email provider** — transactional and announcement emails

---

# 2. Product Roles

The platform has four primary roles:

```text
SUPER_ADMIN
MANAGER
AUTHOR
STUDENT
```

## Super Admin

Full platform access.

Responsibilities:

- Users
- Roles
- Courses
- Bundles
- Workshops
- Authors
- Students
- Payments
- Orders
- Analytics
- Certificates
- Messages monitoring
- Enquiries
- Tickets
- Audit logs
- Platform configuration

## Manager

Operational/content management.

Responsibilities:

- Course approval
- Course publishing
- Course management
- Author management
- Student management
- Workshops
- Messages monitoring
- Enquiries/tickets monitoring
- Reports

## Author

Content and student-learning responsibility.

Responsibilities:

- Create/edit own courses
- Upload/manage videos
- Add sections and sessions
- Add resources
- Add questionnaires
- Submit courses for approval
- View own course analytics
- Respond to student course messages

Authors cannot publish courses directly unless an explicit permission is later introduced.

## Student

Learning and customer-facing role.

Responsibilities:

- Browse products
- Purchase products
- Access enrolled courses
- Watch videos
- Complete sessions
- Complete questionnaires
- Download/view resources
- Attend workshops
- View certificates
- Message authors
- Raise support tickets
- Submit enquiries
- Review courses

---

# 3. Core Product Types

Use a first-class Product abstraction.

```text
PRODUCT
├── COURSE
├── BUNDLE
└── WORKSHOP
```

## Course

```text
Course
├── Sections
│   └── Sessions
│       ├── Video
│       ├── Resources
│       └── Questionnaire
```

## Bundle

A bundle contains multiple courses.

Example:

```text
Full Stack Bundle
├── HTML & CSS
├── JavaScript
├── React
├── Node.js
└── PostgreSQL
```

Purchasing a bundle grants access to its included courses.

## Workshop

A live workshop can be free or paid.

```text
Workshop
├── Schedule
├── Instructor
├── Google Meet URL
├── Registration
├── Recording
└── Resources
```

---

# 4. Course Publishing Workflow

The canonical workflow is:

```text
DRAFT
  ↓
IN_REVIEW
  ↓
APPROVED
  ↓
ON_AIR
```

If changes are required:

```text
IN_REVIEW
  ↓
CHANGES_REQUESTED
  ↓
DRAFT
  ↓
IN_REVIEW
```

Published courses may later be:

```text
ON_AIR
  ↓
ARCHIVED
```

Only authorized Manager/Super Admin users can approve/publish.

Every important workflow transition must create an audit log.

---

# 5. Course Versioning Principle

Do not mutate the live course blindly.

For published courses, future content changes should be treated as a new draft/revision where practical:

```text
LIVE VERSION
     ↓
DRAFT REVISION
     ↓
MANAGER REVIEW
     ↓
NEW LIVE VERSION
```

The initial implementation may keep versioning lightweight, but the architecture must not prevent it.

---

# 6. Learning Progress

Progress must be granular.

Track at minimum:

```text
Enrollment
├── Course progress
└── Session progress
    ├── Started
    ├── Last position
    ├── Watched duration
    ├── Completion percentage
    └── Completed
```

A student must be able to resume from the last watched position.

Important fields include:

```text
student_id
course_id
session_id
last_position
watched_seconds
completion_percentage
completed_at
last_watched_at
```

Do not represent learning progress with a single boolean.

---

# 7. Course Completion

Course completion should be derived from defined completion rules.

For V1:

- Required sessions completed
- Required questionnaire requirements satisfied where applicable

Upon completion:

```text
Course Completed
      ↓
Certificate Issued
```

Certificates must have a unique verification identifier.

---

# 8. Course Messaging

Course messages are for learning-related communication.

```text
Student ↔ Author
```

Messages are scoped to a course.

Managers and Super Admins can monitor conversations.

Do not mix course messaging with support tickets or sales enquiries.

Use these concepts separately:

```text
MESSAGES  → Learning discussion
ENQUIRIES → Sales/pre-sales
TICKETS   → Support
```

---

# 9. Enquiries and Support Tickets

Both are integrated with Leadflow.

## Enquiry

```text
Visitor/Student
      ↓
LMS Enquiry
      ↓
Leadflow
      ↓
Sales Staff
```

Typical use cases:

- Course pricing
- Batch information
- Course suitability
- Callback requests

## Support Ticket

```text
Student
   ↓
LMS Ticket
   ↓
Leadflow
   ↓
Support Staff
```

Typical use cases:

- Payment issue
- Video issue
- Certificate issue
- Access issue
- Account issue

The LMS should not duplicate Leadflow's CRM/support workflow.

Store external IDs and integration state.

---

# 10. Payments

Payments are handled by **VirtuaPayments**.

The LMS owns:

- Products
- Orders
- Order items
- Payment state
- Enrollment state

VirtuaPayments owns payment processing.

Canonical flow:

```text
Student
  ↓
LMS Order
  ↓
VirtuaPayments
  ↓
Payment
  ↓
Verified Webhook
  ↓
LMS
  ↓
Order Status
  ↓
Enrollment
```

Never grant paid access solely based on frontend payment success.

Use verified server-to-server/webhook confirmation.

V1 access policy:

> All course/bundle purchases provide lifetime access unless explicitly changed later.

Super Admin dashboards must expose:

- Successful payments
- Failed payments
- Success rate
- Failure rate
- Orders
- Revenue

---

# 11. Vimeo

Vimeo is the video infrastructure.

The LMS should store Vimeo references and learning metadata, not act as the video streaming platform.

Example:

```text
video
├── session_id
├── vimeo_video_id
├── duration
├── thumbnail
└── status
```

Keep Vimeo credentials server-side.

Never expose Vimeo management credentials to frontend applications.

Use private/domain-restricted playback capabilities where appropriate.

---

# 12. Resources

V1 resource types:

```text
PDF
ZIP
GITHUB
```

Files should be stored in object storage.

Do not store binary resources directly in PostgreSQL.

GitHub resources are external URLs.

---

# 13. Questionnaires

V1 supports:

- Questions
- Multiple choice
- Multiple select if required
- True/False
- Attempts
- Answers
- Scores

Assignments are explicitly out of scope for V1.

---

# 14. Workshops

Live workshops use Google Meet.

V1 stores:

```text
title
description
instructor
start_time
end_time
meeting_url
price
status
```

Workshops may be free or paid.

Email reminders should be supported.

Attendance tracking can be added without requiring it for the first release.

---

# 15. Notifications

V1 notification channel:

**Email**

Use an asynchronous architecture:

```text
Application Event
      ↓
BullMQ
      ↓
Email Worker
      ↓
Email Provider
```

Examples:

- Registration
- Password reset
- Enrollment
- Payment success
- Payment failure
- Course announcement
- Workshop reminder
- Certificate
- Message notification
- Ticket update

Do not block API requests while sending emails.

---

# 16. Announcements

Announcements are different from direct messages.

```text
Author/Manager
      ↓
Course Announcement
      ↓
Enrolled Students
      ↓
Email
```

Announcements should also remain visible inside the LMS.

---

# 17. Reviews

V1 review system is intentionally simple.

Rules:

- Only enrolled students can review.
- One review per student per course.
- Students may edit reviews.
- Managers/Super Admins can moderate.
- Course pages show average rating and review count.

---

# 18. Search

Do not introduce Elasticsearch/OpenSearch for V1.

Use PostgreSQL search capabilities.

Search:

- Courses
- Bundles
- Workshops

Basic filters:

- Category
- Level
- Free/Paid

Search architecture can be upgraded later if actual scale requires it.

---

# 19. SEO

Public product pages must be SEO-friendly.

Examples:

```text
/courses
/courses/:slug
/bundles
/bundles/:slug
/workshops
/workshops/:slug
```

Support:

- Dynamic metadata
- Canonical URLs
- Open Graph
- Sitemap
- robots.txt
- Structured data where appropriate
- SEO-friendly slugs

Do not expose admin/private learning pages to search engines.

---

# 20. Analytics

Analytics are a first-class domain.

Track events such as:

```text
student.enrolled
session.started
video.progressed
session.completed
questionnaire.started
questionnaire.completed
course.completed
certificate.issued
workshop.registered
workshop.attended
message.sent
ticket.created
ticket.resolved
payment.succeeded
payment.failed
```

Dashboards:

## Student

- Continue learning
- Progress
- Courses
- Workshops
- Certificates
- Messages
- Tickets

## Author

- Courses
- Enrollments
- Active learners
- Completion
- Video engagement
- Questionnaire performance
- Reviews
- Student questions/messages

## Manager

- Course approvals
- Course performance
- Authors
- Students
- Messages
- Enquiries
- Tickets

## Super Admin

- Users
- Courses
- Enrollments
- Revenue
- Orders
- Payment success/failure
- Workshops
- Learning metrics
- Engagement
- Enquiries
- Tickets

---

# 21. Audit Logs

Keep V1 audit logging lightweight but consistent.

Record important actions:

```text
Course Created
Course Submitted
Course Approved
Course Rejected
Course Published
Course Archived

User Created
Role Changed
User Suspended

Payment Updated
Enrollment Created
Enrollment Revoked

Certificate Issued
Ticket Updated
```

Suggested model:

```text
audit_logs
├── id
├── actor_id
├── action
├── entity_type
├── entity_id
├── metadata
└── created_at
```

---

# 22. Security Rules

Security is continuous, not a final-phase activity.

Minimum requirements:

- Authentication
- RBAC
- Authorization at API/service level
- DTO/input validation
- Rate limiting
- CORS configuration
- Security headers
- Secure session/token handling
- File upload validation
- File access control
- Private video configuration
- Secret management
- HTTPS
- Database backups
- Audit logs
- Dependency updates
- Error handling without secret leakage

Super Admin should support 2FA when feasible.

Never expose:

```text
DATABASE_URL
JWT_SECRET
VIMEO_SECRET
VIRTUAPAYMENTS_SECRET
LEADFLOW_API_KEY
EXPERTISOR_API_KEY
```

to browser applications.

---

# 23. Repository Architecture

Use a monorepo.

Recommended tooling:

- pnpm workspaces
- Turborepo
- TypeScript

```text
custom-lms/
├── apps/
│   ├── api/
│   ├── web/
│   └── admin/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── api-contracts/
│   ├── validation/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── api/
│   ├── integrations/
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# 24. Backend Architecture

Use a **NestJS modular monolith**.

Do not start with microservices.

Suggested modules:

```text
auth
users
roles
profiles

products
courses
bundles
workshops

enrollments
progress
questionnaires
certificates

orders
payments

messages
enquiries
tickets
notifications

reviews
announcements
analytics
audit
```

External integrations live separately:

```text
integrations/
├── vimeo/
├── virtuapayments/
├── leadflow/
├── expertisor/
├── google-meet/
└── email/
```

---

# 25. Environment Variable Policy

Use individual environment configuration per application.

### API

May contain private secrets:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
VIMEO_ACCESS_TOKEN
VIRTUAPAYMENTS_SECRET
LEADFLOW_API_KEY
EXPERTISOR_API_KEY
EMAIL_API_KEY
```

### Web/Admin

Only public configuration:

```text
VITE_API_URL
VITE_APP_URL
```

Rule:

> Secrets belong to the application that requires them. Shared packages may contain only non-secret configuration, types, contracts, validation schemas, and reusable code.

Never create one giant shared secret `.env` accessible by all apps.

---

# 26. Frontend Architecture

Use two React applications:

```text
apps/web
```

Student/public LMS.

```text
apps/admin
```

Super Admin, Manager, and Author portal.

Use shared UI components through:

```text
packages/ui
```

Keep business-specific components inside the consuming application.

---

# 27. Database Rules

Use PostgreSQL + Prisma.

Prisma belongs inside the API application:

```text
apps/api/prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Do not expose Prisma models to frontend applications.

Use migrations for all schema changes.

Never modify production schema manually unless it is an emergency procedure that is subsequently captured as a migration.

---

# 28. API Rules

All APIs must:

- Validate inputs
- Authenticate where required
- Authorize based on role/permissions
- Return predictable response shapes
- Use pagination for lists
- Avoid leaking internal errors
- Document public APIs in Swagger
- Use consistent HTTP semantics
- Validate ownership/resource access

Example:

```text
GET    /courses
GET    /courses/:id
POST   /courses
PATCH  /courses/:id
POST   /courses/:id/submit
POST   /courses/:id/approve
POST   /courses/:id/publish
```

Avoid giant controllers and giant services.

---

# 29. Code Quality Rules

Prefer:

- Small services
- Single responsibility
- Explicit dependencies
- DTO validation
- Domain-oriented modules
- Repository abstraction where useful
- Typed integration clients
- Unit tests for business logic
- Integration tests for critical flows

Avoid:

- Any/unknown without justification
- Direct DB access from controllers
- Business logic in controllers
- Business logic in React components
- Hard-coded credentials
- Cross-module database manipulation
- Circular dependencies
- Premature microservices
- Premature event-driven complexity

---

# 30. Critical Business Flows Must Be Tested

At minimum:

### Course publishing

```text
Author → Submit → Manager → Approve → Publish
```

### Paid enrollment

```text
Order → VirtuaPayments → Webhook → Payment Success → Enrollment
```

### Bundle enrollment

```text
Bundle purchase → Successful payment → Courses unlocked
```

### Learning

```text
Open course → Watch → Save position → Complete session → Complete course
```

### Certificate

```text
Course completion → Certificate generated → Verification
```

### Support

```text
Student → Ticket → Leadflow → Status update
```

### Enquiry

```text
User → Enquiry → Leadflow → Sales
```

---

# 31. Definition of Done

A feature is not complete when the endpoint works.

A feature is complete when:

- Database changes are migrated
- API is implemented
- Authorization is implemented
- Validation is implemented
- Swagger is updated
- Frontend integration exists where applicable
- Error states are handled
- Loading states are handled
- Tests cover critical business logic
- Audit/event tracking is added where applicable
- Documentation is updated
- Environment variables are documented
---

# 32. Shared Package Conventions (`packages/ui`)

The monorepo ships a shared UI package at `packages/ui` (`@virtua-lms/ui`). Both `apps/admin` and `apps/web` already depend on it.

**Always use this package for shared UI primitives. Do NOT create local copies.**

## What is in `@virtua-lms/ui`

| Export | Purpose |
|--------|---------|
| `Toaster` | Bottom-right toast container (sonner-backed) |
| `toast` | Imperative toast API re-exported from `sonner` |
| `Button`, `Card`, `Badge`, `Input` | shadcn/ui primitives |
| `cn` | `clsx` + `tailwind-merge` utility |

## Toaster / Notifications

**Always use sonner (`toast` from `sonner` or `@virtua-lms/ui`) — never roll a custom toast or alert system.**

```tsx
// ✅ Correct — import from sonner (available via the shared package or directly)
import { toast } from 'sonner';

toast.success('Course published.', { description: 'Live in the catalog.' });
toast.error('Something went wrong.');
toast.warning('Changes requested.');
toast.info('Course archived.');
```

The `<Toaster />` component must be rendered once at the root of each app:

```tsx
// apps/admin/src/console/ConsoleApp.tsx
import { Toaster } from '@virtua-lms/ui';

// Place at root, outside of any scroll container
return <><AppLayout />...<Toaster /></>;
```

## Adding new shared components

Run shadcn/ui CLI **from the `packages/ui` directory**:

```bash
cd packages/ui
npx shadcn@latest add <component-name>
```

Then export from `packages/ui/src/index.ts` so consuming apps can import from `@virtua-lms/ui`.

## Do NOT

- Create local `Toast.tsx`, `Toaster.tsx`, or similar in individual apps.
- Import `sonner` directly without checking if `@virtua-lms/ui` re-exports what you need.
- Use `alert()`, browser dialogs, or inline `<div className="notice">` for user feedback — use `toast`.
