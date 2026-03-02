"use client";

import React from "react"

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, titulo, descripcion, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-muted-foreground max-w-xs">{descripcion}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
