"use client";

import React from "react"

import { WifiOff, Wifi } from "lucide-react";
import { useOfflineMode, toggleOfflineMode, useOfflineQueue } from "@/lib/store";

interface AppHeaderProps {
  titulo: string;
  children?: React.ReactNode;
}

export function AppHeader({ titulo, children }: AppHeaderProps) {
  const offline = useOfflineMode();
  const queue = useOfflineQueue();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{titulo}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {children}
          <button
            onClick={toggleOfflineMode}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-border transition-colors"
            aria-label={offline ? "Modo offline activado" : "Modo online"}
          >
            {offline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-warning" />
                <span className="text-warning">Offline</span>
                {queue.length > 0 && (
                  <span className="bg-warning text-warning-foreground rounded-full px-1.5 text-[10px] font-bold">
                    {queue.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-accent" />
                <span className="text-accent">Online</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
