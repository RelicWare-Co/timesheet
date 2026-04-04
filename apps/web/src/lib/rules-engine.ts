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

interface TimeSegmentResult {
  dayMinutes: number;
  nightMinutes: number;
}

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

const splitSegmentByDayNight = (
  startMinutes: number,
  endMinutes: number,
  daytimeStart: number,
  daytimeEnd: number,
  nighttimeStart: number,
  nighttimeEnd: number
): TimeSegmentResult => {
  let dayMinutes = 0;
  let nightMinutes = 0;

  const totalMinutes =
    endMinutes > startMinutes
      ? endMinutes - startMinutes
      : 1440 - startMinutes + endMinutes;

  for (let minuteOffset = 0; minuteOffset < totalMinutes; minuteOffset += 1) {
    const currentMinute = (startMinutes + minuteOffset) % 1440;
    const isDaytime = isTimeInRange(currentMinute, daytimeStart, daytimeEnd);
    const isNighttime = isTimeInRange(
      currentMinute,
      nighttimeStart,
      nighttimeEnd
    );

    if (isNighttime) {
      nightMinutes += 1;
    } else if (isDaytime) {
      dayMinutes += 1;
    }
  }

  return { dayMinutes, nightMinutes };
};

const subtractBreaksFromSegments = (
  segments: WorkSegment[],
  breaks: BreakSegment[]
): WorkSegment[] => {
  const result: WorkSegment[] = [];

  for (const segment of segments) {
    const segStart = parseTimeToMinutes(segment.startTime);
    let segEnd = parseTimeToMinutes(segment.endTime);

    if (segEnd <= segStart) {
      segEnd += 1440;
    }

    const breakIntervals: [number, number][] = breaks.map((breakSegment) => {
      const breakStart = parseTimeToMinutes(breakSegment.startTime);
      let breakEnd = parseTimeToMinutes(breakSegment.endTime);

      if (breakEnd <= breakStart) {
        breakEnd += 1440;
      }

      return [breakStart, breakEnd];
    });

    breakIntervals.sort((a, b) => a[0] - b[0]);

    let currentStart = segStart;
    const adjustedSegments: [number, number][] = [];

    for (const [breakStart, breakEnd] of breakIntervals) {
      if (breakEnd <= currentStart) {
        continue;
      }

      if (breakStart >= segEnd) {
        break;
      }

      if (breakStart > currentStart) {
        adjustedSegments.push([currentStart, Math.min(breakStart, segEnd)]);
      }

      currentStart = Math.max(currentStart, breakEnd);
    }

    if (currentStart < segEnd) {
      adjustedSegments.push([currentStart, segEnd]);
    }

    if (adjustedSegments.length === 0 && segEnd - segStart > 0) {
      adjustedSegments.push([segStart, segEnd]);
    }

    for (const [startMinutes, endMinutes] of adjustedSegments) {
      if (endMinutes > startMinutes) {
        const startStr = `${Math.floor(startMinutes / 60) % 24}:${String(startMinutes % 60).padStart(2, "0")}`;
        const endStr = `${Math.floor(endMinutes / 60) % 24}:${String(endMinutes % 60).padStart(2, "0")}`;
        result.push({ endTime: endStr, startTime: startStr });
      }
    }
  }

  return result;
};

const calculateMinutesInSegments = (
  segments: WorkSegment[],
  daytimeStart: number,
  daytimeEnd: number,
  nighttimeStart: number,
  nighttimeEnd: number
): TimeSegmentResult => {
  let totalDay = 0;
  let totalNight = 0;

  for (const segment of segments) {
    const start = parseTimeToMinutes(segment.startTime);
    const end = parseTimeToMinutes(segment.endTime);

    if (end > start) {
      const result = splitSegmentByDayNight(
        start,
        end,
        daytimeStart,
        daytimeEnd,
        nighttimeStart,
        nighttimeEnd
      );
      totalDay += result.dayMinutes;
      totalNight += result.nightMinutes;
      continue;
    }

    const firstPart = splitSegmentByDayNight(
      start,
      1440,
      daytimeStart,
      daytimeEnd,
      nighttimeStart,
      nighttimeEnd
    );
    const secondPart = splitSegmentByDayNight(
      0,
      end,
      daytimeStart,
      daytimeEnd,
      nighttimeStart,
      nighttimeEnd
    );

    totalDay += firstPart.dayMinutes + secondPart.dayMinutes;
    totalNight += firstPart.nightMinutes + secondPart.nightMinutes;
  }

  return { dayMinutes: totalDay, nightMinutes: totalNight };
};

