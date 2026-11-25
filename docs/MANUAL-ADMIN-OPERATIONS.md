# BARANGAY E-SERVICES SYSTEM TERMINAL [BEST]
## ADMINISTRATIVE & STAFF OPERATIONS MANUAL
**Document Reference: BEST-OPS-V5-2026**  
**Classification: RESTRICTED — FOR AUTHORIZED MUNICIPAL PERSONNEL ONLY**  
**Jurisdiction: Republic of the Philippines — Local Government Unit of Barangay San Gabriel**  
**Statutory Mandate: Local Government Code of 1991 (R.A. 7160), Data Privacy Act of 2012 (R.A. 10173), Ease of Doing Business Act (R.A. 11032), and First Time Jobseekers Assistance Act (R.A. 11261)**

---

### DOCUMENT CONTROL & REVISION REGISTER

| Version | Date of Effectivity | Primary Changes & Statutory Alignment | Document Custodian |
| :--- | :--- | :--- | :--- |
| **V1.0** | January 15, 2026 | Initial prototype deployment for LAN testing | IT Cadavid / Genella |
| **V2.0** | March 30, 2026 | Addition of multi-role RBAC and assisted intake | IT Saldua / Gutib M. |
| **V3.0** | June 12, 2026 | Anonymous blotter with Zero-IP logging policy | IT Gutib J. / Cadavid |
| **V4.0** | September 1, 2026 | Elimination of RSA records keypair in favor of field AES-256-GCM | Core Architecture Team |
| **V5.0** | November 17, 2026 | Comprehensive production hardening, offline reliability, deep telemetry | Lead Systems Architect |

---

## TABLE OF CONTENTS

1. **Chapter 1: System Topology & Legal Safeguards**
   - 1.1 Air-Gapped Municipal Area Network (MAN) Topology
   - 1.2 Hardware & Server Environment Specifications
   - 1.3 Non-Negotiable Statutory Invariants (Invariants 1-15)
2. **Chapter 2: Administrative Accounts, Credentials & RBAC Matrix**
   - 2.1 Complete Directory of Administrative Accounts
   - 2.2 Account Profile 1: Root System Administrator (`ADMIN`)
   - 2.3 Account Profile 2: Administrative Desk Officer (`STAFF`)
   - 2.4 Account Profile 3: Barangay Treasurer & Cashier (`TREASURER`)
   - 2.5 Account Profile 4: Punong Barangay & Council Official (`OFFICIAL`)
   - 2.6 Granular Route & API Permission Matrix
3. **Chapter 3: Standard Operating Procedures (SOPs)**
   - 3.1 SOP-01: Administrative Login, MFA & 15-Minute Session Inactivity Guard
   - 3.2 SOP-02: Civil Registry & 7-Day Resident Activation Slips
   - 3.3 SOP-03: Assisted Desk Intake for Walk-In Citizens
   - 3.4 SOP-04: Document Queue Processing & Cryptographic Decryption
   - 3.5 SOP-05: Treasury Revenue Collection & In-Person Business Screening
   - 3.6 SOP-06: Production Certificate Printing (100% Solid B&W & HMAC QR)
   - 3.7 SOP-07: Anonymous Blotter Triage, Narrative Decryption & Tanod Patrol Dispatch
   - 3.8 SOP-08: Community Broadcast Publisher & Megaphone PA Generator
   - 3.9 SOP-09: Barangay Leadership & Council Directory Administration
4. **Chapter 4: Server Operations, Reliability & Disaster Recovery**
   - 4.1 Server PC Cold-Start & Power-On Sequence
   - 4.2 Automated Hourly & Daily Encrypted Backups
   - 4.3 Bare-Metal Database Restore Drill (`scripts/test-restore.sh`)
   - 4.4 Warm Spare PC Promotion & Emergency Failover (RTO <= 60 Minutes)
   - 4.5 Cryptographic Key Security (`FIELD_ENC_KEY` & `QR_HMAC_SECRET`)
5. **Chapter 5: System Telemetry, Deep Health & Audit Logging**
   - 5.1 Deep Telemetry Diagnostics (`/api/health/deep`)
   - 5.2 Immutable Security Audit Log Specification
6. **Chapter 6: Troubleshooting & System Error Matrix**
   - 6.1 Common Operational Errors & Step-by-Step Resolutions

---

## CHAPTER 1: SYSTEM TOPOLOGY & LEGAL SAFEGUARDS

### 1.1 Air-Gapped Municipal Area Network (MAN) Topology
The Barangay E-Services System Terminal (BEST) is engineered as an offline-first, sovereign appliance running entirely on local premises. The system does not depend on cloud providers, public internet connectivity, or external servers to deliver civic services.

