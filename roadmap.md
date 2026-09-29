# Custom LMS — V1 Development Roadmap

## 1. Objective

Replace the existing Graphy-based LMS with a custom LMS supporting:

- Courses
- Course bundles
- Paid/free live workshops
- Vimeo streaming
- Student learning/progress
- Questionnaires
- Certificates
- Author → Manager → On Air publishing
- Course messaging
- Leadflow enquiries
- Leadflow support tickets
- VirtuaPayments
- Email notifications
- Reviews
- Basic search
- Rich dashboards
- SEO
- Security

---

# 2. Product Model

```text
PRODUCT
├── COURSE
├── BUNDLE
└── WORKSHOP
```

Course:

```text
Course
└── Sections
    └── Sessions
        ├── Video
        ├── Resources
        └── Questionnaire
```

---

# 3. Release Plan

## Release 1 — LMS Core

Phases 0–6.

Deliverable:

> A functioning LMS where authors create courses, managers approve/publish them, and students can consume courses, track progress, complete questionnaires, and receive certificates.

## Release 2 — Commerce

Phases 7–9.

Deliverable:

> Students can purchase courses/bundles/workshops through VirtuaPayments and attend live workshops.

## Release 3 — Engagement

Phases 10–12.

Deliverable:

> Communication, support, sales enquiries, notifications, reviews, announcements and basic discovery are operational.

## Release 4 — Analytics & Production

Phases 13–15.

Deliverable:

> Rich dashboards, SEO, security hardening, monitoring and production readiness.

---

# PHASE 0 — Foundation

## Goal

Create the technical foundation.

### Tasks

- Create monorepo
- Configure pnpm
- Configure Turborepo
- Create NestJS API
- Create React web app
- Create React admin app
- Configure TypeScript
- Configure ESLint/Prettier
- Configure PostgreSQL
- Configure Prisma
- Configure Redis
- Configure BullMQ
- Configure Docker
- Configure environment files
- Configure Swagger
- Configure logging
- Configure CI/CD
- Create development/staging/production configuration

### Repository

```text
apps/
├── api
├── web
└── admin

packages/
├── ui
├── types
├── api-contracts
├── validation
└── config
```

### Deliverable

```text
Running API
Running Student Web
Running Admin
Database
Redis
Swagger
Docker
CI pipeline
```

---

# PHASE 1 — Authentication, Users & RBAC

## Goal

Implement identity and role-based access.

### Roles

```text
SUPER_ADMIN
MANAGER
AUTHOR
STUDENT
```

### Features

- Login
- Logout
- Registration
- Password reset
- Email verification
- User management
- Role assignment
- Activate/deactivate user
- Profile
- Expertisor integration

### Acceptance

- Student cannot access admin APIs.
- Author cannot approve/publish courses.
- Manager can approve courses.
- Super Admin has full access.

---

# PHASE 2 — Product & Course Content

## Goal

Allow authors to build complete courses.

### Product

- Product base model
- Product type
- Pricing
- Visibility
- Slug

### Course

- Create course
- Edit course
- Description
- Thumbnail
- Category
- Level
- Objectives
- Requirements
- Sections
- Sessions
- Reordering
- Draft state

### Video

- Vimeo integration
- Upload workflow
- Vimeo ID
- Duration
- Thumbnail
- Status
- Private playback configuration

### Resources

Support:

```text
PDF
ZIP
GITHUB
```

### Questionnaire

- Create questionnaire
- Add questions
- Configure options
- Attach questionnaire to session

### Acceptance

Author can create a complete draft course.

---

# PHASE 3 — Course Approval & Publishing

## Goal

Implement controlled publishing.

### Workflow

```text
DRAFT
 ↓
IN_REVIEW
 ↓
APPROVED
 ↓
ON_AIR
```

Alternative:

```text
IN_REVIEW
 ↓
CHANGES_REQUESTED
 ↓
DRAFT
```

### Features

- Submit for approval
- Manager review
- Review comments
- Approve
- Request changes
- Publish
- Unpublish
- Archive
- Audit logs

### Acceptance

An author cannot independently publish a course.

---

# PHASE 4 — Public Catalog & Student Experience

## Goal

Allow students to discover and consume courses.

### Public

- Home
- Course listing
- Course detail
- Bundle listing
- Workshop listing

### Student

- My Courses
- Course player
- Section navigation
- Session navigation
- Vimeo playback
- Resources
- Questionnaire access

### Resume

Store:

```text
course_id
session_id
position
last_watched_at
```

### Acceptance

Student can open a course and resume from the previous position.

---

# PHASE 5 — Progress & Completion

## Goal

Build the LMS learning engine.

### Session progress

Track:

- Started
- Last position
- Watched seconds
- Completion percentage
- Completed
- Last watched timestamp

### Course progress

Calculate:

```text
completed sessions / required sessions
```

### Student dashboard

Show:

- Overall progress
- Continue learning
- Last watched
- Completed courses

### Acceptance

