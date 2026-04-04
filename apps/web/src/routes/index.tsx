import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, CalendarDays, Settings } from "lucide-react";

const HomeComponent = () => (
  <div className="container mx-auto px-4 sm:px-8 py-12 md:py-24 max-w-7xl">
    <div className="mb-16 md:mb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-black tracking-tighter leading-[0.85] uppercase mb-8">
        Domina<br />
        Tu<br />
        Tiempo.
      </h1>
      <p className="max-w-2xl text-xl sm:text-2xl font-bold tracking-tight text-muted-foreground uppercase">
        Registro brutalmente simple. Precisión absoluta en horas extra y salarios. Sin fricción.
      </p>
    </div>

    <div className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2 lg:grid-cols-3">
      
      {/* Primary Action Card */}
      <Link to="/registrar" className="group relative bg-background p-8 md:p-12 hover:bg-foreground hover:text-background transition-colors duration-300 md:col-span-2 lg:col-span-1 min-h-[320px] flex flex-col justify-between">
        <div>
          <Clock className="size-10 mb-6" strokeWidth={2} />
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Registrar</h2>
          <p className="text-sm font-bold uppercase tracking-widest opacity-60">Jornada actual</p>
        </div>
        <div className="flex justify-end">
          <ArrowRight className="size-12 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring" strokeWidth={1.5} />
        </div>
      </Link>

      <Link to="/resumen" className="group relative bg-background p-8 md:p-12 hover:bg-foreground hover:text-background transition-colors duration-300 min-h-[320px] flex flex-col justify-between">
        <div>
          <CalendarDays className="size-10 mb-6" strokeWidth={2} />
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Resumen</h2>
          <p className="text-sm font-bold uppercase tracking-widest opacity-60">Balance semanal</p>
        </div>
        <div className="flex justify-end">
          <ArrowRight className="size-12 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring" strokeWidth={1.5} />
        </div>
      </Link>

      <Link to="/configuracion" className="group relative bg-background p-8 md:p-12 hover:bg-foreground hover:text-background transition-colors duration-300 min-h-[320px] flex flex-col justify-between">
        <div>
          <Settings className="size-10 mb-6" strokeWidth={2} />
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Ajustes</h2>
          <p className="text-sm font-bold uppercase tracking-widest opacity-60">Reglas y salario</p>
        </div>
        <div className="flex justify-end">
          <ArrowRight className="size-12 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring" strokeWidth={1.5} />
        </div>
      </Link>
      
    </div>
  </div>
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
