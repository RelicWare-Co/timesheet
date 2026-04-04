import { formatDateKey, isDateKeyWithinRange, parseDateKey } from "@/lib/date";
import type {
  BreakSegment,
  CalculationSnapshot,
  LegalRuleSet,
  PayBreakdown,
  PaySettings,
  WeeklyTargetHours,
  WorkLog,
  WorkSegment,
} from "@/lib/types";

interface DailyCalculationResult {
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  payableMinutes: number;
  ordinaryDayMinutes: number;
  ordinaryNightMinutes: number;
  overtimeDayMinutes: number;
  overtimeNightMinutes: number;
  sundayHolidayOrdinaryMinutes: number;
  sundayHolidayOvertimeMinutes: number;
  totalOvertimeMinutes: number;
}

interface TimeInterval {
  end: number;
  start: number;
}

const parseTimeToMinutes = (timeStr: string): number => {
  const [hoursPart, minutesPart = "0"] = timeStr.split(":");
  return Number(hoursPart) * 60 + Number(minutesPart);
};

const isTimeInRange = (
  timeMinutes: number,
  rangeStart: number,
  rangeEnd: number
): boolean => {
  if (rangeStart <= rangeEnd) {
    return timeMinutes >= rangeStart && timeMinutes < rangeEnd;
  }

  return timeMinutes >= rangeStart || timeMinutes < rangeEnd;
};

const createContinuousInterval = (
  startTime: string,
  endTime: string
): TimeInterval | null => {
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  if (end <= start) {
    end += 1440;
  }

  return { end, start };
};

const mergeContinuousIntervals = (
  intervals: TimeInterval[]
): TimeInterval[] => {
  if (intervals.length === 0) {
    return [];
  }

  const sortedIntervals = [...intervals].toSorted(
    (a, b) => a.start - b.start || a.end - b.end
  );
  const mergedIntervals: TimeInterval[] = [{ ...sortedIntervals[0] }];

  for (const interval of sortedIntervals.slice(1)) {
    const currentInterval = mergedIntervals.at(-1);

    if (!currentInterval) {
      continue;
    }

    if (interval.start <= currentInterval.end) {
      currentInterval.end = Math.max(currentInterval.end, interval.end);
      continue;
    }

    mergedIntervals.push({ ...interval });
  }

  return mergedIntervals;
};

const buildBreakIntervals = (breaks: BreakSegment[]): TimeInterval[] => {
  const intervals: TimeInterval[] = [];

  for (const breakSegment of breaks) {
    const interval = createContinuousInterval(
      breakSegment.startTime,
      breakSegment.endTime
    );

    if (!interval) {
      continue;
    }

    intervals.push(interval, {
      end: interval.end + 1440,
      start: interval.start + 1440,
    });
  }

  return mergeContinuousIntervals(intervals);
};

const isMinuteCoveredByIntervals = (
  minute: number,
  intervals: TimeInterval[]
): boolean => {
  for (const interval of intervals) {
    if (minute < interval.start) {
      break;
    }

    if (minute < interval.end) {
      return true;
    }
  }

  return false;
};

