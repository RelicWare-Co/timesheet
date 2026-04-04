import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { Calendar } from "@timesheet/ui/components/calendar";
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
  FieldDescription,
} from "@timesheet/ui/components/field";
import { Input } from "@timesheet/ui/components/input";
import { ToggleGroup, ToggleGroupItem } from "@timesheet/ui/components/toggle-group";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Copy, Plus, Save, Trash2, CalendarDays, Calculator } from "lucide-react";
import { useState } from "react";
import { cn } from "@timesheet/ui/lib/utils";

import {
  useHolidays,
  useLegalRuleSets,
  usePaySettings,
  useUserSettings,
  useWeeklyTargets,
  useWorkLogs,
} from "@/hooks/use-timesheet-data";
import { formatDateKey } from "@/lib/date";
import {
  calculateDailyHours,
  calculatePayBreakdown,
  createCalculationSnapshot,
  formatMinutesAsHours,
  getActiveRuleSet,
  getTargetHoursForDay,
} from "@/lib/rules-engine";
import type { WorkLog, WorkSegment, BreakSegment } from "@/lib/types";

interface SegmentInput {
  id: string;
  startTime: string;
  endTime: string;
}

interface BreakInput {
  id: string;
  startTime: string;
  endTime: string;
}

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function RegistrarPage() {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const { targets } = useWeeklyTargets();
  const { paySettings } = usePaySettings();
  const { ruleSets } = useLegalRuleSets();
  const { isHoliday } = useHolidays();
  const { saveLog, logs } = useWorkLogs();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayType, setDayType] = useState<"ordinary" | "sunday" | "holiday">(
    "ordinary"
  );
  const [segments, setSegments] = useState<SegmentInput[]>([
    { endTime: "17:00", id: generateId(), startTime: "09:00" },
  ]);
  const [breaks, setBreaks] = useState<BreakInput[]>([]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [calcPreview, setCalcPreview] = useState<{
    workedMinutes: number;
    overtimeMinutes: number;
    estimatedPay: number;
  } | null>(null);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const dayOfWeek = date.getDay();
      const holidayName = isHoliday(date);
      const dateKey = formatDateKey(date);

      if (dayOfWeek === 0) {
        setDayType("sunday");
      } else if (holidayName) {
        setDayType("holiday");
      } else {
        setDayType("ordinary");
      }

      const existingLog = logs.find((log) => log.date === dateKey);
      if (existingLog) {
        setSegments(
          existingLog.segments.map((segment) => ({
            endTime: segment.endTime,
            id: generateId(),
            startTime: segment.startTime,
          }))
        );
        setBreaks(
          existingLog.breaks.map((breakSegment) => ({
            endTime: breakSegment.endTime,
            id: generateId(),
            startTime: breakSegment.startTime,
          }))
        );
        setNote(existingLog.note);
        setDayType(existingLog.dayType);
      } else {
        setSegments([
          { endTime: "17:00", id: generateId(), startTime: "09:00" },
        ]);
        setBreaks([]);
        setNote("");
      }
    }
  };

  const addSegment = () => {
    setSegments([
      ...segments,
      { endTime: "17:00", id: generateId(), startTime: "09:00" },
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter((segment) => segment.id !== id));
    }
  };

  const addBreak = () => {
    setBreaks([
      ...breaks,
      { endTime: "13:00", id: generateId(), startTime: "12:00" },
    ]);
  };

  const removeBreak = (id: string) => {
    setBreaks(breaks.filter((breakSegment) => breakSegment.id !== id));
  };

  const updateSegment = (
    id: string,
    field: keyof Omit<SegmentInput, "id">,
    value: string
  ) => {
    const updated = [...segments];
    const targetIndex = updated.findIndex((segment) => segment.id === id);

    if (targetIndex === -1) {
      return;
    }

    updated[targetIndex] = { ...updated[targetIndex], [field]: value };
    setSegments(updated);
  };

  const updateBreak = (
    id: string,
    field: keyof Omit<BreakInput, "id">,
    value: string
  ) => {
    const updated = [...breaks];
    const targetIndex = updated.findIndex(
      (breakSegment) => breakSegment.id === id
    );

    if (targetIndex === -1) {
      return;
    }

    updated[targetIndex] = { ...updated[targetIndex], [field]: value };
    setBreaks(updated);
  };

  const duplicatePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDateKey(prevDate);

    const prevLog = logs.find((log) => log.date === prevDateStr);
    if (prevLog) {
      setSegments(
        prevLog.segments.map((segment) => ({
          endTime: segment.endTime,
          id: generateId(),
          startTime: segment.startTime,
        }))
      );
      setBreaks(
        prevLog.breaks.map((breakSegment) => ({
          endTime: breakSegment.endTime,
          id: generateId(),
          startTime: breakSegment.startTime,
        }))
      );
      setNote(`(Copiado del ${format(prevDate, "EEEE d", { locale: es })})`);
    }
  };

  const calculatePreview = () => {
    if (!settings) {
      return;
    }

    const ruleSet = getActiveRuleSet(ruleSets, selectedDate);
    if (!ruleSet) {
      return;
    }

    const targetHours = getTargetHoursForDay(selectedDate, targets);

    const workSegments: WorkSegment[] = segments.map(
      ({ endTime, startTime }) => ({
        endTime,
        startTime,
      })
    );

    const breakSegments: BreakSegment[] = breaks.map(
      ({ endTime, startTime }) => ({
        endTime,
        startTime,
      })
    );

    const calculation = calculateDailyHours(
      selectedDate,
      workSegments,
      breakSegments,
      dayType,
      targetHours,
      ruleSet,
      0
    );

    const payBreakdown = calculatePayBreakdown(
      calculation,
      paySettings,
      ruleSet
    );

    setCalcPreview({
      estimatedPay: payBreakdown.totalEstimatedPay,
      overtimeMinutes: calculation.totalOvertimeMinutes,
      workedMinutes: calculation.totalWorkedMinutes,
    });
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }
    setIsSaving(true);

    const ruleSet = getActiveRuleSet(ruleSets, selectedDate);

    const dateStr = formatDateKey(selectedDate);
    const targetHours = getTargetHoursForDay(selectedDate, targets);

    const workSegments: WorkSegment[] = segments.map(
      ({ endTime, startTime }) => ({
        endTime,
        startTime,
      })
    );

    const breakSegments: BreakSegment[] = breaks.map(
      ({ endTime, startTime }) => ({
        endTime,
        startTime,
      })
    );

    let snapshot = null;
    if (ruleSet) {
      const calculation = calculateDailyHours(
        selectedDate,
        workSegments,
        breakSegments,
        dayType,
        targetHours,
        ruleSet,
        0
      );
      const payBreakdown = calculatePayBreakdown(
        calculation,
        paySettings,
        ruleSet
      );
      snapshot = createCalculationSnapshot(
        calculation,
        payBreakdown,
        ruleSet.id
      );
    }

    const log: WorkLog = {
      breaks: breakSegments,
      calculationSnapshot: snapshot,
      createdAt: new Date(),
      date: dateStr,
      dayType,
      id: generateId(),
      note,
      ruleSetId: ruleSet?.id ?? "",
      segments: workSegments,
      updatedAt: new Date(),
    };

    await saveLog(log);
    setIsSaving(false);
    navigate({ to: "/resumen" });
  };

  const dayName = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
  const targetHours = getTargetHoursForDay(selectedDate, targets);

  if (!settings) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 animate-in fade-in duration-500">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Primero necesitas configurar tu perfil</CardTitle>
            <CardDescription>
              Guarda tus horas objetivo y preferencias de salario antes de
              registrar jornadas.
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
          <h1 className="text-3xl font-extrabold tracking-tight">Registrar Horas</h1>
          <p className="text-sm font-medium text-muted-foreground capitalize mt-1">{dayName}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border/50 bg-card/30 backdrop-blur-xl shadow-sm">
            <CardContent className="p-0 flex justify-center w-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="w-full p-3 sm:p-4 [--cell-size:12vw] sm:[--cell-size:3rem] md:[--cell-size:2.75rem] mx-auto flex justify-center"
              />
            </CardContent>
            <div className="p-4 border-t border-border/40 bg-secondary/20">
              <Button
                variant="secondary"
                className="w-full h-14 sm:h-12 text-base font-medium shadow-sm rounded-xl transition-transform active:scale-[0.98]"
                onClick={duplicatePreviousDay}
              >
                <Copy className="mr-2 size-5" />
                Copiar del día anterior
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                Tipo de Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                type="single"
                value={dayType}
                onValueChange={(v) => v && setDayType(v as typeof dayType)}
                className="justify-start gap-2 bg-secondary/20 p-1.5 rounded-xl flex w-full overflow-x-auto scrollbar-none"
              >
                <ToggleGroupItem value="ordinary" className="rounded-lg px-4 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
                  Ordinario
                </ToggleGroupItem>
                <ToggleGroupItem value="sunday" className="rounded-lg px-4 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
                  Domingo
                </ToggleGroupItem>
                <ToggleGroupItem value="holiday" className="rounded-lg px-4 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
                  Festivo
                </ToggleGroupItem>
              </ToggleGroup>
              {targetHours > 0 && (
                <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-primary/60"></span>
                  Horas objetivo para este día: <span className="font-semibold text-foreground">{targetHours}h</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                Jornada Laboral
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={addSegment} className="rounded-lg shadow-sm">
                <Plus className="mr-1 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-4">
                {segments.map((segment, index) => (
                  <div key={segment.id} className="group flex flex-col sm:flex-row items-end gap-3 p-4 sm:p-3 rounded-2xl border border-transparent bg-secondary/10 transition-all hover:border-border hover:bg-secondary/20">
                    <div className="flex w-full gap-3">
                      <Field className="flex-1">
                        <FieldLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Inicio</FieldLabel>
                        <FieldContent>
                          <Input
                            type="time"
                            value={segment.startTime}
                            onChange={(e) =>
                              updateSegment(
                                segment.id,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="h-14 sm:h-10 text-base sm:text-sm bg-background shadow-sm border-border/50 focus-visible:ring-primary/20"
                          />
                        </FieldContent>
                      </Field>
                      <Field className="flex-1">
                        <FieldLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fin</FieldLabel>
                        <FieldContent>
                          <Input
                            type="time"
                            value={segment.endTime}
                            onChange={(e) =>
                              updateSegment(segment.id, "endTime", e.target.value)
                            }
                            className="h-14 sm:h-10 text-base sm:text-sm bg-background shadow-sm border-border/50 focus-visible:ring-primary/20"
                          />
                        </FieldContent>
                      </Field>
                    </div>
                    {segments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSegment(segment.id)}
                        className="w-full sm:w-10 h-12 sm:h-10 mt-2 sm:mt-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="size-5 sm:size-4" />
                        <span className="sm:hidden ml-2 font-medium">Eliminar segmento</span>
                      </Button>
                    )}
                  </div>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="size-5 text-muted-foreground" />
                Descansos <span className="text-sm font-normal text-muted-foreground">(No remunerados)</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addBreak} className="rounded-lg">
                <Plus className="mr-1 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {breaks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No has registrado descansos
                  </p>
                </div>
              ) : (
                <FieldGroup className="gap-4">
                  {breaks.map((breakSegment) => (
                    <div key={breakSegment.id} className="group flex flex-col sm:flex-row items-end gap-3 p-4 sm:p-3 rounded-2xl border border-transparent bg-secondary/10 transition-all hover:border-border hover:bg-secondary/20">
                      <div className="flex w-full gap-3">
                        <Field className="flex-1">
                          <FieldLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Inicio</FieldLabel>
                          <FieldContent>
                            <Input
                              type="time"
                              value={breakSegment.startTime}
                              onChange={(e) =>
                                updateBreak(
                                  breakSegment.id,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="h-14 sm:h-10 text-base sm:text-sm bg-background shadow-sm border-border/50 focus-visible:ring-primary/20"
                            />
                          </FieldContent>
                        </Field>
                        <Field className="flex-1">
                          <FieldLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fin</FieldLabel>
                          <FieldContent>
                            <Input
                              type="time"
                              value={breakSegment.endTime}
                              onChange={(e) =>
                                updateBreak(
                                  breakSegment.id,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="h-14 sm:h-10 text-base sm:text-sm bg-background shadow-sm border-border/50 focus-visible:ring-primary/20"
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBreak(breakSegment.id)}
                        className="w-full sm:w-10 h-12 sm:h-10 mt-2 sm:mt-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="size-5 sm:size-4" />
                        <span className="sm:hidden ml-2 font-medium">Eliminar descanso</span>
                      </Button>
                    </div>
                  ))}
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-sm transition-all hover:border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Escribe una nota opcional sobre este día..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-secondary/10 border-border/50 focus-visible:ring-primary/20 rounded-xl"
              />
            </CardContent>
          </Card>

          {calcPreview && (
            <Card className="border-primary bg-primary/5 shadow-md animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Calculator className="size-5" />
                  Estimación de la Jornada
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-background/50 p-4 border border-primary/10 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Horas Trabajadas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatMinutesAsHours(calcPreview.workedMinutes)}
                  </p>
                </div>
                <div className="rounded-xl bg-background/50 p-4 border border-primary/10 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Horas Extra</p>
                  <p className={cn("text-2xl font-bold", calcPreview.overtimeMinutes > 0 ? "text-amber-500" : "text-foreground")}>
                    {formatMinutesAsHours(calcPreview.overtimeMinutes)}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-4 border border-primary/20 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">Pago Estimado</p>
                  <p className="text-2xl font-bold text-primary">
                    {paySettings.currency === "COP"
                      ? `$${calcPreview.estimatedPay.toLocaleString()}`
                      : `${paySettings.currency} ${calcPreview.estimatedPay.toFixed(2)}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="hidden sm:flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={calculatePreview} 
              variant="outline" 
              size="lg" 
              className="flex-1 h-14 text-base font-semibold rounded-xl shadow-sm hover:bg-secondary/50 transition-colors"
            >
              <Calculator className="mr-2 size-5 text-muted-foreground" />
              Calcular Vista Previa
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="lg" 
              className="flex-1 h-14 text-base font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="mr-2 size-5" />
              {isSaving ? "Guardando..." : "Guardar Registro"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Actions */}
      <div className="sm:hidden fixed bottom-[4.5rem] left-0 right-0 z-40 p-3 bg-background/80 backdrop-blur-xl border-t border-border/40 flex items-center gap-3">
        <Button 
          onClick={calculatePreview} 
          variant="secondary" 
          size="icon" 
          className="h-12 w-12 shrink-0 rounded-2xl shadow-sm border border-border/50 transition-transform active:scale-[0.96]"
        >
          <Calculator className="size-5 text-muted-foreground" />
          <span className="sr-only">Calcular</span>
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          size="lg" 
          className="flex-1 h-12 text-[15px] font-bold rounded-2xl shadow-md transition-transform active:scale-[0.98]"
        >
          <Save className="mr-2 size-5" />
          {isSaving ? "Guardando..." : "Guardar Registro"}
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});
