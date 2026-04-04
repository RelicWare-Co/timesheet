import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@timesheet/ui/components/card";
import { cn } from "@timesheet/ui/lib/utils";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings
} from "lucide-react";
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
    return "Domingo";
  }

  if (dayType === "holiday") {
    return "Festivo";
  }

  return "Ordinario";
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
        .sort((a, b) => a.date.localeCompare(b.date)),
    [logs, weekEndKey, weekStartKey]
  );

  if (!settings) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 animate-in fade-in duration-500">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Bienvenido a Timesheet</CardTitle>
            <CardDescription>
              Configura tu perfil para comenzar a registrar tus horas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracion/inicial">
              <Button>
                Comenzar Configuración
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 pb-32">
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Resumen Semanal</h1>
          <p className="text-base text-muted-foreground mt-1.5 capitalize font-medium">
            {format(weekStart, "d 'de' MMMM", { locale: es })} -{" "}
            {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-background/60 p-2 rounded-2xl border border-border/30 backdrop-blur-xl shadow-sm self-start sm:self-auto overflow-x-auto max-w-full transition-all ease-spring hover:shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 hover:bg-secondary/60 active:scale-95 transition-transform ease-spring"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl px-5 h-10 font-bold hover:bg-secondary/60 active:scale-95 transition-transform ease-spring"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 hover:bg-secondary/60 active:scale-95 transition-transform ease-spring"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {weeklyData && (
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(var(--primary),0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Objetivo
              </CardTitle>
              <div className="rounded-xl bg-secondary/80 p-2 text-muted-foreground shadow-inner">
                <Clock className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-4xl font-extrabold tracking-tight">
                {formatMinutesAsHours(
                  Math.round(weeklyData.scheduledHours * 60)
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(var(--primary),0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Trabajadas
              </CardTitle>
              <div className="rounded-xl bg-primary/10 p-2 text-primary shadow-inner">
                <TrendingUp className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-4xl font-extrabold tracking-tight text-foreground">
                {formatMinutesAsHours(Math.round(weeklyData.workedHours * 60))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(245,158,11,0.06)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Extras
              </CardTitle>
              <div className={cn("rounded-xl p-2 shadow-inner transition-colors duration-300", weeklyData.overtimeHours > 0 ? "bg-amber-500/15 text-amber-500" : "bg-secondary/80 text-muted-foreground")}>
                <AlertCircle className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div
                className={cn(
                  "text-4xl font-extrabold tracking-tight transition-colors duration-300",
                  weeklyData.overtimeHours > 0
                    ? "text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "text-muted-foreground"
                )}
              >
                {formatMinutesAsHours(
                  Math.round(weeklyData.overtimeHours * 60)
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(34,197,94,0.08)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 ease-spring pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6 relative">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Pago Estimado
              </CardTitle>
              <div className="rounded-xl bg-green-500/15 p-2 shadow-inner">
                <DollarSign className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 relative">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-green-600 dark:text-green-400 truncate drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                {paySettings.currency === "COP"
                  ? `$${weeklyData.estimatedPay.toLocaleString()}`
                  : `${paySettings.currency} ${weeklyData.estimatedPay.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both ease-spring">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-xl font-bold">Balance</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {weeklyData && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Progreso Semanal
                      </span>
                      <span className="text-sm font-bold bg-secondary/80 px-3 py-1 rounded-xl shadow-inner">
                        {weeklyData.scheduledHours > 0
                          ? Math.round(
                              (weeklyData.workedHours / weeklyData.scheduledHours) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-secondary/50 overflow-hidden shadow-inner p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-spring shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        style={{ width: `${Math.min(100, weeklyData.scheduledHours > 0 ? (weeklyData.workedHours / weeklyData.scheduledHours) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-secondary/20 border border-border/20 shadow-sm transition-transform hover:scale-[1.02] duration-300 ease-spring">
                    <span className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                      Diferencia
                    </span>
                    <span
                      className={cn(
                        "font-extrabold text-2xl tracking-tight drop-shadow-sm",
                        weeklyData.balanceHours >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
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
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-xl font-bold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex flex-col gap-4">
              <Link to="/registrar" className="w-full">
                <Button className="w-full h-14 justify-start rounded-2xl shadow-lg transition-transform active:scale-[0.97] ease-spring text-base font-semibold">
                  <Plus className="mr-3 size-5" />
                  Registrar Horas
                </Button>
              </Link>
              <Link to="/configuracion" className="w-full">
                <Button variant="secondary" className="w-full h-14 justify-start rounded-2xl shadow-sm transition-transform active:scale-[0.97] ease-spring text-base font-semibold bg-secondary/60 hover:bg-secondary/90">
                  <Settings className="mr-3 size-5" />
                  Ajustes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300">
            <CardHeader className="px-6 pt-6 pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                Registros de la Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {dailyLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-dashed border-border/40 bg-secondary/5">
                  <div className="rounded-full bg-secondary/50 p-5 mb-5 shadow-inner">
                    <Clock className="size-10 text-muted-foreground/60" />
                  </div>
                  <p className="text-xl font-bold">
                    No hay registros
                  </p>
                  <p className="text-base text-muted-foreground mt-2 mb-8 max-w-[280px]">
                    Comienza a registrar tus horas para ver tu progreso.
                  </p>
                  <Link to="/registrar">
                    <Button className="rounded-2xl h-12 px-6 shadow-md font-semibold active:scale-[0.97] transition-transform ease-spring">
                      <Plus className="mr-2 size-5" />
                      Primer Día
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group flex items-center justify-between rounded-2xl border border-border/20 bg-background/50 p-5 shadow-sm transition-all duration-300 ease-spring hover:border-primary/30 hover:shadow-md hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "flex size-14 shrink-0 items-center justify-center rounded-2xl font-bold text-xl shadow-inner",
                            log.dayType === "sunday" || log.dayType === "holiday"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-primary/15 text-primary"
                          )}
                        >
                          {format(parseDateKey(log.date), "d", { locale: es })}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground capitalize">
                            {format(parseDateKey(log.date), "EEEE", { locale: es })}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                            {getDayTypeLabel(log.dayType)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold tracking-tight text-foreground">
                          {log.calculationSnapshot
                            ? formatMinutesAsHours(
                                log.calculationSnapshot.totalWorkedMinutes
                              )
                            : "--:--"}
                        </p>
                        {log.calculationSnapshot?.totalOvertimeMinutes &&
                          log.calculationSnapshot.totalOvertimeMinutes > 0 && (
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mt-1">
                              +
                              {formatMinutesAsHours(
                                log.calculationSnapshot.totalOvertimeMinutes
                              )} extras
                            </p>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/resumen")({
  component: ResumenPage,
});
