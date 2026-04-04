import { Button } from "@timesheet/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@timesheet/ui/components/dropdown-menu";
import { Moon, Sun, Laptop } from "lucide-react";
import * as React from "react";

import { useTheme } from "@/components/theme-provider";

export const ModeToggle = () => {
  const { setTheme } = useTheme();

  const handleLightTheme = React.useCallback(() => {
    setTheme("light");
  }, [setTheme]);

  const handleDarkTheme = React.useCallback(() => {
    setTheme("dark");
  }, [setTheme]);

  const handleSystemTheme = React.useCallback(() => {
    setTheme("system");
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary/30 border border-border/50 backdrop-blur-sm hover:bg-secondary/60 hover:shadow-sm transition-all"
          />
        }
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 text-amber-500" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 text-indigo-400" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-xl border-border/50 bg-card/95 backdrop-blur-xl shadow-lg"
      >
        <DropdownMenuItem
          onClick={handleLightTheme}
          className="gap-2 cursor-pointer rounded-lg font-medium"
        >
          <Sun className="size-4 text-amber-500" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDarkTheme}
          className="gap-2 cursor-pointer rounded-lg font-medium"
        >
          <Moon className="size-4 text-indigo-400" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSystemTheme}
          className="gap-2 cursor-pointer rounded-lg font-medium"
        >
          <Laptop className="size-4 text-muted-foreground" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
