# BEST System Documentation

## Document control

| Item | Details |
|---|---|
| System | Barangay E-Services System Terminal (BEST) |
| Document | Comprehensive system and research reference |
| Document version | 1.5 |
| Documentation date | 25 November 2026 |
| Documented source revision | Git HEAD 78ce397 plus working-tree updates through 25 November 2026 |
| Application version | 0.1.0 |
| Intended audience | Researchers, project evaluators, developers, barangay administrators, and technical operators |

This document describes the system represented by the source code at the revision above. Revision 1.1 updates the role-specific admin access model, account/password controls, blotter queue workflow, and light/dark theme behavior. It combines the current implementation, the project specification, and deployment guidance. A feature described as a design goal is not automatically proof that it is configured, deployed, or accepted in a real barangay. The source code is the best evidence of current application behavior; the implementation plan describes intended requirements and safeguards.

## 1. Executive summary

BEST is a web-based barangay service and administration system. It provides a public information portal, verified resident accounts, electronic intake and status tracking for selected documents, business-clearance intake, anonymous blotter reporting, community announcements, an officials directory, a digital resident ID viewer, and staff tools for reviewing requests and recording payments. The project frames its privacy and local-government context around Republic Act 10173 (Data Privacy Act of 2012) and Republic Act 7160 (Local Government Code of 1991); this reference does not certify legal compliance.

The application is built with JavaScript, React, and Next.js. It uses PostgreSQL for persistent data and Prisma as its database ORM. The project is designed for local-area-network operation at a barangay hall, with an installable progressive web application (PWA) and selected offline capabilities. The production Docker Compose configuration includes an HTTPS reverse proxy. The development command starts the web application only; a reachable PostgreSQL database and valid environment configuration are also required.

BEST supports digital service intake and administration. It does not replace in-person identity checks, official decision-making, physical document collection, or the barangay's statutory processes. Payment-provider connectivity is not present: Cash, GCash, LandBank, BPI, Maya, and GoTyme are payment methods that staff record manually. BEST does not move money or verify transfers with those providers.

## 2. Background and purpose

Barangay services commonly involve paper forms, in-person follow-up, manual status inquiries, and separate records maintained by several offices. BEST aims to provide one local web application through which residents can learn about services, submit supported requests, and check progress, while authorized personnel review records and manage selected administrative workflows.

### 2.1 Problem addressed

The system is intended to reduce uncertainty about where to apply and how to follow up. It centralizes selected application and public-information workflows while preserving human review for decisions that require barangay judgment or physical verification.

### 2.2 Objectives

- Offer residents a single portal for supported barangay services and announcements.
- Require a verified resident account for resident-linked document and business requests.
- Give residents tracking references and a view of their own request history and status.
- Give authorized personnel queues and administrative tools for service processing.
- Record treasury settlements and create system-generated transaction identifiers.
- Limit public disclosure of resident information and protect designated sensitive fields at rest.
- Support operation on a barangay local network when public internet access is unavailable.
- Provide a responsive interface for desktop and mobile browsers, with reduced-motion and print-specific behavior.

These are system objectives, not measured research outcomes. This repository does not contain a completed user study proving faster service, higher satisfaction, or a specific improvement in processing time.

## 3. Scope

### 3.1 Included capabilities

- Public landing page, service information, broadcast listing, and officials directory.
- Resident activation, sign-in, account view, sign-out, and own-request history.
- Admin-only creation of Staff, Treasurer, and Official accounts, plus reversible deactivation/reactivation of non-admin staff and resident login accounts.
- Barangay clearance and certificate-of-indigency request intake and status tracking.
- Staff review, rejection with a reason, assisted intake, certificate generation, and release tracking.
- Business-clearance request intake that preserves an in-person Treasurer screening step.
- Treasury queue, cash or GCash-reference recording, and generated BEST transaction number.
- Anonymous blotter submission, private tracking, and authorized staff review and status updates.
- Broadcast publication, editing, deletion, and public display.
- Officials directory management, resident-only digital Barangay ID viewing, and staff/admin card issuance and status management.
- Kaagapay FAQ helper that matches keywords to prepared local answers in the documented local configuration.
- PWA shell caching and an IndexedDB outbox for selected resident submissions.
- Staff and resident authentication, role checks, audit records, health endpoints, and database-backed storage.

### 3.2 Excluded or intentionally constrained

- Automated online approval of business clearances. The application retains a physical Treasurer screening step.
- Digital printing of the Barangay ID. Resident access is view-only; designated STAFF and ADMIN accounts may issue and maintain card records.
- Lupon/Katarungang Pambarangay hearing, summons, or escalation workflows.
- A real GCash, LandBank, BPI, banking, or payment-gateway integration.
- Replacing signed physical certificates or the in-person collection process.
- A claim of legal certification, complete statutory compliance, or independently verified privacy certification.