**Network Architecture Overview:**
- **Primary Server PC**: Houses the Docker containerized PostgreSQL 16 database, the Next.js 14 application daemon, automated backup services, and deep telemetry monitoring.
- **Barangay Hall Gigabit Switch**: High-speed, unmanaged physical switch distributing Ethernet connectivity to staff terminals (Admin, Staff Desk, Treasury Counter, Official Office).
- **Barangay Hall Secure Wi-Fi AP**: Closed wireless access point broadcasting `Barangay-BEST-Hall` (WPA3-Personal) for citizen smartphones and public kiosk terminals.
- **Secondary Warm Spare PC**: Standby hardware connected to the hall switch, receiving continuous database backup archives every 15 minutes.

### 1.2 Hardware & Server Environment Specifications

| Component | Minimum Specification | Recommended Production Server |
| :--- | :--- | :--- |
| **Processor** | Intel Core i3 (8th Gen) / AMD Ryzen 3 | Intel Core i5 (12th Gen) / AMD Ryzen 5 (6 Cores / 12 Threads) |
| **System Memory** | 8 GB DDR4 RAM | 16 GB DDR4/DDR5 ECC or Non-ECC RAM |
| **Storage (OS & DB)** | 256 GB SATA SSD | 512 GB NVMe M.2 SSD (Dedicated to Database & Container Engine) |
| **Backup Storage** | External 1 TB USB 3.2 Drive | Dual External 1 TB Encrypted Drives (Rotated Weekly) |
| **Network Interface** | Single Gigabit Ethernet (1000BASE-T) | Dual Gigabit Ethernet (1x LAN Private, 1x Standby / Mirror) |
| **Power Protection** | 650 VA Line-Interactive UPS | 1500 VA True Online Sine-Wave UPS with USB Auto-Shutdown Daemon |
| **Operating System** | Ubuntu 22.04 LTS / Windows 11 Pro 64-bit | Ubuntu 24.04 LTS Server (Dedicated Minimal Install) |

### 1.3 Non-Negotiable Statutory Invariants (Invariants 1-15)
Every system operator and software developer is legally bound by the invariants defined in Plan Section 10.3:
1. **No IP Address Column in Blotter (NFR-02 / R.A. 10173)**: Client IP addresses are never recorded in database tables or server access logs for blotter actions.
2. **No Automated Online Business Approval (R.A. 7160 Sec. 152)**: Business Clearances strictly require physical, in-person assessment by the Barangay Treasurer.
3. **Public Lookups Mask Citizen Names (NFR-01)**: Public tracking interfaces mask identities to `J*** D**` format to prevent unauthorized PII harvesting.
4. **100% Solid Black-and-White Printing (NFR-05)**: Official certificates print with zero CSS background graphics, zero glassmorphism, and zero color gradients on standard 80 gsm Letter/A4 stock.
5. **No Runtime External Origin (OFFLINE-01)**: Zero third-party CDNs, Google Fonts, tracking pixels, or remote scripts. The terminal operates fully severed from the internet.
6. **Sensitive data stays within the system (OFFLINE-02/03)**: Do not send resident personal data or blotter records to external services. In the documented local configuration, broadcast summaries use deterministic sentence extraction and fixed templates.
7. **Homomorphic / Server-Side Field Encryption (ENC-01)**: Sensitive fields (blotter narrative, incident location, document purpose, CTC number, staff notes) are encrypted using AES-256-GCM.
8. **15-Minute Server-Enforced Inactivity Timeout (NFR-06)**: All staff and resident sessions expire after 900 seconds of inactivity on the server side.
9. **No Plain-HTTP Production Listener**: Local traffic runs over TLS (HTTPS) on port 443 with HSTS headers.
10. **Zero-Knowledge Blotter Logging (ZK-LOG-01)**: The reverse proxy strips `User-Agent`, `Referer`, and `X-Forwarded-For` headers from all requests matching `/api/blotter/**`.

---

## CHAPTER 2: ADMINISTRATIVE ACCOUNTS, CREDENTIALS & RBAC MATRIX

### 2.1 Complete Directory of Administrative Accounts
The system provides four specialized administrative roles. Sharing accounts across different staff members is strictly prohibited under municipal administrative circulars.

| Role Code | Official Title | Canonical Username | Default Seed Password | Primary Physical Workspace | Primary Statutory Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | Root System Administrator | `admin` | `AdminSecure2026!` | Server Room / IT Office | Systems uptime, database backup integrity, security audit reviews, and emergency failover. |
| **`STAFF`** | Front Desk & Intake Officer | `staff` | `StaffDesk2026!` | Frontline Public Counter | Resident identity verification, document queue review, assisted intake, and tanod blotter dispatch. |
| **`TREASURER`** | Barangay Treasurer & Cashier | `treasurer` | `TreasurerPay2026!` | Cashier Window / Treasury | Revenue collection, official receipt (OR) issuance, financial reconciliation, and business tax screening. |
| **`OFFICIAL`** | Punong Barangay / Kagawad | `official` | `OfficialLead2026!` | Executive Office / Session Hall | Municipal directory maintenance, emergency civic broadcasts, bandilyo PA scripts, and certificate signing. |

