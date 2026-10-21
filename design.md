# InterestMate — Product & UI Design Specification

## 1. Product Overview

**Product name:** InterestMate (working name)  
**Product type:** Responsive web application / installable PWA  
**Primary purpose:** Calculate loan interest consistently, track loans and repayments, and store promise bond documents linked to each loan.

### Product principles
- **Accuracy first:** Every amount must be explainable and reproducible.
- **Explicit terms:** Never infer an interest rate period, repayment allocation, or date-counting convention.
- **Document continuity:** Keep promise bonds and related documents attached to the relevant loan throughout its lifecycle.
- **Safe closure:** Closing a loan must stop future accrual without falsely marking unpaid amounts as settled.
- **Auditability:** Preserve a traceable record of loan terms, payments, corrections, and status changes.
- **Simple workflow:** A user should be able to create a loan, attach a document, start it, record payments, and close it without navigating confusing screens.

## 2. Target Users

- Individuals tracking money they lend or borrow.
- People managing several private loans and repayments.
- Small operators who need basic loan records and attached documents.

The product is a recordkeeping and calculation tool. It must not claim that an uploaded or generated promise bond is legally valid or enforceable.

## 3. MVP Scope

### Must-have
1. Interest calculator.
2. Loan creation and loan lifecycle controls.
3. Start Loan and Close Loan workflows.
4. Repayment recording and history.
5. Promise bond upload and loan-document linking.
6. Loan detail page with a transparent calculation breakdown.
7. Dashboard and search/filtering.
8. Persistent storage, authentication, and private document access.
9. Audit trail for important actions.
10. Automated tests for calculation rules and lifecycle transitions.

### Later enhancements
- Generate configurable promise-bond document drafts.
- OCR-assisted extraction of bond details with user review.
- Due-date reminders.
- PDF/CSV reports.
- Multi-device synchronization and enhanced analytics.

Do not add AI to the calculation engine. Financial calculations must be deterministic, tested, and explainable.

## 4. Information Architecture

Primary navigation:
- **Dashboard**
- **Calculator**
- **Loans**
- **Promise Bonds** (documents view; documents remain linked to loans)
- **Transactions**
- **Reports**
- **Settings**

### Dashboard
Show:
- Active loans
- Total outstanding principal
- Accrued interest
- Payments received in the selected period
- Loans nearing their due date
- Overdue loans
- Recent activity

Each metric must clearly define what it includes. Do not label accrued interest as “earned” or “received” unless the accounting definition supports it.

### Calculator
Allow a one-off calculation without requiring a loan record. Provide an option to save the result as a draft loan.

### Loans
List loans with:
- Loan reference
- Borrower/lender or counterparty
- Principal
- Rate and rate period
- Start date
- Current outstanding amount
- Due date
- Status
- Promise bond/document indicator

Include search, status filters, date filters, and sorting.

### Loan details
Sections:
1. Overview
2. Calculation breakdown
3. Repayment history
4. Promise bonds and supporting documents
5. Activity/audit history

Prominent actions depend on loan status. Keep destructive or financially consequential actions behind confirmation dialogs.

## 5. Core Loan Lifecycle

### Statuses
- **Draft:** Loan details are being prepared; interest has not started.
- **Active:** Loan has started and accrual follows the agreed calculation terms.
- **Settlement Pending:** User is reviewing or arranging the final settlement.
- **Closed — Settled:** All amounts due under the recorded settlement have been paid and verified.
- **Closed — Outstanding:** Loan is administratively closed but a balance remains due.

Do not use a single ambiguous “Closed” state to imply repayment.

### Start Loan
The **Start Loan** action is available only for Draft loans.

Before starting, show a review screen containing:
- Principal
- Interest rate and period
- Calculation method
- Day-count / monthly-period convention
- Accrual start date
- Repayment allocation rule
- Any compounding frequency
- Due date, if applicable
- Linked promise bond status

Require confirmation. On confirmation:
- Record the effective start date.
- Freeze a version of the agreed terms.
- Create an audit event with timestamp and user.
- Change status to Active.
- Enable accrual based on those terms.

If the start date is backdated, explicitly show that and require authorization/confirmation. Do not silently calculate from an earlier date.

### Record Payment
For each payment, capture:
- Payment date
- Amount
- Currency
- Payment reference / receipt (optional)
- Notes (optional)
- Allocation method

Supported allocation policies should be explicit, such as:
- Interest first, remainder to principal
- Principal first
- Custom allocation

Validate that the allocations add up to the payment amount and prevent unintended negative balances. Preserve each payment as an immutable transaction; corrections should be recorded as reversals/adjustments with reasons, not by silently deleting history.

### Close Loan
The **Close Loan** action is available for Active loans and leads to a settlement review, not an immediate status change.

Settlement review must show:
- Closing/effective date
- Principal outstanding
- Accrued unpaid interest
- Fees/adjustments, if supported
- Payments and credits
- Total settlement amount
- Calculation convention and detailed breakdown
- Whether the proposed settlement fully settles the loan

