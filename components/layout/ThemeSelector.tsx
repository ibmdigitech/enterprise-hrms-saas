"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeSelectorProps {
  variant?: "dropdown" | "inline" | "compact";
  showLabel?: boolean;
  className?: string;
}

const themeOptions: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: "light", label: "Light", icon: Sun, description: "Clean white and soft grey surfaces" },
  { value: "dark", label: "Dark", icon: Moon, description: "Premium navy surfaces with turquoise highlights" },
  { value: "system", label: "System", icon: Monitor, description: "Follows your operating system preference" },
];

export function ThemeSelector({ variant = "dropdown", showLabel = true, className }: ThemeSelectorProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-9 w-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800", className)} />
    );
  }

  const currentTheme = theme as ThemeMode;
  const currentResolved = resolvedTheme as "light" | "dark";
  const currentOption = themeOptions.find((o) => o.value === currentTheme) || themeOptions[2];

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Appearance</span>
        )}
        <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                currentTheme === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
              )}
              aria-pressed={currentTheme === option.value}
              title={option.description}
            >
              <option.icon className="h-4 w-4" />
              {showLabel && <span>{option.label}</span>}
            </button>
          ))}
        </div>
        {currentTheme === "system" && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (currently {currentResolved})
          </span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 rounded-xl", className)}
            aria-label="Change theme"
          >
            <currentOption.icon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex items-center gap-2",
                currentTheme === option.value && "bg-primary/10 text-primary"
              )}
            >
              <option.icon className="h-4 w-4" />
              <div className="flex-1 text-left">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
              </div>
              {currentTheme === option.value && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          {currentTheme === "system" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 cursor-default">
                Resolved: {currentResolved.charAt(0).toUpperCase() + currentResolved.slice(1)} Mode
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start gap-3", className)}>
          <currentOption.icon className="h-4 w-4" />
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 dark:text-white">{currentOption.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentOption.description}</p>
          </div>
          {currentTheme === "system" && (
            <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {currentResolved}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-3",
              currentTheme === option.value && "bg-primary/10 text-primary"
            )}
          >
            <option.icon className="h-4 w-4" />
            <div className="flex-1 text-left">
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
            </div>
            {currentTheme === option.value && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        {currentTheme === "system" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 cursor-default">
              Resolved: {currentResolved.charAt(0).toUpperCase() + currentResolved.slice(1)} Mode
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}