export const calculateDailyHours = (
  _date: Date,
  segments: WorkSegment[],
  breaks: BreakSegment[],
  dayType: "ordinary" | "sunday" | "holiday",
  targetHoursForDay: number,
  ruleSet: LegalRuleSet,
  weeklyOvertimeAlreadyWorked: number
): DailyCalculationResult => {
  let totalBreakMinutes = 0;

  for (const breakSegment of breaks) {
    const breakStart = parseTimeToMinutes(breakSegment.startTime);
    let breakEnd = parseTimeToMinutes(breakSegment.endTime);

    if (breakEnd <= breakStart) {
      breakEnd += 1440;
    }

    totalBreakMinutes += breakEnd - breakStart;
  }

  const adjustedSegments = subtractBreaksFromSegments(segments, breaks);
  const daytimeStart = parseTimeToMinutes(ruleSet.daytimeStart);
  const daytimeEnd = parseTimeToMinutes(ruleSet.daytimeEnd);
  const nighttimeStart = parseTimeToMinutes(ruleSet.nighttimeStart);
  const nighttimeEnd = parseTimeToMinutes(ruleSet.nighttimeEnd);

  const { dayMinutes, nightMinutes } = calculateMinutesInSegments(
    adjustedSegments,
    daytimeStart,
    daytimeEnd,
    nighttimeStart,
    nighttimeEnd
  );

  const totalWorkedMinutes = dayMinutes + nightMinutes;
  const payableMinutes = totalWorkedMinutes;
  const targetMinutesForDay = targetHoursForDay * 60;

  let ordinaryDayMinutes = 0;
  let ordinaryNightMinutes = 0;
  let overtimeDayMinutes = 0;
  let overtimeNightMinutes = 0;
  let sundayHolidayOrdinaryMinutes = 0;
  let sundayHolidayOvertimeMinutes = 0;

  if (dayType === "sunday" || dayType === "holiday") {
    const sundayOrdinaryLimit = targetMinutesForDay;
    if (payableMinutes <= sundayOrdinaryLimit) {
      sundayHolidayOrdinaryMinutes = payableMinutes;
    } else {
      sundayHolidayOrdinaryMinutes = sundayOrdinaryLimit;
      sundayHolidayOvertimeMinutes = payableMinutes - sundayOrdinaryLimit;
    }
  } else {
    const weeklyMaxMinutes = ruleSet.legalWeeklyMaxHours * 60;
    const remainingWeeklyCapacity = Math.max(
      0,
      weeklyMaxMinutes - weeklyOvertimeAlreadyWorked
    );

    let ordinaryMinutes = Math.min(payableMinutes, targetMinutesForDay);
    let overtimeMinutes = Math.max(0, payableMinutes - targetMinutesForDay);

    if (weeklyOvertimeAlreadyWorked >= weeklyMaxMinutes) {
      ordinaryMinutes = 0;
      overtimeMinutes = payableMinutes;
    } else if (
      weeklyOvertimeAlreadyWorked + payableMinutes >
      weeklyMaxMinutes
    ) {
      const availableOrdinary = remainingWeeklyCapacity;
      ordinaryMinutes = Math.min(ordinaryMinutes, availableOrdinary);
      overtimeMinutes = payableMinutes - ordinaryMinutes;
    }

    if (overtimeMinutes > 0 && payableMinutes > 0) {
      const overtimeRatio = overtimeMinutes / payableMinutes;
      ordinaryDayMinutes = Math.round(dayMinutes * (1 - overtimeRatio));
      ordinaryNightMinutes = Math.round(nightMinutes * (1 - overtimeRatio));
      overtimeDayMinutes = Math.round(dayMinutes * overtimeRatio);
      overtimeNightMinutes = Math.round(nightMinutes * overtimeRatio);
    } else {
      ordinaryDayMinutes = dayMinutes;
      ordinaryNightMinutes = nightMinutes;
    }
  }

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
  paySettings: PaySettings
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
    const calculation = calculateDailyHours(
      logDate,
      log.segments,
      log.breaks,
      log.dayType,
      targetHoursForDay,
      ruleSet,
      cumulativeWorkedMinutes
    );
    const payBreakdown = calculatePayBreakdown(
      calculation,
      paySettings,
      ruleSet
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
