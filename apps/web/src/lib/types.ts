export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PayBasis = "monthly" | "biweekly" | "weekly" | "hourly";

export type SalaryDisplayMode = "gross" | "approximate_net" | "both";

export interface WeeklyTargetHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface PaySettings {
  basis: PayBasis;
  amount: number;
  currency: string;
  allowances: number;
  salaryDisplayMode: SalaryDisplayMode;
  netDeductionPct: number;
}

export interface UserSettings {
  id: 1;
  weeklyTargetHours: WeeklyTargetHours;
  paySettings: PaySettings;
  timezone: string;
  locale: string;
  activeRuleSetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSegment {
  startTime: string;
  endTime: string;
}

export interface BreakSegment {
  startTime: string;
  endTime: string;
}

export interface WorkLog {
  id: string;
  date: string;
  segments: WorkSegment[];
  breaks: BreakSegment[];
  note: string;
  dayType: "ordinary" | "sunday" | "holiday";
  ruleSetId: string;
  calculationSnapshot: CalculationSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalRuleSet {
  id: string;
  countryCode: string;
  name: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  daytimeStart: string;
  daytimeEnd: string;
  nighttimeStart: string;
  nighttimeEnd: string;
  ordinaryNightSurchargePct: number;
  daytimeOvertimePct: number;
  nighttimeOvertimePct: number;
  sundayHolidayOrdinaryPct: number;
  sundayHolidayDaytimeOvertimePct: number;
  sundayHolidayNighttimeOvertimePct: number;
  legalWeeklyMaxHours: number;
  overtimeCaps: number | null;
  holidayCalendarSource: string | null;
  flags: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  countryCode: string;
  isNational: boolean;
}

export interface CalculationSnapshot {
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
  estimatedPay: number;
  breakdown: PayBreakdown;
  ruleSetId: string;
  calculatedAt: Date;
}

export interface PayBreakdown {
  baseOrdinaryPay: number;
  nighttimeSurcharge: number;
  overtimeSurcharge: number;
  sundayHolidaySurcharge: number;
  otherAdjustments: number;
  totalEstimatedPay: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  scheduledHours: number;
  workedHours: number;
  overtimeHours: number;
  balanceHours: number;
  estimatedPay: number;
}