---

### 2.2 Account Profile 1: Root System Administrator (`ADMIN`)
- **Username**: `admin`
- **Default Password**: `AdminSecure2026!`
- **Access URL**: `http://localhost:3000/admin/login` (or `https://best.lan/admin/login`)
- **Operational Scope**: Total infrastructure governance. The Administrator is responsible for maintaining the physical server, verifying cryptographic integrity, running backup restoration drills, and monitoring system telemetry.

**Permitted Capabilities:**
- View deep system telemetry (`/api/health/deep`), including PostgreSQL query latency, disk space utilization, backup age, and TLS certificate expiration.
- Inspect immutable security audit logs (`AuditLog` table) for all sensitive operations (e.g., `VIEW_ENCRYPTED`, `UPDATE_STATUS`, `RECORD_PAYMENT`).
- Access all document, blotter, resident, broadcast, and directory queues.
- Issue and manage digital ID cards for verified residents in `/admin/residents`, including validity and active/expired/revoked status.
- Execute server-side maintenance scripts (`scripts/test-restore.sh`, `ops/scripts/promote-spare.sh`).

**Restricted & Forbidden Actions:**
- **CANNOT** approve business clearances without in-person Treasurer financial assessment.
- **CANNOT** commit or export the raw 256-bit encryption key (`FIELD_ENC_KEY`) to external storage.

**Daily Operational Routine:**
1. Log in at 07:45 AM before public counters open.
2. Open `/admin/dashboard` and verify that database latency is under 15ms.
3. Verify that the last automated backup was created within the previous 60 minutes.
4. Verify that disk space consumption is below 75%.
5. Review security audit logs for unauthorized login attempts or failed authentication spikes.

---

### 2.3 Account Profile 2: Administrative Desk Officer (`STAFF`)
- **Username**: `staff`
- **Default Password**: `StaffDesk2026!`
- **Access URL**: `http://localhost:3000/admin/login`
- **Operational Scope**: Frontline municipal document processing, public queue intake, blotter investigation triage, and resident onboarding.

**Permitted Capabilities:**
- Review and verify pending document applications (`CLEARANCE` and `INDIGENCY`) at `/admin/documents`.
- Decrypt and inspect applicant purposes and Community Tax Certificate (CTC) numbers.
- Perform assisted walk-in intake for senior citizens, persons with disabilities (PWDs), and residents lacking smartphones.
- Issue 7-day Crockford base32 activation slips (e.g., `DEMO7ACT04`) to verified residents at `/admin/residents`.
- Issue digital ID cards for verified residents and update their expiration or status at `/admin/residents`. Card numbers and barcode values are generated automatically; cards are not printed from BEST.
- Register new residents in the civil registry database.
- Triage anonymous blotter reports at `/admin/blotter`, record Tanod patrol dispatches, and enter AES-256 encrypted internal investigator notes.
- Trigger high-fidelity certificate printing (`/admin/documents/print/[id]`).

**Restricted & Forbidden Actions:**
- **CANNOT** collect cash fees or issue sequential Official Receipts (ORs) (reserved for Treasurer).
- **CANNOT** bypass required statutory document fees without an approved Indigency certification.
- **CANNOT** delete resident records, blotter reports, or audit logs.
- **CANNOT** access deep system telemetry, database shells, or encryption keys.

---

### 2.4 Account Profile 3: Barangay Treasurer & Cashier (`TREASURER`)
- **Username**: `treasurer`
- **Default Password**: `TreasurerPay2026!`
- **Access URL**: `http://localhost:3000/admin/login`
- **Operational Scope**: Sovereign revenue collection, fee assessment, issuance of serial Official Receipts (OR), and mandatory business tax screening pursuant to R.A. 7160 Sec. 152.

**Permitted Capabilities:**
- Access the Treasury & Cashier Terminal at `/admin/treasury`.
- Search document applications in `PAYMENT_PENDING` status by tracking code or applicant name.
- Record municipal clearance payments (₱50.00 standard clearance fee) by cash, GCash, LandBank, BPI, Maya, or GoTyme. Transfer methods require a reference number; verify the transfer in the provider's records before recording it. BEST does not connect to or verify payments with those providers.
- Record sequential government Official Receipt (OR) numbers (`OR-2026-XXXX`).
- Transition settled document requests to `READY_FOR_PICKUP`.
- Conduct physical, in-person document screening for Barangay Business Clearances:
  - Verify DTI / SEC Business Registration certificate.
  - Review commercial lease contract or real property tax declaration.
  - Assess gross sales declarations and determine appropriate barangay tax schedule.

