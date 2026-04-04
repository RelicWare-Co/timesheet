import type { LegalRuleSet } from "@/lib/types";

export const COLOMBIAN_RULES_2026: LegalRuleSet = {
  countryCode: "CO",
  createdAt: new Date("2026-01-01"),
  daytimeEnd: "22:00",
  daytimeOvertimePct: 25,
  daytimeStart: "06:00",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  flags: {
    isNational: true,
  },
  holidayCalendarSource: "colombia-national",
  id: "col-2026-v1",
  legalWeeklyMaxHours: 47,
  name: "Colombia 2026",
  nighttimeEnd: "06:00",
  nighttimeOvertimePct: 75,
  nighttimeStart: "22:00",
  ordinaryNightSurchargePct: 35,
  overtimeCaps: null,
  sundayHolidayDaytimeOvertimePct: 160,
  sundayHolidayNighttimeOvertimePct: 250,
  sundayHolidayOrdinaryPct: 75,
  updatedAt: new Date("2026-01-01"),
};

export const COLOMBIAN_RULES_2025: LegalRuleSet = {
  countryCode: "CO",
  createdAt: new Date("2025-01-01"),
  daytimeEnd: "22:00",
  daytimeOvertimePct: 25,
  daytimeStart: "06:00",
  effectiveFrom: "2025-01-01",
  effectiveTo: "2025-12-31",
  flags: {
    isNational: true,
  },
  holidayCalendarSource: "colombia-national",
  id: "col-2025-v1",
  legalWeeklyMaxHours: 47,
  name: "Colombia 2025",
  nighttimeEnd: "06:00",
  nighttimeOvertimePct: 75,
  nighttimeStart: "22:00",
  ordinaryNightSurchargePct: 35,
  overtimeCaps: null,
  sundayHolidayDaytimeOvertimePct: 160,
  sundayHolidayNighttimeOvertimePct: 250,
  sundayHolidayOrdinaryPct: 75,
  updatedAt: new Date("2025-01-01"),
};

export const DEFAULT_RULE_SETS: LegalRuleSet[] = [
  COLOMBIAN_RULES_2025,
  COLOMBIAN_RULES_2026,
];

export const COLOMBIAN_HOLIDAYS_2026: { date: string; name: string }[] = [
  { date: "2026-01-01", name: "Año Nuevo" },
  { date: "2026-01-12", name: "Día de Reyes" },
  { date: "2026-03-23", name: "San José" },
  { date: "2026-04-02", name: "Jueves Santo" },
  { date: "2026-04-03", name: "Viernes Santo" },
  { date: "2026-05-01", name: "Día del Trabajo" },
  { date: "2026-05-18", name: "Ascensión del Señor" },
  { date: "2026-06-08", name: "Corpus Christi" },
  { date: "2026-06-29", name: "Sagrado Corazón" },
  { date: "2026-06-30", name: "San Pedro y San Pablo" },
  { date: "2026-07-20", name: "Día de la Independencia" },
  { date: "2026-08-07", name: "Batalla de Boyacá" },
  { date: "2026-08-17", name: "La Asunción" },
  { date: "2026-10-12", name: "Día de la Raza" },
  { date: "2026-11-02", name: "Todos los Santos" },
  { date: "2026-11-16", name: "Independencia de Cartagena" },
  { date: "2026-12-08", name: "Día de las Velitas" },
  { date: "2026-12-25", name: "Navidad" },
];
