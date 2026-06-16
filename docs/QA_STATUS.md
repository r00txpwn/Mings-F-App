# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-06-16T09:24:23.211Z

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

 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns correct percentage[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 when denominator is zero[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 for non-finite inputs[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mcomputes all KPIs correctly[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdefaults discounts and refunds to 0 when omitted[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mreturns avgOrderValue of 0 when orderCount is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mhandles negative operating profit (loss scenario)[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects up direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects down direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects flat direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mreturns null pctChange when previous is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mgroups records by UTC date and sums amounts[32m 21[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mreturns sorted ascending result[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mskips records with null/undefined date or amount[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mreturns empty array for empty input[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns no issues when totals match within epsilon[32m 3[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns mismatch issue when totals differ beyond epsilon[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateRevenueVsChannels[2m > [22mreturns no issues when channelTotal is null/undefined[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/validation.test.ts[2m > [22mvalidateNetFormula[2m > [22mreturns no issues for consistent data[32m 0[2mms[22m[39m
 [32m✓[39m
```
