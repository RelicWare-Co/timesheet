import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Check, ChevronRight, Clock, DollarSign, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { useLegalRuleSets, useUserSettings } from "@/hooks/use-timesheet-data";
import {
  DEFAULT_PAY_SETTINGS,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_TARGET_HOURS,
} from "@/lib/defaults";
import { getActiveRuleSet } from "@/lib/rules-engine";

const DAYS_OF_WEEK = [
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

type SetupStep = "targets" | "pay" | "rules";

export default function SetupPage() {
  const { settings, loading, saveSettings } = useUserSettings();
  const { ruleSets } = useLegalRuleSets();
  const [currentStep, setCurrentStep] = useState<SetupStep>("targets");
  const [draftTargets, setDraftTargets] = useState(DEFAULT_WEEKLY_TARGET_HOURS);
  const [draftPaySettings, setDraftPaySettings] =
    useState(DEFAULT_PAY_SETTINGS);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ruleSets.length === 0) {
      return;
    }

    const activeRuleSetId =
      getActiveRuleSet(ruleSets, new Date())?.id ?? ruleSets[0]?.id ?? "";

    setSelectedRuleSetId((current) => current || activeRuleSetId);
  }, [ruleSets]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setDraftTargets(settings.weeklyTargetHours);
    setDraftPaySettings(settings.paySettings);
    setSelectedRuleSetId(settings.activeRuleSetId);
  }, [settings]);

  const handleTargetChange = (
    key: keyof typeof draftTargets,
    value: number
  ) => {
    setDraftTargets((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveSetup = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        activeRuleSetId:
          selectedRuleSetId ||
          getActiveRuleSet(ruleSets, new Date())?.id ||
          ruleSets[0]?.id ||
          "",
        locale: "es-CO",
        paySettings: draftPaySettings,
        timezone: DEFAULT_TIMEZONE,
        weeklyTargetHours: draftTargets,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>¡Configuración Completada!</CardTitle>
            <CardDescription>
              Tu hoja de tiempos está lista para usar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground">
              Puedes comenzar a registrar tus horas trabajadas o ajustar tu
              configuración en cualquier momento.
            </p>
            <div className="flex gap-3">
              <Link to="/registrar">
                <Button>
                  Registrar Horas
                  <ChevronRight className="ml-1" />
                </Button>
              </Link>
              <Link to="/configuracion">
                <Button variant="outline">
                  <Settings className="mr-1" />
                  Configuración
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración Inicial</h1>
        <p className="text-muted-foreground">
          Configura tus horas objetivo y preferencias de pago.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-lg border p-3 text-sm",
              currentStep === step
                ? "border-primary bg-primary/5 text-primary"
                : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                currentStep === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {currentStep === step ? <Check className="size-3" /> : index + 1}
            </div>
            <span className="hidden sm:inline">
              {step === "targets" && "Horas Objetivo"}
              {step === "pay" && "Salario"}
              {step === "rules" && "Reglas"}
            </span>
          </div>
        ))}
      </div>

      {currentStep === "targets" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Horas Objetivo Semanales
            </CardTitle>
            <CardDescription>
              Configura cuántas horas esperas trabajar cada día de la semana.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {DAYS_OF_WEEK.map((day) => (
                <Field key={day.key}>
                  <FieldLabel>{day.label}</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={draftTargets[day.key]}
                      onChange={(e) =>
                        handleTargetChange(day.key, Number(e.target.value))
                      }
                    />
                  </FieldContent>
                </Field>
              ))}
            </FieldGroup>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setCurrentStep("pay")}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "pay" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Configuración de Salario
            </CardTitle>
            <CardDescription>
              Configura tu salario base y preferencias de visualización.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Base de Pago</FieldLabel>
                <FieldContent>
                  <Select
                    value={draftPaySettings.basis}
                    onValueChange={(v) =>
                      setDraftPaySettings((current) => ({
                        ...current,
                        basis: (v ??
                          current.basis) as typeof draftPaySettings.basis,
                      }))
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
                    value={draftPaySettings.amount}
                    onChange={(e) =>
                      setDraftPaySettings((current) => ({
                        ...current,
                        amount: Number(e.target.value),
                      }))
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Moneda</FieldLabel>
                <FieldContent>
                  <Select
                    value={draftPaySettings.currency}
                    onValueChange={(v) =>
                      setDraftPaySettings((current) => ({
                        ...current,
                        currency: v ?? current.currency,
                      }))
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
                    value={draftPaySettings.allowances}
                    onChange={(e) =>
                      setDraftPaySettings((current) => ({
                        ...current,
                        allowances: Number(e.target.value),
                      }))
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mostrar Salario Como</FieldLabel>
                <FieldContent>
                  <Select
                    value={draftPaySettings.salaryDisplayMode}
                    onValueChange={(v) =>
                      setDraftPaySettings((current) => ({
                        ...current,
                        salaryDisplayMode: (v ??
                          current.salaryDisplayMode) as typeof draftPaySettings.salaryDisplayMode,
                      }))
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
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("targets")}
              >
                Atrás
              </Button>
              <Button onClick={() => setCurrentStep("rules")}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "rules" && (
        <Card>
          <CardHeader>
            <CardTitle>Reglas Laborales</CardTitle>
            <CardDescription>
              Selecciona el conjunto de reglas laborales aplicables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Conjunto activo</FieldLabel>
                <FieldContent>
                  <Select
                    value={selectedRuleSetId}
                    onValueChange={(value) => setSelectedRuleSetId(value ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una regla" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleSets.map((ruleSet) => (
                        <SelectItem key={ruleSet.id} value={ruleSet.id}>
                          {ruleSet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Las reglas laborales de Colombia se cargan automáticamente.
                Puedes cambiarlas más tarde en la configuración.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {ruleSets.map((ruleSet) => (
                <div
                  key={ruleSet.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{ruleSet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Desde: {ruleSet.effectiveFrom}
                      {ruleSet.effectiveTo &&
                        ` - Hasta: ${ruleSet.effectiveTo}`}
                    </p>
                  </div>
                  {selectedRuleSetId === ruleSet.id && (
                    <Check className="text-primary" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("pay")}>
                Atrás
              </Button>
              <Button onClick={handleSaveSetup} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Comenzar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const Route = createFileRoute("/configuracion/inicial")({
  component: SetupPage,
});
