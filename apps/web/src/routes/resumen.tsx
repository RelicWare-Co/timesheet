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
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
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
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resumen Semanal</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d 'de' MMMM", { locale: es })} -{" "}
            {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {weeklyData && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Programadas
              </CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMinutesAsHours(
                  Math.round(weeklyData.scheduledHours * 60)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Trabajadas
              </CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMinutesAsHours(Math.round(weeklyData.workedHours * 60))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Extra
              </CardTitle>
              <AlertCircle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pago Estimado
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paySettings.currency === "COP"
                  ? `$${weeklyData.estimatedPay.toLocaleString()}`
                  : `${paySettings.currency} ${weeklyData.estimatedPay.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Diferencia vs Objetivo
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      weeklyData.balanceHours >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {weeklyData.balanceHours >= 0 ? "+" : ""}
                    {formatMinutesAsHours(
                      Math.round(weeklyData.balanceHours * 60)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Progreso Semanal
                  </span>
                  <span className="font-semibold">
                    {weeklyData.scheduledHours > 0
                      ? Math.round(
                          (weeklyData.workedHours / weeklyData.scheduledHours) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/registrar">
              <Button className="w-full">
                <Plus className="mr-2 size-4" />
                Registrar Horas de Hoy
              </Button>
            </Link>
            <Link to="/configuracion">
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 size-4" />
                Configurar Preferencias
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-2 size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No hay registros para esta semana.
              </p>
              <Link to="/registrar">
                <Button className="mt-4">
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
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        log.dayType === "sunday" || log.dayType === "holiday"
                          ? "bg-amber-500"
                          : "bg-green-500"
                      )}
                    />
                    <div>
                      <p className="font-medium">
                        {format(parseDateKey(log.date), "EEEE d", {
                          locale: es,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getDayTypeLabel(log.dayType)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {log.calculationSnapshot
                        ? formatMinutesAsHours(
                            log.calculationSnapshot.totalWorkedMinutes
                          )
                        : "--:--"}
                    </p>
                    {log.calculationSnapshot?.totalOvertimeMinutes &&
                      log.calculationSnapshot.totalOvertimeMinutes > 0 && (
                        <p className="text-xs text-amber-500">
                          +
                          {formatMinutesAsHours(
                            log.calculationSnapshot.totalOvertimeMinutes
                          )}
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
  );
}

export const Route = createFileRoute("/resumen")({
  component: ResumenPage,
});