## 4. Users and access model

BEST has public visitors, verified residents, and staff accounts. Staff accounts use one of four database roles: ADMIN, STAFF, TREASURER, and OFFICIAL. Resident sessions use resident-specific authentication and are separate from the staff role enum.

| User type | Main purpose and permissions |
|---|---|
| Public visitor | Read public broadcasts and directory information, open service guidance, and use public tracking or anonymous blotter functions. |
| Verified resident | Manage their signed-in session, submit supported requests, view their own profile and request statuses, and view their own digital ID when available. |
| STAFF | Review documents, produce permitted certificates, assist residents, manage resident activation slips and verified residents' digital ID cards, update blotter reports, and publish broadcasts. |
| TREASURER | Use Treasury and Official Receipts, record permitted payments, and handle the in-person business assessment workflow. |
| OFFICIAL | Manage the officials directory and publish broadcasts. |
| ADMIN | Manage non-admin staff accounts and perform staff operations explicitly allowed by the permission matrix, including document, resident, digital ID, treasury, blotter, broadcast, and directory functions. ADMIN is not a blanket API bypass. |

The admin navigation and page layout enforce a matching page-access map. Dashboard and My Account are available to all staff roles. Documents, Blotter, and Residents & Slips are available to STAFF and ADMIN; Treasury is available to TREASURER and ADMIN; Broadcasts are available to STAFF, OFFICIAL, and ADMIN; the Officials Directory is available to OFFICIAL and ADMIN; Staff Accounts is ADMIN-only. Disallowed links are hidden, and a directly opened restricted page displays an “Outside your clearance level” notice without rendering its forms. API permission checks remain authoritative and independently reject unauthorized requests.

The authentication library also enforces the operation-level permission matrix. Page access does not grant every action within a page; server handlers check the role for each operation.

## 5. Functional modules and user workflows

### 5.1 Public portal

The homepage presents service shortcuts, a request-tracking entry point, public information, and selected broadcast content. Public pages include broadcasts, the officials directory, document tracking, blotter intake and tracking, the Kaagapay FAQ helper, and service-request information. Public lookups are designed to avoid returning unmasked resident names.

### 5.2 Resident identity and account

The resident identity process is designed around in-person verification by staff. Staff create or verify a resident record and can issue a time-limited activation slip. The resident activates an account with the supplied information, creates a password, and signs in. The resident account area provides profile information and the resident's own request history. Residents can sign out and change their password after confirming the current password. For an activated resident who cannot sign in, an administrator can set a temporary password; the resident must replace it at the next sign-in. A resident who has not activated an account still needs an activation slip.

An administrator can deactivate or reactivate a resident login from the Residents & Slips page. Deactivation invalidates the resident's current session, disables future sign-in, and clears any unused activation slip. It does not delete the resident profile or service history. A resident without a credential has no login account to deactivate.

Resident-linked writes obtain the resident identity from the verified server session. The API rejects a submitted resident ID in request bodies. This prevents a client from choosing another resident's database identity when creating a request.

### 5.3 Barangay Clearance and Certificate of Indigency

Residents submit a document type, purpose, and required supporting details. The system creates a tracking code and adds the request to the staff queue. Staff can move a request through review, request payment where applicable, reject it with a reason, mark it ready for pickup, and record release. Staff may also file an assisted request for a resident who needs in-person help.

The schema sets a default clearance fee of PHP 50.00 and the current user interface describes indigency certificates as free. A fee schedule is an administrative policy and must be verified with the barangay before deployment. A document is not automatically approved merely because an online request was submitted.

Document statuses in the database are:

| Status | Meaning |
|---|---|
| SUBMITTED | Request received and awaiting initial staff action. |
| UNDER_REVIEW | Staff is reviewing the request. |
| PAYMENT_PENDING | Staff has determined that payment is due. |
| READY_FOR_PICKUP | The request is ready for physical collection. |
| RELEASED | Staff recorded that the document was released. |
| REJECTED | Request was rejected; the system requires a rejection reason. |

The application generates a print view for clearance and indigency documents. The print stylesheet is intended to produce high-contrast A4 or Letter output without the normal glass-style screen effects. Signatory data is looked up from staff and officials records. The current certificate components contain fixed Barangay Daro and Dumaguete City text, so those templates must be reviewed before reusing this application in a different locality.

### 5.4 Business-clearance intake

