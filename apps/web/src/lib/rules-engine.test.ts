import { describe, it, expect } from "vitest";

import { COLOMBIAN_RULES_2026 } from "./colombian-rules";
import { parseDateKey } from "./date";
import {
  calculateDailyHours,
  calculatePayBreakdown,
  calculateWeeklySummary,
  createCalculationSnapshot,
  formatMinutesAsHours,
  getActiveRuleSet,
  getTargetHoursForDay,
} from "./rules-engine";
import type {
  LegalRuleSet,
  PaySettings,
  WeeklyTargetHours,
  WorkLog,
} from "./types";

const DEFAULT_TARGETS: WeeklyTargetHours = {
  friday: 8,
  monday: 8,
  saturday: 0,
  sunday: 0,
  thursday: 8,
  tuesday: 8,
  wednesday: 8,
};

const DEFAULT_PAY: PaySettings = {
  allowances: 0,
  amount: 1_300_000,
  basis: "monthly",
  currency: "COP",
  netDeductionPct: 0,
  salaryDisplayMode: "gross",
};

describe("calculateDailyHours", () => {
  it("calculates ordinary daytime hours correctly", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "17:00", startTime: "09:00" }],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(480);
    expect(result.totalBreakMinutes).toBe(0);
    expect(result.payableMinutes).toBe(480);
    expect(result.overtimeDayMinutes).toBe(0);
    expect(result.overtimeNightMinutes).toBe(0);
  });

  it("subtracts break time correctly", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "18:00", startTime: "09:00" }],
      [{ endTime: "13:00", startTime: "12:00" }],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(480);
    expect(result.totalBreakMinutes).toBe(60);
  });

  it("calculates overtime when exceeding target hours", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "18:00", startTime: "08:00" }],
      [{ endTime: "13:00", startTime: "12:00" }],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(540);
    expect(result.totalOvertimeMinutes).toBe(60);
  });

  it("handles nighttime work with surcharge minutes", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "06:00", startTime: "22:00" }],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(480);
    expect(result.ordinaryNightMinutes).toBe(480);
  });

  it("handles sunday work with surcharge", () => {
    const result = calculateDailyHours(
      new Date("2026-01-04"),
      [{ endTime: "17:00", startTime: "09:00" }],
      [],
      "sunday",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(480);
    expect(result.sundayHolidayOrdinaryMinutes).toBe(480);
  });

  it("handles sunday overtime", () => {
    const result = calculateDailyHours(
      new Date("2026-01-04"),
      [{ endTime: "19:00", startTime: "09:00" }],
      [],
      "sunday",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(600);
    expect(result.sundayHolidayOrdinaryMinutes).toBe(480);
    expect(result.sundayHolidayOvertimeMinutes).toBe(120);
  });

  it("handles multiple work segments", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [
        { endTime: "12:00", startTime: "08:00" },
        { endTime: "18:00", startTime: "14:00" },
      ],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(480);
  });

  it("handles shifts crossing midnight", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "04:00", startTime: "22:00" }],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(360);
    expect(result.ordinaryNightMinutes).toBe(360);
  });

  it("handles weekly overtime when exceeding weekly max", () => {
    const result = calculateDailyHours(
      new Date("2026-01-09T12:00:00"),
      [{ endTime: "17:00", startTime: "09:00" }],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      47 * 60
    );

    expect(result.totalWorkedMinutes).toBe(480);
    expect(result.totalOvertimeMinutes).toBe(480);
  });

  it("allocates overtime chronologically across day and night hours", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "06:00", startTime: "20:00" }],
      [],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(600);
    expect(result.ordinaryDayMinutes).toBe(120);
    expect(result.ordinaryNightMinutes).toBe(360);
    expect(result.overtimeDayMinutes).toBe(0);
    expect(result.overtimeNightMinutes).toBe(120);
  });

  it("subtracts breaks that occur after midnight", () => {
    const result = calculateDailyHours(
      new Date("2026-01-05"),
      [{ endTime: "06:00", startTime: "22:00" }],
      [{ endTime: "03:00", startTime: "02:00" }],
      "ordinary",
      8,
      COLOMBIAN_RULES_2026,
      0
    );

    expect(result.totalWorkedMinutes).toBe(420);
    expect(result.totalBreakMinutes).toBe(60);
    expect(result.ordinaryDayMinutes).toBe(0);
    expect(result.ordinaryNightMinutes).toBe(420);
    expect(result.overtimeDayMinutes).toBe(0);
    expect(result.overtimeNightMinutes).toBe(0);
  });
});

