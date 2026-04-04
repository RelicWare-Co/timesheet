import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
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
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Calculator,
  Sparkles,
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
        <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 animate-in fade-in zoom-in-95 duration-700 ease-spring">
        <div className="bg-background/60 backdrop-blur-3xl border border-border/40 shadow-sm rounded-[2.5rem] p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-100 pointer-events-none" />
          <div className="relative z-10">
            <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Check className="size-8" strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-extrabold mb-4">¡Todo Listo!</h1>
            <p className="text-lg text-muted-foreground/80 mb-10 max-w-sm mx-auto">
              Tu entorno de trabajo está configurado y listo.
            </p>
            <div className="flex flex-col gap-4">
              <Link to="/registrar" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-bold rounded-2xl shadow-md"
                >
                  Comenzar a Registrar Horas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 pb-32">
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Configuración
        </h1>
        <p className="text-lg font-medium text-muted-foreground/80 text-balance">
          Personaliza tu entorno de trabajo.
        </p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-3">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full font-bold transition-all duration-500 ease-spring",
                currentStep === step
                  ? "bg-foreground text-background scale-110 shadow-md"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {currentStep === step ? (
                <Sparkles className="size-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div className="w-8 sm:w-16 h-1 rounded-full bg-secondary mx-3" />
            )}
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
        {currentStep === "targets" && (
          <div className="bg-background/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary rounded-2xl">
                <Clock className="size-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Horas Objetivo</h2>
                <p className="text-sm font-medium text-muted-foreground/80">
                  Horas diarias esperadas.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 transition-colors hover:bg-secondary/50"
                >
                  <span className="font-bold capitalize">{day.label}</span>
                  <div className="w-24 relative">
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={draftTargets[day.key]}
                      onChange={(e) =>
                        handleTargetChange(day.key, Number(e.target.value))
                      }
                      className="h-12 bg-background/80 border-none font-bold text-center rounded-xl focus:ring-2 focus:ring-primary/20"
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
                className="h-14 px-8 font-bold rounded-full shadow-md"
                onClick={() => setCurrentStep("pay")}
              >
                Siguiente <ChevronRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "pay" && (
          <div className="bg-background/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary rounded-2xl">
                <DollarSign className="size-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Salario</h2>
                <p className="text-sm font-medium text-muted-foreground/80">
                  Para calcular pagos extra.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Base
                  </div>
                  <Select
                    value={draftPaySettings.basis}
                    onValueChange={(v) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        basis: v as typeof c.basis,
                      }))
                    }
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/20 bg-background/80 backdrop-blur-xl">
                      {PAY_BASIS_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="rounded-xl font-bold"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Moneda
                  </div>
                  <Select
                    value={draftPaySettings.currency}
                    onValueChange={(v) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        currency: v ?? c.currency,
                      }))
                    }
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/20 bg-background/80 backdrop-blur-xl">
                      {CURRENCY_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="rounded-xl font-bold"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Monto Base
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftPaySettings.amount}
                    onChange={(e) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        amount: Number(e.target.value),
                      }))
                    }
                    className="h-16 pl-12 rounded-2xl bg-background border-border/40 font-black text-xl focus:ring-2 focus:ring-primary/20 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Bonos Fijos
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftPaySettings.allowances}
                    onChange={(e) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        allowances: Number(e.target.value),
                      }))
                    }
                    className="h-14 rounded-2xl bg-secondary/30 border-none font-bold px-4"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Mostrar
                  </div>
                  <Select
                    value={draftPaySettings.salaryDisplayMode}
                    onValueChange={(v) =>
                      setDraftPaySettings((c) => ({
                        ...c,
                        salaryDisplayMode: v as typeof c.salaryDisplayMode,
                      }))
                    }
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/20 bg-background/80 backdrop-blur-xl">
                      {DISPLAY_MODE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="rounded-xl font-bold"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="h-14 px-8 font-bold rounded-full"
                onClick={() => setCurrentStep("targets")}
              >
                <ArrowLeft className="mr-2 size-5" /> Atrás
              </Button>
              <Button
                size="lg"
                className="h-14 px-8 font-bold rounded-full shadow-md"
                onClick={() => setCurrentStep("rules")}
              >
                Siguiente <ChevronRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "rules" && (
          <div className="bg-background/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary rounded-2xl">
                <Calculator className="size-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Reglas Laborales</h2>
                <p className="text-sm font-medium text-muted-foreground/80">
                  Leyes de tu país.
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex gap-3 mb-6">
              <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-foreground">
                Reglas de Colombia cargadas. Se aplicarán automáticamente.
              </p>
            </div>

            <div className="space-y-4">
              {ruleSets.map((ruleSet) => (
                <button
                  type="button"
                  key={ruleSet.id}
                  className={cn(
                    "p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 flex items-center justify-between text-left w-full",
                    selectedRuleSetId === ruleSet.id
                      ? "border-foreground bg-foreground/5 shadow-sm"
                      : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
                  )}
                  onClick={() => setSelectedRuleSetId(ruleSet.id)}
                >
                  <div>
                    <p className="font-extrabold text-lg">{ruleSet.name}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                      Desde: {ruleSet.effectiveFrom}
                    </p>
                  </div>
                  {selectedRuleSetId === ruleSet.id && (
                    <div className="bg-foreground text-background p-1.5 rounded-full shadow-sm">
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
                className="h-14 px-8 font-bold rounded-full"
                onClick={() => setCurrentStep("pay")}
              >
                <ArrowLeft className="mr-2 size-5" /> Atrás
              </Button>
              <Button
                size="lg"
                onClick={handleSaveSetup}
                disabled={isSaving}
                className="h-14 px-8 font-bold rounded-full shadow-md"
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
