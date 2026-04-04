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
    <div className="container mx-auto max-w-5xl px-4 py-8 pb-32">
      <div className="mb-10 flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-secondary/60 transition-transform active:scale-95 ease-spring">
            <ArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-base font-medium text-muted-foreground mt-1.5">
            Gestiona tus preferencias, salario y base de datos.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
        {/* Sidebar Navigation */}
        <div className="md:col-span-4 lg:col-span-3 min-w-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory">
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
                    "flex items-center gap-3 rounded-2xl px-5 py-4 text-[15px] font-bold transition-all duration-300 ease-spring whitespace-nowrap md:whitespace-normal text-left snap-start",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:scale-[0.98]"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0 transition-transform duration-300 ease-spring", isActive && "scale-110")} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          {activeTab === "targets" && (
            <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all animate-in fade-in slide-in-from-right-8 duration-500 ease-spring">
              <CardHeader className="pb-6 border-b border-border/20 px-6 sm:px-8 pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Clock className="size-6" />
                  </div>
                  Horas Objetivo Semanales
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground/80 leading-relaxed">
                  Configura cuántas horas esperas trabajar cada día para que el sistema calcule tu balance correctamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-6 sm:px-8 pb-8">
                <FieldGroup className="gap-4">
                  {DAYS_OF_WEEK_ES.map((day) => (
                    <div key={day.key} className="flex items-center justify-between p-4 sm:px-5 rounded-2xl bg-secondary/10 hover:bg-secondary/30 transition-colors duration-300 ease-spring border border-transparent hover:border-border/40 shadow-sm">
                      <FieldLabel className="text-[15px] font-bold capitalize text-foreground m-0">{day.label}</FieldLabel>
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
                          className="h-14 bg-background shadow-inner text-center font-extrabold text-lg rounded-xl border-border/30 focus-visible:ring-primary/30"
                        />
                      </div>
                    </div>
                  ))}
                </FieldGroup>
                <div className="mt-10 flex justify-end">
                  <Button size="lg" onClick={handleSaveTargets} disabled={isSaving} className="h-14 rounded-2xl px-10 text-base font-bold shadow-lg transition-transform active:scale-95 ease-spring">
                    <Save className="mr-2 size-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "pay" && (
            <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all animate-in fade-in slide-in-from-right-8 duration-500 ease-spring">
              <CardHeader className="pb-6 border-b border-border/20 px-6 sm:px-8 pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <DollarSign className="size-6" />
                  </div>
                  Configuración de Salario
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground/80 leading-relaxed">
                  Ajusta tu salario base y preferencias de moneda para el cálculo automático.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-6 sm:px-8 pb-8">
                <FieldGroup className="gap-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Base de Pago</FieldLabel>
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
                          <SelectTrigger className="h-14 text-base font-semibold rounded-2xl bg-secondary/10 border-border/30 focus:ring-primary/30 shadow-sm px-4 hover:bg-secondary/20 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/30 bg-background/80 backdrop-blur-xl">
                            {PAY_BASIS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Moneda</FieldLabel>
                      <FieldContent>
                        <Select
                          value={paySettings.currency}
                          onValueChange={(v) =>
                            updatePaySettings({
                              currency: v ?? paySettings.currency,
                            })
                          }
                        >
                          <SelectTrigger className="h-14 text-base font-semibold rounded-2xl bg-secondary/10 border-border/30 focus:ring-primary/30 shadow-sm px-4 hover:bg-secondary/20 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/30 bg-background/80 backdrop-blur-xl">
                            {CURRENCY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Monto del Salario Base</FieldLabel>
                    <FieldContent>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform duration-300 ease-spring group-focus-within:scale-110">
                          <DollarSign className="size-5 text-muted-foreground group-focus-within:text-primary" />
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
                          className="pl-14 h-16 text-xl font-extrabold rounded-2xl bg-background shadow-inner border-border/30 focus-visible:ring-primary/30"
                        />
                      </div>
                    </FieldContent>
                  </Field>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Otros Ingresos / Bonos</FieldLabel>
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
                          className="h-14 text-base font-semibold rounded-2xl bg-background shadow-inner border-border/30 focus-visible:ring-primary/30 px-4"
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Mostrar Salario Como</FieldLabel>
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
                          <SelectTrigger className="h-14 text-base font-semibold rounded-2xl bg-secondary/10 border-border/30 focus:ring-primary/30 shadow-sm px-4 hover:bg-secondary/20 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/30 bg-background/80 backdrop-blur-xl">
                            {DISPLAY_MODE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  </div>
                </FieldGroup>
                <div className="mt-10 flex justify-end">
                  <Button size="lg" onClick={handleSavePay} disabled={isSaving} className="h-14 rounded-2xl px-10 text-base font-bold shadow-lg transition-transform active:scale-95 ease-spring">
                    <Save className="mr-2 size-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "rules" && (
            <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all animate-in fade-in slide-in-from-right-8 duration-500 ease-spring">
              <CardHeader className="pb-6 border-b border-border/20 px-6 sm:px-8 pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-secondary text-foreground">
                    <Settings className="size-6" />
                  </div>
                  Conjuntos de Reglas Laborales
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground/80 leading-relaxed">
                  El sistema aplica estas reglas automáticamente según la fecha de cada registro.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-6 sm:px-8 pb-8">
                <div className="space-y-6">
                  {ruleSets.map((rs) => (
                    <div key={rs.id} className="rounded-3xl border border-border/30 bg-secondary/10 p-6 transition-all duration-300 ease-spring hover:bg-secondary/20 hover:border-border/50 hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-extrabold text-xl text-foreground">{rs.name}</h3>
                            {settings?.activeRuleSetId === rs.id && (
                              <span className="rounded-lg bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-2 bg-background/50 inline-block px-3 py-1 rounded-lg">
                            Vigencia: {rs.effectiveFrom}
                            {rs.effectiveTo && ` hasta ${rs.effectiveTo}`}
                          </p>
                        </div>
                        <div className="bg-background rounded-2xl px-4 py-2 border border-border/40 inline-flex self-start shadow-sm">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jornada Máxima: <span className="text-foreground text-sm ml-1">{rs.legalWeeklyMaxHours}h</span></span>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-6 border-t border-border/20">
                        <div className="bg-background/80 rounded-2xl p-4 border border-border/20 shadow-sm hover:scale-105 transition-transform duration-300 ease-spring">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Horario Diurno</p>
                          <p className="text-[15px] font-extrabold">{rs.daytimeStart} - {rs.daytimeEnd}</p>
                        </div>
                        <div className="bg-background/80 rounded-2xl p-4 border border-border/20 shadow-sm hover:scale-105 transition-transform duration-300 ease-spring">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Horario Nocturno</p>
                          <p className="text-[15px] font-extrabold">{rs.nighttimeStart} - {rs.nighttimeEnd}</p>
                        </div>
                        <div className="bg-background/80 rounded-2xl p-4 border border-primary/10 shadow-sm hover:scale-105 transition-transform duration-300 ease-spring">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">Recargo Nocturno</p>
                          <p className="text-lg font-black text-primary">+{rs.ordinaryNightSurchargePct}%</p>
                        </div>
                        <div className="bg-background/80 rounded-2xl p-4 border border-amber-500/10 shadow-sm hover:scale-105 transition-transform duration-300 ease-spring">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 mb-2">Hora Extra Diurna</p>
                          <p className="text-lg font-black text-amber-500">+{rs.daytimeOvertimePct}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all animate-in fade-in slide-in-from-right-8 duration-500 ease-spring">
              <CardHeader className="pb-6 border-b border-border/20 px-6 sm:px-8 pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="size-6" />
                  </div>
                  Registros Guardados
                </CardTitle>
                <CardDescription className="text-base mt-2 text-muted-foreground/80 leading-relaxed">
                  Gestiona, revisa o elimina tus registros históricos de tiempo.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-6 sm:px-8 pb-8">
                {logs.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/40 bg-secondary/5 p-16 text-center">
                    <CalendarDays className="mx-auto mb-6 size-12 text-muted-foreground/40" />
                    <p className="text-xl font-bold">No hay registros guardados</p>
                    <p className="text-base text-muted-foreground mt-2">Tus horas trabajadas aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="group flex items-center justify-between rounded-2xl border border-border/30 bg-background/60 p-5 transition-all duration-300 ease-spring hover:border-primary/30 hover:shadow-md hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "flex size-14 shrink-0 items-center justify-center rounded-2xl font-bold text-xl shadow-inner",
                            log.dayType === "sunday" || log.dayType === "holiday"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-primary/15 text-primary"
                          )}>
                            {parseDateKey(log.date).getDate()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground capitalize text-lg">
                              {parseDateKey(log.date).toLocaleDateString("es-CO", {
                                month: "long",
                                weekday: "long",
                                year: "numeric",
                              })}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded-md">
                                {getDayTypeLabel(log.dayType)}
                              </span>
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded-md">
                                {log.calculationSnapshot
                                  ? `${formatMinutesAsHours(log.calculationSnapshot.totalWorkedMinutes)} trab.`
                                  : `${log.segments.length} seg.`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-spring text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-12 w-12"
                          onClick={() => setLogToDelete(log)}
                        >
                          <Trash2 className="size-6" />
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
        <AlertDialogContent className="rounded-3xl border-border/20 bg-background/80 backdrop-blur-3xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] p-8">
          <AlertDialogHeader>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-inner">
              <ShieldAlert className="size-8" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-extrabold">¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[15px] mt-3 text-muted-foreground/90 leading-relaxed">
              {logToDelete && (
                <>
                  Estás a punto de eliminar permanentemente el registro del <span className="font-bold text-foreground px-1 py-0.5 bg-secondary/50 rounded-md">{parseDateKey(logToDelete.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>. Esta acción no se puede deshacer y afectará tus resúmenes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-8 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeletingLog} className="rounded-2xl h-14 sm:w-36 text-base font-bold shadow-sm transition-transform active:scale-95 ease-spring border-border/30 hover:bg-secondary/60 m-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingLog}
              onClick={handleDeleteLog}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl h-14 sm:w-36 text-base font-bold shadow-lg transition-transform active:scale-95 ease-spring m-0"
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
