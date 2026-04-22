import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { NumberInput } from "@timesheet/ui/components/number-input";
import { cn } from "@timesheet/ui/lib/utils";
import {
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Calculator,
  ArrowLeft,
} from "lucide-react";
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
  { label: "COP", value: "COP" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
] as const;

type SetupStep = "targets" | "pay" | "rules";

export default function SetupPage() {
  const navigate = useNavigate();
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
    setDraftTargets((current) => ({ ...current, [key]: value }));
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
      navigate({ to: "/" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-8">
        <div className="size-10 shrink-0 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando tu perfil...
        </p>
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 animate-in fade-in duration-700">
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center bg-primary/10 text-primary rounded-2xl">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-3 tracking-tight">
            Todo Listo
          </h1>
          <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            Tu perfil está configurado. Empieza a registrar jornadas y verifica
            que tu empleador calcule correctamente tus horas extra.
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/registrar" className="w-full">
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-xl"
              >
                Registrar mi primera jornada
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 pb-32">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Configuración
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          Define tu jornada y salario para que Timesheet calcule automáticamente
          horas extra y recargos según la ley colombiana.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex size-9 items-center justify-center font-bold text-sm transition-all duration-500 ease-spring rounded-full",
                currentStep === step
                  ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {currentStep === step ? (
                <Check className="size-4" strokeWidth={2.5} />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div className="w-6 sm:w-12 h-1 bg-secondary mx-2 rounded-full" />
            )}
          </div>
        ))}
      </div>

      <div>
        {currentStep === "targets" && (
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Clock className="size-6" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  Horas Objetivo
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cuántas horas trabajas cada día.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {DAYS_OF_WEEK.map((day) => (
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
                      value={draftTargets[day.key]}
                      onValueChange={(value) =>
                        handleTargetChange(day.key, value)
                      }
                      className="h-10 bg-background border-border font-semibold text-center rounded-lg shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                      h
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                className="h-12 px-6 font-semibold rounded-xl"
                onClick={() => setCurrentStep("pay")}
              >
                Siguiente <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "pay" && (
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-xl text-accent">
                <DollarSign className="size-6" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  Salario
                </h2>
                <p className="text-sm text-muted-foreground">
                  Para estimar pagos extra.
                </p>
              </div>
            </div>

            <div className="space-y-5">
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
                          setDraftPaySettings((c) => ({
                            ...c,
                            basis: opt.value,
                          }))
                        }
                        className={cn(
                          "text-sm font-medium p-3 text-left transition-all rounded-xl border",
                          draftPaySettings.basis === opt.value
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
                          setDraftPaySettings((c) => ({
                            ...c,
                            currency: opt.value,
                          }))
                        }
                        className={cn(
                          "text-sm font-medium p-3 text-left transition-all rounded-xl border",
                          draftPaySettings.currency === opt.value
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
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <NumberInput
                    min="0"
                    step="0.01"
                    value={draftPaySettings.amount}
                    onValueChange={(value) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        amount: value,
                      }))
                    }
                    className="h-14 pl-12 font-bold text-xl rounded-xl shadow-none border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Bonos Fijos
                  </div>
                  <NumberInput
                    min="0"
                    step="0.01"
                    value={draftPaySettings.allowances}
                    onValueChange={(value) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        allowances: value,
                      }))
                    }
                    className="h-12 font-semibold rounded-xl shadow-none border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Mostrar salario
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {DISPLAY_MODE_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() =>
                          setDraftPaySettings((c) => ({
                            ...c,
                            salaryDisplayMode: opt.value,
                          }))
                        }
                        className={cn(
                          "text-xs font-medium p-2.5 text-left transition-all rounded-xl border",
                          draftPaySettings.salaryDisplayMode === opt.value
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

            <div className="mt-8 flex justify-between gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-6 font-semibold rounded-xl"
                onClick={() => setCurrentStep("targets")}
              >
                <ArrowLeft className="mr-2 size-4" /> Atrás
              </Button>
              <Button
                size="lg"
                className="h-12 px-6 font-semibold rounded-xl"
                onClick={() => setCurrentStep("rules")}
              >
                Siguiente <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "rules" && (
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-secondary rounded-xl text-secondary-foreground">
                <Calculator className="size-6" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  Reglas Laborales
                </h2>
                <p className="text-sm text-muted-foreground">
                  Leyes de tu país.
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 mb-6">
              <Check
                className="size-5 shrink-0 mt-0.5 text-primary"
                strokeWidth={2.5}
              />
              <p className="text-sm font-medium text-foreground">
                Reglas de Colombia cargadas. Se aplicarán automáticamente a tus
                registros para calcular recargos nocturnos, horas extra y
                dominicales/festivas.
              </p>
            </div>

            <div className="space-y-3">
              {ruleSets.map((ruleSet) => (
                <button
                  type="button"
                  key={ruleSet.id}
                  className={cn(
                    "p-4 border cursor-pointer transition-all duration-300 flex items-center justify-between text-left w-full rounded-xl",
                    selectedRuleSetId === ruleSet.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-secondary/30"
                  )}
                  onClick={() => setSelectedRuleSetId(ruleSet.id)}
                >
                  <div>
                    <p className="font-bold text-base">{ruleSet.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      Desde: {ruleSet.effectiveFrom}
                    </p>
                  </div>
                  {selectedRuleSetId === ruleSet.id && (
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                      <Check className="size-4" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-6 font-semibold rounded-xl"
                onClick={() => setCurrentStep("pay")}
              >
                <ArrowLeft className="mr-2 size-4" /> Atrás
              </Button>
              <Button
                size="lg"
                onClick={handleSaveSetup}
                disabled={isSaving}
                className="h-12 px-6 font-semibold rounded-xl"
              >
                {isSaving ? "Guardando..." : "Finalizar y Comenzar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/configuracion/inicial")({
  component: SetupPage,
});