Progress survives logout/login and can be resumed across devices.

---

# PHASE 6 — Questionnaires & Certificates

## Goal

Complete the learning lifecycle.

### Questionnaire

- Start attempt
- Save answers
- Submit
- Calculate score
- Store attempt
- Show result

### Certificate

- Completion rule
- Generate certificate
- Unique certificate ID
- Verification page
- Student certificate listing

### Acceptance

A completed course can produce a verifiable certificate.

---

# PHASE 7 — VirtuaPayments & Commerce

## Goal

Enable paid products.

### Commerce

- Orders
- Order items
- Payment initiation
- Payment state
- Payment webhook
- Success/failure handling
- Enrollment

### Flow

```text
Student
 ↓
Order
 ↓
VirtuaPayments
 ↓
Payment
 ↓
Verified webhook
 ↓
Order SUCCESS
 ↓
Enrollment
```

### Access

V1:

> Lifetime access.

### Super Admin metrics

- Total orders
- Successful payments
- Failed payments
- Success rate
- Failure rate
- Revenue

### Acceptance

A successful verified payment grants lifetime access.

---

# PHASE 8 — Bundles

## Goal

Support bundled courses.

### Features

- Create bundle
- Add courses
- Remove courses
- Bundle price
- Bundle landing page
- Purchase bundle
- Enroll student into included courses

### Acceptance

One successful bundle purchase grants access to all included courses.

---

# PHASE 9 — Live Workshops

## Goal

Support free and paid workshops.

### Features

- Workshop CRUD
- Schedule
- Instructor
- Google Meet URL
- Free/paid
- Registration
- Payment integration
- Email confirmation
- Email reminders
- Recording reference

### Future

- Attendance tracking
- Workshop analytics

### Acceptance

Student can register for a free or paid workshop and receive the Google Meet details.

---

# PHASE 10 — Messaging, Enquiries & Tickets

## Goal

Implement communication and Leadflow integration.

## Course messages

```text
Student ↔ Author
```

Features:

- Course-scoped conversations
- Messages
- Unread count
- Author response
- Manager/Super Admin monitoring

## Enquiries

```text
User
 ↓
LMS
 ↓
Leadflow
 ↓
Sales
```

Store:

```text
leadflow_lead_id
```

## Tickets

```text
Student
 ↓
LMS
 ↓
Leadflow
 ↓
Support
```

Store:

```text
leadflow_ticket_id
```

### Acceptance

Course learning questions stay in LMS messaging; sales/support cases are delegated to Leadflow.

---

# PHASE 11 — Email Notifications

## Goal

Create reliable asynchronous email delivery.

### Events

- Registration
- Password reset
- Enrollment
- Payment success
- Payment failure
- Course announcement
- Workshop registration
- Workshop reminder
- Certificate issued
- New message
- Ticket update

### Architecture

```text
Event
 ↓
BullMQ
 ↓
Email Worker
 ↓
Email Provider
```

### Acceptance

Email delivery does not block primary API operations.

---

# PHASE 12 — Search, Reviews & Announcements

## Search

Basic PostgreSQL search.

Search:

- Courses
- Bundles
- Workshops

Filters:

- Category
- Level
- Free/Paid

## Reviews

- Enrolled-student only
- One review per course
- Rating
- Review
- Edit
- Moderation

## Announcements

```text
Author/Manager
 ↓
Course Announcement
 ↓
Enrolled Students
 ↓
Email
```

### Acceptance

Students can discover products, review courses, and receive course announcements.

---

# PHASE 13 — Rich Analytics & Dashboards

## Goal

Provide actionable dashboards for each role.

## Student

Metrics:

- Current courses
- Progress
- Sessions completed
- Courses completed
- Certificates
- Upcoming workshops
- Messages
- Tickets

## Author

Metrics:

- Course count
- Enrollments
- Active learners
- Completion rate
- Average progress
- Session performance
- Video engagement
- Questionnaire performance
- Reviews
- Unanswered messages

## Manager

Metrics:

- Courses awaiting approval
- Course performance
- Authors
- Students
- Enquiries
- Tickets
- Messages

## Super Admin

Metrics:

- Total users
- Total courses
- Total bundles
- Total workshops
- Enrollments
- Revenue
- Orders
- Payment success rate
- Payment failure rate
- Active learners
- Completion rate
- Certificates
- Enquiries
- Tickets
- Engagement

### Event tracking

Implement events such as:

```text
student.enrolled
session.started
video.progressed
session.completed
questionnaire.completed
course.completed
certificate.issued
workshop.registered
message.sent
ticket.created
ticket.resolved
payment.succeeded
payment.failed
```

---

# PHASE 14 — SEO & Public Experience

## Goal

Make the public LMS discoverable.

### Pages

```text
/courses
/courses/:slug
/bundles
/bundles/:slug
/workshops
/workshops/:slug
```

### SEO

- Dynamic metadata
- Canonical URLs
- Open Graph
- Sitemap
- robots.txt
- Structured data
- SEO-friendly slugs

