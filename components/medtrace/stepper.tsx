"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  pasos: string[];
  pasoActual: number;
}

export function Stepper({ pasos, pasoActual }: StepperProps) {
  return (
    <div className="flex items-center gap-1" role="list" aria-label="Pasos del formulario">
      {pasos.map((paso, i) => {
        const isCompleted = i < pasoActual;
        const isCurrent = i === pasoActual;
        return (
          <div key={paso} className="flex items-center gap-1 flex-1" role="listitem">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted && "bg-accent text-accent-foreground",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {paso}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-4",
                  isCompleted ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
