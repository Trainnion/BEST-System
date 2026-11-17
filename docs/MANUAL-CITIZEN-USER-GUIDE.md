# BARANGAY E-SERVICES SYSTEM TERMINAL [BEST]
## CITIZEN & RESIDENT USER GUIDE
**Document Reference: BEST-USER-V5-2026**  
**Classification: PUBLIC — FOR ALL CITIZENS & RESIDENTS OF BARANGAY SAN GABRIEL**  
**Jurisdiction: Republic of the Philippines — Local Government Unit of Barangay San Gabriel**  
**Statutory Guarantees: Local Government Code of 1991 (R.A. 7160), Data Privacy Act of 2012 (R.A. 10173), First Time Jobseekers Assistance Act (R.A. 11261), and Ease of Doing Business Act (R.A. 11032)**

---

### WELCOME TO YOUR DIGITAL BARANGAY SERVICES

The **Barangay E-Services System Terminal (BEST)** is Barangay San Gabriel's sovereign, offline-first digital service platform. Built directly into the barangay hall's local network, BEST allows you to request official barangay documents, file confidential community reports, verify elected officials, and view your digital resident ID card without waiting in long physical lines.

Because BEST operates on an offline-first municipal network, **the system continues functioning even during typhoons, cellular signal loss, or commercial internet blackouts**.

---

## TABLE OF CONTENTS

1. **Chapter 1: Accessing Barangay Services & Citizen Rights**
   - 1.1 Three Ways to Access the BEST Terminal
   - 1.2 Your Privacy Rights under the Data Privacy Act of 2012 (R.A. 10173)
   - 1.3 Fee Schedules & Free Services under R.A. 11261 (First-Time Jobseekers)
2. **Chapter 2: Citizen Account Types & Demo Persona Directory**
   - 2.1 The Three Citizen Interaction Modes
   - 2.2 Complete Roster of Seeded Citizen Demonstration Accounts
   - 2.3 Persona Profile 1: Maria Clara Santos (Fully Verified Citizen / Clearance Applicant)
   - 2.4 Persona Profile 2: Juan Ramon Dela Cruz (Indigent Citizen / Jobseeker)
   - 2.5 Persona Profile 3: Ana Liza Reyes (Micro-Enterprise Business Owner)
   - 2.6 Persona Profile 4: Elena Bautista (Senior Citizen / 7-Day Slip Activation)
   - 2.7 Persona Profile 5: Carlos Mendoza (New Resident / Accessibility User)
   - 2.8 Persona Profile 6: The Anonymous Citizen (Walk-Up / Public Kiosk)
3. **Chapter 3: Step-by-Step Service Guides**
   - 3.1 Guide 1: Activating Your Resident Account with a 7-Day Slip (`/resident/activate`)
   - 3.2 Guide 2: Logging In & Understanding the 15-Minute Security Timer (`/resident/login`)
   - 3.3 Guide 3: Applying for a Barangay Clearance (`/services/request`)
   - 3.4 Guide 4: Applying for a Free Certificate of Indigency (`/services/request`)
   - 3.5 Guide 5: Applying for a Barangay Business Clearance (Mandatory In-Person Screening)
   - 3.6 Guide 6: Viewing Your Digital Barangay ID Card (`/resident/id`)
   - 3.7 Guide 7: Filing an Anonymous Incident Blotter Report (`/blotter`)
   - 3.8 Guide 8: Public Document & Blotter Tracking (`/track`)
   - 3.9 Guide 9: Verifying Certificate Authenticity via Vector QR (`/verify`)
   - 3.10 Guide 10: Asking AI Kaagapay Civic Concierge (Tagalog, Cebuano, English)
4. **Chapter 4: Frequently Asked Questions (FAQ) & Resident Assistance**
   - 4.1 Lost Activation Slips, Passwords & Common Inquiries
   - 4.2 Emergency Hotlines & Physical Hall Assistance Hours

---

## CHAPTER 1: ACCESSING BARANGAY SERVICES & CITIZEN RIGHTS