An authenticated resident can submit business details and schedule an intake. Staff and the Treasurer can review the record and checklist. The lifecycle uses INTAKE_SCHEDULED, IN_PERSON_SCREENING, TREASURER_ASSESSED, APPROVED, and REJECTED. Online submission is not final approval; the physical screening and assessment step remains part of the workflow.

### 5.5 Treasury and Official Receipts

The Treasury page groups payable document and business requests, shows recent payments, and records payment details. The payment queue refreshes every 15 seconds while the page is visible and can also be refreshed manually. The BEST transaction number is generated by the server when a payment record is created; staff do not type that identifier. Cash does not require an external reference. GCash, LandBank, BPI, Maya, and GoTyme transfers require a reference number, validated as 6–40 letters, numbers, or hyphens. Staff must verify each transfer in the provider's records before marking it paid; BEST only records the method and reference. A physical official-receipt number is a separate field and can be absent on newer records.

The payment API accepts Cash, GCash, LandBank, BPI, Maya, and GoTyme for new transactions. These are manually recorded methods, not live payment integrations. A payment record updates an eligible document to READY_FOR_PICKUP.

### 5.6 Anonymous blotter

The public blotter form collects incident category, coarse zone, date, and a narrative. The report is not linked to a resident account. A proof-of-work challenge is used for abuse resistance rather than IP-based rate limiting. The reverse proxy is configured to remove identifying request headers from blotter traffic, and the application avoids logging report contents on that path. A public tracking code lets a reporter check limited status information. Authorized staff can inspect the encrypted report, assign an officer, and add public or internal updates.

Blotter statuses are FILED, UNDER_REVIEW, ACTION_TAKEN, and CLOSED. The required transition path begins FILED → UNDER_REVIEW. From UNDER_REVIEW, staff may move to ACTION_TAKEN or CLOSED; ACTION_TAKEN may move to CLOSED. Direct transitions from FILED to ACTION_TAKEN or CLOSED are rejected. The staff queue has All Reports, Needs Review, and Handled Reports views. Handled Reports groups ACTION_TAKEN and CLOSED records. The queue is paginated so reports beyond the first page remain accessible.

The project describes anonymity as best-effort, not absolute: a small community, the reporter's own text, the local network, or a device may reveal information outside the application's control. The server holds the encryption key and can decrypt authorized reports.

### 5.7 Broadcasts and officials directory

Authorized staff can create, edit, or delete community broadcasts, set a category and active date range, and publish the resulting information to public pages. Categories include AYUDA, HEALTH, VETERINARY, SCHOLARSHIP, and URGENT. In the documented local configuration, the broadcast UI creates a plain-language summary through deterministic sentence extraction and fills a megaphone script from a fixed language template. This local processing does not generate original content.

Officials records contain a full name, position, committee, contact information, display order, and active state. The same records supply signatory information for certificates where the relevant official is configured.

### 5.8 Digital Barangay ID

STAFF and ADMIN can issue a digital ID for a verified resident from **Admin → Residents & Slips**, then update its expiration date or mark it expired or revoked. Card numbers and barcode values are generated automatically and the action is audited. A resident can view only their own card after signing in and once staff have issued it. The project intentionally has no ID print route or print button; physical card production is outside the application's scope.

### 5.9 Kaagapay FAQ helper

In the documented local configuration, Kaagapay provides a civic-information interface in English, Tagalog, and Cebuano. It detects likely language, matches keywords to prepared topics, and returns entries from a local knowledge base rather than generating new answers. The knowledge base is sample content pending local team review; staff must confirm fees, requirements, office hours, and local procedures before relying on its answers.

### 5.10 Staff account administration

Administrators use **Staff Accounts** to create logins for STAFF, TREASURER, and OFFICIAL roles. The administrator supplies a username, full name, role, and initial password. Passwords are stored as bcrypt hashes and are never returned in account listings. Staff, residents, and administrators can change their own passwords after confirming the current password. An administrator can deactivate or reactivate non-admin staff and resident login accounts; these actions affect sign-in access and do not delete the person's profile or service history. An administrator can also set a temporary password for a non-admin staff account or an activated resident account. A reset invalidates existing sessions and requires the account owner to choose a new password at the next sign-in. Administrator accounts cannot be created or reset from Staff Accounts. Account creation, password resets, deactivation, and reactivation are recorded in the audit log without storing password values.

## 6. Application routes and API overview

### 6.1 Web pages

