import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@timesheet/ui/components/card";
import { Clock, Calendar, Settings, Plus, ArrowRight, Sparkles } from "lucide-react";

const HomeComponent = () => (
  <div className="container mx-auto max-w-4xl px-4 py-8 md:py-24">
    <div className="mb-16 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
      <div className="mb-8 inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-3xl shadow-[0_4px_24px_-4px_rgba(var(--primary),0.1)]">
        <Sparkles className="mr-2 size-4" />
        Bienvenido a tu panel de control
      </div>
      <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
        Toma el control de tu <span className="text-primary relative inline-block">
          tiempo
          <div className="absolute inset-x-0 bottom-2 h-3 bg-primary/20 -z-10 blur-sm rounded-full" />
        </span>
      </h1>
      <p className="max-w-[46rem] text-muted-foreground/80 sm:text-xl sm:leading-relaxed text-balance">
        Gestiona tus jornadas laborales, calcula tu salario con precisión y mantén un registro perfecto de tus horas extra. Todo en una interfaz hermosa.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both ease-spring">
      <Card className="group relative overflow-hidden transition-all duration-500 ease-spring hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 border-border/40 bg-background/40 backdrop-blur-2xl rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="p-8 pb-4">
          <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:rotate-3">
            <Clock className="size-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Registrar Horas</CardTitle>
          <CardDescription className="text-base mt-3 leading-relaxed text-muted-foreground/80">
            Ingresa rápidamente tu jornada de hoy. El sistema calcula pausas y horas extra automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Link to="/registrar" className="w-full">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold transition-all ease-spring duration-200 active:scale-[0.97] rounded-2xl shadow-lg hover:shadow-primary/25">
              <Plus className="mr-2 size-5" />
              Nuevo Registro
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden transition-all duration-500 ease-spring hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 border-border/40 bg-background/40 backdrop-blur-2xl rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="p-8 pb-4">
          <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-inner transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-primary/10 group-hover:text-primary">
            <Calendar className="size-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Resumen Semanal</CardTitle>
          <CardDescription className="text-base mt-3 leading-relaxed text-muted-foreground/80">
            Visualiza tu progreso, revisa métricas clave y comprueba si has alcanzado tus objetivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Link to="/resumen" className="w-full">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-base font-semibold transition-all ease-spring duration-200 active:scale-[0.97] rounded-2xl group-hover:bg-primary/10 group-hover:text-primary">
              Ver Resumen
              <ArrowRight className="ml-2 size-5 transition-transform duration-300 ease-spring group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden transition-all duration-500 ease-spring hover:shadow-xl md:col-span-2 border-border/40 bg-background/40 backdrop-blur-2xl rounded-3xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-6 space-y-0 p-8">
          <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-all duration-500 ease-spring group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
            <Settings className="size-7" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold">Configuración y Preferencias</CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground/80">
              Ajusta tu salario base, horas objetivo y reglas laborales para mantener cálculos precisos.
            </CardDescription>
          </div>
          <Link to="/configuracion" className="w-full sm:w-auto">
            <Button variant="ghost" size="icon" className="w-full sm:w-14 h-14 shrink-0 transition-transform duration-200 ease-spring active:scale-[0.95] rounded-2xl hover:bg-primary/10 hover:text-primary">
              <ArrowRight className="size-6 transition-transform duration-300 ease-spring sm:group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardHeader>
      </Card>
    </div>
  </div>
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
