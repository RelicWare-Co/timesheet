import DexieBase from "dexie";
import type { Table } from "dexie";

import type { Holiday, LegalRuleSet, UserSettings, WorkLog } from "@/lib/types";

class TimesheetDB extends DexieBase {
  userSettings!: Table<UserSettings>;
  workLogs!: Table<WorkLog>;
  legalRuleSets!: Table<LegalRuleSet>;
  holidays!: Table<Holiday>;

  constructor() {
    super("timesheet-db");
    this.version(1).stores({
      holidays: "id, date, countryCode, isNational",
      legalRuleSets: "id, countryCode, effectiveFrom, effectiveTo",
      userSettings: "id, createdAt, updatedAt",
      workLogs: "id, date, dayType, ruleSetId, createdAt, updatedAt",
    });
  }
}

export const db = new TimesheetDB();