| Page | Purpose |
|---|---|
| / | Public homepage and service shortcuts. |
| /services/request | Document request entry point. |
| /services/business-clearance | Business-clearance intake. |
| /services/kaagapay | Local civic FAQ helper. |
| /track | Public document tracking. |
| /blotter and /blotter/track | Anonymous report intake and tracking. |
| /broadcasts | Public announcements. |
| /directory | Public officials directory. |
| /resident/login, /resident/activate | Resident sign-in and activation. |
| /resident/account | Resident account and request history. |
| /password/change | Signed-in staff or resident changes their own password; required first-login password changes also use this page. |
| /id-card | Resident digital ID viewer. |
| /login | Unified sign-in entry point. |
| /admin/login | Staff sign-in. |
| /admin/dashboard | Staff dashboard. |
| /admin/residents | Resident directory and activation work. |
| /admin/users | Admin-only staff account creation and status management. |
| /admin/documents and /admin/documents/print/[id] | Review queue and certificate print view. |
| /admin/treasury | Payment queue and payment records. |
| /admin/blotter | Staff blotter queue. |
| /admin/broadcasts | Broadcast publisher. |
| /admin/directory | Officials directory management. |
| /admin/account | Staff account/profile actions. |
| /offline | Offline fallback and pending-outbox viewer. |

### 6.2 API families

API routes are implemented as Next.js App Router route handlers under src/app/api. The following is a functional index, not a complete API contract; request and response schemas should be read from the named handler before external integration.