Actions:
- **Confirm Settlement & Close** — only when the settlement has been paid/verified and balance is zero under the chosen rules.
- **Close With Outstanding Balance** — separate, explicitly labelled administrative closure, requires reason and confirmation.
- **Cancel** — returns to the active loan without changes.

On closure:
- Record the closing date and closure type.
- Freeze a final calculation snapshot and downloadable statement.
- Preserve all loan terms, payments, and documents.
- Stop new interest accrual after the effective closing date.
- Do not delete or overwrite the promise bond.
- Require an audited correction/reopen workflow for mistakes.

### Reopening
Optional for MVP, but if implemented, require elevated permission, a reason, and an audit event. Reopening must explicitly define whether and how interest applies to the period in question; never silently accrue interest over a closed period.

## 6. Interest Calculation Requirements

### Inputs
- Principal amount
- Currency (MVP: INR)
- Rate value
- Rate period: daily, monthly, or annual
- Interest method: simple or compound
- Start date and calculation/end date
- Monthly-period or day-count convention
- Compounding frequency (when applicable)
- Repayment events and allocation policy
- Rounding policy

### Accuracy rules
- Use decimal arithmetic suitable for money (e.g. Python `Decimal` in the backend), never binary floating-point for financial totals.
- Store monetary values and rates with documented precision.
- Keep calculation logic in one tested backend/domain module; the frontend displays returned results and does not independently determine the authoritative balance.
- Make the convention visible on every result.
- Define whether dates are inclusive or exclusive and test boundary cases.
- Handle leap years, different month lengths, month-end starts, partial months, zero interest, and same-day closure.
- Do not assume every month has 30 days unless the selected convention explicitly says so.
- Do not silently convert monthly rates to annual rates or vice versa.
- Keep principal, accrued interest, paid interest, and outstanding balance as separate values.
- Define rounding at the agreed calculation stage; avoid repeated rounding that compounds errors.
- Use idempotent payment recording so retries cannot duplicate transactions.
- Return a calculation breakdown that can be audited and reproduced.

### Calculation models
For simple interest, the chosen convention must define how elapsed time is measured. A common formula for a full period is:

`Interest = Principal × Rate × Number of Periods`

For daily simple interest, the denominator/day-count basis must be explicit, for example actual days over 365 or 366, or a configured 360-day basis. Do not mix conventions.

For compound interest, define compounding frequency and treatment of partial periods before calculation. For loans with repayments, calculate each interval using the applicable outstanding principal and transaction sequence.

### Required tests
- Zero principal and zero rate
- Monthly vs annual rate interpretation
- Exact full-period dates
- Partial period dates
- Month-end dates (e.g. 31 January)
- Leap day / leap year
- Same-day start and close
- Payment before/after interest posting date
- Partial payment reducing principal
- Interest-only payment
- Overpayment and settlement
- Closing with an outstanding balance
- Duplicate payment submission
- Repeated calculation produces identical result

Never promise “perfect” calculations without specifying the rules. Accuracy depends on matching the contract's terms and the selected calculation convention.

## 7. Promise Bond & Document Management

### Upload
Support PDF, JPEG, and PNG. Enforce size limits and validate file content/type server-side. Consider malware scanning for production deployments.

### Metadata
- Document title/type
- Linked loan
- Document/reference number (optional)
- Parties named in the document (optional)
- Principal amount stated in document (optional)
- Execution date (optional)
- Maturity/repayment date (optional)
- Witness details (optional)
- Notes
- Upload timestamp and uploader
- Verification status: Unreviewed / Reviewed / Mismatch flagged

### UX
- Upload from the loan detail page.
- Show upload progress, success, and actionable errors.
- Preview PDFs/images in a secure viewer.
- Download only after authorization checks.
- Allow multiple documents per loan.
- Flag discrepancies between document metadata and loan terms for human review.
- Preserve document version history when a replacement or updated document is uploaded.
- Do not make document links public by default.
- Do not use OCR results as verified facts until the user confirms them.

### Document generation (future)
Generated promise-bond drafts must use a configurable template, clearly identify blank/required fields, and be reviewed for applicable legal requirements. Never represent a generated document as automatically legally valid.

## 8. Visual Design System

### Design direction
Professional, calm, trustworthy, finance-oriented. Favor clear typography, strong alignment, ample whitespace, restrained color, and readable tables. Avoid excessive gradients, decorative charts, and clutter.

### Suggested tokens
- **App background:** `#F7F8FA`
- **Surface:** `#FFFFFF`
- **Primary text:** `#17202A`
- **Secondary text:** `#667085`
- **Border:** `#E4E7EC`
- **Primary action:** `#2457D6`
- **Success / Active:** `#16845B`
- **Warning / Pending:** `#B7791F`
- **Danger / Closure warning:** `#C0392B`
- **Subtle success background:** `#EAF7F0`
- **Subtle warning background:** `#FFF5E5`
- **Subtle danger background:** `#FDEDEC`

