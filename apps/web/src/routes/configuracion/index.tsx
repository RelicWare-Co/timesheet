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
import {
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  Settings,
  Trash2,
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
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
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
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus preferencias y registros.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {(
          [
            ["targets", "Horas Objetivo", Clock],
            ["pay", "Salario", DollarSign],
            ["rules", "Reglas", Settings],
            ["logs", "Registros", Clock],
          ] as const
        ).map(([tab, label, Icon]) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab as SettingsTab)}
          >
            <Icon className="mr-2 size-4" />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === "targets" && (
        <Card>
          <CardHeader>
            <CardTitle>Horas Objetivo Semanales</CardTitle>
            <CardDescription>
              Configura cuántas horas esperas trabajar cada día.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {DAYS_OF_WEEK_ES.map((day) => (
                <Field key={day.key}>
                  <FieldLabel>{day.label}</FieldLabel>
                  <FieldContent>
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
                    />
                  </FieldContent>
                </Field>
              ))}
            </FieldGroup>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveTargets} disabled={isSaving}>
                <Save className="mr-2 size-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "pay" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Salario</CardTitle>
            <CardDescription>
              Configura tu salario y preferencias de visualización.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Base de Pago</FieldLabel>
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
                    <SelectTrigger>
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
                <FieldLabel>Monto del Salario</FieldLabel>
                <FieldContent>
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
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Moneda</FieldLabel>
                <FieldContent>
                  <Select
                    value={paySettings.currency}
                    onValueChange={(v) =>
                      updatePaySettings({
                        currency: v ?? paySettings.currency,
                      })
                    }
                  >
                    <SelectTrigger>
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

              <Field>
                <FieldLabel>Otros Ingresos / Bonificaciones</FieldLabel>
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
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mostrar Salario Como</FieldLabel>
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
                    <SelectTrigger>
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
            </FieldGroup>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSavePay} disabled={isSaving}>
                <Save className="mr-2 size-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "rules" && (
        <Card>
          <CardHeader>
            <CardTitle>Conjuntos de Reglas Laborales</CardTitle>
            <CardDescription>
              Las reglas activas se aplican automáticamente según la fecha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ruleSets.map((rs) => (
                <div key={rs.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{rs.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Desde: {rs.effectiveFrom}
                        {rs.effectiveTo && ` - Hasta: ${rs.effectiveTo}`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Jornada semanal máxima: {rs.legalWeeklyMaxHours}h
                      </p>
                    </div>
                    {settings?.activeRuleSetId === rs.id && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Diurno: </span>
                      {rs.daytimeStart} - {rs.daytimeEnd}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nocturno: </span>
                      {rs.nighttimeStart} - {rs.nighttimeEnd}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Recargo nocturno:{" "}
                      </span>
                      {rs.ordinaryNightSurchargePct}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Hora extra diurna:{" "}
                      </span>
                      +{rs.daytimeOvertimePct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle>Registros Guardados</CardTitle>
            <CardDescription>
              Gestiona tus registros de horas trabajadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay registros guardados.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {parseDateKey(log.date).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "long",
                          weekday: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getDayTypeLabel(log.dayType)} •{" "}
                        {log.calculationSnapshot
                          ? `${Math.round(log.calculationSnapshot.totalWorkedMinutes / 60)}h trabajadas`
                          : `${log.segments.length} segmento(s)`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLogToDelete(log)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={logToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLogToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
            <AlertDialogDescription>
              {logToDelete &&
                `Vas a eliminar el registro del ${parseDateKey(
                  logToDelete.date
                ).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                  year: "numeric",
                })}. Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingLog}
              onClick={handleDeleteLog}
              variant="destructive"
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
