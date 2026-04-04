import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@timesheet/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@timesheet/ui/components/card";
import { Clock, Calendar, Settings, Plus, ArrowRight } from "lucide-react";

const HomeComponent = () => (
  <div className="container mx-auto max-w-3xl px-4 py-8">
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold mb-2">Timesheet</h1>
      <p className="text-muted-foreground">
        Gestiona tus horas de trabajo y calcula tu salario.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Registrar Horas
          </CardTitle>
          <CardDescription>
            Registra rápidamente las horas trabajadas hoy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/registrar">
            <Button>
              <Plus className="mr-2 size-4" />
              Registrar Ahora
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Ver Resumen
          </CardTitle>
          <CardDescription>
            Revisa tu progreso semanal y horas extra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/resumen">
            <Button variant="outline">
              Ver Resumen
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Configuración
          </CardTitle>
          <CardDescription>
            Ajusta tus horas objetivo y preferencias de salario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/configuracion">
            <Button variant="outline">Abrir Configuración</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Sistema operativo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