Use color alongside text/icons; never rely on color alone to convey loan status.

### Typography
Use Inter or a system sans-serif stack. Establish clear hierarchy:
- Page title: 24–30 px
- Section heading: 18–20 px
- Body: 14–16 px
- Helper text: 12–14 px
- Amounts: tabular numerals where available

### Layout
- Desktop: persistent left navigation, top header, responsive content area.
- Mobile: compact header and collapsible navigation.
- Forms: labels above inputs, explicit units, helpful validation.
- Tables: aligned numeric columns, sticky header only where helpful, responsive card/list fallback on narrow screens.
- Currency: format INR using `₹` and Indian digit grouping.
- Dates: display unambiguously, e.g. `21 Oct 2026`; retain ISO dates internally.

### Components
- Summary cards
- Status badges
- Loan table/list
- Currency input
- Rate input with period selector
- Date picker
- Calculation breakdown panel
- Payment timeline
- Document upload/dropzone
- Document preview
- Confirmation modal
- Toast/inline validation messages
- Empty states and loading skeletons

### Button hierarchy
- Primary: Create Loan, Start Loan, Record Payment
- Secondary: View Bond, Download Statement, Edit Draft
- Destructive/financially consequential: Close Loan, Reverse Payment
- The Close Loan button must open the settlement review. It must never close a loan immediately on the first click.

## 9. Key Screens and Interaction Details

### A. Dashboard
Top row: active loans, outstanding principal, accrued interest, upcoming repayments.
Below: recent loans, upcoming/overdue list, recent transactions.

### B. Calculator
Inputs in this order:
1. Principal
2. Rate and rate period
3. Interest method
4. Start date
5. End/calculation date
6. Day-count or monthly-period convention
7. Compounding frequency (only when compound interest is selected)

Result panel:
- Principal
- Interest
- Total before payments
- Payments/adjustments, if any
- Outstanding amount
- Full calculation breakdown
- Save as draft loan

### C. Create Loan
Collect counterparty and financial terms. Keep the loan in Draft until Start Loan is confirmed. Allow bond upload now or later.

### D. Active Loan
Show current balance, start date, terms, linked documents, and transaction timeline. Actions: Record Payment, View Bond, Download Statement, Close Loan.

### E. Settlement Review
Show a clear line-by-line final calculation. Require the user to confirm the effective closing date and settlement status. Distinguish “settled” from “closed with outstanding balance”.

### F. Promise Bonds
List documents with linked loan reference, upload date, type, and verification status. Provide search/filtering and secure preview.

## 10. Data & Security Requirements

Core records:
- User
- Loan
- LoanTermsVersion
- PaymentTransaction
- PaymentAllocation
- LoanCalculationSnapshot
- Document
- DocumentVersion
- AuditEvent

Security:
- Authenticate users before showing private financial records.
- Enforce authorization on every backend read/write and document download.
- Store uploaded files in private storage.
- Use signed, short-lived download links where applicable.
- Encrypt traffic and protect secrets.
- Validate input on both client and server.
- Keep backups and test restoration.
- Avoid logging sensitive document contents or full personal identifiers.
- Provide a clear retention/export/deletion policy.
- Record who performed important actions and when.

## 11. Accessibility & Responsive Behavior

- Meet WCAG AA contrast targets where practical.
- All actions must be keyboard accessible and have visible focus.
- Use explicit labels and understandable validation messages.
- Confirmation dialogs must be accessible and focus-managed.
- At narrow widths, tables should become readable cards or use deliberate horizontal scrolling.
- Never make a critical action available only on hover.
- Support browser zoom and reduced motion.

## 12. Acceptance Criteria

The MVP is ready for initial release when:
1. A user can create a draft loan and attach a promise bond.
2. A user can review terms and explicitly start the loan.
3. The calculation result identifies the exact rate period and date convention.
4. Repeated calculations with identical inputs produce identical outputs.
5. A user can record payments and see their allocation and effect on balances.
6. A user can review the final settlement before closing.
7. The system never marks an unpaid loan as settled.
8. A closed loan has a final calculation snapshot and no further automatic accrual.
9. A closed loan's documents and transaction history remain accessible to authorized users.
10. Important actions are auditable.
11. Private documents cannot be accessed by another unauthorized user.
12. Automated tests cover the calculation and lifecycle edge cases listed above.

## 13. Recommended Build Order

1. Specify calculation conventions and implement tested calculation functions.
2. Create the database model for loans, terms versions, transactions, documents, and audit events.
3. Build the calculator UI and transparent result breakdown.
4. Build draft loan creation and promise bond upload.
5. Implement Start Loan and the immutable terms snapshot.
6. Implement payment recording and allocation.
7. Implement settlement review and Close Loan.
8. Build dashboard, filters, and reports.
9. Add authentication, private storage, audit review, and production hardening.
10. Run calculation, security, accessibility, and lifecycle tests before launch.
