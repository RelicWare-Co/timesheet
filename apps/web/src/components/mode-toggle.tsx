import { Button } from "@timesheet/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@timesheet/ui/components/dropdown-menu";
import { Moon, Sun } from "lucide-react";
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
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLightTheme}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDarkTheme}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSystemTheme}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