### 1.1 Three Ways to Access the BEST Terminal

You can access barangay digital services using any of the following convenient options:

1. **Option A: Touchscreen Kiosks at Barangay Hall**
   - Located in the main lobby of Barangay San Gabriel Hall.
   - Large touch-screen interface designed for fast public lookups, walk-up applications, and public directory searching.
   - No internet connection or mobile phone required.

2. **Option B: Your Personal Mobile Phone or Tablet (Over Barangay Wi-Fi)**
   - When visiting the barangay hall or surrounding plaza, connect your Wi-Fi to: `Barangay-BEST-Hall`.
   - Open any browser (Chrome, Safari, Firefox, Edge) and go to: `http://best.lan` (or `http://localhost:3000`).
   - The portal loads instantly with zero cellular data charges.

3. **Option C: Assisted Frontline Desk Counter**
   - If you do not have a smartphone or prefer in-person help, visit **Counter 1 (Assisted Intake Desk)**.
   - A friendly desk officer will verify your identity, file your application on your behalf, and hand you a printed tracking slip.

---

### 1.2 Your Privacy Rights under the Data Privacy Act of 2012 (R.A. 10173)

Barangay San Gabriel takes your privacy and data sovereignty seriously:
- **Zero Public PII Exposure (NFR-01)**: When checking public application status, names are masked (e.g., `M*** S***`). Strangers cannot see your identity.
- **Server-Side Field Encryption (ENC-01)**: Your contact phone number, exact residential address, document purpose, and Community Tax Certificate (CTC) number are scrambled using 256-bit military-grade encryption (AES-256-GCM). Even if server hardware were stolen, your personal data cannot be read without the municipal key.
- **Strict Blotter Anonymity (ZK-LOG-01)**: When you file an incident report, the server deliberately **does not collect your IP address, device serial number, internet cookies, or browsing history**. You remain completely anonymous.
- **Right to Rectification**: If any information on your civil registry record is incorrect, you have the right to request an immediate correction at the desk.

---

### 1.3 Fee Schedules & Free Services under R.A. 11261 (First-Time Jobseekers)

| Document / Certification Type | Standard Statutory Fee | Qualified Fee Exemptions | Legal Basis & Requirements |
| :--- | :--- | :--- | :--- |
| **Barangay Clearance** | **₱50.00** | None (Standard municipal administrative fee) | Local Government Code of 1991 (R.A. 7160 Sec. 152). Valid Community Tax Certificate (CTC) required. |
| **Certificate of Indigency** | **₱0.00 (FREE)** | **100% Free** for low-income residents, jobseekers, and welfare applicants | Republic Act 11261 (First Time Jobseekers Assistance Act) & Social Welfare Code. Zero municipal fee. |
| **Barangay Business Clearance** | Variable by Gross Sales | None (Requires in-person Treasurer assessment) | Local Revenue Code. In-person gross revenue verification mandatory. |
| **Anonymous Blotter Incident Report** | **₱0.00 (FREE)** | Always free for all residents and visitors | Sovereign peace and order service. No fee permitted. |
| **Digital Barangay ID Viewing** | **₱0.00 (FREE)** | Free for all registered residents | Digital credential access is free of charge. |

---

## CHAPTER 2: CITIZEN ACCOUNT TYPES & DEMO PERSONA DIRECTORY

### 2.1 The Three Citizen Interaction Modes

The BEST platform accommodates different levels of interaction depending on what you wish to accomplish:

```
+-----------------------------------------------------------------------------------+
|                           CITIZEN INTERACTION MODES                               |
+-----------------------------------------------------------------------------------+
| 1. PUBLIC & ANONYMOUS MODE                                                        |
|    - No account or login required.                                                |
|    - File confidential anonymous blotters, track documents via tracking code,    |
|      verify certificate QR codes, consult AI Kaagapay civic assistant.            |
+-----------------------------------------------------------------------------------+
| 2. PENDING ACTIVATION (7-DAY SLIP)                                                |
|    - Resident has a physical activation slip issued at the desk.                  |
|    - Enters 10-character code at /resident/activate to choose private password.   |
+-----------------------------------------------------------------------------------+
| 3. VERIFIED RESIDENT PORTAL                                                       |
|    - Resident logs in with Resident ID (RES-YYYY-XXXX) and private password.      |
|    - File clearances, apply for free indigency, view digital ID card.             |
+-----------------------------------------------------------------------------------+
```

