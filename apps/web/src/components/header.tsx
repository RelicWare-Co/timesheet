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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 transition-transform active:scale-95 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:rotate-6">
                <Clock className="size-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground">Timesheet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              {links.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.97]",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
      
      {/* Mobile navigation bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl md:hidden h-[4.5rem]">
        <nav className="flex items-center justify-around h-full px-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl py-2 px-4 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.95]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-primary/15" : "bg-transparent"
                )}>
                  <Icon className={cn("size-[18px]", isActive && "fill-primary/20")} />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
