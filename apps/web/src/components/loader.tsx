import { Loader2 } from "lucide-react";
import { cn } from "@timesheet/ui/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-4 animate-in fade-in duration-500", className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Loader2 className="size-10 text-primary animate-spin relative z-10" />
      </div>
      <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Cargando</p>
    </div>
  );
}