**Restricted & Forbidden Actions:**
- **CANNOT** approve or sign document clearances (reserved for Desk Staff / Officials).
- **CANNOT** modify resident civil records, blotter narratives, or tanod patrol notes.
- **CANNOT** grant online or automated approval for business permits without physical face-to-face evaluation.

---

### 2.5 Account Profile 4: Punong Barangay & Council Official (`OFFICIAL`)
- **Username**: `official`
- **Default Password**: `OfficialLead2026!`
- **Access URL**: `http://localhost:3000/admin/login`
- **Operational Scope**: Executive municipal governance, legislative directory maintenance, emergency civic broadcasts, and official certificate signatory attestation.

**Permitted Capabilities:**
- Access the Official Directory Management interface at `/admin/directory`.
- Update official council roster entries (Punong Barangay, Barangay Kagawad, Sangguniang Kabataan Chair, Secretary, Treasurer).
- Publish urgent community broadcast advisories at `/admin/broadcasts`.
- Create concise notice summaries and template-based megaphone script text for barangay tanod mobile vehicles.
- Review aggregate civic caseload telemetry and municipal statistics on the dashboard.

**Restricted & Forbidden Actions:**
- **CANNOT** receive payments or issue Official Receipts.
- **CANNOT** execute system configuration, database migrations, or restore operations.
- **CANNOT** inspect unredacted complainant identities in anonymous blotters without formal legal cause.

---

### 2.6 Granular Route & API Permission Matrix

| Interface Route / API Endpoint | `ADMIN` | `STAFF` | `TREASURER` | `OFFICIAL` | Enforced Security Check |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`/admin/dashboard`** | ALLOWED | ALLOWED | ALLOWED | ALLOWED | Verified JWE Session Cookie |
| **`/admin/documents`** | ALLOWED | ALLOWED | DENIED | DENIED | Role IN (`ADMIN`, `STAFF`) |
| **`/admin/documents/print/[id]`** | ALLOWED | ALLOWED | DENIED | ALLOWED | Role IN (`ADMIN`, `STAFF`, `OFFICIAL`) |
| **`/admin/blotter`** | ALLOWED | ALLOWED | DENIED | DENIED | Role IN (`ADMIN`, `STAFF`) |
| **`/admin/residents`** | ALLOWED | ALLOWED | DENIED | DENIED | Role IN (`ADMIN`, `STAFF`) |
| **`/admin/treasury`** | ALLOWED | DENIED | ALLOWED | DENIED | Role IN (`ADMIN`, `TREASURER`) |
| **`/admin/broadcasts`** | ALLOWED | ALLOWED | DENIED | ALLOWED | Role IN (`ADMIN`, `STAFF`, `OFFICIAL`) |
| **`/admin/directory`** | ALLOWED | DENIED | DENIED | ALLOWED | Role IN (`ADMIN`, `OFFICIAL`) |
| **`/api/health/deep`** | ALLOWED | DENIED | DENIED | DENIED | Role === `ADMIN` |
| **`/api/audit`** | ALLOWED | DENIED | DENIED | DENIED | Role === `ADMIN` |
| **`/api/documents/assisted`** | ALLOWED | ALLOWED | DENIED | DENIED | Role IN (`ADMIN`, `STAFF`) |
| **`/api/treasury/pay`** | ALLOWED | DENIED | ALLOWED | DENIED | Role IN (`ADMIN`, `TREASURER`) |

---

## CHAPTER 3: STANDARD OPERATING PROCEDURES (SOPs)

### 3.1 SOP-01: Administrative Login, MFA & 15-Minute Session Inactivity Guard

**Objective**: Ensure that only authorized municipal personnel access administrative functions and prevent unattended terminal hijacking.

**Procedure**:
1. Open a web browser on any authorized staff terminal connected to the barangay LAN.
2. Navigate to: `http://localhost:3000/admin/login` (or `https://best.lan/admin/login`).
3. Select your designated role from the Role Selector dropdown (`Administrator`, `Staff Desk`, `Treasurer`, `Official`).
4. Enter your canonical username (e.g., `staff`) and secret password.
5. Click **Sign In to Terminal**.
6. Upon successful authentication, the server generates an encrypted JSON Web Encryption (JWE) token with `HttpOnly; Secure; SameSite=Strict` flags.

**Inactivity Guard Operations (NFR-06)**:
- The system enforces a strict 900-second (15-minute) inactivity limit calculated on the server.
- At **14 minutes of inactivity** (60 seconds remaining), a warning modal appears: *"Session Inactivity Warning — Your session will terminate in 60 seconds."*
- Click **Keep Me Logged In** to transmit a heartbeat ping (`POST /api/auth/ping`) and reset the timer.
- If no action is taken, the session terminates at exactly 15 minutes. The user is redirected to `/admin/login?reason=idle_timeout`.

---