---

### 2.2 Complete Roster of Seeded Citizen Demonstration Accounts

For auditing, training, and testing on the server terminal, use the following pre-configured resident profiles:

| Resident ID | Full Name | Account State | Purpose / Demonstration Persona | Default Password / Activation Code |
| :--- | :--- | :--- | :--- | :--- |
| **`RES-2026-0001`** | Demo Maria Clara Santos | Fully Active | Regular resident requesting clearance & viewing digital ID (Birth Date: 1990-03-12) | `ResidentPass2026!` |
| **`RES-2026-0002`** | Demo Juan Ramon Dela Cruz | Fully Active | Indigent resident & first-time jobseeker R.A. 11261 zero fee (Birth Date: 1985-07-04) | `ResidentPass2026!` |
| **`RES-2026-0003`** | Demo Ana Reyes | Fully Active | Micro-enterprise owner scheduling business clearance screening (Birth Date: 1998-11-23) | `ResidentPass2026!` |
| **`RES-2026-0004`** | Demo Pedro Mendoza | Pending Activation | Walk-in resident testing 7-day Crockford slip activation (Birth Date: 1972-02-09) | Code: `DEMO7ACT04` |
| **`RES-2026-0005`** | Demo Liza Garcia | Fully Active | Senior citizen / accessibility kiosk user (Birth Date: 2001-06-30) | `ResidentPass2026!` |
| **`PUBLIC`** | Anonymous Citizen | No Account | Anonymous incident reporting & public document tracking | None (No Login Required) |

---

### 2.3 Persona Profile 1: Demo Maria Clara Santos (Fully Verified Citizen / Clearance Applicant)
- **Resident ID**: `RES-2026-0001`
- **Default Password**: `ResidentPass2026!`
- **Registered Birth Date**: `1990-03-12`
- **Civil Details**: Female, Married, Blood Type O+, Resident of Purok 1.
- **Digital ID Card**: `CARD-2026-0001` (Active, eGovPH Compliant QR & Code 128 Barcode).
- **Primary Persona Goals**: Apply for a standard Barangay Clearance for local employment, view personal digital ID card, monitor request status.
- **How to Test**:
  1. Go to `http://localhost:3000/resident/login`.
  2. Enter `RES-2026-0001` and `ResidentPass2026!`.
  3. Submit a new Clearance request with purpose: *"Local Employment Requirement"*.
  4. Notice the issued tracking code (e.g., `CLR-2026-DEMO0001`).

---

### 2.4 Persona Profile 2: Demo Juan Ramon Dela Cruz (Indigent Citizen / Jobseeker)
- **Resident ID**: `RES-2026-0002`
- **Default Password**: `ResidentPass2026!`
- **Registered Birth Date**: `1985-07-04`
- **Civil Details**: Male, Single, Blood Type A+, Resident of Purok 2.
- **Digital ID Card**: `CARD-2026-0002` (Active).
- **Primary Persona Goals**: Apply for a **Certificate of Indigency** with **100% Fee Exemption** under the First Time Jobseekers Assistance Act (R.A. 11261).
- **How to Test**:
  1. Go to `http://localhost:3000/resident/login`.
  2. Enter `RES-2026-0002` and `ResidentPass2026!`.
  3. Select **Certificate of Indigency**.
  4. Notice that the fee is displayed as **₱0.00 (FREE)**.
  5. Select purpose: *"First-Time Jobseeker Assistance"*.
  6. Submit request. Once reviewed by staff, the status moves directly to `READY_FOR_PICKUP` without requiring Treasury cashier payment.

