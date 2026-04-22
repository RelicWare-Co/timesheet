import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@timesheet/ui/components/alert-dialog";
import { Button } from "@timesheet/ui/components/button";
import { NumberInput } from "@timesheet/ui/components/number-input";
import { cn } from "@timesheet/ui/lib/utils";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useLegalRuleSets,
  usePaySettings,
  useUserSettings,
  useWeeklyTargets,
  useWorkLogs,
} from "@/hooks/use-timesheet-data";
import { parseDateKey } from "@/lib/date";
import { formatMinutesAsHours } from "@/lib/rules-engine";
import type { WeeklyTargetHours, WorkLog } from "@/lib/types";

const DAYS_OF_WEEK_ES = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

const PAY_BASIS_OPTIONS = [
  { label: "Mensual", value: "monthly" },
  { label: "Quincenal", value: "biweekly" },
  { label: "Semanal", value: "weekly" },
  { label: "Por Hora", value: "hourly" },
] as const;

const DISPLAY_MODE_OPTIONS = [
  { label: "Bruto", value: "gross" },
  { label: "Neto Aproximado", value: "approximate_net" },
  { label: "Ambos", value: "both" },
] as const;

const CURRENCY_OPTIONS = [
  { label: "COP", value: "COP" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
] as const;

type SettingsTab = "targets" | "pay" | "rules" | "logs";

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

export default function SettingsPage() {
  const { settings, saveSettings } = useUserSettings();
  const { targets, updateTargets } = useWeeklyTargets();
  const { paySettings, updatePaySettings } = usePaySettings();
  const { ruleSets } = useLegalRuleSets();
  const { logs, deleteLog } = useWorkLogs();

  const [activeTab, setActiveTab] = useState<SettingsTab>("targets");
  const [isSaving, setIsSaving] = useState(false);
  const [logToDelete, setLogToDelete] = useState<WorkLog | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        paySettings,
        weeklyTargetHours: targets,
      });
      toast.success("Configuración guardada");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!logToDelete) {
      return;
    }
    setIsDeletingLog(true);
    try {
      await deleteLog(logToDelete.id);
      setLogToDelete(null);
    } finally {
      setIsDeletingLog(false);
    }
  };

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <h2 className="font-heading text-3xl font-bold mb-3 tracking-tight">
            Configura tu perfil
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Define tu jornada semanal, salario base y moneda para que Timesheet
            calcule automáticamente tus horas extra y recargos según la ley
            colombiana. Los datos se guardan solo en tu dispositivo.
          </p>
          <Link to="/configuracion/inicial">
            <Button
              size="lg"
              className="h-14 w-full text-lg font-semibold rounded-xl"
            >
              Ir a configuración
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 pb-28 md:pb-16">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="mb-10">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          Ajustes
        </h1>
        <p className="text-lg font-medium text-muted-foreground">
          Reglas, salario y datos
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-3">
          <nav className="flex flex-col gap-1.5">
            {(
              [
                ["targets", "Horas Objetivo"],
                ["pay", "Salario"],
                ["rules", "Reglas Legales"],
                ["logs", "Historial"],
              ] as const
            ).map(([tab, label]) => {
              const isActive = activeTab === tab;
              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab as SettingsTab)}
                  className={cn(
                    "text-left px-4 py-3 text-sm font-medium transition-all rounded-xl",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          {activeTab === "targets" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold tracking-tight mb-6">
                Horas Objetivo
              </h2>
              <div className="flex flex-col gap-2 mb-6">
                {DAYS_OF_WEEK_ES.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-semibold text-sm">{day.label}</span>
                    <div className="w-24 relative">
                      <NumberInput
                        min="0"
                        max="24"
                        step="0.5"
                        value={targets[day.key as keyof typeof targets]}
                        onValueChange={(value) =>
                          updateTargets({
                            [day.key]: value,
                          } as Partial<WeeklyTargetHours>)
                        }
                        className="h-10 bg-background border-border font-semibold text-center rounded-lg shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pay" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold tracking-tight mb-6">
                Salario
              </h2>
              <div className="space-y-5 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                      Base de pago
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {PAY_BASIS_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() =>
                            updatePaySettings({ basis: opt.value })
                          }
                          className={cn(
                            "text-sm font-medium p-3 text-left transition-all rounded-xl border",
                            paySettings.basis === opt.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                      Moneda
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {CURRENCY_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() =>
                            updatePaySettings({ currency: opt.value })
                          }
                          className={cn(
                            "text-sm font-medium p-3 text-left transition-all rounded-xl border",
                            paySettings.currency === opt.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Monto Base
                  </div>
                  <NumberInput
                    min="0"
                    step="0.01"
                    value={paySettings.amount}
                    onValueChange={(value) =>
                      updatePaySettings({ amount: value })
                    }
                    className="h-14 text-xl font-bold rounded-xl shadow-none border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                      Bonos
                    </div>
                    <NumberInput
                      min="0"
                      step="0.01"
                      value={paySettings.allowances}
                      onValueChange={(value) =>
                        updatePaySettings({ allowances: value })
                      }
                      className="h-12 font-semibold rounded-xl shadow-none border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                      Mostrar
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {DISPLAY_MODE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() =>
                            updatePaySettings({
                              salaryDisplayMode: opt.value,
                            })
                          }
                          className={cn(
                            "text-xs font-medium p-2.5 text-left transition-all rounded-xl border",
                            paySettings.salaryDisplayMode === opt.value
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold tracking-tight mb-6">
                Reglas
              </h2>
              <div className="space-y-4">
                {ruleSets.map((rs) => (
                  <div
                    key={rs.id}
                    className="border border-border rounded-xl p-5 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                      <h3 className="font-bold text-base">{rs.name}</h3>
                      {settings?.activeRuleSetId === rs.id && (
                        <span className="bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full">
                          Activo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Diurno
                        </p>
                        <p className="font-semibold">
                          {rs.daytimeStart} - {rs.daytimeEnd}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Nocturno
                        </p>
                        <p className="font-semibold">
                          {rs.nighttimeStart} - {rs.nighttimeEnd}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Recargo Nocturno
                        </p>
                        <p className="font-semibold">
                          +{rs.ordinaryNightSurchargePct}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Extra Diurna
                        </p>
                        <p className="font-semibold">
                          +{rs.daytimeOvertimePct}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold tracking-tight mb-6">
                Historial
              </h2>

              {logs.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-16 text-center bg-secondary/20">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sin registros
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold tracking-tight w-10 text-center font-heading text-muted-foreground">
                          {parseDateKey(log.date).getDate()}
                        </div>
                        <div>
                          <p className="font-semibold text-base capitalize">
                            {parseDateKey(log.date).toLocaleDateString(
                              "es-CO",
                              { month: "short", weekday: "long" }
                            )}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {getDayTypeLabel(log.dayType)} ·{" "}
                            {log.calculationSnapshot
                              ? formatMinutesAsHours(
                                  log.calculationSnapshot.totalWorkedMinutes
                                )
                              : "--"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 transition-colors"
                        onClick={() => setLogToDelete(log)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab !== "logs" && activeTab !== "rules" && (
        <div className="fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-md border-t border-border p-4 z-50 md:hidden">
          <Button
            size="lg"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="h-12 w-full font-semibold rounded-xl shadow-sm"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}

      <AlertDialog
        open={logToDelete !== null}
        onOpenChange={(o) => !o && setLogToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-border p-6 shadow-lg bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-bold tracking-tight mb-2">
              Eliminar registro
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium opacity-80 leading-relaxed">
              Esta acción elimina permanentemente el registro del{" "}
              {logToDelete
                ? parseDateKey(logToDelete.date).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                  })
                : ""}
              . No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 sm:space-x-0">
            <AlertDialogCancel
              disabled={isDeletingLog}
              className="h-12 w-full sm:w-auto font-semibold rounded-xl border border-border bg-transparent hover:bg-secondary"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingLog}
              onClick={handleDeleteLog}
              className="h-12 w-full sm:w-auto font-semibold rounded-xl bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90"
            >
              {isDeletingLog ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/configuracion/")({
  component: SettingsPage,
});
