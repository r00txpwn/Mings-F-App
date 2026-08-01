# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Mings-f-app
- **Date:** 2026-08-01
- **Prepared by:** TestSprite AI Team
- **Environment:** Local preview `http://127.0.0.1:4175/spec-ops` → Supabase **sandbox** `glpdpkozvmfzgoewquxi` (not production)
- **Prep:** Additive migration `employee_attendance_marks` applied on sandbox; `admin-api` redeployed; staff preview rebuilt

---

## 2️⃣ Requirement Validation Summary

### Requirement: Staff authentication
- **Description:** Sign in to the staff cockpit with email/password and reach authenticated surfaces.

#### Test TC002 Sign in and reach the staff cockpit home
- **Test Code:** [TC002_Sign_in_and_reach_the_staff_cockpit_home.py](./TC002_Sign_in_and_reach_the_staff_cockpit_home.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/c01c1390-0595-43dd-9d50-c9758af58b39
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Login with sandbox test account succeeded and loaded the staff cockpit (previous run was blocked while sandbox was paused).
---

### Requirement: Cockpit navigation
- **Description:** Move between staff cockpit sections and open executive home.

#### Test TC006 Switch between cockpit sections
- **Test Code:** [TC006_Switch_between_cockpit_sections.py](./TC006_Switch_between_cockpit_sections.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/611cd3d9-3511-49ee-9074-22397800e431
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Section switching via cockpit navigation worked as expected.
---

#### Test TC009 Open the executive home screen from cockpit navigation
- **Test Code:** [TC009_Open_the_executive_home_screen_from_cockpit_navigation.py](./TC009_Open_the_executive_home_screen_from_cockpit_navigation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/16dc95df-1c08-4c25-aa6c-042bde0e40e8
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Executive home opened correctly from nav.
---

### Requirement: Month payroll roster
- **Description:** Manage employees on the month payroll screen (create/edit/list visibility).

#### Test TC003 Create an employee and see them in the payroll list
- **Test Code:** [TC003_Create_an_employee_and_see_them_in_the_payroll_list.py](./TC003_Create_an_employee_and_see_them_in_the_payroll_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/afeccbd5-0f3b-47dc-89bd-8aafa612df69
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** New employee appears in the payroll list after create.
---

#### Test TC005 Edit an employee and keep them visible in payroll
- **Test Code:** [TC005_Edit_an_employee_and_keep_them_visible_in_payroll.py](./TC005_Edit_an_employee_and_keep_them_visible_in_payroll.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/c441ca9f-a277-4f62-a396-86bac11bd8b0
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Employee edit persisted and remained visible for the selected month.
---

#### Test TC007 Move between payroll months
- **Test Code:** [TC007_Move_between_payroll_months.py](./TC007_Move_between_payroll_months.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/58bdef87-f631-47f9-a36b-015b7d37d0a0
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Month navigator previous/next behaved correctly.
---

### Requirement: Attendance marks and payable math
- **Description:** Tap day marks (Work / Absent / Off); only absences reduce payable using calendar-day rate.

#### Test TC004 See payable update when attendance changes
- **Test Code:** [TC004_See_payable_update_when_attendance_changes.py](./TC004_See_payable_update_when_attendance_changes.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/e9945f8b-ba3a-42f8-b71e-0f850a1e2255
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Payable updated when attendance changed; confirms sandbox schema + admin-api path for day marks is working.
---

#### Test TC008 Mark attendance across a single employee row
- **Test Code:** [TC008_Mark_attendance_across_a_single_employee_row.py](./TC008_Mark_attendance_across_a_single_employee_row.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/a096148c-7684-4da0-9a13-25aa0695f94d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Day cycling on a single employee attendance grid succeeded.
---

### Requirement: Salary payments ledger
- **Description:** Record payments (including suggested remaining) and review history by month.

#### Test TC001 Record a salary payment from the suggested remaining amount
- **Test Code:** [TC001_Record_a_salary_payment_from_the_suggested_remaining_amount.py](./TC001_Record_a_salary_payment_from_the_suggested_remaining_amount.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/b8edc1b6-d178-450e-9d31-41d6798572b3
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Payment recording from suggested remaining amount worked end-to-end on sandbox.
---

#### Test TC010 Review salary history by month
- **Test Code:** [TC010_Review_salary_history_by_month.py](./TC010_Review_salary_history_by_month.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/59bf83ae-ef36-4804-a3af-c107cc374325/00df72f3-1aa7-46bb-8267-f32a5212181b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Month-scoped salary history review passed.
---

## 3️⃣ Coverage & Matching Metrics

- **100.00%** of tests passed (10/10)

| Requirement | Total Tests | ✅ Passed | ❌ Failed |
|----|----|----|----|
| Staff authentication | 1 | 1 | 0 |
| Cockpit navigation | 2 | 2 | 0 |
| Month payroll roster | 3 | 3 | 0 |
| Attendance marks and payable math | 2 | 2 | 0 |
| Salary payments ledger | 2 | 2 | 0 |
| **Total** | **10** | **10** | **0** |

---

## 4️⃣ Key Gaps / Risks

- Full `npm run supabase:push` still fails on sandbox due to **remote migration history drift** (remote versions not present locally). Attendance schema was applied via targeted MCP `apply_migration` instead. Before relying on CLI push for this sandbox, repair/sync migration history carefully — do not blindly revert remote versions.
- This run used **sandbox only** (`glpdpkozvmfzgoewquxi`). Production (`dmrvycswdteuhfydchdr`) was not migrated and not tested.
- Production still needs the same additive migration + `admin-api` redeploy before shipping payroll attendance there.
- Earlier blocked TestSprite run (sandbox paused / DNS missing) is obsolete; this report reflects the post-resume successful run.