---

### 2.5 Persona Profile 3: Demo Ana Reyes (Micro-Enterprise Business Owner)
- **Resident ID**: `RES-2026-0003`
- **Default Password**: `ResidentPass2026!`
- **Registered Birth Date**: `1998-11-23`
- **Civil Details**: Female, Married, Resident of Purok 3. Business: *Reyes Neighborhood Sari-Sari Store & Bakery* (`BIZ-2026-0001`).
- **Primary Persona Goals**: Apply for a **Barangay Business Clearance** and understand the mandatory in-person Treasury screening requirement under R.A. 7160 Sec. 152.
- **Statutory Protection**: Pursuant to R.A. 7160 Sec. 152, business clearances cannot be approved automatically online. Ana schedules an appointment to present her DTI registration and gross sales ledger to the Barangay Treasurer.

---

### 2.6 Persona Profile 4: Demo Pedro Mendoza (Walk-In Resident / 7-Day Slip Activation)
- **Resident ID**: `RES-2026-0004`
- **Account State**: **PENDING ACTIVATION** (Unactivated).
- **Activation Slip Code**: `DEMO7ACT04` (10-character Crockford base32 code).
- **Registered Birth Date**: `1972-02-09` (`February 9, 1972`).
- **Primary Persona Goals**: Activate his account for the very first time using his printed desk slip, establish a secure personal password, and unlock his portal.
- **How to Test**:
  1. Open `http://localhost:3000/resident/activate`.
  2. Input Resident ID: `RES-2026-0004`.
  3. Input Activation Code: `DEMO7ACT04`.
  4. Input Birth Date: `1972-02-09`.
  5. Set new password: `Mendoza#Secure99!`.
  6. Click **Activate Account**. The system verifies the one-time code, burns the code, and immediately logs him into the dashboard.

---

### 2.7 Persona Profile 5: Demo Liza Garcia (Accessibility Kiosk User)
- **Resident ID**: `RES-2026-0005`
- **Default Password**: `ResidentPass2026!`
- **Registered Birth Date**: `2001-06-30`
- **Civil Details**: Female, Resident of Purok 5.
- **Primary Persona Goals**: Access municipal services using high-contrast fonts, large touch targets, and assistive screen reader navigation on public lobby kiosks.

---

### 2.8 Persona Profile 6: The Anonymous Citizen (Walk-Up / Public Kiosk)
- **Authentication**: **NO LOGIN OR ACCOUNT REQUIRED**.
- **Access Route**: Direct public navigation on any kiosk or phone.
- **Primary Persona Goals**:
  1. File a confidential community incident report at `/blotter` without revealing identity or IP address.
  2. Track document progress at `/track` using an 11-character tracking code.
  3. Verify a printed certificate by scanning its vector QR code at `/verify`.
  4. Ask civic questions to the AI Kaagapay assistant at `/services/kaagapay`.

---

## CHAPTER 3: STEP-BY-STEP SERVICE GUIDES

### 3.1 Guide 1: Activating Your Resident Account with a 7-Day Slip (`/resident/activate`)

If you are a newly registered resident or have received an activation slip from the barangay desk officer, follow these steps to activate your digital portal:

**Step-by-Step Instructions**:
1. Connect to the barangay hall Wi-Fi (`Barangay-BEST-Hall`) or open the kiosk.
2. In your web browser, navigate to: `http://localhost:3000/resident/activate`.
3. Locate the printed activation slip given to you by the desk clerk.
4. Enter your **Resident Number** exactly as printed (e.g., `RES-2026-0004`).
5. Enter the **10-Character Activation Code** (e.g., `DEMO7ACT04`).
   - *Note*: Crockford base32 excludes confusing letters like `I`, `L`, `O`, and `U`.
6. Enter your **Registered Date of Birth** in YYYY-MM-DD format (e.g., `1960-05-18`).
7. Create your private **Password**:
   - Must be at least 10 characters in length.
   - We recommend using a combination of uppercase letters, numbers, and symbols.
