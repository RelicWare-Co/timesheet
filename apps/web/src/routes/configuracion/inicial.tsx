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
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="size-10 border-4 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 animate-in fade-in duration-700">
        <div className="border border-foreground/10 p-10 text-center">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center bg-foreground text-background">
            <Check className="size-8" strokeWidth={3} />
          </div>
          <h1 className="font-heading text-4xl font-black uppercase mb-4 tracking-tighter">
            Todo Listo
          </h1>
          <p className="text-base text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
            Tu perfil está configurado. Empieza a registrar jornadas y verifica
            que tu empleador calcule correctamente tus horas extra.
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/registrar" className="w-full">
              <Button
                size="lg"
                className="w-full h-16 text-lg font-bold uppercase tracking-widest"
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
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-4">
          Configuración
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          Define tu jornada y salario para que Timesheet calcule automáticamente
          horas extra y recargos según la ley colombiana.
        </p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-3">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex size-10 items-center justify-center font-bold transition-all duration-500 ease-spring",
                currentStep === step
                  ? "bg-foreground text-background scale-110"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {currentStep === step ? (
                <Check className="size-5" strokeWidth={3} />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && <div className="w-8 sm:w-16 h-1 bg-secondary mx-3" />}
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
        {currentStep === "targets" && (
          <div className="border border-foreground/10 p-6 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary">
                <Clock className="size-6 text-foreground" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black uppercase tracking-tighter">
                  Horas Objetivo
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Cuántas horas trabajas cada día.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center justify-between p-4 bg-background hover:bg-secondary/20 transition-colors"
                >
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {day.label}
                  </span>
                  <div className="w-24 relative">
                    <NumberInput
                      min="0"
                      max="24"
                      step="0.5"
                      value={draftTargets[day.key]}
                      onValueChange={(value) =>
                        handleTargetChange(day.key, value)
                      }
                      className="h-12 bg-transparent border border-foreground/10 font-black text-center shadow-none focus-visible:ring-1 focus-visible:ring-foreground"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                      h
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                size="lg"
                className="h-14 px-8 font-bold uppercase tracking-widest"
                onClick={() => setCurrentStep("pay")}
              >
                Siguiente <ChevronRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "pay" && (
          <div className="border border-foreground/10 p-6 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary">
                <DollarSign
                  className="size-6 text-foreground"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black uppercase tracking-tighter">
                  Salario
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Para estimar pagos extra.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                    Base
                  </div>
                  <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
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
                          "text-xs font-black uppercase tracking-widest p-3 text-left transition-colors",
                          draftPaySettings.basis === opt.value
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-secondary/20"
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
                  <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
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
                          "text-xs font-black uppercase tracking-widest p-3 text-left transition-colors",
                          draftPaySettings.currency === opt.value
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-secondary/20"
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
                    className="h-16 pl-12 font-black text-xl shadow-none border-foreground/10 focus-visible:ring-1 focus-visible:ring-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
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
                    className="h-14 font-bold shadow-none border-foreground/10 focus-visible:ring-1 focus-visible:ring-foreground"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block">
                    Mostrar
                  </div>
                  <div className="flex flex-col gap-px bg-foreground/10 border border-foreground/10">
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
                          "text-[10px] font-black uppercase tracking-widest p-3 text-left transition-colors",
                          draftPaySettings.salaryDisplayMode === opt.value
                            ? "bg-foreground text-background"
                            : "bg-background hover:bg-secondary/20"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="h-14 px-8 font-bold uppercase tracking-widest"
                onClick={() => setCurrentStep("targets")}
              >
                <ArrowLeft className="mr-2 size-5" /> Atrás
              </Button>
              <Button
                size="lg"
                className="h-14 px-8 font-bold uppercase tracking-widest"
                onClick={() => setCurrentStep("rules")}
              >
                Siguiente <ChevronRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "rules" && (
          <div className="border border-foreground/10 p-6 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary">
                <Calculator
                  className="size-6 text-foreground"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black uppercase tracking-tighter">
                  Reglas Laborales
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Leyes de tu país.
                </p>
              </div>
            </div>

            <div className="p-4 bg-secondary/20 border border-foreground/10 flex gap-3 mb-6">
              <Check className="size-5 shrink-0 mt-0.5" strokeWidth={3} />
              <p className="text-sm font-bold text-foreground">
                Reglas de Colombia cargadas. Se aplicarán automáticamente a tus
                registros para calcular recargos nocturnos, horas extra y
                dominicales/festivas.
              </p>
            </div>

            <div className="space-y-4">
              {ruleSets.map((ruleSet) => (
                <button
                  type="button"
                  key={ruleSet.id}
                  className={cn(
                    "p-5 border cursor-pointer transition-all duration-300 flex items-center justify-between text-left w-full",
                    selectedRuleSetId === ruleSet.id
                      ? "border-foreground bg-foreground/5"
                      : "border-foreground/10 bg-background hover:bg-secondary/20"
                  )}
                  onClick={() => setSelectedRuleSetId(ruleSet.id)}
                >
                  <div>
                    <p className="font-extrabold text-lg uppercase tracking-tighter">
                      {ruleSet.name}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                      Desde: {ruleSet.effectiveFrom}
                    </p>
                  </div>
                  {selectedRuleSetId === ruleSet.id && (
                    <div className="bg-foreground text-background p-1.5">
                      <Check className="size-4" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-between gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="h-14 px-8 font-bold uppercase tracking-widest"
                onClick={() => setCurrentStep("pay")}
              >
                <ArrowLeft className="mr-2 size-5" /> Atrás
              </Button>
              <Button
                size="lg"
                onClick={handleSaveSetup}
                disabled={isSaving}
                className="h-14 px-8 font-bold uppercase tracking-widest"
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
