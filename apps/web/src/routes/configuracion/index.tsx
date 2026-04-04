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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@timesheet/ui/components/card";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldGroup,
} from "@timesheet/ui/components/field";
import { Input } from "@timesheet/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timesheet/ui/components/select";
import { cn } from "@timesheet/ui/lib/utils";
import {
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  Settings,
  Trash2,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";
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
import type { WorkLog } from "@/lib/types";

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
  { label: "COP - Peso Colombiano", value: "COP" },
  { label: "USD - Dólar Estadounidense", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
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
      <div className="container mx-auto max-w-4xl px-4 py-8 animate-in fade-in duration-500">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Configura tu perfil primero</CardTitle>
            <CardDescription>
              Necesitas completar la configuración inicial antes de editar
              preferencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracion/inicial">
              <Button>Ir a configuración inicial</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ajustes</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Gestiona tus preferencias, salario y base de datos.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Sidebar Navigation */}
        <div className="md:col-span-3 lg:col-span-3 min-w-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            {(
              [
                ["targets", "Horas Objetivo", Clock],
                ["pay", "Salario y Pagos", DollarSign],
                ["rules", "Reglas Laborales", Settings],
                ["logs", "Mis Registros", CalendarDays],
              ] as const
            ).map(([tab, label, Icon]) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as SettingsTab)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap md:whitespace-normal text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", isActive && "text-primary")} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-9 lg:col-span-9">
          {activeTab === "targets" && (
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="pb-6 border-b border-border/40">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Clock className="size-6 text-primary" />
                  Horas Objetivo Semanales
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Configura cuántas horas esperas trabajar cada día para que el sistema calcule tu balance correctamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FieldGroup className="gap-3">
                  {DAYS_OF_WEEK_ES.map((day) => (
                    <div key={day.key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                      <FieldLabel className="text-sm font-semibold capitalize text-foreground m-0">{day.label}</FieldLabel>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={targets[day.key as keyof typeof targets]}
                          onChange={(e) =>
                            updateTargets({
                              [day.key]: Number(e.target.value),
                            } as Partial<typeof targets>)
                          }
                          className="bg-background text-center font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </FieldGroup>
                <div className="mt-8 flex justify-end">
                  <Button size="lg" onClick={handleSaveTargets} disabled={isSaving} className="rounded-xl px-8 shadow-md transition-transform active:scale-[0.98]">
                    <Save className="mr-2 size-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "pay" && (
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="pb-6 border-b border-border/40">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <DollarSign className="size-6 text-primary" />
                  Configuración de Salario
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Ajusta tu salario base y preferencias de moneda para el cálculo automático.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FieldGroup className="gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Base de Pago</FieldLabel>
                      <FieldContent>
                        <Select
                          value={paySettings.basis}
                          onValueChange={(v) =>
                            updatePaySettings({
                              basis: (v ??
                                paySettings.basis) as typeof paySettings.basis,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-secondary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAY_BASIS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Moneda</FieldLabel>
                      <FieldContent>
                        <Select
                          value={paySettings.currency}
                          onValueChange={(v) =>
                            updatePaySettings({
                              currency: v ?? paySettings.currency,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-secondary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Monto del Salario Base</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <DollarSign className="size-5 text-muted-foreground" />
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paySettings.amount}
                          onChange={(e) =>
                            updatePaySettings({
                              amount: Number(e.target.value),
                            })
                          }
                          className="pl-12 h-14 text-lg font-bold rounded-xl bg-secondary/20"
                        />
                      </div>
                    </FieldContent>
                  </Field>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Otros Ingresos Fijos / Bonos</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paySettings.allowances}
                          onChange={(e) =>
                            updatePaySettings({
                              allowances: Number(e.target.value),
                            })
                          }
                          className="h-12 rounded-xl bg-secondary/20"
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Mostrar Salario Como</FieldLabel>
                      <FieldContent>
                        <Select
                          value={paySettings.salaryDisplayMode}
                          onValueChange={(v) =>
                            updatePaySettings({
                              salaryDisplayMode: (v ??
                                paySettings.salaryDisplayMode) as typeof paySettings.salaryDisplayMode,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-secondary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DISPLAY_MODE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  </div>
                </FieldGroup>
                <div className="mt-8 flex justify-end">
                  <Button size="lg" onClick={handleSavePay} disabled={isSaving} className="rounded-xl px-8 shadow-md transition-transform active:scale-[0.98]">
                    <Save className="mr-2 size-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "rules" && (
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="pb-6 border-b border-border/40">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Settings className="size-6 text-primary" />
                  Conjuntos de Reglas Laborales
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  El sistema aplica estas reglas automáticamente según la fecha de cada registro.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {ruleSets.map((rs) => (
                    <div key={rs.id} className="rounded-2xl border border-border/50 bg-secondary/5 p-5 transition-all hover:bg-secondary/10">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-foreground">{rs.name}</h3>
                            {settings?.activeRuleSetId === rs.id && (
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-1">
                            Vigencia: {rs.effectiveFrom}
                            {rs.effectiveTo && ` hasta ${rs.effectiveTo}`}
                          </p>
                        </div>
                        <div className="bg-background rounded-lg px-3 py-1.5 border border-border/50 inline-flex self-start">
                          <span className="text-xs font-bold text-muted-foreground">Jornada Máxima: <span className="text-foreground">{rs.legalWeeklyMaxHours}h</span></span>
                        </div>
                      </div>
                      
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-4 border-t border-border/30">
                        <div className="bg-background/50 rounded-xl p-3 border border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Horario Diurno</p>
                          <p className="text-sm font-semibold">{rs.daytimeStart} - {rs.daytimeEnd}</p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 border border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Horario Nocturno</p>
                          <p className="text-sm font-semibold">{rs.nighttimeStart} - {rs.nighttimeEnd}</p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 border border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Recargo Nocturno</p>
                          <p className="text-sm font-semibold text-primary">+{rs.ordinaryNightSurchargePct}%</p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 border border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Hora Extra Diurna</p>
                          <p className="text-sm font-semibold text-amber-500">+{rs.daytimeOvertimePct}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="pb-6 border-b border-border/40">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CalendarDays className="size-6 text-primary" />
                  Registros Guardados
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Gestiona, revisa o elimina tus registros históricos de tiempo.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {logs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/5 p-12 text-center">
                    <CalendarDays className="mx-auto mb-4 size-10 text-muted-foreground/50" />
                    <p className="text-lg font-medium">No hay registros guardados</p>
                    <p className="text-sm text-muted-foreground mt-1">Tus horas trabajadas aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg font-bold text-sm",
                            log.dayType === "sunday" || log.dayType === "holiday"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-primary/15 text-primary"
                          )}>
                            {parseDateKey(log.date).getDate()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground capitalize text-sm sm:text-base">
                              {parseDateKey(log.date).toLocaleDateString("es-CO", {
                                month: "long",
                                weekday: "long",
                                year: "numeric",
                              })}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {getDayTypeLabel(log.dayType)}
                              </span>
                              <span className="text-xs text-border">•</span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {log.calculationSnapshot
                                  ? `${formatMinutesAsHours(log.calculationSnapshot.totalWorkedMinutes)} trabajadas`
                                  : `${log.segments.length} segmento(s)`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => setLogToDelete(log)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog
        open={logToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLogToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <AlertDialogTitle className="text-center text-xl">¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {logToDelete && (
                <>
                  Estás a punto de eliminar permanentemente el registro del <span className="font-bold text-foreground">{parseDateKey(logToDelete.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>. Esta acción no se puede deshacer y afectará tus resúmenes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
            <AlertDialogCancel disabled={isDeletingLog} className="rounded-xl sm:w-32">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingLog}
              onClick={handleDeleteLog}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl sm:w-32"
            >
              {isDeletingLog ? "Eliminando..." : "Eliminar"}
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