8. Click **Activate Account**.
9. The terminal immediately confirms activation, destroys the one-time code, and redirects you directly to your **Resident Dashboard**.

---

### 3.2 Guide 2: Logging In & Understanding the 15-Minute Security Timer (`/resident/login`)

**How to Sign In**:
1. Open `http://localhost:3000/resident/login`.
2. Input your **Resident ID** (e.g., `RES-2026-0001`) or your verified mobile phone number.
3. Input your secret **Password**.
4. Click **Sign In to Resident Portal**.

**Understanding the 15-Minute Inactivity Protection (NFR-06)**:
- To protect your personal civil records from being accessed if you walk away from a public kiosk or leave your phone unattended, **the system automatically logs you out after 15 minutes of inactivity**.
- If you are idle for 14 minutes, a screen reminder will ask if you need more time.
- If logged out, simply re-enter your password to continue where you left off.

---

### 3.3 Guide 3: Applying for a Barangay Clearance (`/services/request`)

A Barangay Clearance certifies good legal and community standing. It is commonly required for job applications, postal IDs, bank accounts, or court clearances.

**Step-by-Step Instructions**:
1. Sign in to your portal at `/resident/login`.
2. On your dashboard, click **Request New Document** or select **Barangay Clearance**.
3. **Review Fee**: Standard municipal fee is **₱50.00**.
4. **Enter Purpose**: Type the exact reason you need the clearance (e.g., *"Pre-employment requirement for ABC Distribution Inc."*).
5. **Enter CTC (Cedula) Number**: Enter your Community Tax Certificate number (e.g., `CTC-2026-987654`). If you do not have one yet, you may obtain one at the Barangay Treasury window before claiming.
6. Click **Submit Clearance Request**.
7. **SAVE YOUR TRACKING CODE**: The system will display an 11-character code:
   ```
   CLR-2026-XXXXXXXX
   ```
8. Take a photo or screenshot of this code.
9. **Next Steps**:
   - Desk staff will review your application.
   - When status updates to `PAYMENT_PENDING`, proceed to the Barangay Treasury cashier counter.
   - Pay the ₱50.00 fee and receive your official receipt (OR).
   - Your certificate will be printed, stamped with the barangay dry seal, and handed to you.

---

### 3.4 Guide 4: Applying for a Free Certificate of Indigency (`/services/request`)

Under Republic Act 11261 (First Time Jobseekers Assistance Act) and barangay welfare ordinances, low-income residents, students, and first-time jobseekers are entitled to **100% Free Indigency Certifications**.

**Step-by-Step Instructions**:
1. Sign in to your portal at `/resident/login`.
2. Click **Request New Document** and select **Certificate of Indigency**.
3. **Verify Fee**: The system confirms the fee is **₱0.00 (FREE)**.
4. **Select Assistance Category**:
   - *First-Time Jobseeker Assistance (R.A. 11261)*
   - *Medical Assistance / Hospital Subsidy*
   - *Public Attorney's Office (PAO) Free Legal Aid*
   - *Educational Scholarship / Tuition Assistance*
   - *DSWD Assistance to Individuals in Crisis Situations (AICS)*
5. In the details box, state your specific situation.
6. Click **Submit Indigency Request**.
7. **Take Note of Your Tracking Code**:
   ```
   IND-2026-XXXXXXXX
   ```
8. **No Cashier Visit Required**: Because this certification is 100% free, once desk staff review and approve your application, its status moves directly to **`READY_FOR_PICKUP`**. You do not need to wait in line at the Treasury counter.

---

### 3.5 Guide 5: Applying for a Barangay Business Clearance (Mandatory In-Person Screening)

Operating a business within Barangay San Gabriel requires a Barangay Business Clearance prior to obtaining a City Mayor's Permit.

**Why In-Person Screening is Legally Required**:
- Under Section 152 of the Local Government Code of 1991 (R.A. 7160), the barangay must verify the physical location, environmental impact, and gross sales of every commercial enterprise.
- **Automated online approval of business permits is strictly prohibited by law.**

