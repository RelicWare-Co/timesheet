import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@timesheet/ui/lib/utils";
import { Clock, LayoutDashboard, CalendarDays, Settings } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const location = useLocation();

  const links = [
    { icon: LayoutDashboard, label: "Inicio", to: "/" },
    { icon: Clock, label: "Registrar", to: "/registrar" },
    { icon: CalendarDays, label: "Resumen", to: "/resumen" },
    { icon: Settings, label: "Ajustes", to: "/configuracion" },
  ] as const;

  return (
    <>
      {/* Desktop Header - Warm & Clean */}
      <header className="hidden md:flex fixed top-0 left-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border h-16 shadow-sm">
        <div className="w-full flex h-full items-center justify-between px-6 max-w-6xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-[0.97]"
          >
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <Clock className="size-4" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight font-heading">
              Timesheet
            </span>
          </Link>

          <nav className="flex items-center gap-1 h-full">
            {links.map(({ to, label }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center h-9 px-4 text-sm font-medium rounded-full transition-all active:scale-[0.97]",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Top Header - Clean */}
      <header className="md:hidden fixed top-0 z-50 w-full bg-card/90 backdrop-blur-md border-b border-border h-14 shadow-sm">
        <div className="flex h-full items-center justify-between px-4 max-w-xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-transform active:scale-[0.97]"
          >
            <div className="flex items-center justify-center size-7 rounded-md bg-primary text-primary-foreground">
              <Clock className="size-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">
              Timesheet
            </span>
          </Link>
          <ModeToggle />
        </div>
      </header>

      {/* Mobile Bottom Navigation - Pill Style */}
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
        <nav className="flex items-center justify-around h-14 px-2 bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-lg shadow-black/5">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive =
              location.pathname === to ||
              (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full rounded-xl transition-all active:scale-[0.97]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 mb-0.5 transition-all",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  )}
                />
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