export const calculateDailyHours = (
  _date: Date,
  segments: WorkSegment[],
  breaks: BreakSegment[],
  dayType: "ordinary" | "sunday" | "holiday",
  targetHoursForDay: number,
  ruleSet: LegalRuleSet,
  weeklyWorkedAlreadyMinutes: number
): DailyCalculationResult => {
  const workIntervals = mergeContinuousIntervals(
    segments
      .map((segment) =>
        createContinuousInterval(segment.startTime, segment.endTime)
      )
      .filter((interval): interval is TimeInterval => interval !== null)
  );
  const breakIntervals = buildBreakIntervals(breaks);
  const nighttimeStart = parseTimeToMinutes(ruleSet.nighttimeStart);
  const nighttimeEnd = parseTimeToMinutes(ruleSet.nighttimeEnd);
  const isSundayOrHoliday = dayType === "sunday" || dayType === "holiday";
  const targetMinutesForDay = Math.max(0, Math.round(targetHoursForDay * 60));
  const weeklyMaxMinutes = Math.max(
    0,
    Math.round(ruleSet.legalWeeklyMaxHours * 60)
  );
  const weeklyRemainingCapacity = Math.max(
    0,
    weeklyMaxMinutes - weeklyWorkedAlreadyMinutes
  );

  let ordinaryMinutesRemaining = isSundayOrHoliday
    ? targetMinutesForDay
    : Math.min(targetMinutesForDay, weeklyRemainingCapacity);
  let sundayHolidayOrdinaryMinutesRemaining = isSundayOrHoliday
    ? targetMinutesForDay
    : 0;
  let totalBreakMinutes = 0;
  let totalWorkedMinutes = 0;
  let ordinaryDayMinutes = 0;
  let ordinaryNightMinutes = 0;
  let overtimeDayMinutes = 0;
  let overtimeNightMinutes = 0;
  let sundayHolidayOrdinaryMinutes = 0;
  let sundayHolidayOvertimeMinutes = 0;

  for (const interval of workIntervals) {
    for (let minute = interval.start; minute < interval.end; minute += 1) {
      if (isMinuteCoveredByIntervals(minute, breakIntervals)) {
        totalBreakMinutes += 1;
        continue;
      }

      totalWorkedMinutes += 1;

      if (isSundayOrHoliday) {
        if (sundayHolidayOrdinaryMinutesRemaining > 0) {
          sundayHolidayOrdinaryMinutes += 1;
          sundayHolidayOrdinaryMinutesRemaining -= 1;
        } else {
          sundayHolidayOvertimeMinutes += 1;
        }
        continue;
      }

      const minuteOfDay = minute % 1440;
      const isNighttime = isTimeInRange(
        minuteOfDay,
        nighttimeStart,
        nighttimeEnd
      );

      if (ordinaryMinutesRemaining > 0) {
        if (isNighttime) {
          ordinaryNightMinutes += 1;
        } else {
          ordinaryDayMinutes += 1;
        }
        ordinaryMinutesRemaining -= 1;
      } else if (isNighttime) {
        overtimeNightMinutes += 1;
      } else {
        overtimeDayMinutes += 1;
      }
    }
  }

  const payableMinutes = totalWorkedMinutes;

  return {
    ordinaryDayMinutes,
    ordinaryNightMinutes,
    overtimeDayMinutes,
    overtimeNightMinutes,
    payableMinutes,
    sundayHolidayOrdinaryMinutes,
    sundayHolidayOvertimeMinutes,
    totalBreakMinutes,
    totalOvertimeMinutes:
      overtimeDayMinutes + overtimeNightMinutes + sundayHolidayOvertimeMinutes,
    totalWorkedMinutes,
  };
};

export const calculatePayBreakdown = (
  calculation: DailyCalculationResult,
  paySettings: PaySettings,
  ruleSet: LegalRuleSet
): PayBreakdown => {
  let hourlyRate = 0;

  switch (paySettings.basis) {
    case "hourly": {
      hourlyRate = paySettings.amount;
      break;
    }
    case "weekly": {
      hourlyRate = paySettings.amount / ruleSet.legalWeeklyMaxHours;
      break;
    }
    case "biweekly": {
      hourlyRate = paySettings.amount / (ruleSet.legalWeeklyMaxHours * 2);
      break;
    }
    case "monthly": {
      hourlyRate =
        (paySettings.amount * 12) / (52 * ruleSet.legalWeeklyMaxHours);
      break;
    }
    default: {
      hourlyRate = 0;
    }
  }

  const minuteRate = hourlyRate / 60;

  const baseOrdinaryPay =
    (calculation.ordinaryDayMinutes +
      calculation.ordinaryNightMinutes +
      calculation.sundayHolidayOrdinaryMinutes) *
    minuteRate;

  const nighttimeSurcharge =
    calculation.ordinaryNightMinutes *
    minuteRate *
    (ruleSet.ordinaryNightSurchargePct / 100);

  const overtimeSurcharge =
    calculation.overtimeDayMinutes *
      minuteRate *
      (ruleSet.daytimeOvertimePct / 100) +
    calculation.overtimeNightMinutes *
      minuteRate *
      (ruleSet.nighttimeOvertimePct / 100);

  const sundayHolidaySurcharge =
    calculation.sundayHolidayOrdinaryMinutes *
      minuteRate *
      (ruleSet.sundayHolidayOrdinaryPct / 100) +
    calculation.sundayHolidayOvertimeMinutes *
      minuteRate *
      (ruleSet.sundayHolidayNighttimeOvertimePct / 100);

  return {
    baseOrdinaryPay: Math.round(baseOrdinaryPay * 100) / 100,
    nighttimeSurcharge: Math.round(nighttimeSurcharge * 100) / 100,
    otherAdjustments: paySettings.allowances,
    overtimeSurcharge: Math.round(overtimeSurcharge * 100) / 100,
    sundayHolidaySurcharge: Math.round(sundayHolidaySurcharge * 100) / 100,
    totalEstimatedPay:
      Math.round(
        (baseOrdinaryPay +
          nighttimeSurcharge +
          overtimeSurcharge +
          sundayHolidaySurcharge +
          paySettings.allowances) *
          100
      ) / 100,
  };
};