**Application & Screening Steps**:
1. Log in to `/resident/login` and select **Barangay Business Clearance**.
2. Input your registered Business Trade Name and complete commercial address.
3. Submit your application to receive a Business Tracking Code (`BUS-2026-XXXXXXXX`).
4. Gather your required physical documents:
   - DTI Business Name Registration (for Sole Proprietorships) or SEC Articles of Incorporation (for Corporations/Partnerships).
   - Commercial Lease Contract (or Real Property Tax declaration if owner).
   - Prior-year gross receipts statement or BIR tax returns.
5. Visit the **Barangay Treasury Window** with your physical documents and tracking code.
6. The Barangay Treasurer will conduct a personal interview, verify your business records, calculate the applicable local revenue tax, issue an Official Receipt, and release your signed Business Clearance.

---

### 3.6 Guide 6: Viewing Your Digital Barangay ID Card (`/resident/id`)

Every verified resident has access to a secure, digital version of their Barangay Resident ID card:

**How to View**:
1. Sign in to `/resident/login`.
2. Click **Digital Barangay ID** in the navigation menu.
3. Your digital credential is displayed in the browser.

**Digital ID Features**:
- Full Legal Name, Photo Placeholder, and Resident Number (`RES-YYYY-XXXX`).
- Unique Card Serial Number (`CARD-YYYY-XXXX`).
- Civil details: Purok residence, birth date, gender, blood type, and emergency contact.
- **High-Contrast Code 128 Barcode**: Scannable by municipal barcode readers at the desk.
- **Vector Offline Verification QR Code**: Can be scanned by any smartphone camera to confirm card authenticity.
- **Anti-Counterfeiting Holographic Glass Styling**: High-fidelity security finish preventing forged screenshots.

**Important Security Notice**:
- Pursuant to municipal anti-fraud circulars, **the Digital Barangay ID is strictly view-only on personal phones**.
- Physical ID cards may only be printed using the official barangay card printing machine at the hall. Mobile print buttons are disabled by design.

---

### 3.7 Guide 7: Filing an Anonymous Incident Blotter Report (`/blotter`)

If you witness a community disturbance, illegal waste dumping, stray dog hazard, or neighborhood dispute and wish to notify the authorities without revealing who you are:

**How Total Anonymity is Protected**:
- **Zero IP Collection**: The server does not record your computer or phone's IP address.
- **Zero Cookies**: The blotter page stores no tracking cookies or advertising identifiers.
- **Field Encryption**: Your report text and exact location are encrypted with AES-256-GCM.
- **Automated Privacy Scrubber**: The software scans your narrative and automatically redacts accidentally typed personal names or contact numbers.
- **Spam Defense**: A 1-second cryptographic challenge (Proof-of-Work) runs silently in your browser to block automated internet bots without human verification puzzles.

**Filing Steps**:
1. Open any browser and go to: `http://localhost:3000/blotter`. **No sign-in is needed.**
2. Select the incident category:
   - *Noise Disturbance / Loud Late-Night Music*
   - *Sanitation / Illegal Garbage Dumping*
   - *Stray Animals / Rabies Hazard*
   - *Public Disturbance / Neighborhood Dispute*
   - *Other Community Concern*
3. Select the **Purok / Zone** where the incident occurred.
4. Enter the date, approximate time, and street landmark.
5. In the **Incident Description** box, describe what you observed clearly.
6. Click **Submit Anonymous Report**.
7. **SAVE YOUR BLOTTER TRACKING CODE**:
   ```
   BLT-XXXX-XX (e.g., BLT-2026-DEMO01)
   ```
8. Use this tracking code to check what actions the barangay tanod patrol has taken.

---

### 3.8 Guide 8: Public Document & Blotter Tracking (`/track`)

You can monitor the status of any document request or blotter report from any computer or smartphone:

**How to Track**:
1. Navigate to: `http://localhost:3000/track`.
2. Enter your 11-character document tracking code (`CLR-2026-DEMO0001`) or blotter code (`BLT-2026-DEMO01`).
3. Click **Track Status**.

