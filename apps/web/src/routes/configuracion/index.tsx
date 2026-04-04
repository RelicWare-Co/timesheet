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

  const handleSaveTargets = async () => {
    setIsSaving(true);
    try {
      await saveSettings({ weeklyTargetHours: targets });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePay = async () => {
    setIsSaving(true);
    try {
      await saveSettings({ paySettings });
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
        <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">
          Configura tu perfil
        </h2>
        <Link to="/configuracion/inicial">
          <Button
            size="lg"
            className="h-16 w-full text-xl font-bold uppercase tracking-widest rounded-none"
          >
            Ir a configuración
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 pb-32">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 group"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="mb-16">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
          Ajustes.
        </h1>
        <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground">
          Reglas, salario y datos
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-3">
          <nav className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
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
                    "text-left p-4 uppercase tracking-widest text-xs font-black transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-secondary/50"
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
            <div className="border border-foreground/10 p-6 md:p-12">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">
                Horas Objetivo
              </h2>
              <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10 mb-8">
                {DAYS_OF_WEEK_ES.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center justify-between p-4 bg-background hover:bg-secondary/20 transition-colors"
                  >
                    <span className="font-black uppercase tracking-widest text-sm">
                      {day.label}
                    </span>
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
                        className="h-12 bg-transparent border border-foreground/10 font-black text-center rounded-none shadow-none focus-visible:ring-1 focus-visible:ring-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                onClick={handleSaveTargets}
                disabled={isSaving}
                className="h-14 w-full sm:w-auto px-8 font-black uppercase tracking-widest rounded-none shadow-none text-background bg-foreground"
              >
                <Save className="mr-3 size-5" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}

          {activeTab === "pay" && (
            <div className="border border-foreground/10 p-6 md:p-12">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">
                Salario
              </h2>
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                      Base
                    </div>
                    <div className="flex flex-col gap-1 border border-foreground/10 p-1">
                      {PAY_BASIS_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() =>
                            updatePaySettings({ basis: opt.value })
                          }
                          className={cn(
                            "text-xs font-black uppercase tracking-widest p-3 text-left transition-colors",
                            paySettings.basis === opt.value
                              ? "bg-foreground text-background"
                              : "hover:bg-secondary/20"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                      Moneda
                    </div>
                    <div className="flex flex-col gap-1 border border-foreground/10 p-1">
                      {CURRENCY_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() =>
                            updatePaySettings({ currency: opt.value })
                          }
                          className={cn(
                            "text-xs font-black uppercase tracking-widest p-3 text-left transition-colors",
                            paySettings.currency === opt.value
                              ? "bg-foreground text-background"
                              : "hover:bg-secondary/20"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                    Monto Base
                  </div>
                  <NumberInput
                    min="0"
                    step="0.01"
                    value={paySettings.amount}
                    onValueChange={(value) =>
                      updatePaySettings({ amount: value })
                    }
                    className="h-16 text-3xl font-black rounded-none shadow-none border-foreground/10 focus-visible:ring-1 focus-visible:ring-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                      Bonos
                    </div>
                    <NumberInput
                      min="0"
                      step="0.01"
                      value={paySettings.allowances}
                      onValueChange={(value) =>
                        updatePaySettings({ allowances: value })
                      }
                      className="h-14 font-black rounded-none shadow-none border-foreground/10 focus-visible:ring-1 focus-visible:ring-foreground"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                      Mostrar
                    </div>
                    <div className="flex flex-col gap-1 border border-foreground/10 p-1">
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
                            "text-[10px] font-black uppercase tracking-widest p-2 text-left transition-colors",
                            paySettings.salaryDisplayMode === opt.value
                              ? "bg-foreground text-background"
                              : "hover:bg-secondary/20"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleSavePay}
                disabled={isSaving}
                className="h-14 w-full sm:w-auto px-8 font-black uppercase tracking-widest rounded-none shadow-none text-background bg-foreground"
              >
                <Save className="mr-3 size-5" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="border border-foreground/10 p-6 md:p-12">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">
                Reglas
              </h2>
              <div className="space-y-6">
                {ruleSets.map((rs) => (
                  <div
                    key={rs.id}
                    className="border border-foreground/10 p-6 bg-background"
                  >
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-foreground/10">
                      <h3 className="font-black text-xl tracking-tighter uppercase">
                        {rs.name}
                      </h3>
                      {settings?.activeRuleSetId === rs.id && (
                        <span className="bg-foreground text-background px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                          Activo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                          Diurno
                        </p>
                        <p className="font-black">
                          {rs.daytimeStart} - {rs.daytimeEnd}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                          Nocturno
                        </p>
                        <p className="font-black">
                          {rs.nighttimeStart} - {rs.nighttimeEnd}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                          Recargo Nocturno
                        </p>
                        <p className="font-black">
                          +{rs.ordinaryNightSurchargePct}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                          Extra Diurna
                        </p>
                        <p className="font-black">+{rs.daytimeOvertimePct}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="border border-foreground/10 p-6 md:p-12">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">
                Historial
              </h2>

              {logs.length === 0 ? (
                <div className="border border-dashed border-foreground/10 p-16 text-center">
                  <p className="text-sm font-black uppercase tracking-widest opacity-50">
                    Sin registros
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-background hover:bg-secondary/20 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="text-3xl font-black tracking-tighter w-12 text-center">
                          {parseDateKey(log.date).getDate()}
                        </div>
                        <div>
                          <p className="font-black text-lg uppercase tracking-tighter">
                            {parseDateKey(log.date).toLocaleDateString(
                              "es-CO",
                              { month: "short", weekday: "long" }
                            )}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">
                            {getDayTypeLabel(log.dayType)} •{" "}
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
                        className="text-muted-foreground hover:text-background hover:bg-foreground rounded-none h-12 w-12 transition-colors"
                        onClick={() => setLogToDelete(log)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={logToDelete !== null}
        onOpenChange={(o) => !o && setLogToDelete(null)}
      >
        <AlertDialogContent className="rounded-none border border-foreground/10 p-8 shadow-none bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase mb-2">
              Eliminar registro
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold uppercase tracking-widest opacity-60">
              Esta acción es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-4 sm:space-x-0">
            <AlertDialogCancel
              disabled={isDeletingLog}
              className="rounded-none h-14 w-full sm:w-auto font-black uppercase tracking-widest border border-foreground/10 bg-transparent"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingLog}
              onClick={handleDeleteLog}
              className="rounded-none h-14 w-full sm:w-auto font-black uppercase tracking-widest bg-foreground text-background shadow-none border border-foreground"
            >
              {isDeletingLog ? "..." : "Confirmar"}
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