describe("calculatePayBreakdown", () => {
  it("calculates base pay from monthly salary", () => {
    const calculation = {
      ordinaryDayMinutes: 480,
      ordinaryNightMinutes: 0,
      overtimeDayMinutes: 0,
      overtimeNightMinutes: 0,
      payableMinutes: 480,
      sundayHolidayOrdinaryMinutes: 0,
      sundayHolidayOvertimeMinutes: 0,
      totalBreakMinutes: 0,
      totalOvertimeMinutes: 0,
      totalWorkedMinutes: 480,
    };

    const breakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      COLOMBIAN_RULES_2026
    );

    expect(breakdown.baseOrdinaryPay).toBeGreaterThan(0);
    expect(breakdown.nighttimeSurcharge).toBe(0);
    expect(breakdown.overtimeSurcharge).toBe(0);
  });

  it("calculates nighttime surcharge", () => {
    const calculation = {
      ordinaryDayMinutes: 0,
      ordinaryNightMinutes: 480,
      overtimeDayMinutes: 0,
      overtimeNightMinutes: 0,
      payableMinutes: 480,
      sundayHolidayOrdinaryMinutes: 0,
      sundayHolidayOvertimeMinutes: 0,
      totalBreakMinutes: 0,
      totalOvertimeMinutes: 0,
      totalWorkedMinutes: 480,
    };

    const breakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      COLOMBIAN_RULES_2026
    );

    expect(breakdown.nighttimeSurcharge).toBeGreaterThan(0);
  });

  it("calculates overtime surcharge", () => {
    const calculation = {
      ordinaryDayMinutes: 0,
      ordinaryNightMinutes: 0,
      overtimeDayMinutes: 60,
      overtimeNightMinutes: 0,
      payableMinutes: 60,
      sundayHolidayOrdinaryMinutes: 0,
      sundayHolidayOvertimeMinutes: 0,
      totalBreakMinutes: 0,
      totalOvertimeMinutes: 60,
      totalWorkedMinutes: 60,
    };

    const breakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      COLOMBIAN_RULES_2026
    );

    expect(breakdown.overtimeSurcharge).toBeGreaterThan(0);
  });
});

describe("formatMinutesAsHours", () => {
  it("formats minutes correctly", () => {
    expect(formatMinutesAsHours(0)).toBe("0:00");
    expect(formatMinutesAsHours(60)).toBe("1:00");
    expect(formatMinutesAsHours(90)).toBe("1:30");
    expect(formatMinutesAsHours(480)).toBe("8:00");
    expect(formatMinutesAsHours(545)).toBe("9:05");
  });

  it("handles negative minutes", () => {
    expect(formatMinutesAsHours(-60)).toBe("-1:00");
    expect(formatMinutesAsHours(-90)).toBe("-1:30");
  });
});

describe("getActiveRuleSet", () => {
  const ruleSets: LegalRuleSet[] = [
    {
      ...COLOMBIAN_RULES_2026,
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      id: "col-2025",
      name: "Colombia 2025",
    },
    COLOMBIAN_RULES_2026,
  ];

  it("returns correct rule set for 2025 date", () => {
    const result = getActiveRuleSet(ruleSets, new Date("2025-06-15"));
    expect(result?.id).toBe("col-2025");
  });

  it("returns correct rule set for 2026 date", () => {
    const result = getActiveRuleSet(ruleSets, new Date("2026-06-15"));
    expect(result?.id).toBe("col-2026-v1");
  });

  it("returns null for date before all rules", () => {
    const result = getActiveRuleSet(ruleSets, new Date("2024-01-01"));
    expect(result).toBeNull();
  });
});

