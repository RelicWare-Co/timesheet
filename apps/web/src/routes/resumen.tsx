import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { cn } from "@timesheet/ui/lib/utils";
import {
  addWeeks,
  differenceInCalendarWeeks,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useUserSettings,
  useLegalRuleSets,
  usePaySettings,
  useWorkLogs,
} from "@/hooks/use-timesheet-data";
import { formatDateKey, parseDateKey } from "@/lib/date";
import { clearRecentLogDate, readRecentLogDate } from "@/lib/recent-log";
import {
  calculateDailyHours,
  calculatePayBreakdown,
  calculateWeeklySummary,
  createCalculationSnapshot,
  formatMinutesAsHours,
  getActiveRuleSet,
  getTargetHoursForDay,
} from "@/lib/rules-engine";
import type { CalculationSnapshot, WorkLog } from "@/lib/types";

const getDayTypeLabel = (
  dayType: "ordinary" | "sunday" | "holiday"
): string => {
  if (dayType === "sunday") {
    return "DOM";
  }
  if (dayType === "holiday") {
    return "FES";
  }
  return "ORD";
};

const getDayTypeFullLabel = (
  dayType: "ordinary" | "sunday" | "holiday"
): string => {
  if (dayType === "sunday") {
    return "Domingo";
  }
  if (dayType === "holiday") {
    return "Festivo";
  }
  return "Ordinario";
};

