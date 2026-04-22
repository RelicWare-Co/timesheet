import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, CalendarDays, Settings } from "lucide-react";

const HomeComponent = () => (
  <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-5xl">
    <div className="mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-foreground">
        Domina
        <br />
        tu tiempo
      </h1>
      <p className="max-w-xl text-lg sm:text-xl font-medium text-muted-foreground leading-relaxed">
        Registro simple de jornadas laborales. Calcula horas extra, recargos
        nocturnos y salario según la ley colombiana.
      </p>
      <p className="mt-3 text-sm font-semibold text-primary">
        Sin fricción. Sin dudas.
      </p>
    </div>

    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
      {/* Primary Action Card */}
      <Link
        to="/registrar"
        className="group relative bg-card rounded-2xl border border-border p-6 md:p-8 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 md:col-span-2 lg:col-span-1 min-h-[260px] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-5">
            <Clock className="size-6" strokeWidth={2} />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight mb-1">
            Registrar
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Jornada actual
          </p>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center justify-center size-10 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ArrowRight
              className="size-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring"
              strokeWidth={2}
            />
          </div>
        </div>
      </Link>

      <Link
        to="/resumen"
        className="group relative bg-card rounded-2xl border border-border p-6 md:p-8 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 min-h-[260px] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-accent/10 text-accent mb-5">
            <CalendarDays className="size-6" strokeWidth={2} />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight mb-1">
            Resumen
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Balance semanal
          </p>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center justify-center size-10 rounded-full bg-secondary text-secondary-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
            <ArrowRight
              className="size-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring"
              strokeWidth={2}
            />
          </div>
        </div>
      </Link>

      <Link
        to="/configuracion"
        className="group relative bg-card rounded-2xl border border-border p-6 md:p-8 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 min-h-[260px] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-secondary text-secondary-foreground mb-5">
            <Settings className="size-6" strokeWidth={2} />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight mb-1">
            Ajustes
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Reglas y salario
          </p>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center justify-center size-10 rounded-full bg-secondary text-secondary-foreground group-hover:bg-foreground group-hover:text-background transition-all duration-300">
            <ArrowRight
              className="size-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500 ease-spring"
              strokeWidth={2}
            />
          </div>
        </div>
      </Link>
    </div>

    {/* Trust footer */}
    <div className="mt-16 md:mt-24 p-6 md:p-8 rounded-2xl bg-card border border-border">
      <p className="text-sm font-medium text-muted-foreground leading-relaxed">
        Tus datos se guardan solo en este dispositivo. Nadie más tiene acceso a
        tu información salarial ni a tus registros de jornada.
      </p>
    </div>
  </div>
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