describe("getTargetHoursForDay", () => {
  it("returns correct target hours for each day", () => {
    expect(
      getTargetHoursForDay(new Date("2026-01-05T12:00:00"), DEFAULT_TARGETS)
    ).toBe(8);
    expect(
      getTargetHoursForDay(new Date("2026-01-06T12:00:00"), DEFAULT_TARGETS)
    ).toBe(8);
    expect(
      getTargetHoursForDay(new Date("2026-01-04T12:00:00"), DEFAULT_TARGETS)
    ).toBe(0);
  });
});

describe("createCalculationSnapshot", () => {
  it("creates snapshot with correct data", () => {
    const calculation = {
      ordinaryDayMinutes: 400,
      ordinaryNightMinutes: 80,
      overtimeDayMinutes: 0,
      overtimeNightMinutes: 0,
      payableMinutes: 480,
      sundayHolidayOrdinaryMinutes: 0,
      sundayHolidayOvertimeMinutes: 0,
      totalBreakMinutes: 60,
      totalOvertimeMinutes: 0,
      totalWorkedMinutes: 480,
    };

    const payBreakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      COLOMBIAN_RULES_2026
    );

    const snapshot = createCalculationSnapshot(
      calculation,
      payBreakdown,
      "col-2026-v1"
    );

    expect(snapshot.ruleSetId).toBe("col-2026-v1");
    expect(snapshot.totalWorkedMinutes).toBe(480);
    expect(snapshot.breakdown).toEqual(payBreakdown);
    expect(snapshot.calculatedAt).toBeInstanceOf(Date);
  });
});

describe("calculateWeeklySummary", () => {
  it("uses the stored rule set for each log when recalculating", () => {
    const ruleSets: LegalRuleSet[] = [
      {
        ...COLOMBIAN_RULES_2026,
        createdAt: new Date("2026-01-01"),
        daytimeOvertimePct: 25,
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-01-03",
        id: "rule-a",
        name: "Rule A",
        updatedAt: new Date("2026-01-01"),
      },
      {
        ...COLOMBIAN_RULES_2026,
        createdAt: new Date("2026-01-04"),
        daytimeOvertimePct: 100,
        effectiveFrom: "2026-01-04",
        effectiveTo: "2026-12-31",
        id: "rule-b",
        name: "Rule B",
        updatedAt: new Date("2026-01-04"),
      },
    ];

    const log: WorkLog = {
      breaks: [],
      calculationSnapshot: null,
      createdAt: new Date("2026-01-05"),
      date: "2026-01-05",
      dayType: "ordinary",
      id: "log-1",
      note: "",
      ruleSetId: "rule-b",
      segments: [{ endTime: "18:00", startTime: "08:00" }],
      updatedAt: new Date("2026-01-05"),
    };

    const summary = calculateWeeklySummary(
      new Date("2026-01-01"),
      new Date("2026-01-07"),
      [log],
      DEFAULT_TARGETS,
      ruleSets[0],
      DEFAULT_PAY,
      ruleSets
    );

    const calculation = calculateDailyHours(
      new Date("2026-01-05"),
      log.segments,
      log.breaks,
      log.dayType,
      getTargetHoursForDay(new Date("2026-01-05"), DEFAULT_TARGETS),
      ruleSets[1],
      0
    );
    const expectedBreakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      ruleSets[1]
    );
    const legacyBreakdown = calculatePayBreakdown(
      calculation,
      DEFAULT_PAY,
      ruleSets[0]
    );

    expect(summary.estimatedPay).toBe(expectedBreakdown.totalEstimatedPay);
    expect(summary.estimatedPay).not.toBe(legacyBreakdown.totalEstimatedPay);
  });
});

describe("parseDateKey", () => {
  it("rejects invalid date keys", () => {
    expect(Number.isNaN(parseDateKey("2026-02-31").getTime())).toBe(true);
    expect(Number.isNaN(parseDateKey("not-a-date").getTime())).toBe(true);
  });
});
