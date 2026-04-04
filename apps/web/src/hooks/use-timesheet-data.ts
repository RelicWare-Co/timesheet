import { useEffect, useState } from "react";

import {
  COLOMBIAN_HOLIDAYS_2026,
  DEFAULT_RULE_SETS,
} from "@/lib/colombian-rules";
import { formatDateKey } from "@/lib/date";
import { db } from "@/lib/db";
import {
  DEFAULT_LOCALE,
  DEFAULT_PAY_SETTINGS,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_TARGET_HOURS,
} from "@/lib/defaults";
import { getActiveRuleSet } from "@/lib/rules-engine";
import type {
  Holiday,
  LegalRuleSet,
  UserSettings,
  WeeklyTargetHours,
  WorkLog,
  PaySettings,
} from "@/lib/types";

const getDefaultActiveRuleSetId = (now: Date): string =>
  getActiveRuleSet(DEFAULT_RULE_SETS, now)?.id ??
  DEFAULT_RULE_SETS[0]?.id ??
  "";

const mergeWeeklyTargetHours = (
  existing: WeeklyTargetHours | undefined,
  updates: Partial<WeeklyTargetHours> | undefined
): WeeklyTargetHours => ({
  ...DEFAULT_WEEKLY_TARGET_HOURS,
  ...existing,
  ...updates,
});

const mergePaySettings = (
  existing: PaySettings | undefined,
  updates: Partial<PaySettings> | undefined
): PaySettings => ({
  ...DEFAULT_PAY_SETTINGS,
  ...existing,
  ...updates,
});

const buildUserSettings = (
  existing: UserSettings | null,
  updates: Partial<UserSettings>,
  now: Date
): UserSettings => ({
  activeRuleSetId:
    updates.activeRuleSetId ??
    existing?.activeRuleSetId ??
    getDefaultActiveRuleSetId(now),
  createdAt: existing?.createdAt ?? now,
  id: 1,
  locale: updates.locale ?? existing?.locale ?? DEFAULT_LOCALE,
  paySettings: mergePaySettings(existing?.paySettings, updates.paySettings),
  timezone: updates.timezone ?? existing?.timezone ?? DEFAULT_TIMEZONE,
  updatedAt: now,
  weeklyTargetHours: mergeWeeklyTargetHours(
    existing?.weeklyTargetHours,
    updates.weeklyTargetHours
  ),
});

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const existing = await db.userSettings.get(1);
      setSettings(existing ?? null);
      setLoading(false);
    };

    void load();
  }, []);

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const existing = await db.userSettings.get(1);
    const now = new Date();
    const toSave = buildUserSettings(existing ?? null, newSettings, now);

    await db.userSettings.put(toSave);
    setSettings(toSave);

    return toSave;
  };

  return { loading, saveSettings, settings };
};

export const useWorkLogs = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const allLogs = await db.workLogs.orderBy("date").toArray();
      setLogs(allLogs.toReversed());
      setLoading(false);
    };

    void load();
  }, []);

  const saveLog = async (log: WorkLog) => {
    await db.workLogs.put(log);
    setLogs((previousLogs) => {
      const withoutCurrent = previousLogs.filter(
        (entry) => entry.id !== log.id
      );
      return [...withoutCurrent, log].toSorted((a, b) =>
        b.date.localeCompare(a.date)
      );
    });

    return log;
  };

  const deleteLog = async (id: string) => {
    await db.workLogs.delete(id);
    setLogs((previousLogs) => previousLogs.filter((entry) => entry.id !== id));
  };

  const getLogsForDateRange = (start: Date, end: Date) => {
    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);

    return logs.filter((log) => log.date >= startKey && log.date <= endKey);
  };

  return { deleteLog, getLogsForDateRange, loading, logs, saveLog };
};

export const useLegalRuleSets = () => {
  const [ruleSets, setRuleSets] = useState<LegalRuleSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const existing = await db.legalRuleSets.toArray();

      if (existing.length === 0) {
        await db.legalRuleSets.bulkAdd(DEFAULT_RULE_SETS);
        setRuleSets(DEFAULT_RULE_SETS);
      } else {
        setRuleSets(existing);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const saveRuleSet = async (ruleSet: LegalRuleSet) => {
    await db.legalRuleSets.put(ruleSet);
    setRuleSets((previousRuleSets) => {
      const withoutCurrent = previousRuleSets.filter(
        (entry) => entry.id !== ruleSet.id
      );
      return [...withoutCurrent, ruleSet];
    });

    return ruleSet;
  };

  return { loading, ruleSets, saveRuleSet };
};

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const existing = await db.holidays.toArray();

      if (existing.length === 0) {
        const holidaysToAdd: Holiday[] = COLOMBIAN_HOLIDAYS_2026.map(
          (holiday, index) => ({
            countryCode: "CO",
            date: holiday.date,
            id: `col-2026-${index}`,
            isNational: true,
            name: holiday.name,
          })
        );
        await db.holidays.bulkAdd(holidaysToAdd);
        setHolidays(holidaysToAdd);
      } else {
        setHolidays(existing);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const isHoliday = (date: Date): string | null => {
    const dateKey = formatDateKey(date);
    const holiday = holidays.find((entry) => entry.date === dateKey);
    return holiday?.name ?? null;
  };

  return { holidays, isHoliday, loading };
};

export const useWeeklyTargets = () => {
  const { settings, saveSettings } = useUserSettings();

  const targets: WeeklyTargetHours =
    settings?.weeklyTargetHours ?? DEFAULT_WEEKLY_TARGET_HOURS;

  const updateTargets = async (newTargets: Partial<WeeklyTargetHours>) => {
    if (!settings) {
      return;
    }

    await saveSettings({
      weeklyTargetHours: { ...targets, ...newTargets },
    });
  };

  return { targets, updateTargets };
};

export const usePaySettings = () => {
  const { settings, saveSettings } = useUserSettings();

  const paySettings = settings?.paySettings ?? DEFAULT_PAY_SETTINGS;

  const updatePaySettings = async (
    newPaySettings: Partial<typeof paySettings>
  ) => {
    if (!settings) {
      return;
    }

    await saveSettings({
      paySettings: { ...paySettings, ...newPaySettings },
    });
  };

  return { paySettings, updatePaySettings };
};
