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
      <div className="flex min-h-[50vh] items-center justify-center p-8 animate-in fade-in ease-spring duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="size-16 rounded-[2rem] border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_30px_rgba(var(--primary),0.2)]" />
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-sm">Preparando tu entorno...</p>
        </div>
      </div>
    );
  }

  if (settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 animate-in fade-in zoom-in-95 duration-700 ease-spring">
        <Card className="border-border/30 bg-background/40 backdrop-blur-3xl shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.4)] overflow-hidden relative rounded-[2.5rem]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent opacity-100 pointer-events-none" />
          <CardHeader className="text-center pt-14 pb-8 relative">
            <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary shadow-inner border border-primary/20 transition-transform hover:scale-110 duration-500 ease-spring">
              <Check className="size-12" />
            </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight">¡Todo Listo!</CardTitle>
            <CardDescription className="text-lg mt-3 text-balance font-medium text-muted-foreground/80">
              Tu entorno de trabajo está configurado y listo para calcular tus horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-8 sm:px-12 pb-12 relative">
            <Link to="/registrar" className="w-full">
              <Button size="lg" className="w-full text-[17px] font-bold rounded-2xl h-16 shadow-[0_8px_24px_rgba(var(--primary),0.25)] transition-transform active:scale-95 ease-spring">
                Comenzar a Registrar Horas
                <ChevronRight className="ml-2 size-6" />
              </Button>
            </Link>
            <Link to="/configuracion" className="w-full">
              <Button size="lg" variant="secondary" className="w-full text-[17px] font-bold rounded-2xl h-16 shadow-sm bg-secondary/60 hover:bg-secondary transition-transform active:scale-95 ease-spring border border-border/30">
                <Settings className="mr-3 size-5" />
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
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700 ease-spring">
        <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-bold tracking-widest uppercase text-primary shadow-sm backdrop-blur-md">
          <Sparkles className="mr-2 size-4" />
          Configuración Rápida
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">Configura tu perfil</h1>
        <p className="text-xl text-muted-foreground/80 max-w-[28rem] mx-auto text-balance leading-relaxed">
          Solo necesitamos algunos datos para que el sistema calcule todo automáticamente.
        </p>
      </div>

      <div className="mb-10 flex gap-3 animate-in fade-in duration-700 delay-150 fill-mode-both ease-spring">
        {(["targets", "pay", "rules"] as SetupStep[]).map((step, index) => (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center justify-center sm:justify-start gap-4 rounded-2xl border p-4 sm:px-6 transition-all duration-500 ease-spring",
              currentStep === step
                ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                : "border-border/30 bg-background/40 backdrop-blur-md text-muted-foreground opacity-60"
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all duration-500 ease-spring",
                currentStep === step
                  ? "bg-primary text-primary-foreground shadow-sm scale-110"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {currentStep === step ? <Check className="size-5" /> : index + 1}
            </div>
            <span className={cn("hidden sm:inline font-bold text-[15px] uppercase tracking-wider", currentStep === step ? "text-foreground" : "")}>
              {step === "targets" && "Horas"}
              {step === "pay" && "Salario"}
              {step === "rules" && "Reglas"}
            </span>
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 fill-mode-both ease-spring">
        {currentStep === "targets" && (
          <Card className="border-border/30 bg-background/40 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-[2.5rem]">
            <CardHeader className="pb-8 pt-10 px-8 sm:px-10">
              <CardTitle className="text-3xl font-extrabold flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Clock className="size-7" />
                </div>
                Horas Objetivo
              </CardTitle>
              <CardDescription className="text-[17px] mt-3 leading-relaxed font-medium text-muted-foreground/80">
                ¿Cuántas horas esperas trabajar cada día de la semana? Esto nos ayuda a calcular tu balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 sm:px-10 pb-10">
              <FieldGroup className="gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-4 sm:px-5 rounded-2xl bg-secondary/10 hover:bg-secondary/30 transition-colors duration-300 ease-spring border border-transparent hover:border-border/30 shadow-sm">
                    <FieldLabel className="text-[15px] font-bold capitalize text-foreground m-0">{day.label}</FieldLabel>
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
                        className="h-14 bg-background shadow-inner text-center font-extrabold text-lg rounded-xl border-border/30 focus-visible:ring-primary/30"
                      />
                    </div>
                  </div>
                ))}
              </FieldGroup>
              <div className="mt-10 flex justify-end">
                <Button size="lg" className="h-16 rounded-2xl px-10 text-[17px] font-bold shadow-[0_8px_20px_rgba(var(--primary),0.2)] transition-transform active:scale-95 ease-spring" onClick={() => setCurrentStep("pay")}>
                  Continuar
                  <ChevronRight className="ml-2 size-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "pay" && (
          <Card className="border-border/30 bg-background/40 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-[2.5rem]">
            <CardHeader className="pb-8 pt-10 px-8 sm:px-10">
              <CardTitle className="text-3xl font-extrabold flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <DollarSign className="size-7" />
                </div>
                Configuración de Salario
              </CardTitle>
              <CardDescription className="text-[17px] mt-3 leading-relaxed font-medium text-muted-foreground/80">
                Usamos esto para estimar tus ingresos, incluyendo horas extra y recargos.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 sm:px-10 pb-10">
              <FieldGroup className="gap-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Base de Pago</FieldLabel>
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
                        value={draftPaySettings.currency}
                        onValueChange={(v) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            currency: v ?? current.currency,
                          }))
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
                        value={draftPaySettings.amount}
                        onChange={(e) =>
                          setDraftPaySettings((current) => ({
                            ...current,
                            amount: Number(e.target.value),
                          }))
                        }
                        className="pl-14 h-16 text-xl font-extrabold rounded-2xl bg-background shadow-inner border-border/30 focus-visible:ring-primary/30"
                      />
                    </div>
                  </FieldContent>
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Otros Ingresos Fijos</FieldLabel>
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
                        className="h-14 text-base font-semibold rounded-2xl bg-background shadow-inner border-border/30 focus-visible:ring-primary/30 px-4"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Mostrar Salario Como</FieldLabel>
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
              <div className="mt-10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <Button size="lg" variant="ghost" className="h-16 rounded-2xl px-8 text-base font-bold transition-colors hover:bg-secondary/60 active:scale-95 ease-spring" onClick={() => setCurrentStep("targets")}>
                  Atrás
                </Button>
                <Button size="lg" className="h-16 rounded-2xl px-10 text-[17px] font-bold shadow-[0_8px_20px_rgba(var(--primary),0.2)] transition-transform active:scale-95 ease-spring" onClick={() => setCurrentStep("rules")}>
                  Continuar
                  <ChevronRight className="ml-2 size-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "rules" && (
          <Card className="border-border/30 bg-background/40 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-[2.5rem]">
            <CardHeader className="pb-8 pt-10 px-8 sm:px-10">
              <CardTitle className="text-3xl font-extrabold flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Calculator className="size-7" />
                </div>
                Reglas Laborales
              </CardTitle>
              <CardDescription className="text-[17px] mt-3 leading-relaxed font-medium text-muted-foreground/80">
                Define las reglas que aplican a tu país o contrato para el cálculo de horas extra.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 sm:px-10 pb-10">
              <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex gap-4 shadow-sm">
                <Sparkles className="size-6 text-primary shrink-0 mt-0.5" />
                <p className="text-[15px] text-foreground leading-relaxed">
                  Las reglas laborales actualizadas de <span className="font-extrabold bg-primary/10 px-2 py-0.5 rounded-md">Colombia</span> se han cargado automáticamente. 
                  El sistema aplicará las reglas correctas según la fecha que registres.
                </p>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel className="font-bold text-muted-foreground uppercase tracking-widest text-[11px] mb-2">Conjunto Principal</FieldLabel>
                  <FieldContent>
                    <Select
                      value={selectedRuleSetId}
                      onValueChange={(value) => setSelectedRuleSetId(value ?? "")}
                    >
                      <SelectTrigger className="h-14 text-base font-semibold rounded-2xl bg-secondary/10 border-border/30 focus:ring-primary/30 shadow-sm px-4 hover:bg-secondary/20 transition-colors">
                        <SelectValue placeholder="Selecciona una regla" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/30 bg-background/80 backdrop-blur-xl">
                        {ruleSets.map((ruleSet) => (
                          <SelectItem key={ruleSet.id} value={ruleSet.id} className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary">
                            {ruleSet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <div className="mt-8 space-y-4">
                {ruleSets.map((ruleSet) => (
                  <div
                    key={ruleSet.id}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border p-5 transition-all duration-500 ease-spring",
                      selectedRuleSetId === ruleSet.id 
                        ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                        : "border-border/40 bg-secondary/10 opacity-60 grayscale-[50%] hover:opacity-100 hover:grayscale-0 cursor-pointer"
                    )}
                    onClick={() => setSelectedRuleSetId(ruleSet.id)}
                  >
                    <div>
                      <p className={cn("font-extrabold text-lg", selectedRuleSetId === ruleSet.id ? "text-primary" : "text-foreground")}>
                        {ruleSet.name}
                      </p>
                      <p className="text-[13px] font-semibold text-muted-foreground mt-1.5 bg-background/50 inline-block px-2 py-0.5 rounded-md">
                        Desde: {ruleSet.effectiveFrom}
                        {ruleSet.effectiveTo &&
                          ` - Hasta: ${ruleSet.effectiveTo}`}
                      </p>
                    </div>
                    {selectedRuleSetId === ruleSet.id && (
                      <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.5)] transition-all ease-spring">
                        <Check className="size-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <Button size="lg" variant="ghost" className="h-16 rounded-2xl px-8 text-base font-bold transition-colors hover:bg-secondary/60 active:scale-95 ease-spring" onClick={() => setCurrentStep("pay")}>
                  Atrás
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleSaveSetup} 
                  disabled={isSaving}
                  className="h-16 rounded-2xl px-10 text-[17px] font-bold shadow-[0_8px_24px_rgba(var(--primary),0.25)] transition-transform active:scale-95 ease-spring"
                >
                  {isSaving ? "Guardando..." : "Finalizar y Comenzar"}
                  {!isSaving && <Sparkles className="ml-2 size-5" />}
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