### 3.2 SOP-02: Civil Registry & 7-Day Resident Activation Slips

**Objective**: Safely onboard verified residents into the digital terminal and issue cryptographic activation slips.

**Procedure for Issuing Activation Slips**:
1. Resident presents themselves at the frontline desk with at least one government-issued photo ID (National ID, PhilHealth, Driver's License, Senior Citizen ID).
2. Log in as `staff` and open `/admin/residents`.
3. Search for the resident by surname or Resident ID (e.g., `RES-2026-0004`).
4. Verify that the citizen's photo, birth date, and purok match their physical presentation.
5. Click **Issue Slip** adjacent to the resident's profile.
6. The system generates a 10-character Crockford base32 activation code (e.g., `DEMO7ACT04`). This code contains no ambiguous characters (0, O, 1, I are excluded) and expires in 168 hours (7 days).
7. Hand the printed physical slip to the resident with instructions to navigate to `/resident/activate`.

**Procedure for Registering a New Resident**:
1. On `/admin/residents`, click **+ Register New Resident**.
2. Complete all required fields:
   - First Name, Middle Name, Last Name, Suffix
   - Date of Birth (YYYY-MM-DD), Gender, Civil Status, Blood Type
   - Purok Zone (Purok 1 through Purok 7), Complete Street Address
   - Emergency Contact Person and Contact Phone Number
3. Click **Save Resident Record**.
4. The system assigns a sequential identifier: `RES-2026-XXXX`.

---

### 3.3 SOP-03: Assisted Desk Intake for Walk-In Citizens

**Objective**: Facilitate document requests for residents who do not possess a smartphone, computer, or digital literacy.

**Procedure**:
1. Log in as `staff` and navigate to `/admin/documents`.
2. Click **+ Assisted Walk-In Intake** in the top navigation bar.
3. Search for the resident using their registered name or `RES-YYYY-XXXX` identifier.
4. Select the requested document type:
   - **`CLEARANCE`** (Standard Barangay Clearance — ₱50.00 fee)
   - **`INDIGENCY`** (Certificate of Indigency — ₱0.00 fee under R.A. 11261)
5. Enter the declared **Purpose of Application** (e.g., *"Local Employment Requirement"*).
6. If applying for Clearance, input the resident's **Community Tax Certificate (CTC / Cedula) Number**. If the resident does not have a CTC, direct them to the Treasury counter first.
7. Click **Submit Assisted Request**.
8. The request is immediately assigned an 11-character tracking code (e.g., `CLR-2026-DEMO0001`).
9. Print or write the tracking code on the resident's receipt slip and instruct them to proceed to the Treasury counter (if Clearance) or waiting area (if Indigency).

---

### 3.4 SOP-04: Document Queue Processing & Cryptographic Decryption

**Objective**: Review incoming document applications, inspect encrypted purposes, and manage lifecycle state transitions.

**Lifecycle State Progression**:
- `SUBMITTED`: Newly filed application awaiting frontline clerk review.
- `UNDER_REVIEW`: Application currently open on a staff review terminal.
- `PAYMENT_PENDING`: Clearance approved by staff; awaiting cashier fee settlement.
- `READY_FOR_PICKUP`: Application approved and settled; ready for physical certificate printing.
- `RELEASED`: Stamped certificate handed to resident in person.
- `REJECTED`: Application denied due to non-residency or pending legal dispute.

**Processing Steps**:
1. Log in as `staff` and open `/admin/documents`.
2. Filter the queue by status: `SUBMITTED`.
3. Click **Review** on an applicant's row.
4. The server automatically decrypts the stored purpose and CTC number using `FIELD_ENC_KEY` and logs an immutable audit event (`action: "VIEW_ENCRYPTED"`).
5. **If the application is for Barangay Clearance**:
   - Verify that the purpose is legitimate.
   - Click **Require Payment**. The status moves to `PAYMENT_PENDING`.
6. **If the application is for Certificate of Indigency**:
   - Verify that the resident qualifies for fee exemption under R.A. 11261 or social welfare rules.
   - Click **Approve & Ready**. The status moves directly to `READY_FOR_PICKUP` (₱0.00 fee).
7. **If the application must be rejected**:
   - Click **Reject Application**.
   - Select or type the official rejection reason (e.g., *"Applicant address outside Barangay San Gabriel jurisdiction"*).
   - Click **Confirm Rejection**. The reason becomes visible on public tracking.

---

### 3.5 SOP-05: Treasury Revenue Collection & In-Person Business Screening

**Objective**: Collect municipal fees, issue serial Official Receipts, and enforce statutory in-person business tax screening.

**Fee Collection Procedure**:
1. Log in as `treasurer` and open `/admin/treasury`.
2. Enter the resident's 11-character tracking code (e.g., `CLR-2026-DEMO0001`).
3. Confirm that the status is `PAYMENT_PENDING` and the fee is ₱50.00.
4. Collect the payment in physical cash (or verify validated municipal QR transfer).
5. Enter the next sequential paper **Official Receipt (OR) Number** (e.g., `OR-2026-0042`).
6. Click **Record Payment & Settle**.
7. The system transitions the document status to `READY_FOR_PICKUP` and records a financial audit log entry.
8. Issue the physical paper Official Receipt to the resident.

**Mandatory In-Person Business Clearance Screening (R.A. 7160 Sec. 152)**:
- **LEGAL MANDATE**: No software, agent, or clerk may automatically approve a Barangay Business Clearance online.
- When an applicant presents a business clearance request:
  1. The Treasurer physically inspects the applicant's DTI / SEC registration documents.
  2. The Treasurer reviews the applicant's prior-year Gross Sales declaration or financial statement.
  3. The Treasurer calculates the municipal business tax pursuant to the Local Revenue Ordinance.
  4. Once satisfied, the Treasurer endorses the application physically and records the settlement on the terminal.

---

### 3.6 SOP-06: Production Certificate Printing (100% Solid B&W & HMAC QR)

**Objective**: Generate tamper-evident, court-admissible physical certificates meeting NFR-05 print standards.

**Procedure**:
1. In `/admin/documents`, find an application marked `READY_FOR_PICKUP`.
2. Click **Print Certificate**. The system opens `/admin/documents/print/[id]`.
3. Verify that the certificate template renders:
   - Official Republic of the Philippines header and Barangay San Gabriel seal.
   - Resident full name, address, CTC number, and issued date.
   - 300 DPI vector QR code containing the tracking URL and HMAC-SHA256 signature (`QR_HMAC_SECRET`).
   - Official signatory blocks for Barangay Secretary, Barangay Treasurer, and Punong Barangay.
4. Press `Ctrl + P` to open the system print dialog.
5. **Printer Settings Requirements**:
   - Destination: Heavy-Duty Laser Printer (e.g., HP LaserJet / Brother HL series).
   - Paper Size: Letter (8.5 x 11 in) or A4 (210 x 297 mm) 80 gsm white bond.
   - Color Mode: Monochrome / Black and White.
   - Margins: Default or None (CSS handles internal padding).
   - **DO NOT** enable "Background graphics" (the document is 100% solid B&W by law).
6. Click **Print**.
7. Affix the official physical barangay dry seal over the lower-left corner of the certificate.
8. Have the Punong Barangay or authorized Kagawad sign above the signature line.
9. Hand the certificate to the resident, return to `/admin/documents`, and click **Confirm Released to Citizen**.

---

### 3.7 SOP-07: Anonymous Blotter Triage, Narrative Decryption & Tanod Patrol Dispatch

**Objective**: Investigate community incident reports while safeguarding the complainant's privacy under R.A. 10173 and ZK-LOG-01.

**Procedure**:
1. Log in as `staff` and open `/admin/blotter`.
2. New reports arrive with masked codes (e.g., `BLT-2026-DEMO01`).
3. Click **Inspect & Triage**.
4. The server decrypts the narrative, exact location, and time using `FIELD_ENC_KEY`.
5. **Dispatching Patrols**:
   - Update the status to `ACTION_TAKEN`.
   - In **Action Taken**, record the patrol log: *"Barangay Tanod Mobile Patrol Unit 3 dispatched to Purok 2 for noise abatement."*
   - In **Public Guidance Note**, provide citizen reassurance visible on their tracking screen: *"Patrol officers are on-site conducting inquiry."*
   - In **Confidential Internal Notes**, enter sensitive officer observations. This field is encrypted with AES-256-GCM before saving.
6. **Closing an Incident**: Once resolved through amicable settlement or referral, update status to `CLOSED`.

**Katarungang Pambarangay (Lupon) Boundary Notice (SCOPE-01)**:
- BEST is an initial incident triage and tanod patrol logging system.
- Formal Katarungang Pambarangay mediation hearings, Lupon summonses, and formal dispute arbitrations are strictly handled outside the software via physical legal docket books. Do not create summons records in BEST.

---

### 3.8 SOP-08: Community Broadcast Publisher & Megaphone PA Generator

**Objective**: Disseminate official advisories, severe weather warnings, and generate audio scripts for mobile public address systems.

**Procedure**:
1. Log in as `official` or `staff` and open `/admin/broadcasts`.
2. Click **+ New Announcement**.
3. Select the priority category:
   - **`EMERGENCY`** (Typhoon, Flood, Fire evacuation — red banner)
   - **`ADVISORY`** (Scheduled power/water outage, medical mission — blue banner)
   - **`GENERAL`** (Barangay assembly, fiesta notice — green banner)
4. Input the official title and full broadcast text.
5. Click **AI Simplify & Megaphone**. In the documented local configuration, the helper extracts the lead sentence and sentences containing dates, times, or amounts, then fills a fixed language-specific script template. It creates text only; it does not produce audio or guarantee a fixed word count.
6. Click **Publish Broadcast Immediately**.
7. The advisory appears on all public kiosks, citizen portals, and local hall digital displays.

---

### 3.9 SOP-09: Barangay Leadership & Council Directory Administration

**Objective**: Maintain an accurate, up-to-date public directory of elected and appointed barangay officials.

**Procedure**:
1. Log in as `official` and open `/admin/directory`.
2. To update an existing official's details, click **Edit**.
3. To add a newly appointed official, click **+ Add Official**.
4. Enter:
   - Full Legal Name and Title
   - Official Position (Punong Barangay, Barangay Kagawad, SK Chairman, Secretary, Treasurer)
   - Assigned Committee (e.g., Committee on Peace & Order, Committee on Health & Sanitation)
   - Office Schedule and Public Consultation Hours
5. Click **Save Official Record**. The public directory is updated instantly across all kiosks and portals.

---

## CHAPTER 4: SERVER OPERATIONS, RELIABILITY & DISASTER RECOVERY

### 4.1 Server PC Cold-Start & Power-On Sequence

In the event of a scheduled power outage, facility relocation, or municipal emergency:
1. Ensure the server PC is connected to the operational Uninterruptible Power Supply (UPS).
2. Press the hardware power button on the primary server chassis.
3. Allow the operating system to complete its boot sequence.
4. Log in to the host server console using authorized hardware administrative credentials.
5. Open a terminal / PowerShell session and navigate to the project directory:
   ```bash
   cd "C:\Users\Lloyd\Desktop\BEST system"
   ```
6. Verify that the PostgreSQL database container is running and healthy:
   ```bash
   docker ps
   ```
   *Expected output: Container `best_postgres` status is "Up (healthy)".*
7. If the container is stopped, start it:
   ```bash
   docker compose up -d best_postgres
   ```
8. Start the application daemon:
   ```bash
   npm run start
   ```
9. Verify that the local endpoint responds:
   ```bash
   curl -I http://localhost:3000/api/health
   ```
   *Expected output: HTTP/1.1 200 OK*

---

### 4.2 Automated Hourly & Daily Encrypted Backups

The `best_backup` automated service container executes encrypted database dumps at regular intervals.

**Backup Schedule & Retention Matrix**:
- **Hourly Dumps**: Executed every 60 minutes. Retained for 48 hours.
- **Daily Dumps**: Executed at 00:00 midnight. Retained for 14 days.
- **Weekly Dumps**: Executed every Sunday at 01:00 AM. Retained for 8 weeks.
- **Monthly Dumps**: Executed on the 1st of each month. Retained for 12 months.

**Cryptographic Archive Security**:
Each dump is extracted via `pg_dump -Fc` and piped directly into `age` asymmetric encryption:
```bash
pg_dump -h best_postgres -U best_admin -Fc best_barangay_db | age -r "$BACKUP_AGE_PUBKEY" > /backups/hourly/best-$TIMESTAMP.dump.age
```
Backup archives cannot be decrypted without the physical private age key maintained by the municipal IT custodian in a sealed tamper-evident safe.

---

### 4.3 Bare-Metal Database Restore Drill (`scripts/test-restore.sh`)

**Objective**: Prove quarterly disaster readiness by executing a complete restore test without disrupting live operations.

**Procedure**:
1. Open terminal on the primary server.
2. Run the automated restore test script:
   ```bash
   npm run test:restore
   ```
3. The script executes the following verification steps:
   - Creates a temporary verification database: `best_barangay_db_restore_test`.
   - Locates the most recent encrypted `.age` archive in `/backups/`.
   - Decrypts the archive using the staging key.
   - Restores the database schema and all relational tables.
   - Asserts record counts for residents, documents, blotters, and audit logs.
   - Verifies that AES-256-GCM encrypted fields can be read.
   - Drops the temporary database and outputs an execution report.
4. File the generated restoration report in the municipal IT compliance binder.

---

### 4.4 Warm Spare PC Promotion & Emergency Failover (RTO <= 60 Minutes)

**Objective**: Resume municipal operations within 60 minutes if the primary server suffers catastrophic hardware destruction (fire, water damage, motherboard failure).

**Emergency Promotion Steps**:
1. Power on the physical **Warm Spare PC** located in the secondary municipal office.
2. Ensure the spare PC is connected to the primary hall network switch via Ethernet.
3. Open a terminal on the Warm Spare PC:
   ```bash
   sh ops/scripts/promote-spare.sh
   ```
4. The promotion script automatically:
   - Mounts the latest synced database snapshot.
   - Launches the `best_postgres` container with production parameters.
   - Applies any pending Prisma migrations.
   - Starts the Next.js production server on port 3000.
   - Asserts `/api/health` and verifies field decryption.
5. In the barangay hall router administration portal, point the static DNS entry `best.lan` to the Warm Spare PC's IP address (e.g., `192.168.1.50`).
6. All staff terminals and citizen kiosks reconnect automatically without configuration changes.

---

### 4.5 Cryptographic Key Security (`FIELD_ENC_KEY` & `QR_HMAC_SECRET`)

**Key Management Policy (ENC-01)**:
- `FIELD_ENC_KEY` is a 256-bit (32-byte) cryptographically secure random value encoded in base64.
- The key resides exclusively in the server's `.env` file with operating system file permissions set to `600` (read/write by the host user only).
- **NEVER** commit `.env` to git or paste it into external chat services or public websites.
- **Generating a New Key (Initial Setup Only)**:
  ```bash
  npm run keys:generate
  ```
  The command outputs a fresh key string on the terminal screen. A designated human administrator copies the key into `.env`.
- An encrypted backup of the key string is stored on an air-gapped, password-protected USB key stored in the municipal treasurer's fireproof vault.

---

## CHAPTER 5: SYSTEM TELEMETRY, DEEP HEALTH & AUDIT LOGGING

### 5.1 Deep Telemetry Diagnostics (`/api/health/deep`)

The System Administrator inspects infrastructure vitality via the deep telemetry endpoint.

**Diagnostic Metrics & Thresholds**:

| Telemetry Metric | Healthy Range | Warning Threshold | Critical Incident Action |
| :--- | :--- | :--- | :--- |
| **Database Ping Latency (`db_ms`)** | 1 ms – 15 ms | 16 ms – 50 ms | Investigate runaway queries or indexing locks. |
| **Disk Storage Consumption** | Under 70% | 71% – 85% | Run `ops/backup/prune.sh` to remove expired archives. |
| **Backup Archive Age** | Under 60 minutes | 61 – 120 minutes | Check `best_backup` container logs: `docker logs best_backup`. |
| **TLS Certificate Remaining** | Over 30 days | 15 – 30 days | Run certificate renewal script: `ops/scripts/cert-check.sh`. |
| **Active Session Tokens** | Under 50 | 51 – 200 | Verify no session cookie leaking; check audit logs. |

---

### 5.2 Immutable Security Audit Log Specification

Every sensitive event generates an immutable record in the `AuditLog` table. Audit records cannot be modified or deleted through the user interface.

**Logged Security Actions**:
- `LOGIN_SUCCESS`: Staff member successfully authenticated with role.
- `LOGIN_FAILURE`: Invalid password or non-existent username submitted.
- `VIEW_ENCRYPTED`: Staff member decrypted a sensitive purpose, CTC, or blotter narrative.
- `UPDATE_STATUS`: Document or blotter state transitioned (records previous and new state).
- `RECORD_PAYMENT`: Treasurer recorded cash fee settlement and issued an OR.
- `ISSUE_ACTIVATION_SLIP`: Staff issued a 7-day Crockford resident activation code.
- `PUBLISH_BROADCAST`: Official published an emergency advisory.

---

## CHAPTER 6: TROUBLESHOOTING & SYSTEM ERROR MATRIX

### 6.1 Common Operational Errors & Step-by-Step Resolutions

| Error Condition / Symptom | Probable Underlying Cause | Step-by-Step Resolution Command |
| :--- | :--- | :--- |
| **HTTP 500: Database Connection Refused** | PostgreSQL container `best_postgres` has stopped or crashed. | Run in terminal: `docker compose up -d best_postgres` then verify with `docker ps`. |
| **Error: `FIELD_ENC_KEY is not configured`** | Server `.env` file is missing or `FIELD_ENC_KEY` was deleted. | Restore `.env` from physical vault backup or regenerate via `npm run keys:generate`. |
| **HTTP 401: `idle_timeout` on Form Submit** | Staff session exceeded 15 minutes of inactivity (NFR-06). | Return to `/admin/login`, re-enter credentials, and resume task. |
| **Print Output Shows Cut-Off Margins** | Printer driver paper size mismatch (A4 selected instead of Letter). | In print dialog, set Paper Size to `Letter`, Scale to `100%`, and Margins to `Default`. |
| **Activation Code Rejected as Invalid** | Slip expired (past 7 days) or mistyped characters. | Verify resident ID and issue a fresh activation slip in `/admin/residents`. |
| **Public Tracking Displays `NOT_FOUND`** | Citizen entered incorrect tracking code format. | Remind citizen that tracking codes use uppercase letters (e.g., `CLR-2026-DEMO0001`). |

---

**CERTIFICATION OF OPERATIONAL READINESS**  
*This Administrative & Staff Operations Manual has been reviewed and certified for full operational deployment in Barangay San Gabriel under the laws of the Republic of the Philippines.*
