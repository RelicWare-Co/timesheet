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
  <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
    <div className="mb-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
        <Sparkles className="mr-2 size-4" />
        Bienvenido a tu panel de control
      </div>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
        Toma el control de tu <span className="text-primary bg-clip-text">tiempo</span>
      </h1>
      <p className="max-w-[42rem] text-muted-foreground sm:text-xl sm:leading-8 text-balance">
        Gestiona tus jornadas laborales, calcula tu salario con precisión y mantén un registro perfecto de tus horas extra. Todo en una interfaz hermosa.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader>
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner">
            <Clock className="size-6" />
          </div>
          <CardTitle className="text-2xl">Registrar Horas</CardTitle>
          <CardDescription className="text-base mt-2">
            Ingresa rápidamente tu jornada de hoy. El sistema calcula pausas y horas extra automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link to="/registrar" className="w-full">
            <Button size="lg" className="w-full sm:w-auto transition-all active:scale-[0.97] rounded-xl shadow-md">
              <Plus className="mr-2 size-5" />
              Nuevo Registro
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader>
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner">
            <Calendar className="size-6" />
          </div>
          <CardTitle className="text-2xl">Resumen Semanal</CardTitle>
          <CardDescription className="text-base mt-2">
            Visualiza tu progreso, revisa métricas clave y comprueba si has alcanzado tus objetivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link to="/resumen" className="w-full">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto transition-all active:scale-[0.97] rounded-xl group-hover:bg-primary/10 group-hover:text-primary">
              Ver Resumen
              <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-border md:col-span-2 border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-6 space-y-0 p-6">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Settings className="size-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Configuración y Preferencias</CardTitle>
            <CardDescription className="text-sm mt-1">
              Ajusta tu salario base, horas objetivo y reglas laborales para mantener cálculos precisos.
            </CardDescription>
          </div>
          <Link to="/configuracion">
            <Button variant="ghost" size="icon" className="shrink-0 transition-transform active:scale-[0.95] rounded-full hover:bg-primary/10 hover:text-primary size-12">
              <ArrowRight className="size-6" />
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
