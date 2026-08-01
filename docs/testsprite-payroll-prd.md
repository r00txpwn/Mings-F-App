# Ming's OS — Staff Cockpit Product Spec (TestSprite)

## Product
Ming's OS is a restaurant operations platform for Ming's (Baku). This TestSprite run targets the **staff cockpit** local preview.

## Entry
- Base URL: `http://localhost:4175/spec-ops`
- Auth: Supabase email/password staff login (admin or manager)

## Surfaces in scope for this run
1. **Staff & Salaries (Payroll)** — `?screen=staff`
2. Basic cockpit shell navigation after login (home / finance hub)

## Payroll feature requirements
1. Month navigator (previous / next month), not a free date-range filter.
2. Employee roster with:
   - Full name, designation, monthly salary
   - Start date (`hired_at`)
   - Default weekly off weekday (salary includes this day)
3. For the selected month, each employee shows:
   - Payable amount after absences
   - Paid amount
   - Remaining
   - Status chip: Paid / Partial / Unpaid
4. Expand employee → attendance calendar:
   - Tap day cycles: Work → Absent → Off
   - Weekly off does **not** reduce pay
   - Absent deducts **1 day**: `dailyRate = monthlySalary / calendarDaysInMonth`
   - Payable = monthlySalary − (absentDays × dailyRate), floored at 0
5. Record payment can suggest remaining payable for the month.
6. Do not enter the same salaries again under Expenses → Salaries (double-count warning visible).

## Example acceptance
- Employee monthly salary ₼1200, August (31 days), default Sunday off
- Mark one Monday as Absent
- Payable ≈ ₼1161.29 (1200 − 1200/31)
- Sunday Off alone does not change payable

## Out of scope
- Customer order /track storefront
- Kiosk / KDS deep flows
- Production deploy
- Tax estimation (removed)

## Success criteria
- Login succeeds with provided test account
- Payroll screen loads and is usable
- Month navigation works
- Day mark + payable math behave as above when exercised