**Understanding Status Indicators**:
- `SUBMITTED`: Your application has been received and is waiting in the desk queue.
- `UNDER_REVIEW`: A desk officer is currently reviewing your application.
- `PAYMENT_PENDING`: Clearance approved! Please proceed to the Treasury counter to settle the ₱50 fee.
- `READY_FOR_PICKUP`: Your certificate has been printed and is waiting for you at the release counter.
- `RELEASED`: You have claimed your stamped physical certificate.
- `REJECTED`: Application denied. An explanation note will be displayed on screen.

---

### 3.9 Guide 9: Verifying Certificate Authenticity via Vector QR (`/verify`)

If an employer, bank, university, or government agency requests proof that your printed Barangay Clearance is authentic:

1. Locate the printed vector QR code at the bottom of your official physical certificate.
2. Open the camera app on any smartphone or tablet.
3. Point the camera at the QR code.
4. Tap the displayed link (pointing to `/verify?code=...`).
5. The official verification portal loads, displaying:
   - Certificate Authenticity Badge (VERIFIED AUTHENTIC).
   - Document Serial Number & Issue Date.
   - Masked Applicant Name (`M*** S***`).
   - Signing Authority (Punong Barangay).
   - Digital cryptographic signature match (HMAC-SHA256).

---

### 3.10 Guide 10: Asking AI Kaagapay Civic Concierge (Tagalog, Cebuano, English)

If you are unsure which documents you need or have questions regarding barangay hall schedules, consult **Kaagapay**, your 24/7 offline AI civic assistant:

1. Open `/services/kaagapay` on any kiosk or phone.
2. Select your preferred language: **Tagalog**, **Cebuano**, or **English**.
3. Type your question in natural language:
   - *Tagalog*: "Ano po ang requirements para makakuha ng Barangay Clearance para sa trabaho?"
   - *Cebuano*: "Unsa ang mga papeles nga kinahanglan para sa Certificate of Indigency?"
   - *English*: "What are the operating hours of the Barangay Health Center on Fridays?"
4. Kaagapay provides an instant, easy-to-understand checklist based on official barangay ordinances.

---

## CHAPTER 4: FREQUENTLY ASKED QUESTIONS (FAQ) & ASSISTANCE

### 4.1 Lost Activation Slips, Passwords & Common Inquiries

**Q1: What should I do if I lose my 10-character activation slip before activating?**  
*Answer*: Visit the frontline desk at the barangay hall with your valid photo ID. The desk officer will confirm your identity and issue a new activation slip on the spot.

**Q2: What happens if I forget my resident password?**  
*Answer*: For security reasons and to prevent unauthorized identity theft, password resets are handled in person at the frontline desk. Present your photo ID, and an officer will issue an immediate password reset authorization.

**Q3: Can I apply for a clearance for a family member?**  
*Answer*: Yes, provided you bring an authorization letter signed by the resident, a photocopy of their valid ID, and your own valid ID to the frontline desk.

**Q4: Does the BEST terminal require internet connection on my phone?**  
*Answer*: No! Connect to `Barangay-BEST-Hall` Wi-Fi. The terminal runs entirely on the physical hall server. You do not need prepaid mobile load or mobile data.

---

### 4.2 Emergency Hotlines & Physical Hall Assistance Hours

- **Barangay Hall Address**: City of Santa Rosa, Laguna, Philippines
- **Public Service Hours**: Monday to Friday • 08:00 AM – 05:00 PM (No Noon Break)
- **Barangay Emergency Tanod Hotline**: Local Hall Extension 101
- **Disaster Risk Reduction Office (BDRRMC)**: Local Hall Extension 102
- **Barangay Health Center**: Monday to Saturday • 08:00 AM – 04:00 PM

---

**BARANGAY SAN GABRIEL LOCAL GOVERNMENT UNIT**  
*Serbisyong Tapat, Mabilis, at Maaasahan Para sa Lahat.*