| API family | Main operations |
|---|---|
| /api/auth/* | Staff login, logout, password change, session information, and session keep-alive. |
| /api/resident/* | Resident activation, login, logout, current session, account, requests, and ID card. |
| /api/documents/* | Create resident requests, list staff queue, inspect/update a request, assisted intake, and public tracking. |
| /api/business/* | Create and list business requests, inspect and update assessment/checklist state. |
| /api/treasury and /api/treasury/pay | Load payable items/recent payments and record a payment. |
| /api/blotter/* | Issue proof-of-work challenge, accept anonymous report, and return public tracking information. |
| /api/admin/blotter/* | Staff queue, authorized report inspection, and status/update actions. |
| /api/broadcasts/* | Public broadcast listing and authorized create/update/delete operations. |
| /api/directory | Public directory data and authorized management operations. |
| /api/admin/residents and /api/residents/[id]/activation | Staff resident management and activation slips. |
| /api/admin/residents/[id]/id-card | STAFF/ADMIN digital ID issue and maintenance; resident card numbers are generated by the server. |
| /api/admin/users/*; /api/admin/residents/[id]/account; /api/admin/residents/[id]/password | Admin-only staff account creation/status changes, resident-login status changes, and temporary password resets. |
| /api/auth/password | Change the signed-in staff or resident password after confirming the current password. |
| /api/ai/* | FAQ matching and broadcast text-helper routes; the documented local configuration uses deterministic rules and templates. |
| /api/health and /api/health/deep | Basic health and ADMIN-only database health check. |
| /api/public/stats | Public aggregate counters that exclude resident identity details. |

## 7. Technical architecture

### 7.1 Architectural layers

1. Client: React pages and components render on desktop and mobile browsers. The app includes local fonts and icons and can be installed as a PWA.
2. Application server: Next.js 14 App Router serves pages, server-side functions, and REST-style API handlers.
3. Domain services: JavaScript modules implement authentication, role checks, encryption, audit recording, offline outbox handling, treasury helpers, business checklist logic, blotter logic, FAQ matching, and deterministic broadcast text processing.
4. Data access: Prisma Client communicates with PostgreSQL. Prisma schema and migrations define the relational data model.
5. Infrastructure: Docker Compose defines PostgreSQL, the Next.js container, and Caddy as a reverse proxy. A reliability overlay defines additional backup and monitoring containers.

### 7.2 Technologies

| Technology | Role in BEST |
|---|---|
| JavaScript ESM and JSX | Application language and module format. TypeScript is not used. |
| Node.js | JavaScript runtime; package requires version 18.17 or later. The Docker image uses Node 20 Alpine. |
| Next.js 14.2.25 | App framework, routing, server-rendered pages, and API handlers. |
| React 18.3.1 | Component UI. |
| Tailwind CSS 3.4.14 | Utility styling and project design tokens. |
| PostgreSQL 16 | Relational persistent database. |
| Prisma 5.21.1 | ORM, schema generation, migrations, and JavaScript database client. |
| Docker Compose | Local multi-container deployment definition. |
| Caddy 2 | HTTPS reverse proxy in the Compose deployment. |
| jose 5.9.6 | Encrypted JWE session cookies. |
| bcryptjs 2.4.3 | Password hashing. |
| Node crypto / Web Crypto | Server encryption and browser-side cryptographic operations. |
| Playwright 1.48.1 | Browser end-to-end test runner. |
| IndexedDB and Service Worker | Browser-side pending outbox and selective offline support. |
| lucide-react 0.453.0 | Icons. |
| qrcode 1.5.4 and jsbarcode 3.11.6 | Certificate QR and digital ID barcode presentation. |
| Fontsource packages | Local Plus Jakarta Sans, JetBrains Mono, Poppins, Public Sans, and Source Sans 3 fonts; no runtime font CDN is required. |
| PostCSS 8.4.47 and Autoprefixer 10.4.20 | CSS processing and browser-prefix generation. |

Exact package versions are recorded in package.json and package-lock.json.

### 7.3 Deployment topology

The intended production deployment runs on a barangay-controlled server on the local network. Residents and staff connect through a browser over the LAN. In Docker Compose, Caddy accepts HTTPS connections, forwards requests to the Next.js app, and the app connects to PostgreSQL on the private Compose network. The PostgreSQL host port is bound to loopback and should not be exposed to LAN clients.

The application can also be run directly on a developer's computer using npm run dev, but that mode does not start PostgreSQL and is not the production HTTPS topology. Direct development access at localhost is for local development. LAN deployment should use the configured HTTPS proxy and a trusted certificate setup.

### 7.4 Source repository map

| Location | Contents |
|---|---|
| src/app | Next.js page routes, layouts, and API route handlers. |
| src/components | Reusable resident, staff, home, print, authentication, and system UI components. |
| src/lib | Authentication, encryption, database client, role-to-admin-page access map, domain helpers, local FAQ and broadcast text helpers, offline outbox, audit, and performance code. |
| src/styles | Global CSS and theme behavior. |
| prisma/schema.prisma | PostgreSQL model definitions and enums. |
| prisma/migrations | Versioned database schema changes. |
| prisma/seed.reference.js and prisma/seed.demo.js | Reference data and development/test-only demo data. |
| public | Service Worker, manifest, icons, and generated precache manifest. |
| scripts | Environment setup, key generation, admin bootstrap, policy checks, build support, and maintenance scripts. |
| tests-e2e | Playwright browser and security-oriented end-to-end specifications. |
| ops | Backup, restore, monitoring, watchdog, and operational scripts. |
| docs | Implementation plan, setup guidance, manuals, and this system reference. |

## 8. Data model

The Prisma schema defines the following principal entities:

| Entity | Purpose |
|---|---|
| Resident | Resident profile and relationships to credentials, requests, businesses, and ID card. |
| ResidentCredential | Password/activation hashes, active state, required password-change flag, lockout state, issuer, and session invalidation time. |
| BarangayIDCard | One-to-one digital ID record and barcode details. |
| DocumentRequest | Clearance or indigency request, status, purpose, fee, tracking/QR fields, and reviewer. |
| BusinessClearanceEntry | Business application, in-person appointment, assessment, and status. |
| BusinessChecklistItem | Requirements checklist attached to a business application. |
| PaymentRecord | Payment metadata and links to a document or business record. |
| BlotterReport | Anonymous incident report with encrypted narrative/location payload and status. |
| BlotterUpdate | Public and internal actions recorded against a blotter report. |
| CommunityBroadcast | Public announcement, author, category, visibility dates, and optional summary and megaphone-script text. |
| BarangayOfficial | Public official/signatory details and display order. |
| SystemUser | Staff username, password hash, full name, role, active state, and session controls. |
| AuditLog | Staff action, target entity, metadata, and event time. |

Relationships are relational and enforced with foreign keys. Document and business payments are represented as one-to-one relationships. Resident-linked requests refer to a resident record, while public blotter reports intentionally have no resident foreign key.

### 8.1 Important enumerations

- DocumentType: CLEARANCE, INDIGENCY.
- DocumentStatus: SUBMITTED, UNDER_REVIEW, PAYMENT_PENDING, READY_FOR_PICKUP, RELEASED, REJECTED.
- BusinessStatus: INTAKE_SCHEDULED, IN_PERSON_SCREENING, TREASURER_ASSESSED, APPROVED, REJECTED.
- BlotterStatus: FILED, UNDER_REVIEW, ACTION_TAKEN, CLOSED.
- UserRole: ADMIN, STAFF, TREASURER, OFFICIAL.
- Payment methods shown to staff: Cash, GCash, LandBank, BPI, Maya, and GoTyme. Transfer methods are recorded manually and are not provider integrations.

## 9. Security, privacy, and data protection

### 9.1 Authentication and sessions

Staff and residents have separate session cookies. The authentication module uses encrypted JWE cookies, bcrypt password hashes, and server-side session validation. The planned idle timeout is 15 minutes and the absolute maximum session duration is 8 hours. The server checks session age and user state on protected requests; a client countdown is not the security control. Password changes and administrator resets invalidate prior sessions. Temporary passwords block protected actions until the user changes the password.

Resident activation codes are stored as hashes and are time-limited and single-use. Login lockout counters are stored on the account. Resident-linked writes derive the identity from the server session rather than trusting a client-supplied resident ID.

### 9.2 Encryption at rest

The application uses server-side AES-256-GCM field encryption for specified sensitive data, including document purpose and CTC number, contact and address fields, business details, blotter narrative and exact incident information, and staff-only internal notes. The server reads the field key from FIELD_ENC_KEY. It is not supposed to be committed to Git, placed in the database, or included with encrypted backups.

The same field key is required to decrypt existing encrypted records. Losing the key or replacing it without a migration/key-rotation process can make stored values unreadable. Backup restoration therefore requires the correct key-management procedure.

### 9.3 Transport and browser security

The production design requires HTTPS through Caddy. The Caddyfile redirects ordinary HTTP traffic to HTTPS; application content should be accessed over the secure endpoint. Next.js production headers include a Content Security Policy, frame restrictions, referrer policy, MIME-sniffing protection, and permissions policy. The app is designed to use same-origin assets and self-hosted fonts.

### 9.4 Privacy controls

- Public document tracking masks resident names.
- Staff-only details are returned from protected routes and are not intended for public lookup.
- Resident request writes use the authenticated account session.
- Blotter records are anonymous in the database relationship model and exclude a complainant resident ID and IP field.
- Blotter routes are configured to strip Cookie, User-Agent, Referer, and X-Forwarded-For headers at the Caddy proxy.
- Authenticated/admin API results are excluded from Service Worker caching.
- Blotter narratives and encrypted sensitive fields must remain within the configured system and must not be sent to external services.

These controls reduce exposure but do not, by themselves, prove compliance with all requirements of the Data Privacy Act or other laws. A barangay data-protection officer or qualified reviewer should approve notices, retention periods, access policies, and operational procedures.

## 10. Offline and PWA behavior

The site includes a web manifest, a Service Worker, a generated precache manifest, and an IndexedDB request outbox. The Service Worker can cache application shell pages and static assets. It uses a stale-while-revalidate strategy only for selected public, non-PII APIs, such as broadcasts, directory, and public statistics. Authenticated pages and other API calls are network-only and are not stored in Service Worker caches.

Selected document and business requests can be saved to a local IndexedDB outbox if the server cannot be reached. The outbox has limits and expiry behavior and replays requests when connectivity returns. Kiosk mode disables local persistence. Offline storage is a temporary queue, not proof that a request has been received by the barangay; the resident needs a server-issued tracking reference after successful submission.

## 11. User interface, accessibility, and printing

The project uses a responsive visual system with semantic colors, light/dark themes, locally bundled fonts, and glass-inspired surfaces. Text, controls, alerts, tracking results, and status surfaces use theme-specific foreground and background colors so content remains readable when switching themes. The specification defines a Lite rendering baseline and an optional Full effects tier. Reduced-motion preferences are supported, and homepage movement is intended to animate transform and opacity rather than expensive layout/filter properties.

Forms and buttons use explicit labels, status messages, and interactive states. Print views have separate styles from the normal screen interface. A4 and Letter print output is intended to be high-contrast black and white and to omit decorative screen effects. Printed documents should be checked with the actual browser and printer before operational use.

The performance plan specifies targets of at most 150 KB total first-load transfer, LCP at or below 2.5 seconds on the plan's Slow 4G profile and 4 seconds on its Slow 3G profile, CLS at or below 0.1, and INP at or below 200 ms. These are targets to test on the stated profiles, not measurements reported by this document.

## 12. Installation, configuration, and startup

### 12.1 Requirements

For a direct local development setup:

- Node.js 18.17 or later and npm.
- PostgreSQL 16 reachable using the DATABASE_URL configured for Prisma.
- Git for source checkout.
- The required environment variables described below.

For the container deployment, Docker with the Compose plugin is required. The repository's Dockerfile builds a Node 20 Alpine application image. The Compose topology also uses PostgreSQL 16 Alpine and Caddy 2 Alpine.

### 12.2 Important environment variables

| Variable | Purpose |
|---|---|
| DATABASE_URL | Prisma connection string used by local host commands and development server. |
| POSTGRES_PASSWORD | PostgreSQL password used by the Compose database and application. |
| SESSION_SECRET | Secret material for staff/resident encrypted sessions. |
| QR_HMAC_SECRET | Secret used for signed tokens/challenges. |
| FIELD_ENC_KEY | 32-byte base64 field encryption key. |
| FIELD_ENC_KEY_ID | Optional identifier attached to ciphertext version metadata. |
| BEST_ENV | Environment identity; production mode applies production guards. |
| BEST_HOST | Host name used by Caddy for the HTTPS site. |
| SESSION_IDLE_MS | Staff/resident idle timeout; default configuration is 900000 ms. |
| SEED_DEMO_DATA | Development/test-only seed switch; production must not enable it. |
| NEXT_PUBLIC_KIOSK | Enables kiosk-specific behavior such as disabled offline persistence. |
| BACKUP_AGE_PUBKEY and SPARE_HOST | Optional reliability-overlay backup and spare-server settings. |

The committed .env.example contains placeholders, not usable secrets. Never copy a real .env file into documentation, Git, screenshots, or research submissions. Keys and passwords should be generated and entered by a responsible human on the server. Keep FIELD_ENC_KEY backed up separately from encrypted database backups.

### 12.3 Local development startup

1. Start PostgreSQL 16 and create/use the configured BEST database and database user.
2. Copy .env.example to .env, then replace the placeholders with values appropriate for the local machine. Ensure DATABASE_URL credentials match the PostgreSQL user and password. Do not use the template placeholders as working credentials.
3. Install packages and generate the Prisma client:

    npm ci
    npx prisma generate

4. Apply migrations already committed to the repository:

    npx prisma migrate deploy

   During schema development, use Prisma's development migration command to create a new migration rather than editing an applied migration in place.

5. Start the development server:

    npm run dev

6. Open http://localhost:3000 and check http://localhost:3000/api/health. The web server being ready does not prove that database-backed endpoints work; verify the database connection and protected flows as well.

If Prisma reports an authentication failure for best_admin, verify that the PostgreSQL service is running and that the username/password in DATABASE_URL match the actual database role. Changing a .env password does not automatically change the password stored inside an already-created PostgreSQL data volume.

### 12.4 Docker Compose startup

Configure the production environment values in a server-only .env, including POSTGRES_PASSWORD, BEST_HOST, SESSION_SECRET, QR_HMAC_SECRET, and FIELD_ENC_KEY. Then build and start the defined services:

    docker compose up -d --build

The default Compose file defines best_postgres, best_app, and best_proxy. The app waits for the database health check. The database and app host ports bind to loopback; LAN users access the system through Caddy. The Caddy configuration uses an internal CA by default, which requires trusted root-certificate installation on devices that must access it. Do not treat the development HTTP endpoint as a production LAN deployment.

The reliability overlay is started with:

    docker compose -f docker-compose.yml -f docker-compose.reliability.yml up -d --build

Use the overlay only after configuring its backup disk, encryption recipient key, spare host, and monitoring. The Compose files and scripts provide an operational starting point; uptime and restore guarantees still require correct host configuration and drills.

## 13. Testing and quality assurance

The repository includes Playwright end-to-end specs for:

- Citizen service navigation, masked tracking, and Kaagapay FAQ responses.
- Resident authentication and rejection of client-supplied resident IDs.
- Role-based access boundaries and view-only digital ID behavior.
- Business clearance's in-person approval gate.
- Anonymous blotter proof-of-work and outbound-origin checks.
- Encryption round-trip behavior.
- Offline service worker behavior and caching headers.
- Certificate print fidelity.
- Reduced-motion and homepage animation behavior.
- Mobile performance budgets and external-origin restrictions.

Available package scripts include npm run test:e2e, npm run test:restore, npm run check:policy, npm run check:demo-creds, npm run build, and npm start. E2E tests are configured to run against a production build and may require a working database and suitable test environment. The existence of test files does not mean they passed in the documented environment. No test run is claimed by this document.

## 14. Operational administration

The project includes scripts for bootstrapping an administrator, generating a field key, checking production demo credentials, generating a precache manifest, creating an offline bundle, and managing backup/restore operations. Operations scripts and the reliability Compose overlay are present in the repository. Their safe use depends on the target host, storage mounts, age encryption keys, permissions, and recovery procedure being configured and tested by the operator.

Production operation should include at least:

- Human-managed secret generation and secure storage.
- HTTPS certificate installation and renewal monitoring.
- Least-privilege staff account provisioning and prompt credential replacement.
- Regular database backups and restore drills.
- Database, disk, application, and certificate monitoring.
- Documented data retention, archival, and deletion procedures.
- A tested outage and hardware-recovery process.
- Staff training for rejecting requests, recording payments, printing, and releasing documents.

The implementation plan sets a 99.5% monthly availability target. This is a target, not an independently measured service-level result. The repository does not demonstrate that a particular barangay server meets it.

## 15. Known limitations and deployment checks

1. Database configuration is mandatory. A Next.js homepage can return successfully while database-backed API routes fail if PostgreSQL credentials are incorrect or migrations have not been applied.
2. Payment is recording-only. GCash, LandBank, BPI, Maya, and GoTyme options do not contact their providers or verify transferred funds. Staff must verify payment independently before recording it.
3. The local FAQ knowledge base is sample content pending team review. Local laws, document requirements, fees, office hours, and translations need validation by barangay staff.
4. Certificate text includes locality-specific template content for Barangay Daro and Dumaguete City. The official roster must be populated for signatories to be correct. Review all certificate wording and branding before issuing official documents.
5. The application is a workflow aid. Staff retain responsibility for identity checks, eligibility decisions, payment verification, signing, and physical release.
6. Encryption protects configured fields only when the correct key is present and well managed. It is not a substitute for OS disk encryption, access control, backups, or key rotation.
7. Offline queueing is device-local and temporary. Residents must understand when a queued submission has actually reached the server.
8. No measured usability, processing-time, availability, or impact results are included here. Those require a separate study and operational data collection plan.

## 16. Suggested research evaluation

For a research report, evaluate the deployed system with synthetic accounts and approved test data. Do not use real resident records in screenshots, presentations, or model prompts. A useful evaluation can measure:

- Task completion rate for account activation, document request, request tracking, and staff review.
- Median time and number of steps to complete each task compared with the existing process.
- Error and recovery rates for rejected forms, expired sessions, database outages, and offline submission/replay.
- User-rated clarity, ease of use, and confidence, using a consistent questionnaire such as SUS if approved by the research adviser.
- Successful operation on desktop and mobile screen sizes, keyboard accessibility, and reduced-motion settings.
- Whether public responses mask identity and whether protected API routes reject unauthorized requests.
- Restore success and recovery time in a controlled backup exercise.

Report the test environment, sample size, participant selection, instruments, consent and privacy safeguards, task definitions, analysis method, dates, and limitations. Keep measured results separate from the system's planned requirements and from opinions about legal compliance.

## 17. Glossary

| Term | Meaning |
|---|---|
| API | Application Programming Interface; the server routes used by the web UI and other clients. |
| AES-256-GCM | Authenticated encryption mode used for selected sensitive fields at rest. |
| Barangay | The smallest local government unit in the Philippines. |
| CTC / Cedula | Community Tax Certificate information associated with document processing. |
| ESM | ECMAScript module format used by JavaScript source. |
| HMAC | Keyed message authentication code used to verify generated tokens/signatures. |
| IndexedDB | Browser database used by the client-side offline outbox. |
| JWE | Encrypted JSON Web Token format used for session cookies. |
| LAN | Local Area Network, such as the barangay hall network. |
| ORM | Object-relational mapper; Prisma maps application models to relational database operations. |
| PWA | Progressive Web Application, a website with installability and selected offline support. |
| Proof of work | A computational challenge used by the blotter flow to discourage automated spam without IP-based throttling. |
| RBAC | Role-based access control. |
| Service Worker | Browser script that controls caching and selected offline behavior. |
| Tracking code | A generated reference used to look up a request's permitted public status. |

## 18. Repository references

- [Implementation plan](implementation-plan.md) — requirements, architectural constraints, and project targets.
- [BEST system user manual](BEST-SYSTEM-USER-MANUAL.md) — consolidated user and operations guidance; check it against the source before reuse.
- [Citizen user guide](MANUAL-CITIZEN-USER-GUIDE.md) — resident-oriented instructions.
- [Administrative operations manual](MANUAL-ADMIN-OPERATIONS.md) — staff procedures; check for content that may have changed.
- [Chapter II RRL synthesis](CHAPTER-II-RRL-SYNTHESIS.md) — collected related literature and studies with their connection to BEST.
- [Research diagrams and target map](RESEARCH-DIAGRAMS-AND-TARGET-MAP.md) — context diagram, deployment diagram, and target environment map.
- [Setup guide](../SETUP-GUIDE.md) — local installation guidance.
- [Package manifest](../package.json) — scripts, runtime requirement, and dependencies.
- [Prisma schema](../prisma/schema.prisma) — database models and enums.
- [Docker Compose](../docker-compose.yml) and [Dockerfile](../Dockerfile) — container deployment.
- [Caddy configuration](../Caddyfile) — reverse proxy and HTTPS behavior.
- [Environment template](../.env.example) — variable names with non-working placeholders; never replace this document with a real .env file.

---

This document is a technical description of the repository, not a legal opinion, security certification, or guarantee of production readiness. Confirm the deployed revision, database state, locality-specific wording, operational controls, and research ethics requirements before citing system behavior as an evaluated result.
