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
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Resumen Semanal</h1>
          <p className="text-muted-foreground mt-1 capitalize font-medium">
            {format(weekStart, "d 'de' MMMM", { locale: es })} -{" "}
            {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm self-start sm:self-auto overflow-x-auto max-w-full">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-9 w-9"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg px-4 h-9 font-medium"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-9 w-9"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {weeklyData && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Objetivo
              </CardTitle>
              <div className="rounded-full bg-secondary/50 p-2">
                <Clock className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {formatMinutesAsHours(
                  Math.round(weeklyData.scheduledHours * 60)
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Trabajadas
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {formatMinutesAsHours(Math.round(weeklyData.workedHours * 60))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Extras
              </CardTitle>
              <div className={cn("rounded-full p-2", weeklyData.overtimeHours > 0 ? "bg-amber-500/10" : "bg-secondary/50")}>
                <AlertCircle className={cn("size-4", weeklyData.overtimeHours > 0 ? "text-amber-500" : "text-muted-foreground")} />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  weeklyData.overtimeHours > 0
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              >
                {formatMinutesAsHours(
                  Math.round(weeklyData.overtimeHours * 60)
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-green-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pago Estimado
              </CardTitle>
              <div className="rounded-full bg-green-500/10 p-2">
                <DollarSign className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-green-600 dark:text-green-400 truncate">
                {paySettings.currency === "COP"
                  ? `$${weeklyData.estimatedPay.toLocaleString()}`
                  : `${paySettings.currency} ${weeklyData.estimatedPay.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Progreso Semanal
                      </span>
                      <span className="text-sm font-bold bg-secondary px-2 py-0.5 rounded-full">
                        {weeklyData.scheduledHours > 0
                          ? Math.round(
                              (weeklyData.workedHours / weeklyData.scheduledHours) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, weeklyData.scheduledHours > 0 ? (weeklyData.workedHours / weeklyData.scheduledHours) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                    <span className="text-sm font-medium text-muted-foreground">
                      Diferencia vs Objetivo
                    </span>
                    <span
                      className={cn(
                        "font-bold text-lg",
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

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link to="/registrar" className="w-full">
                <Button className="w-full justify-start rounded-xl shadow-sm transition-transform active:scale-[0.98]">
                  <Plus className="mr-3 size-5" />
                  Registrar Horas de Hoy
                </Button>
              </Link>
              <Link to="/configuracion" className="w-full">
                <Button variant="secondary" className="w-full justify-start rounded-xl shadow-sm transition-transform active:scale-[0.98]">
                  <Settings className="mr-3 size-5" />
                  Configurar Preferencias
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-border/50 bg-card/30 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                Registros de la Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border/60 bg-secondary/10">
                  <div className="rounded-full bg-secondary/50 p-4 mb-4">
                    <Clock className="size-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-lg font-medium">
                    No hay registros para esta semana
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-[250px]">
                    Comienza a registrar tus horas para ver tu progreso aquí.
                  </p>
                  <Link to="/registrar">
                    <Button className="rounded-xl shadow-sm">
                      <Plus className="mr-2 size-4" />
                      Registrar Primer Día
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-xl font-bold text-lg",
                            log.dayType === "sunday" || log.dayType === "holiday"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-primary/15 text-primary"
                          )}
                        >
                          {format(parseDateKey(log.date), "d", { locale: es })}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground capitalize">
                            {format(parseDateKey(log.date), "EEEE", { locale: es })}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {getDayTypeLabel(log.dayType)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold tracking-tight text-foreground">
                          {log.calculationSnapshot
                            ? formatMinutesAsHours(
                                log.calculationSnapshot.totalWorkedMinutes
                              )
                            : "--:--"}
                        </p>
                        {log.calculationSnapshot?.totalOvertimeMinutes &&
                          log.calculationSnapshot.totalOvertimeMinutes > 0 && (
                            <p className="text-xs font-semibold text-amber-500">
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
