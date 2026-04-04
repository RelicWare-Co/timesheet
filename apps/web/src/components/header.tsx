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
      {/* Desktop Header - Minimalist Top Bar */}
      <header className="hidden md:flex fixed top-0 left-0 z-50 w-full bg-background border-b border-foreground/10 h-16">
        <div className="w-full flex h-full items-center justify-between px-8 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-[0.97]">
            <Clock className="size-5" strokeWidth={3} />
            <span className="text-xl font-black tracking-tighter uppercase">Timesheet</span>
          </Link>

          <nav className="flex items-center gap-6 h-full">
            {links.map(({ to, label }) => {
              const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center h-full text-sm font-bold uppercase tracking-widest transition-colors active:scale-[0.97]",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Top Header - Stark */}
      <header className="md:hidden fixed top-0 z-50 w-full bg-background border-b border-foreground/10 h-14">
        <div className="flex h-full items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 transition-transform active:scale-[0.97]">
            <Clock className="size-5" strokeWidth={3} />
            <span className="text-lg font-black tracking-tighter uppercase">Timesheet</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      
      {/* Mobile Bottom Navigation - Stark & Square */}
      <div className="md:hidden fixed bottom-0 left-0 z-50 w-full bg-background border-t border-foreground/10">
        <nav className="flex items-center justify-around h-16 px-2">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full transition-transform active:scale-[0.97]",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5 mb-1")} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground rounded-b-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
