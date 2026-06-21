# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-06-21T08:28:27.409Z

| Check | Status |
|-------|--------|
| TypeScript | PASSED |
| ESLint | PASSED |
| Build | PASSED |
| Unit Tests | PASSED |
| E2E | SKIPPED |

## Unit Test Output
```

> vite-react-typescript-starter@0.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv3.2.4 [39m[90m/home/runner/work/Mings-F-App/Mings-F-App[39m

 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns no issues when totals match within epsilon[32m 4[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns mismatch issue when totals differ beyond epsilon[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns no issues when channelTotal is null/undefined[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateNetFormula[2m > [22mreturns no issues for consistent data[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateNetFormula[2m > [22mreturns error when operating profit is inconsistent[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateNetFormula[2m > [22mhandles negative operating profit correctly[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidatePayoutReconciliationTotals[2m > [22mreturns no issues for null/undefined input[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidatePayoutReconciliationTotals[2m > [22mreturns no issues for consistent payout data[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidatePayoutReconciliationTotals[2m > [22mreports all mismatches for inconsistent payout data[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateAnalyticsSnapshot[2m > [22mreturns empty array for fully consistent snapshot[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateAnalyticsSnapshot[2m > [22maggregates issues from all validators[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns correct percentage[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 when denominator is zero[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 for non-finite inputs[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mcomputes all KPIs correctly[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdefaults discounts and refunds to 0 when omitted[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mreturns avgOrderValue of 0 when orderCount is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mhandles negative operating profit (loss scenario)[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalcula
```
