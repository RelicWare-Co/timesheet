import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { cn } from "@timesheet/ui/lib/utils";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import {
  useUserSettings,
  useWorkLogs,
  useLegalRuleSets,
  usePaySettings,
} from "@/hooks/use-timesheet-data";
import { formatDateKey, parseDateKey } from "@/lib/date";
import {
  calculateWeeklySummary,
  formatMinutesAsHours,
  getActiveRuleSet,
} from "@/lib/rules-engine";

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

export default function ResumenPage() {
  const { settings } = useUserSettings();
  const { logs } = useWorkLogs();
  const { ruleSets } = useLegalRuleSets();
  const { paySettings } = usePaySettings();
  const [weekOffset, setWeekOffset] = useState(0);

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
      paySettings
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

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">
          Bienvenido
        </h2>
        <Link to="/configuracion/inicial">
          <Button
            size="lg"
            className="h-16 w-full text-xl font-bold uppercase tracking-widest rounded-none"
          >
            Comenzar <ArrowRight className="ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 pb-32">
      <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
            Resumen.
          </h1>
          <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground">
            {format(weekStart, "d MMM", { locale: es })} -{" "}
            {format(weekEnd, "d MMM", { locale: es })}
          </p>
        </div>

        <div className="flex items-center border border-foreground/10 bg-background w-fit">
          <button
            type="button"
            className="p-3 hover:bg-foreground hover:text-background transition-colors active:scale-95"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            className="px-6 h-[50px] font-black uppercase tracking-widest text-sm border-x border-foreground/10 hover:bg-foreground hover:text-background transition-colors"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Actual
          </button>
          <button
            type="button"
            className="p-3 hover:bg-foreground hover:text-background transition-colors active:scale-95"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>

      {weeklyData && (
        <div className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="bg-background p-6 hover:bg-secondary/20 transition-colors flex flex-col justify-between min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Objetivo
            </span>
            <p className="text-5xl font-black tracking-tighter">
              {formatMinutesAsHours(Math.round(weeklyData.scheduledHours * 60))}
            </p>
          </div>

          <div className="bg-background p-6 hover:bg-secondary/20 transition-colors flex flex-col justify-between min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Trabajado
            </span>
            <p className="text-5xl font-black tracking-tighter">
              {formatMinutesAsHours(Math.round(weeklyData.workedHours * 60))}
            </p>
          </div>

          <div className="bg-background p-6 hover:bg-secondary/20 transition-colors flex flex-col justify-between min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Extras
            </span>
            <p
              className={cn(
                "text-5xl font-black tracking-tighter",
                weeklyData.overtimeHours > 0
                  ? "text-foreground"
                  : "text-muted-foreground/30"
              )}
            >
              {formatMinutesAsHours(Math.round(weeklyData.overtimeHours * 60))}
            </p>
          </div>

          <div className="bg-foreground text-background p-6 transition-colors flex flex-col justify-between min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Estimado
            </span>
            <p className="text-4xl font-black tracking-tighter truncate">
              {paySettings.currency === "COP"
                ? `$${weeklyData.estimatedPay.toLocaleString()}`
                : `${paySettings.currency} ${weeklyData.estimatedPay.toFixed(2)}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-16 lg:grid-cols-12">
        {/* Balance */}
        <div className="lg:col-span-5">
          <h2 className="text-xl font-black tracking-tighter uppercase mb-6 border-b border-foreground/10 pb-2">
            Balance
          </h2>
          {weeklyData && (
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black uppercase tracking-widest opacity-50">
                    Progreso
                  </span>
                  <span className="text-3xl font-black">
                    {weeklyData.scheduledHours > 0
                      ? Math.round(
                          (weeklyData.workedHours / weeklyData.scheduledHours) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-4 w-full bg-foreground/10 border border-foreground/10">
                  <div
                    className="h-full bg-foreground transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(100, weeklyData.scheduledHours > 0 ? (weeklyData.workedHours / weeklyData.scheduledHours) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-6 border border-foreground/10 flex justify-between items-center bg-background">
                <span className="text-xs font-black uppercase tracking-widest opacity-50">
                  Diferencia
                </span>
                <span className="font-black text-4xl tracking-tighter">
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
          <div className="flex items-center justify-between border-b border-foreground/10 pb-2 mb-6">
            <h2 className="text-xl font-black tracking-tighter uppercase">
              Historial
            </h2>
          </div>

          {dailyLogs.length === 0 ? (
            <div className="border border-foreground/10 border-dashed p-12 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                Sin registros
              </p>
              <Link to="/registrar">
                <Button className="rounded-none h-12 px-8 font-black uppercase tracking-widest">
                  Registrar
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
              {dailyLogs.map((log) => (
                <Link
                  key={log.id}
                  to="/registrar"
                  search={{ date: log.date }}
                  className="bg-background p-4 flex items-center justify-between hover:bg-foreground hover:text-background transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-3xl font-black tracking-tighter w-12 text-center group-hover:text-background">
                      {format(parseDateKey(log.date), "d", { locale: es })}
                    </div>
                    <div>
                      <p className="font-black text-xl uppercase tracking-tighter">
                        {format(parseDateKey(log.date), "EEE", { locale: es })}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        {getDayTypeLabel(log.dayType)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter">
                      {log.calculationSnapshot
                        ? formatMinutesAsHours(
                            log.calculationSnapshot.totalWorkedMinutes
                          )
                        : "--:--"}
                    </p>
                    {log.calculationSnapshot?.totalOvertimeMinutes &&
                    log.calculationSnapshot.totalOvertimeMinutes > 0 ? (
                      <p className="text-[10px] font-black uppercase tracking-widest">
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
