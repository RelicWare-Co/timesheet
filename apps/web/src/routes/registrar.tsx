import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import { Calendar } from "@timesheet/ui/components/calendar";
import { Input } from "@timesheet/ui/components/input";
import { cn } from "@timesheet/ui/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Plus, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

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

function BrutalistTimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
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
      if (h === 0) {h = 12;}
      if (h > 12) {h -= 12;}
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
        current = "0" + d;
        setChars(current);
        return;
      }
    }
    if (current.length >= 4) {return;}
    const next = current + d;
    if (next.length === 1 && !/[0-1]/.test(next)) {return;}
    if (next.length === 2) {
      const hr = Number.parseInt(next, 10);
      if (hr < 1 || hr > 12) {return;}
    }
    if (next.length === 3 && !/[0-5]/.test(d)) {return;}
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
    if (h === 12 && period === "AM") {h = 0;}
    else if (h !== 12 && period === "PM") {h += 12;}
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
    if (hNum === 0) {hNum = 12;}
    if (hNum > 12) {hNum -= 12;}
    closedDisplay = `${hNum.toString().padStart(2, "0")}:${cm} ${p}`;
  } else {
    closedDisplay = "--:--";
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        className="w-full text-left border-none shadow-none text-2xl font-black h-12 bg-transparent focus-visible:ring-0 outline-none flex items-center justify-between group active:scale-[0.98] transition-transform px-2"
        onClick={() => setIsOpen(true)}
      >
        <span>{closedDisplay}</span>
        <Clock className="size-5 opacity-20 group-hover:opacity-100 transition-opacity" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-foreground/10">
            <span className="font-black uppercase tracking-widest text-sm">
              {label || "Hora"}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="font-black p-2 -mr-2 opacity-50 hover:opacity-100 active:scale-95 transition-all"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-8 sm:gap-12">
            <div className="flex flex-col items-center gap-6">
              <div className="text-7xl sm:text-8xl font-black tracking-tighter tabular-nums flex items-end">
                {displayTime}
              </div>
              <div className="flex bg-secondary/20 p-1 w-fit">
                <button
                  onClick={() => setPeriod("AM")}
                  className={cn(
                    "px-8 py-4 text-2xl font-black transition-colors uppercase",
                    period === "AM"
                      ? "bg-foreground text-background"
                      : "hover:bg-foreground/10"
                  )}
                >
                  AM
                </button>
                <button
                  onClick={() => setPeriod("PM")}
                  className={cn(
                    "px-8 py-4 text-2xl font-black transition-colors uppercase",
                    period === "PM"
                      ? "bg-foreground text-background"
                      : "hover:bg-foreground/10"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full max-w-[340px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigit(num.toString())}
                  className="bg-secondary/20 h-16 sm:h-20 text-4xl font-black hover:bg-foreground/10 active:bg-foreground active:text-background transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="bg-secondary/20 h-16 sm:h-20 text-2xl font-black hover:bg-foreground/10 active:bg-foreground active:text-background transition-colors flex items-center justify-center text-destructive"
              >
                DEL
              </button>
              <button
                onClick={() => handleDigit("0")}
                className="bg-secondary/20 h-16 sm:h-20 text-4xl font-black hover:bg-foreground/10 active:bg-foreground active:text-background transition-colors"
              >
                0
              </button>
              <button
                onClick={handleConfirm}
                className="bg-foreground text-background h-16 sm:h-20 text-2xl font-black hover:bg-foreground/90 active:scale-95 transition-all flex items-center justify-center"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  useEffect(() => {
    calculatePreview();
  }, [segments, breaks, dayType, selectedDate]);

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
    if (targetIndex === -1) {return;}
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
    if (targetIndex === -1) {return;}
    updated[targetIndex] = { ...updated[targetIndex], [field]: value };
    setBreaks(updated);
  };

  const calculatePreview = () => {
    if (!settings) {return;}
    const ruleSet = getActiveRuleSet(ruleSets, selectedDate);
    if (!ruleSet) {return;}
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

    setCalcPreview({
      estimatedPay: payBreakdown.totalEstimatedPay,
      overtimeMinutes: calculation.totalOvertimeMinutes,
      workedMinutes: calculation.totalWorkedMinutes,
    });
  };

  const handleSave = async () => {
    if (!settings) {return;}
    setIsSaving(true);
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

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">
          Perfil no configurado
        </h2>
        <Link to="/configuracion/inicial">
          <Button
            size="lg"
            className="h-16 w-full text-xl font-bold uppercase tracking-widest rounded-none"
          >
            Configurar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 group"
      >
        <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="mb-16">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
          Registro.
        </h1>
        <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground">
          {dayName}
        </p>
      </div>

      <div className="grid gap-16 md:grid-cols-12">
        {/* Left Col - Context */}
        <div className="md:col-span-5 flex flex-col gap-12">
          {/* Calendar & Copy */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest border-b border-foreground/10 pb-2 mb-6">
              Fecha
            </h3>
            <div className="flex justify-center border border-foreground/10 p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="w-full"
              />
            </div>
          </div>

          {/* Day Type */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest border-b border-foreground/10 pb-2 mb-6">
              Tipo de Día
            </h3>
            <div className="flex flex-col gap-2">
              {(["ordinary", "sunday", "holiday"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDayType(type)}
                  className={cn(
                    "text-left p-4 border transition-colors active:scale-[0.98] uppercase font-bold text-sm tracking-widest",
                    dayType === type
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/10 text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  {type === "ordinary"
                    ? "Ordinario"
                    : (type === "sunday"
                      ? "Domingo"
                      : "Festivo")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col - Times */}
        <div className="md:col-span-7 flex flex-col gap-12">
          {/* Work Segments */}
          <div>
            <div className="flex items-center justify-between border-b border-foreground/10 pb-2 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Jornada
              </h3>
              <button
                onClick={addSegment}
                className="text-xs font-bold uppercase tracking-widest hover:underline"
              >
                + Añadir
              </button>
            </div>
            <div className="space-y-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex-1 w-full border border-foreground/10 p-2 flex items-center bg-background">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                      IN
                    </span>
                    <BrutalistTimePicker
                      value={segment.startTime}
                      onChange={(val) =>
                        updateSegment(segment.id, "startTime", val)
                      }
                    />
                  </div>
                  <span className="hidden sm:block opacity-30">-</span>
                  <div className="flex-1 w-full border border-foreground/10 p-2 flex items-center bg-background">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                      OUT
                    </span>
                    <BrutalistTimePicker
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
                      className="rounded-none shrink-0 border border-transparent hover:border-destructive hover:text-destructive hover:bg-transparent"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Break Segments */}
          <div>
            <div className="flex items-center justify-between border-b border-foreground/10 pb-2 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Descansos
              </h3>
              <button
                onClick={addBreak}
                className="text-xs font-bold uppercase tracking-widest hover:underline"
              >
                + Añadir
              </button>
            </div>
            {breaks.length === 0 ? (
              <div className="border border-foreground/10 border-dashed p-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Sin descansos
              </div>
            ) : (
              <div className="space-y-4">
                {breaks.map((breakSegment) => (
                  <div
                    key={breakSegment.id}
                    className="flex flex-col sm:flex-row items-center gap-2"
                  >
                    <div className="flex-1 w-full border border-foreground/10 p-2 flex items-center bg-secondary/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                        IN
                      </span>
                      <BrutalistTimePicker
                        value={breakSegment.startTime}
                        onChange={(val) =>
                          updateBreak(breakSegment.id, "startTime", val)
                        }
                      />
                    </div>
                    <span className="hidden sm:block opacity-30">-</span>
                    <div className="flex-1 w-full border border-foreground/10 p-2 flex items-center bg-secondary/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                        OUT
                      </span>
                      <BrutalistTimePicker
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
                      className="rounded-none shrink-0 hover:text-destructive hover:bg-transparent"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest border-b border-foreground/10 pb-2 mb-6">
              Notas
            </h3>
            <Input
              placeholder="Escribe algo sobre la jornada..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-16 text-lg font-bold border-foreground/10 rounded-none shadow-none focus-visible:ring-1 focus-visible:ring-foreground bg-transparent"
            />
          </div>

          {/* Actions & Preview */}
          <div className="pt-8 flex flex-col gap-6">
            {calcPreview && (
              <div className="flex items-center justify-between font-black uppercase tracking-widest p-4 border border-foreground/10 bg-foreground text-background">
                <span>Total Horas</span>
                <span className="text-2xl">
                  {formatMinutesAsHours(calcPreview.workedMinutes)}
                </span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-16 w-full text-lg font-black uppercase tracking-widest rounded-none shadow-none transition-transform active:scale-[0.98] border border-foreground bg-foreground hover:bg-foreground/90 text-background"
            >
              <Save className="mr-3 size-6" />
              {isSaving ? "Guardando..." : "Guardar Jornada"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});
