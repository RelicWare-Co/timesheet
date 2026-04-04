import type { PaySettings, WeeklyTargetHours } from "@/lib/types";

export const DEFAULT_WEEKLY_TARGET_HOURS: WeeklyTargetHours = {
  friday: 8,
  monday: 8,
  saturday: 0,
  sunday: 0,
  thursday: 8,
  tuesday: 8,
  wednesday: 8,
};

export const DEFAULT_PAY_SETTINGS: PaySettings = {
  allowances: 0,
  amount: 0,
  basis: "monthly",
  currency: "COP",
  netDeductionPct: 0,
  salaryDisplayMode: "gross",
};

export const DEFAULT_LOCALE = "es-CO";

export const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Bogota";