const computeWeekOffsetFromDateKey = (dateKey: string | null): number => {
  if (!dateKey) {
    return 0;
  }

  const parsedDate = parseDateKey(dateKey);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  return differenceInCalendarWeeks(
    startOfWeek(parsedDate, { weekStartsOn: 0 }),
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
};

const SummaryMetric = ({
  label,
  minutes,
}: {
  label: string;
  minutes: number;
}) => (
  <div className="bg-card p-4 md:p-5 rounded-xl">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p
      className={cn(
        "mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums font-heading",
        minutes > 0 ? "text-foreground" : "text-muted-foreground/40"
      )}
    >
      {formatMinutesAsHours(minutes)}
    </p>
  </div>
);

const DailyLogSummaryPanel = ({
  label,
  log,
  snapshot,
}: {
  label: string;
  log: WorkLog;
  snapshot: CalculationSnapshot;
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const summaryDate = parseDateKey(log.date);
  const isValidDate = !Number.isNaN(summaryDate.getTime());
  const summaryDateLabel = isValidDate
    ? format(summaryDate, "EEEE d 'de' MMMM", { locale: es })
    : log.date;
  const totalNightMinutes =
    snapshot.ordinaryNightMinutes + snapshot.overtimeNightMinutes;

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {label}
          </p>
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight capitalize">
              {summaryDateLabel}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              {getDayTypeFullLabel(log.dayType)} ·{" "}
              {formatMinutesAsHours(snapshot.totalWorkedMinutes)} trabajadas
            </p>
          </div>
          {log.note ? (
            <p className="mt-4 p-4 rounded-xl bg-secondary/40 text-sm leading-relaxed text-muted-foreground">
              {log.note}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-primary/10 rounded-xl p-5 border border-primary/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
              Horas extra
            </p>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-heading text-primary">
              {formatMinutesAsHours(snapshot.totalOvertimeMinutes)}
            </p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Horas nocturnas
            </p>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-heading">
              {formatMinutesAsHours(totalNightMinutes)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3 mx-5 md:mx-6 mb-4 rounded-xl overflow-hidden border border-border">
        <SummaryMetric
          label="Total trabajado"
          minutes={snapshot.totalWorkedMinutes}
        />
        <SummaryMetric
          label="Horas extra"
          minutes={snapshot.totalOvertimeMinutes}
        />
        <SummaryMetric label="Descanso" minutes={snapshot.totalBreakMinutes} />
      </div>

      <button
        type="button"
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors border-t border-border"
      >
        {showBreakdown ? "Ocultar desglose" : "Ver desglose detallado"}
      </button>

      {showBreakdown && (
        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-300 mx-5 md:mx-6 mb-4 rounded-xl overflow-hidden border border-border">
          <SummaryMetric
            label="Diurna ordinaria"
            minutes={snapshot.ordinaryDayMinutes}
          />
          <SummaryMetric
            label="Nocturna ordinaria"
            minutes={snapshot.ordinaryNightMinutes}
          />
          <SummaryMetric
            label="Extra diurna"
            minutes={snapshot.overtimeDayMinutes}
          />
          <SummaryMetric
            label="Extra nocturna"
            minutes={snapshot.overtimeNightMinutes}
          />
          <SummaryMetric
            label="Dom/Festiva ordinaria"
            minutes={snapshot.sundayHolidayOrdinaryMinutes}
          />
          <SummaryMetric
            label="Dom/Festiva extra"
            minutes={snapshot.sundayHolidayOvertimeMinutes}
          />
        </div>
      )}
    </section>
  );
};

export default function ResumenPage() {
  const { settings } = useUserSettings();
  const { logs } = useWorkLogs();
  const { ruleSets } = useLegalRuleSets();
  const { paySettings } = usePaySettings();
  const [recentSavedDateKey, setRecentSavedDateKey] = useState<string | null>(
    () => readRecentLogDate()
  );
  const initialWeekOffsetRef = useRef(
    computeWeekOffsetFromDateKey(recentSavedDateKey)
  );
  const [weekOffset, setWeekOffset] = useState(initialWeekOffsetRef.current);

  const currentDate = new Date();
  const weekStart = addWeeks(
    startOfWeek(currentDate, { weekStartsOn: 0 }),
    weekOffset
  );
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(weekEnd);

  const weeklyData = useMemo(() => {
    if (!settings) {
      return null;
    }
    const ruleSet = getActiveRuleSet(ruleSets, weekStart);
    if (!ruleSet) {
      return null;
    }

    const weekLogs = logs.filter(
      (log) => log.date >= weekStartKey && log.date <= weekEndKey
    );

    return calculateWeeklySummary(
      weekStart,
      weekEnd,
      weekLogs,
      settings.weeklyTargetHours,
      ruleSet,
      paySettings,
      ruleSets
    );
  }, [
    settings,
    logs,
    paySettings,
    ruleSets,
    weekEnd,
    weekEndKey,
    weekStart,
    weekStartKey,
  ]);

  const dailyLogs = useMemo(
    () =>
      logs
        .filter((log) => log.date >= weekStartKey && log.date <= weekEndKey)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [logs, weekEndKey, weekStartKey]
  );

  const summaryLog = useMemo(() => {
    if (recentSavedDateKey) {
      return logs.find((log) => log.date === recentSavedDateKey) ?? null;
    }

    return dailyLogs[0] ?? null;
  }, [dailyLogs, logs, recentSavedDateKey]);

  const summarySnapshot = useMemo(() => {
    if (!settings || !summaryLog) {
      return null;
    }

    if (summaryLog.calculationSnapshot) {
      return summaryLog.calculationSnapshot;
    }

    const logDate = parseDateKey(summaryLog.date);
    if (Number.isNaN(logDate.getTime())) {
      return null;
    }

    const logRuleSet =
      ruleSets.find((candidate) => candidate.id === summaryLog.ruleSetId) ??
      getActiveRuleSet(ruleSets, logDate);

    if (!logRuleSet) {
      return null;
    }

    const targetHours = getTargetHoursForDay(
      logDate,
      settings.weeklyTargetHours
    );
    const calculation = calculateDailyHours(
      logDate,
      summaryLog.segments,
      summaryLog.breaks,
      summaryLog.dayType,
      targetHours,
      logRuleSet,
      0
    );
    const payBreakdown = calculatePayBreakdown(
      calculation,
      paySettings,
      logRuleSet
    );

    return createCalculationSnapshot(calculation, payBreakdown, logRuleSet.id);
  }, [paySettings, ruleSets, settings, summaryLog]);

  useEffect(() => {
    clearRecentLogDate();
  }, []);

  useEffect(() => {
    if (
      recentSavedDateKey !== null &&
      weekOffset !== initialWeekOffsetRef.current
    ) {
      setRecentSavedDateKey(null);
    }
  }, [recentSavedDateKey, weekOffset]);

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <h2 className="font-heading text-3xl font-bold mb-3 tracking-tight">
            Bienvenido
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Configura tu perfil para empezar a registrar jornadas y calcular
            automáticamente horas extra, recargos nocturnos y estimaciones de
            salario según la ley laboral colombiana.
          </p>
          <Link to="/configuracion/inicial">
            <Button
              size="lg"
              className="h-14 w-full text-lg font-semibold rounded-xl"
            >
              Comenzar <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 pb-28 md:pb-16">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            Resumen
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            {format(weekStart, "d MMM", { locale: es })} -{" "}
            {format(weekEnd, "d MMM", { locale: es })}
          </p>
        </div>

        <div className="flex items-center bg-card border border-border rounded-xl w-fit shadow-sm">
          <button
            type="button"
            className="p-2.5 hover:bg-secondary transition-colors active:scale-95 rounded-l-xl"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="px-5 h-[44px] font-semibold text-sm border-x border-border hover:bg-secondary transition-colors"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Actual
          </button>
          <button
            type="button"
            className="p-2.5 hover:bg-secondary transition-colors active:scale-95 rounded-r-xl"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {weeklyData && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:shadow-black/5 transition-shadow flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Objetivo
            </span>
            <p className="text-4xl font-bold tracking-tight font-heading mt-2">
              {formatMinutesAsHours(Math.round(weeklyData.scheduledHours * 60))}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:shadow-black/5 transition-shadow flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trabajado
            </span>
            <p className="text-4xl font-bold tracking-tight font-heading mt-2">
              {formatMinutesAsHours(Math.round(weeklyData.workedHours * 60))}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:shadow-black/5 transition-shadow flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Extras
            </span>
            <p
              className={cn(
                "text-4xl font-bold tracking-tight font-heading mt-2",
                weeklyData.overtimeHours > 0
                  ? "text-accent"
                  : "text-muted-foreground/30"
              )}
            >
              {formatMinutesAsHours(Math.round(weeklyData.overtimeHours * 60))}
            </p>
          </div>

          <div className="bg-primary/10 rounded-2xl border border-primary/20 p-5 flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
              Estimado
            </span>
            <p className="text-3xl font-bold tracking-tight font-heading mt-2 text-primary truncate">
              {paySettings.currency === "COP"
                ? `$${weeklyData.estimatedPay.toLocaleString()}`
                : `${paySettings.currency} ${weeklyData.estimatedPay.toFixed(2)}`}
            </p>
          </div>
        </div>
      )}

      {summaryLog && summarySnapshot && (
        <DailyLogSummaryPanel
          label={
            recentSavedDateKey ? "Registro recién guardado" : "Último registro"
          }
          log={summaryLog}
          snapshot={summarySnapshot}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Balance */}
        <div className="lg:col-span-5">
          <h2 className="text-lg font-bold tracking-tight mb-4 font-heading">
            Balance
          </h2>
          {weeklyData && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Progreso semanal
                  </span>
                  <span className="text-2xl font-bold font-heading">
                    {weeklyData.scheduledHours > 0
                      ? Math.round(
                          (weeklyData.workedHours / weeklyData.scheduledHours) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                    style={{
                      width: `${Math.min(100, weeklyData.scheduledHours > 0 ? (weeklyData.workedHours / weeklyData.scheduledHours) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Diferencia
                </span>
                <span
                  className={cn(
                    "font-bold text-3xl tracking-tight font-heading",
                    weeklyData.balanceHours >= 0
                      ? "text-primary"
                      : "text-destructive"
                  )}
                >
                  {weeklyData.balanceHours >= 0 ? "+" : ""}
                  {formatMinutesAsHours(
                    Math.round(weeklyData.balanceHours * 60)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight font-heading">
              Historial
            </h2>
          </div>

          {dailyLogs.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Sin registros esta semana
              </p>
              <Link to="/registrar">
                <Button className="rounded-xl h-12 px-8 font-semibold">
                  Registrar
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dailyLogs.map((log) => (
                <Link
                  key={log.id}
                  to="/registrar"
                  search={{ date: log.date }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md hover:shadow-black/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold tracking-tight w-10 text-center font-heading text-muted-foreground group-hover:text-primary transition-colors">
                      {format(parseDateKey(log.date), "d", { locale: es })}
                    </div>
                    <div>
                      <p className="font-semibold text-lg capitalize">
                        {format(parseDateKey(log.date), "EEE", { locale: es })}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {getDayTypeLabel(log.dayType)} ·{" "}
                        {log.calculationSnapshot
                          ? formatMinutesAsHours(
                              log.calculationSnapshot.totalWorkedMinutes
                            )
                          : "--:--"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold tracking-tight font-heading">
                      {log.calculationSnapshot
                        ? formatMinutesAsHours(
                            log.calculationSnapshot.totalWorkedMinutes
                          )
                        : "--:--"}
                    </p>
                    {log.calculationSnapshot?.totalOvertimeMinutes &&
                    log.calculationSnapshot.totalOvertimeMinutes > 0 ? (
                      <p className="text-[11px] font-semibold text-accent">
                        +
                        {formatMinutesAsHours(
                          log.calculationSnapshot.totalOvertimeMinutes
                        )}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/resumen")({
  component: ResumenPage,
});
