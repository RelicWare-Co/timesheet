import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { Calendar } from "@timesheet/ui/components/calendar";
import { Textarea } from "@timesheet/ui/components/textarea";
import { cn } from "@timesheet/ui/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  useHolidays,
  useLegalRuleSets,
  usePaySettings,
  useUserSettings,
  useWeeklyTargets,
  useWorkLogs,
} from "@/hooks/use-timesheet-data";
import { formatDateKey, parseDateKey } from "@/lib/date";
import { saveRecentLogDate } from "@/lib/recent-log";
import {
  calculateDailyHours,
  calculatePayBreakdown,
  createCalculationSnapshot,
  formatMinutesAsHours,
  getActiveRuleSet,
  getTargetHoursForDay,
} from "@/lib/rules-engine";
import type { WorkLog } from "@/lib/types";

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

const getDayTypeLabel = (
  dayType: "ordinary" | "sunday" | "holiday"
): string => {
  if (dayType === "ordinary") {
    return "Ordinario";
  }
  if (dayType === "sunday") {
    return "Domingo";
  }
  return "Festivo";
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

interface ValidationError {
  segmentId?: string;
  breakId?: string;
  message: string;
}

const validateSegments = (segs: SegmentInput[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  for (const seg of segs) {
    const start = timeToMinutes(seg.startTime);
    const end = timeToMinutes(seg.endTime);
    if (end <= start) {
      errors.push({
        message: "La salida debe ser después de la entrada",
        segmentId: seg.id,
      });
    }
  }
  for (let idx = 0; idx < segs.length - 1; idx += 1) {
    const currEnd = timeToMinutes(segs[idx].endTime);
    const nextStart = timeToMinutes(segs[idx + 1].startTime);
    if (nextStart < currEnd) {
      errors.push({
        message: "Los segmentos se solapan",
        segmentId: segs[idx + 1].id,
      });
    }
  }
  return errors;
};

const validateBreaks = (
  breaks: BreakInput[],
  segs: SegmentInput[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const workStart = Math.min(...segs.map((s) => timeToMinutes(s.startTime)));
  const workEnd = Math.max(...segs.map((s) => timeToMinutes(s.endTime)));
  for (const b of breaks) {
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    if (end <= start) {
      errors.push({
        breakId: b.id,
        message: "La salida del descanso debe ser después de la entrada",
      });
    }
    if (start < workStart || end > workEnd) {
      errors.push({
        breakId: b.id,
        message: "El descanso debe estar dentro de la jornada",
      });
    }
  }
  return errors;
};

const FriendlyTimePicker = ({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chars, setChars] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [isPristine, setIsPristine] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const parts = (value || "00:00").split(":");
      const hStr = parts[0] || "00";
      const mStr = parts[1] || "00";
      let h = Number.parseInt(hStr, 10);
      const p: "AM" | "PM" = h >= 12 ? "PM" : "AM";
      if (h === 0) {
        h = 12;
      }
      if (h > 12) {
        h -= 12;
      }
      setChars(`${h.toString().padStart(2, "0")}${mStr}`);
      setPeriod(p);
      setIsPristine(true);
    }
  }, [isOpen, value]);

  const handleDigit = (d: string) => {
    let current = chars;
    if (isPristine) {
      current = "";
      setIsPristine(false);
      if (/[2-9]/.test(d)) {
        current = `0${d}`;
        setChars(current);
        return;
      }
    }
    if (current.length >= 4) {
      return;
    }
    const next = current + d;
    if (next.length === 1 && !/[0-1]/.test(next)) {
      return;
    }
    if (next.length === 2) {
      const hr = Number.parseInt(next, 10);
      if (hr < 1 || hr > 12) {
        return;
      }
    }
    if (next.length === 3 && !/[0-5]/.test(d)) {
      return;
    }
    setChars(next);
  };

  const handleBackspace = () => {
    setIsPristine(false);
    setChars(chars.slice(0, -1));
  };

  const handleConfirm = () => {
    const padded = chars.padEnd(4, "0");
    let h = Number.parseInt(padded.slice(0, 2), 10);
    const m = padded.slice(2, 4);
    if (h === 12 && period === "AM") {
      h = 0;
    } else if (h !== 12 && period === "PM") {
      h += 12;
    }
    onChange(`${h.toString().padStart(2, "0")}:${m}`);
    setIsOpen(false);
  };

  const displayChars = chars.padEnd(4, "_");
  const displayTime = `${displayChars.slice(0, 2)}:${displayChars.slice(2, 4)}`;

  let closedDisplay = "";
  if (value) {
    const parts = value.split(":");
    const ch = parts[0] || "00";
    const cm = parts[1] || "00";
    let hNum = Number.parseInt(ch, 10);
    const p = hNum >= 12 ? "PM" : "AM";
    if (hNum === 0) {
      hNum = 12;
    }
    if (hNum > 12) {
      hNum -= 12;
    }
    closedDisplay = `${hNum.toString().padStart(2, "0")}:${cm} ${p}`;
  } else {
    closedDisplay = "--:--";
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        className="w-full text-left border-none shadow-none text-xl font-semibold h-11 bg-transparent focus-visible:ring-0 outline-none flex items-center justify-between group active:scale-[0.98] transition-transform px-3 rounded-lg hover:bg-secondary/50"
        onClick={() => setIsOpen(true)}
      >
        <span>{closedDisplay}</span>
        <Clock className="size-4 opacity-30 group-hover:opacity-60 transition-opacity" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <span className="font-semibold text-sm text-muted-foreground">
              {label || "Hora"}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-semibold p-2 -mr-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all rounded-lg hover:bg-secondary"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-8 sm:gap-10">
            <div className="flex flex-col items-center gap-5">
              <div className="text-6xl sm:text-7xl font-bold tracking-tighter tabular-nums flex items-end font-heading">
                {displayTime}
              </div>
              <div className="flex bg-secondary rounded-xl p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setPeriod("AM")}
                  className={cn(
                    "px-8 py-3 text-xl font-semibold transition-colors uppercase rounded-lg",
                    period === "AM"
                      ? "bg-card text-foreground shadow-sm"
                      : "hover:bg-card/50 text-muted-foreground"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("PM")}
                  className={cn(
                    "px-8 py-3 text-xl font-semibold transition-colors uppercase rounded-lg",
                    period === "PM"
                      ? "bg-card text-foreground shadow-sm"
                      : "hover:bg-card/50 text-muted-foreground"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[320px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handleDigit(num.toString())}
                  className="bg-card border border-border h-14 sm:h-16 text-3xl font-semibold hover:bg-secondary active:bg-primary active:text-primary-foreground transition-colors rounded-xl shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="bg-card border border-border h-14 sm:h-16 text-lg font-semibold hover:bg-secondary active:bg-primary active:text-primary-foreground transition-colors rounded-xl shadow-sm flex items-center justify-center text-destructive"
              >
                DEL
              </button>
              <button
                type="button"
                onClick={() => handleDigit("0")}
                className="bg-card border border-border h-14 sm:h-16 text-3xl font-semibold hover:bg-secondary active:bg-primary active:text-primary-foreground transition-colors rounded-xl shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground h-14 sm:h-16 text-xl font-semibold hover:bg-primary/90 active:scale-95 transition-all rounded-xl shadow-sm flex items-center justify-center"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function RegistrarPage() {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const { targets } = useWeeklyTargets();
  const { paySettings } = usePaySettings();
  const { ruleSets } = useLegalRuleSets();
  const { isHoliday, loading: holidaysLoading } = useHolidays();
  const { saveLog, logs, loading: logsLoading } = useWorkLogs();
  const hasInitializedSelection = useRef(false);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayType, setDayType] = useState<"ordinary" | "sunday" | "holiday">(
    "ordinary"
  );
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [segments, setSegments] = useState<SegmentInput[]>([
    { endTime: "17:00", id: generateId(), startTime: "09:00" },
  ]);
  const [breaks, setBreaks] = useState<BreakInput[]>([]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const calcPreview = useMemo(() => {
    if (!settings) {
      return null;
    }

    const ruleSet = getActiveRuleSet(ruleSets, selectedDate);
    if (!ruleSet) {
      return null;
    }

    const targetHours = getTargetHoursForDay(selectedDate, targets);
    const workSegments = segments.map(({ endTime, startTime }) => ({
      endTime,
      startTime,
    }));
    const breakSegments = breaks.map(({ endTime, startTime }) => ({
      endTime,
      startTime,
    }));
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

    return {
      estimatedPay: payBreakdown.totalEstimatedPay,
      overtimeMinutes: calculation.totalOvertimeMinutes,
      workedMinutes: calculation.totalWorkedMinutes,
    };
  }, [
    breaks,
    dayType,
    paySettings,
    ruleSets,
    segments,
    selectedDate,
    settings,
    targets,
  ]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
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
          setEditingLog(existingLog);
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
          setEditingLog(null);
          setSegments([
            { endTime: "17:00", id: generateId(), startTime: "09:00" },
          ]);
          setBreaks([]);
          setNote("");
        }
      }
    },
    [isHoliday, logs]
  );

  useEffect(() => {
    if (hasInitializedSelection.current) {
      return;
    }

    if (logsLoading || holidaysLoading) {
      return;
    }

    const rawSearchDate =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("date");
    const parsedSearchDate = rawSearchDate ? parseDateKey(rawSearchDate) : null;
    const initialDate =
      parsedSearchDate && !Number.isNaN(parsedSearchDate.getTime())
        ? parsedSearchDate
        : new Date();

    hasInitializedSelection.current = true;
    handleDateSelect(initialDate);
  }, [handleDateSelect, holidaysLoading, logsLoading]);

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
    const targetIndex = updated.findIndex((b) => b.id === id);
    if (targetIndex === -1) {
      return;
    }
    updated[targetIndex] = { ...updated[targetIndex], [field]: value };
    setBreaks(updated);
  };

  useEffect(() => {
    const segErrors = validateSegments(segments);
    const breakErrors = validateBreaks(breaks, segments);
    setErrors([...segErrors, ...breakErrors]);
  }, [segments, breaks]);

  const handleSave = async () => {
    if (!settings) {
      return;
    }
    const segErrors = validateSegments(segments);
    const breakErrors = validateBreaks(breaks, segments);
    const allErrors = [...segErrors, ...breakErrors];
    if (allErrors.length > 0) {
      setErrors(allErrors);
      toast.error("Corrige los errores antes de guardar");
      return;
    }
    setIsSaving(true);
    try {
      const ruleSet = getActiveRuleSet(ruleSets, selectedDate);
      const dateStr = formatDateKey(selectedDate);
      const targetHours = getTargetHoursForDay(selectedDate, targets);

      const workSegments = segments.map(({ endTime, startTime }) => ({
        endTime,
        startTime,
      }));
      const breakSegments = breaks.map(({ endTime, startTime }) => ({
        endTime,
        startTime,
      }));

      let snapshot = editingLog?.calculationSnapshot ?? null;
      let ruleSetId = editingLog?.ruleSetId ?? "";

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
        ruleSetId = ruleSet.id;
      }

      const now = new Date();
      const log: WorkLog = {
        breaks: breakSegments,
        calculationSnapshot: snapshot,
        createdAt: editingLog?.createdAt ?? now,
        date: dateStr,
        dayType,
        id: editingLog?.id ?? generateId(),
        note,
        ruleSetId,
        segments: workSegments,
        updatedAt: now,
      };

      await saveLog(log);
      saveRecentLogDate(dateStr);
      const dayLabel = format(selectedDate, "EEEE d 'de' MMMM", {
        locale: es,
      });
      toast.success(`Registro guardado: ${dayLabel}`);
      navigate({ to: "/resumen" });
    } finally {
      setIsSaving(false);
    }
  };

  const dayName = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

  const getSaveButtonLabel = () => {
    if (isSaving) {
      return "Guardando...";
    }
    if (errors.length > 0) {
      return "Corrige para guardar";
    }
    return "Guardar Jornada";
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving && errors.length === 0) {
          void handleSaveRef.current();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, errors.length]);

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
            <Clock className="size-8" strokeWidth={2} />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3 tracking-tight">
            Perfil no configurado
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Para calcular horas extra, recargos nocturnos y estimaciones de
            salario según la ley colombiana, necesitamos conocer tu jornada
            semanal y condiciones de pago. Tu información se guarda solo en este
            dispositivo.
          </p>
          <Link to="/configuracion/inicial">
            <Button
              size="lg"
              className="h-14 w-full text-lg font-semibold rounded-xl"
            >
              Configurar mi perfil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="mb-10">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          Registro
        </h1>
        <p className="text-lg font-medium text-muted-foreground capitalize">
          {dayName}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Col - Context */}
        <div className="md:col-span-5 flex flex-col gap-8">
          {/* Calendar */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Fecha
            </h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="w-full"
            />
          </div>

          {/* Day Type */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Tipo de Día
            </h3>
            <div className="flex flex-col gap-2">
              {(["ordinary", "sunday", "holiday"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setDayType(type)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all active:scale-[0.98] font-medium text-sm",
                    dayType === type
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                  )}
                >
                  {getDayTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col - Times */}
        <div className="md:col-span-7 flex flex-col gap-8">
          {/* Work Segments */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Jornada
              </h3>
              <button
                type="button"
                onClick={addSegment}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                + Añadir segmento
              </button>
            </div>
            <div className="space-y-3">
              {segments.map((segment) => {
                const segErrors = errors.filter(
                  (e) => e.segmentId === segment.id
                );
                return (
                  <div key={segment.id} className="space-y-1">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div
                        className={cn(
                          "flex-1 w-full rounded-xl border p-2 flex items-center bg-background",
                          segErrors.length > 0
                            ? "border-destructive"
                            : "border-border"
                        )}
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground px-2 uppercase tracking-wide">
                          Entrada
                        </span>
                        <FriendlyTimePicker
                          value={segment.startTime}
                          onChange={(val) =>
                            updateSegment(segment.id, "startTime", val)
                          }
                        />
                      </div>
                      <span className="hidden sm:block text-muted-foreground">
                        →
                      </span>
                      <div
                        className={cn(
                          "flex-1 w-full rounded-xl border p-2 flex items-center bg-background",
                          segErrors.length > 0
                            ? "border-destructive"
                            : "border-border"
                        )}
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground px-2 uppercase tracking-wide">
                          Salida
                        </span>
                        <FriendlyTimePicker
                          value={segment.endTime}
                          onChange={(val) =>
                            updateSegment(segment.id, "endTime", val)
                          }
                        />
                      </div>
                      {segments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSegment(segment.id)}
                          className="shrink-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                    {segErrors[0] && (
                      <p className="text-xs font-medium text-destructive pl-1">
                        {segErrors[0].message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Break Segments */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Descansos
              </h3>
              <button
                type="button"
                onClick={addBreak}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                + Añadir descanso
              </button>
            </div>
            {breaks.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center bg-secondary/30">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Sin descansos registrados
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Añade descansos si tu jornada incluye pausas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {breaks.map((breakSegment) => {
                  const breakErrors = errors.filter(
                    (e) => e.breakId === breakSegment.id
                  );
                  return (
                    <div key={breakSegment.id} className="space-y-1">
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div
                          className={cn(
                            "flex-1 w-full rounded-xl border p-2 flex items-center bg-secondary/30",
                            breakErrors.length > 0
                              ? "border-destructive"
                              : "border-border"
                          )}
                        >
                          <span className="text-[10px] font-semibold text-muted-foreground px-2 uppercase tracking-wide">
                            Inicio
                          </span>
                          <FriendlyTimePicker
                            value={breakSegment.startTime}
                            onChange={(val) =>
                              updateBreak(breakSegment.id, "startTime", val)
                            }
                          />
                        </div>
                        <span className="hidden sm:block text-muted-foreground">
                          →
                        </span>
                        <div
                          className={cn(
                            "flex-1 w-full rounded-xl border p-2 flex items-center bg-secondary/30",
                            breakErrors.length > 0
                              ? "border-destructive"
                              : "border-border"
                          )}
                        >
                          <span className="text-[10px] font-semibold text-muted-foreground px-2 uppercase tracking-wide">
                            Fin
                          </span>
                          <FriendlyTimePicker
                            value={breakSegment.endTime}
                            onChange={(val) =>
                              updateBreak(breakSegment.id, "endTime", val)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBreak(breakSegment.id)}
                          className="shrink-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {breakErrors[0] && (
                        <p className="text-xs font-medium text-destructive pl-1">
                          {breakErrors[0].message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Notas
            </h3>
            <Textarea
              placeholder="Observaciones sobre la jornada: tareas especiales, retrasos justificados, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] text-base font-medium border-border rounded-xl shadow-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-transparent placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Actions & Preview */}
          <div className="flex flex-col gap-4">
            {calcPreview && (
              <div className="flex items-center justify-between font-semibold p-5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                <span>Total Horas</span>
                <span className="text-2xl font-bold tabular-nums">
                  {formatMinutesAsHours(calcPreview.workedMinutes)}
                </span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                Corrige {errors.length} error
                {errors.length > 1 ? "es" : ""} antes de guardar.
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving || errors.length > 0}
              className="h-14 w-full text-lg font-semibold rounded-xl shadow-sm transition-transform active:scale-[0.98]"
            >
              <Save className="mr-2 size-5" />
              {getSaveButtonLabel()}
            </Button>
            <p className="text-xs font-medium text-muted-foreground/60 text-center">
              Atajo: Ctrl + S
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});
