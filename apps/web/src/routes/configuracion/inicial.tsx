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
import { Check, ChevronRight, Clock, DollarSign, Settings, Calculator, Sparkles } from "lucide-react";
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
      <div className="flex min-h-[50vh] items-center justify-center p-8 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Preparando tu entorno...</p>
        </div>
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <Check className="size-10" />
            </div>
            <CardTitle className="text-3xl font-extrabold">¡Todo Listo!</CardTitle>
            <CardDescription className="text-lg mt-2 text-balance">
              Tu entorno de trabajo está configurado y listo para calcular tus horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-10 pb-10">
            <Link to="/registrar" className="w-full">
              <Button size="lg" className="w-full text-lg rounded-xl h-14 shadow-md transition-transform active:scale-[0.98]">
                Comenzar a Registrar Horas
                <ChevronRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Link to="/configuracion" className="w-full">
              <Button size="lg" variant="secondary" className="w-full text-lg rounded-xl h-14 transition-transform active:scale-[0.98]">
                <Settings className="mr-2 size-5" />
                Ajustes Avanzados
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="mr-2 size-4" />
          Configuración Rápida
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Configura tu perfil</h1>
        <p className="text-lg text-muted-foreground max-w-[28rem] mx-auto text-balance">
          Solo necesitamos algunos datos para que el sistema calcule todo automáticamente.
        </p>
      </div>

      <div className="mb-8 flex gap-2 animate-in fade-in duration-700 delay-150 fill-mode-both">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center justify-center sm:justify-start gap-3 rounded-xl border p-4 transition-all duration-300",
              currentStep === step
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/50 bg-card/30 text-muted-foreground opacity-70"
            )}
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300",
                currentStep === step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {currentStep === step ? <Check className="size-4" /> : index + 1}
            </div>
            <span className={cn("hidden sm:inline font-semibold", currentStep === step ? "text-foreground" : "")}>
              {step === "targets" && "Horas"}
              {step === "pay" && "Salario"}
              {step === "rules" && "Reglas"}
            </span>
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
        {currentStep === "targets" && (
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Clock className="size-6 text-primary" />
                Horas Objetivo
              </CardTitle>
              <CardDescription className="text-base mt-2">
                ¿Cuántas horas esperas trabajar cada día de la semana? Esto nos ayuda a calcular tu balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/50">
                    <FieldLabel className="text-sm font-semibold capitalize text-foreground m-0">{day.label}</FieldLabel>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={draftTargets[day.key]}
                        onChange={(e) =>
                          handleTargetChange(day.key, Number(e.target.value))
                        }
                        className="bg-background text-center font-bold"
                      />
                    </div>
                  </div>
                ))}
              </FieldGroup>
              <div className="mt-8 flex justify-end">
                <Button size="lg" className="rounded-xl px-8 shadow-md transition-transform active:scale-[0.98]" onClick={() => setCurrentStep("pay")}>
                  Continuar
                  <ChevronRight className="ml-2 size-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "pay" && (
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-3">
                <DollarSign className="size-6 text-primary" />
                Configuración de Salario
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Usamos esto para estimar tus ingresos, incluyendo horas extra y recargos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Base de Pago</FieldLabel>
                    <FieldContent>
                      <Select
                        value={draftPaySettings.basis}
                        onValueChange={(v) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            basis: (v ?? current.basis) as typeof draftPaySettings.basis,
                          }))
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
                        value={draftPaySettings.currency}
                        onValueChange={(v) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            currency: v ?? current.currency,
                          }))
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
                        value={draftPaySettings.amount}
                        onChange={(e) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            amount: Number(e.target.value),
                          }))
                        }
                        className="pl-12 h-14 text-lg font-bold rounded-xl bg-secondary/20"
                      />
                    </div>
                  </FieldContent>
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Otros Ingresos Fijos</FieldLabel>
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
                        className="h-12 rounded-xl bg-secondary/20"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Mostrar Salario Como</FieldLabel>
                    <FieldContent>
                      <Select
                        value={draftPaySettings.salaryDisplayMode}
                        onValueChange={(v) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            salaryDisplayMode: (v ?? current.salaryDisplayMode) as typeof draftPaySettings.salaryDisplayMode,
                          }))
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
              <div className="mt-8 flex justify-between">
                <Button size="lg" variant="ghost" className="rounded-xl transition-colors hover:bg-secondary" onClick={() => setCurrentStep("targets")}>
                  Atrás
                </Button>
                <Button size="lg" className="rounded-xl px-8 shadow-md transition-transform active:scale-[0.98]" onClick={() => setCurrentStep("rules")}>
                  Continuar
                  <ChevronRight className="ml-2 size-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "rules" && (
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Calculator className="size-6 text-primary" />
                Reglas Laborales
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Define las reglas que aplican a tu país o contrato para el cálculo de horas extra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Las reglas laborales actualizadas de <span className="font-semibold">Colombia</span> se han cargado automáticamente. 
                  El sistema aplicará las reglas correctas según la fecha que registres.
                </p>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Conjunto Principal</FieldLabel>
                  <FieldContent>
                    <Select
                      value={selectedRuleSetId}
                      onValueChange={(value) => setSelectedRuleSetId(value ?? "")}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-secondary/20 font-medium">
                        <SelectValue placeholder="Selecciona una regla" />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleSets.map((ruleSet) => (
                          <SelectItem key={ruleSet.id} value={ruleSet.id} className="font-medium">
                            {ruleSet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <div className="mt-6 space-y-3">
                {ruleSets.map((ruleSet) => (
                  <div
                    key={ruleSet.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all duration-300",
                      selectedRuleSetId === ruleSet.id 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border/50 bg-secondary/10 opacity-70 grayscale-[50%]"
                    )}
                  >
                    <div>
                      <p className={cn("font-bold", selectedRuleSetId === ruleSet.id ? "text-primary" : "text-foreground")}>
                        {ruleSet.name}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">
                        Desde: {ruleSet.effectiveFrom}
                        {ruleSet.effectiveTo &&
                          ` - Hasta: ${ruleSet.effectiveTo}`}
                      </p>
                    </div>
                    {selectedRuleSetId === ruleSet.id && (
                      <div className="rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
                        <Check className="size-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <Button size="lg" variant="ghost" className="rounded-xl transition-colors hover:bg-secondary" onClick={() => setCurrentStep("pay")}>
                  Atrás
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleSaveSetup} 
                  disabled={isSaving}
                  className="rounded-xl px-8 shadow-md transition-all active:scale-[0.98]"
                >
                  {isSaving ? "Guardando..." : "Finalizar y Comenzar"}
                  {!isSaving && <Sparkles className="ml-2 size-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/configuracion/inicial")({
  component: SetupPage,
});
