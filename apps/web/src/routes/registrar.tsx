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
    <div className="container mx-auto max-w-5xl px-4 py-8 pb-32">
      <div className="mb-10 flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-spring">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-secondary/60 transition-transform active:scale-95 ease-spring">
            <ArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Registrar Horas</h1>
          <p className="text-base font-medium text-muted-foreground capitalize mt-1.5">{dayName}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300">
            <CardContent className="p-0 flex justify-center w-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="w-full p-4 sm:p-5 [--cell-size:11.5vw] sm:[--cell-size:3.2rem] md:[--cell-size:3rem] mx-auto flex justify-center"
              />
            </CardContent>
            <div className="p-4 border-t border-border/20 bg-secondary/10">
              <Button
                variant="secondary"
                className="w-full h-14 text-base font-medium rounded-2xl transition-transform active:scale-[0.98] ease-spring bg-background/50 hover:bg-background/80"
                onClick={duplicatePreviousDay}
              >
                <Copy className="mr-2 size-5" />
                Copiar del día anterior
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-500 ease-spring hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(var(--primary),0.08)]">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
                Tipo de Día
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ToggleGroup
                type="single"
                value={dayType}
                onValueChange={(v) => v && setDayType(v as typeof dayType)}
                className="justify-start gap-3 bg-secondary/20 p-2 rounded-2xl flex w-full overflow-x-auto scrollbar-none"
              >
                <ToggleGroupItem value="ordinary" className="rounded-xl h-12 text-sm font-medium px-5 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-md data-[state=on]:text-primary transition-all duration-300 ease-spring">
                  Ordinario
                </ToggleGroupItem>
                <ToggleGroupItem value="sunday" className="rounded-xl h-12 text-sm font-medium px-5 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-md data-[state=on]:text-primary transition-all duration-300 ease-spring">
                  Domingo
                </ToggleGroupItem>
                <ToggleGroupItem value="holiday" className="rounded-xl h-12 text-sm font-medium px-5 sm:flex-1 data-[state=on]:bg-background data-[state=on]:shadow-md data-[state=on]:text-primary transition-all duration-300 ease-spring">
                  Festivo
                </ToggleGroupItem>
              </ToggleGroup>
              {targetHours > 0 && (
                <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>
                  Horas objetivo para este día: <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-md">{targetHours}h</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-500 ease-spring hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(var(--primary),0.08)]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Clock className="size-5" />
                </div>
                Jornada Laboral
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={addSegment} className="rounded-xl h-10 px-4 shadow-sm bg-background/60 hover:bg-background/90 transition-all ease-spring">
                <Plus className="mr-1.5 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <FieldGroup className="gap-4">
                {segments.map((segment, index) => (
                  <div key={segment.id} className="group flex flex-col sm:flex-row items-end gap-4 p-4 sm:p-4 rounded-2xl border border-border/20 bg-secondary/10 transition-all duration-300 ease-spring hover:border-border/40 hover:bg-secondary/20 shadow-sm">
                    <div className="flex w-full gap-4">
                      <Field className="flex-1">
                        <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Inicio</FieldLabel>
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
                            className="h-14 text-base font-semibold bg-background shadow-sm border-border/30 focus-visible:ring-primary/30 rounded-xl px-4"
                          />
                        </FieldContent>
                      </Field>
                      <Field className="flex-1">
                        <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Fin</FieldLabel>
                        <FieldContent>
                          <Input
                            type="time"
                            value={segment.endTime}
                            onChange={(e) =>
                              updateSegment(segment.id, "endTime", e.target.value)
                            }
                            className="h-14 text-base font-semibold bg-background shadow-sm border-border/30 focus-visible:ring-primary/30 rounded-xl px-4"
                          />
                        </FieldContent>
                      </Field>
                    </div>
                    {segments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSegment(segment.id)}
                        className="w-full sm:w-14 h-14 mt-2 sm:mt-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ease-spring"
                      >
                        <Trash2 className="size-5" />
                        <span className="sm:hidden ml-2 font-medium">Eliminar</span>
                      </Button>
                    )}
                  </div>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-500 ease-spring hover:border-border/50 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                  <Calculator className="size-5" />
                </div>
                Descansos <span className="text-sm font-normal text-muted-foreground ml-1 bg-secondary/50 px-2 py-0.5 rounded-md">(No remunerados)</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addBreak} className="rounded-xl h-10 px-4 bg-background/30 transition-all ease-spring">
                <Plus className="mr-1.5 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {breaks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/40 p-8 text-center bg-secondary/5">
                  <p className="text-[15px] font-medium text-muted-foreground">
                    No has registrado descansos
                  </p>
                </div>
              ) : (
                <FieldGroup className="gap-4">
                  {breaks.map((breakSegment) => (
                    <div key={breakSegment.id} className="group flex flex-col sm:flex-row items-end gap-4 p-4 sm:p-4 rounded-2xl border border-border/20 bg-secondary/10 transition-all duration-300 ease-spring hover:border-border/40 hover:bg-secondary/20 shadow-sm">
                      <div className="flex w-full gap-4">
                        <Field className="flex-1">
                          <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Inicio</FieldLabel>
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
                              className="h-14 text-base font-semibold bg-background shadow-sm border-border/30 focus-visible:ring-primary/30 rounded-xl px-4"
                            />
                          </FieldContent>
                        </Field>
                        <Field className="flex-1">
                          <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Fin</FieldLabel>
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
                              className="h-14 text-base font-semibold bg-background shadow-sm border-border/30 focus-visible:ring-primary/30 rounded-xl px-4"
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBreak(breakSegment.id)}
                        className="w-full sm:w-14 h-14 mt-2 sm:mt-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ease-spring"
                      >
                        <Trash2 className="size-5" />
                        <span className="sm:hidden ml-2 font-medium">Eliminar</span>
                      </Button>
                    </div>
                  ))}
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-500 ease-spring hover:border-border/50 hover:shadow-lg">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-xl">Notas</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Input
                placeholder="Escribe una nota opcional sobre este día..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-14 text-base bg-secondary/10 border-border/30 focus-visible:ring-primary/30 rounded-xl px-5 shadow-inner"
              />
            </CardContent>
          </Card>

          {calcPreview && (
            <Card className="border-primary/20 bg-primary/5 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-top-8 duration-700 ease-spring overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="pb-3 px-6 pt-6 relative">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Calculator className="size-5" />
                  </div>
                  Estimación de la Jornada
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3 px-6 pb-6 relative">
                <div className="rounded-2xl bg-background/60 p-5 border border-primary/10 backdrop-blur-md shadow-sm transition-transform hover:scale-105 duration-300 ease-spring">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Horas Trabajadas
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatMinutesAsHours(calcPreview.workedMinutes)}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/60 p-5 border border-primary/10 backdrop-blur-md shadow-sm transition-transform hover:scale-105 duration-300 ease-spring">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Horas Extra</p>
                  <p className={cn("text-3xl font-bold", calcPreview.overtimeMinutes > 0 ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "text-foreground")}>
                    {formatMinutesAsHours(calcPreview.overtimeMinutes)}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/15 p-5 border border-primary/20 backdrop-blur-md shadow-sm transition-transform hover:scale-105 duration-300 ease-spring">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">Pago Estimado</p>
                  <p className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.3)]">
                    {paySettings.currency === "COP"
                      ? `$${calcPreview.estimatedPay.toLocaleString()}`
                      : `${paySettings.currency} ${calcPreview.estimatedPay.toFixed(2)}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="hidden sm:flex flex-col sm:flex-row gap-5 pt-6">
            <Button 
              onClick={calculatePreview} 
              variant="outline" 
              size="lg" 
              className="flex-1 h-16 text-base font-bold rounded-2xl shadow-sm hover:bg-secondary/40 hover:text-foreground transition-all duration-300 ease-spring active:scale-95 bg-background/50 backdrop-blur-sm"
            >
              <Calculator className="mr-2 size-5 text-muted-foreground" />
              Vista Previa
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="lg" 
              className="flex-1 h-16 text-base font-bold rounded-2xl shadow-[0_8px_20px_rgba(var(--primary),0.25)] transition-all duration-300 ease-spring active:scale-95"
            >
              <Save className="mr-2 size-5" />
              {isSaving ? "Guardando..." : "Guardar Registro"}
            </Button>
          </div>
        </div>
      </div>

      {/* High-end Mobile Sticky Bottom Actions as a floating pill */}
      <div className="sm:hidden fixed bottom-28 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="mx-auto max-w-[400px] p-2 bg-background/80 backdrop-blur-3xl border border-border/30 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex items-center gap-2 pointer-events-auto">
          <Button 
            onClick={calculatePreview} 
            variant="secondary" 
            size="icon" 
            className="h-14 w-14 shrink-0 rounded-full shadow-sm bg-secondary/50 hover:bg-secondary transition-transform duration-300 active:scale-90 ease-spring"
          >
            <Calculator className="size-6 text-muted-foreground" />
            <span className="sr-only">Calcular</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            size="lg" 
            className="flex-1 h-14 text-base font-bold rounded-full shadow-lg transition-transform duration-300 active:scale-95 ease-spring"
          >
            <Save className="mr-2 size-5" />
            {isSaving ? "Guardando..." : "Guardar Registro"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});
