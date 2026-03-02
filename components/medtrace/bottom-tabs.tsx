"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Pill,
  Tag,
  ClipboardList,
  ScanLine,
  MoreHorizontal,
} from "lucide-react";

export type TabId = "inicio" | "medicamentos" | "etiquetas" | "pedidos" | "escaneo" | "mas";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "inicio", label: "Inicio", icon: LayoutDashboard },
  { id: "medicamentos", label: "Medicamentos", icon: Pill },
  { id: "etiquetas", label: "Etiquetas", icon: Tag },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "escaneo", label: "Escaneo", icon: ScanLine },
  { id: "mas", label: "Mas", icon: MoreHorizontal },
];

interface BottomTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card"
      role="tablist"
      aria-label="Navegacion principal"
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