export const createCalculationSnapshot = (
  calculation: DailyCalculationResult,
  payBreakdown: PayBreakdown,
  ruleSetId: string
): CalculationSnapshot => ({
  breakdown: payBreakdown,
  calculatedAt: new Date(),
  estimatedPay: payBreakdown.totalEstimatedPay,
  ordinaryDayMinutes: calculation.ordinaryDayMinutes,
  ordinaryNightMinutes: calculation.ordinaryNightMinutes,
  overtimeDayMinutes: calculation.overtimeDayMinutes,
  overtimeNightMinutes: calculation.overtimeNightMinutes,
  payableMinutes: calculation.payableMinutes,
  ruleSetId,
  sundayHolidayOrdinaryMinutes: calculation.sundayHolidayOrdinaryMinutes,
  sundayHolidayOvertimeMinutes: calculation.sundayHolidayOvertimeMinutes,
  totalBreakMinutes: calculation.totalBreakMinutes,
  totalOvertimeMinutes: calculation.totalOvertimeMinutes,
  totalWorkedMinutes: calculation.totalWorkedMinutes,
});

export const getTargetHoursForDay = (
  date: Date,
  targets: WeeklyTargetHours
): number => {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  const dayName = dayNames[date.getDay()] as keyof WeeklyTargetHours;
  return targets[dayName] ?? 0;
};

export const getActiveRuleSet = (
  ruleSets: LegalRuleSet[],
  date: Date
): LegalRuleSet | null => {
  const dateStr = formatDateKey(date);
  const applicable = ruleSets.filter((ruleSet) => {
    const from = ruleSet.effectiveFrom <= dateStr;
    const to = ruleSet.effectiveTo === null || ruleSet.effectiveTo >= dateStr;
    return from && to;
  });

  if (applicable.length === 0) {
    return null;
  }

  const sortedRuleSets = [...applicable].toSorted((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom)
  );

  return sortedRuleSets[0] ?? null;
};

export const calculateWeeklySummary = (
  weekStart: Date,
  weekEnd: Date,
  logs: WorkLog[],
  targets: WeeklyTargetHours,
  ruleSet: LegalRuleSet,
  paySettings: PaySettings,
  ruleSets: LegalRuleSet[] = [ruleSet]
): {
  scheduledHours: number;
  workedHours: number;
  overtimeHours: number;
  balanceHours: number;
  estimatedPay: number;
} => {
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(weekEnd);
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  let scheduledHours = 0;

  for (
    let current = new Date(weekStart);
    current.getTime() <= weekEnd.getTime();
  ) {
    const dayName = days[current.getDay()];
    scheduledHours += targets[dayName as keyof WeeklyTargetHours] ?? 0;
    current = new Date(current);
    current.setDate(current.getDate() + 1);
  }

  const availableRuleSets = ruleSets.length > 0 ? ruleSets : [ruleSet];
  const weekLogs = [...logs]
    .filter((log) => isDateKeyWithinRange(log.date, weekStartKey, weekEndKey))
    .toSorted((a, b) => a.date.localeCompare(b.date));

  let workedHours = 0;
  let overtimeHours = 0;
  let estimatedPay = 0;
  let cumulativeWorkedMinutes = 0;

  for (const log of weekLogs) {
    if (log.calculationSnapshot) {
      workedHours += log.calculationSnapshot.totalWorkedMinutes / 60;
      overtimeHours += log.calculationSnapshot.totalOvertimeMinutes / 60;
      estimatedPay += log.calculationSnapshot.estimatedPay;
      cumulativeWorkedMinutes += log.calculationSnapshot.totalWorkedMinutes;
      continue;
    }

    const logDate = parseDateKey(log.date);
    if (Number.isNaN(logDate.getTime())) {
      continue;
    }

    const targetHoursForDay = getTargetHoursForDay(logDate, targets);
    const logRuleSet =
      availableRuleSets.find((candidate) => candidate.id === log.ruleSetId) ??
      getActiveRuleSet(availableRuleSets, logDate) ??
      ruleSet;
    const calculation = calculateDailyHours(
      logDate,
      log.segments,
      log.breaks,
      log.dayType,
      targetHoursForDay,
      logRuleSet,
      cumulativeWorkedMinutes
    );
    const payBreakdown = calculatePayBreakdown(
      calculation,
      paySettings,
      logRuleSet
    );

    workedHours += calculation.totalWorkedMinutes / 60;
    overtimeHours += calculation.totalOvertimeMinutes / 60;
    estimatedPay += payBreakdown.totalEstimatedPay;
    cumulativeWorkedMinutes += calculation.totalWorkedMinutes;
  }

  return {
    balanceHours: Math.round((workedHours - scheduledHours) * 100) / 100,
    estimatedPay: Math.round(estimatedPay * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    scheduledHours: Math.round(scheduledHours * 100) / 100,
    workedHours: Math.round(workedHours * 100) / 100,
  };
};

export const formatMinutesAsHours = (minutes: number): string => {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${hours}:${String(mins).padStart(2, "0")}`;
};

export const formatMinutesAsDecimalHours = (minutes: number): number =>
  Math.round((minutes / 60) * 100) / 100;