### Acceptance

Public product pages are indexable and have correct metadata.

---

# PHASE 15 — Security & Production Hardening

## Goal

Production readiness.

### API security

- Rate limiting
- Input validation
- Authorization
- CORS
- Security headers
- Secure authentication
- Secure cookies/tokens
- Error sanitization

### File security

- MIME validation
- File size limits
- Safe filenames
- Private storage
- Authorized downloads

### Video security

- Private Vimeo configuration
- Domain restrictions where appropriate
- Do not expose management credentials
- Verify playback access

### Infrastructure

- HTTPS
- Secrets management
- Firewall
- Database backups
- Monitoring
- Error tracking
- Dependency scanning
- Audit logging

### Admin

- 2FA for Super Admin where feasible

---

# 4. Cross-Phase Engineering Requirements

Every feature must consider:

```text
Database
API
Authorization
Validation
Frontend
Error handling
Loading state
Empty state
Tests
Swagger
Audit/events
Email if applicable
Analytics if applicable
```

Do not mark a feature complete merely because the API endpoint works.

---

# 5. Suggested Development Order Inside Each Phase

Use this sequence:

```text
1. Domain/requirements
       ↓
2. Database model
       ↓
3. Migration
       ↓
4. Backend module
       ↓
5. Unit tests
       ↓
6. API/Swagger
       ↓
7. Frontend
       ↓
8. Integration tests
       ↓
9. Analytics/events
       ↓
10. Audit/logging
       ↓
11. Documentation
```

---

# 6. Critical End-to-End Test Flows

These flows should be treated as release gates.

## Course publishing

```text
Author
 → Create Course
 → Add Sections
 → Add Sessions
 → Upload Vimeo Video
 → Add Resources
 → Add Questionnaire
 → Submit
 → Manager Reviews
 → Approves
 → Course Goes On Air
```

## Purchase

```text
Student
 → Product
 → Order
 → VirtuaPayments
 → Webhook
 → Payment Success
 → Enrollment
 → Lifetime Access
```

## Learning

```text
Student
 → Course
 → Session
 → Vimeo
 → Progress
 → Session Completion
 → Course Completion
 → Certificate
```

## Bundle

```text
Student
 → Bundle
 → Payment
 → Webhook
 → Bundle Enrollment
 → Course Access
```

## Workshop

```text
Student
 → Workshop
 → Registration
 → Payment if required
 → Email
 → Google Meet
```

## Course message

```text
Student
 → Course
 → Message
 → Author
 → Reply
 → Student
```

## Enquiry

```text
User
 → Enquiry
 → Leadflow
 → Sales
```

## Support ticket

```text
Student
 → Ticket
 → Leadflow
 → Support
 → Status Update
 → Student
```

---

# 7. Explicitly Out of V1 Scope

Do not build these unless requirements change:

```text
Assignments
Subscription billing
Expiring course access
Drip content
Advanced recommendation engine
AI tutor
AI course generation
Microservices
Elasticsearch/OpenSearch
Advanced attendance tracking
Advanced CRM
Custom video streaming infrastructure
Native video conferencing
Complex gamification
```

These can be added later without forcing them into the initial implementation.

---

# 8. Architecture Principles

1. Start with a modular monolith.
2. Keep domain boundaries clean.
3. Treat external products as integrations.
4. Never expose third-party secrets to frontend.
5. Use verified payment webhooks.
6. Keep lifetime access simple for V1.
7. Track granular learning progress.
8. Keep messages, enquiries and tickets separate.
9. Use asynchronous jobs for email and other slow/retryable work.
10. Use PostgreSQL for V1 search and analytics.
11. Avoid premature microservices.
12. Prefer explicit state machines for workflows.
13. Make auditability part of important workflows.
14. Make security part of every phase.
15. Keep APIs independently deployable from frontend applications.

---

# 9. V1 Completion Criteria

The LMS V1 is production-ready when:

```text
[ ] Authentication works
[ ] RBAC works
[ ] Student/Author/Manager/Super Admin flows work
[ ] Authors can create courses
[ ] Vimeo videos work
[ ] Resources work
[ ] Questionnaires work
[ ] Manager approval works
[ ] Courses can go On Air
[ ] Students can enroll
[ ] VirtuaPayments works
[ ] Payment webhook works
[ ] Lifetime access works
[ ] Progress tracking works
[ ] Resume learning works
[ ] Course completion works
[ ] Certificates work
[ ] Bundles work
[ ] Workshops work
[ ] Google Meet links work
[ ] Course messaging works
[ ] Leadflow enquiries work
[ ] Leadflow tickets work
[ ] Email notifications work
[ ] Reviews work
[ ] Announcements work
[ ] Basic search works
[ ] Dashboards work
[ ] SEO pages work
[ ] Audit logs work
[ ] Security controls are implemented
[ ] Backups/monitoring are configured
[ ] Critical end-to-end tests pass
```
