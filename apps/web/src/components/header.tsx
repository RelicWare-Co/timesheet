import { Link, useLocation } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import { cn } from "@timesheet/ui/lib/utils";
import { Clock, LayoutDashboard, CalendarDays, Settings } from "lucide-react";

export default function Header() {
  const location = useLocation();

  const links = [
    { label: "Inicio", to: "/", icon: LayoutDashboard },
    { label: "Registrar", to: "/registrar", icon: Clock },
    { label: "Resumen", to: "/resumen", icon: CalendarDays },
    { label: "Ajustes", to: "/configuracion", icon: Settings },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-2xl border-b border-border/20 transition-all duration-300">
        <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 transition-transform active:scale-[0.97] group">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-transform ease-spring duration-300 group-hover:rotate-6 group-hover:scale-105">
                <Clock className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Timesheet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97] ease-spring duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </div>
      </header>
      
      {/* High-end Mobile floating bottom navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px] md:hidden">
        <nav className="flex items-center justify-between p-2 rounded-[2rem] bg-background/70 backdrop-blur-2xl border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center w-16 h-14 rounded-3xl transition-all active:scale-95 ease-spring duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-[1.4rem] animate-in zoom-in-95 ease-spring duration-300" />
                )}
                <Icon className={cn("size-6 relative z-10 transition-transform ease-spring duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  "absolute bottom-1 text-[9px] font-bold tracking-wide transition-all ease-spring duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "absolute top-2 w-1 h-1 rounded-full bg-primary transition-all ease-spring duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                )} />
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
