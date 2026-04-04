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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timesheet/ui/components/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

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
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card>
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
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Horas</h1>
          <p className="text-sm text-muted-foreground">{dayName}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card size="sm">
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={duplicatePreviousDay}
            >
              <Copy className="mr-2 size-4" />
              Copiar del día anterior
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Día</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={dayType}
                onValueChange={(v) => setDayType(v as typeof dayType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinary">
                    Ordinario (Lunes a Sábado)
                  </SelectItem>
                  <SelectItem value="sunday">Domingo</SelectItem>
                  <SelectItem value="holiday">Festivo</SelectItem>
                </SelectContent>
              </Select>
              {targetHours > 0 && (
                <FieldDescription className="mt-2">
                  Horas objetivo para este día: {targetHours}h
                </FieldDescription>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Segmentos de Trabajo</CardTitle>
              <Button variant="outline" size="sm" onClick={addSegment}>
                <Plus className="mr-1 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {segments.map((segment) => (
                  <div key={segment.id} className="flex items-end gap-2">
                    <Field className="flex-1">
                      <FieldLabel>Inicio</FieldLabel>
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
                        />
                      </FieldContent>
                    </Field>
                    <Field className="flex-1">
                      <FieldLabel>Fin</FieldLabel>
                      <FieldContent>
                        <Input
                          type="time"
                          value={segment.endTime}
                          onChange={(e) =>
                            updateSegment(segment.id, "endTime", e.target.value)
                          }
                        />
                      </FieldContent>
                    </Field>
                    {segments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSegment(segment.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Descansos (no remunerados)</CardTitle>
              <Button variant="outline" size="sm" onClick={addBreak}>
                <Plus className="mr-1 size-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {breaks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin descansos registrados
                </p>
              ) : (
                <FieldGroup>
                  {breaks.map((breakSegment) => (
                    <div key={breakSegment.id} className="flex items-end gap-2">
                      <Field className="flex-1">
                        <FieldLabel>Inicio</FieldLabel>
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
                          />
                        </FieldContent>
                      </Field>
                      <Field className="flex-1">
                        <FieldLabel>Fin</FieldLabel>
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
                          />
                        </FieldContent>
                      </Field>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBreak(breakSegment.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Agregar nota opcional..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={calculatePreview} variant="outline">
              <Clock className="mr-2 size-4" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 size-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>

          {calcPreview && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-primary">
                  Vista Previa del Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Horas Trabajadas
                  </p>
                  <p className="text-lg font-semibold">
                    {formatMinutesAsHours(calcPreview.workedMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Extra</p>
                  <p className="text-lg font-semibold">
                    {formatMinutesAsHours(calcPreview.overtimeMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pago Estimado</p>
                  <p className="text-lg font-semibold">
                    {paySettings.currency === "COP"
                      ? `$${calcPreview.estimatedPay.toLocaleString()}`
                      : `${paySettings.currency} ${calcPreview.estimatedPay.toFixed(2)}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});
