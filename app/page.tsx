"use client";

import { useState } from "react";
import { SWRConfig } from "swr";
import { BottomTabs, type TabId } from "@/components/medtrace/bottom-tabs";
import { InicioScreen } from "@/components/medtrace/screens/inicio-screen";
import { MedicamentosScreen } from "@/components/medtrace/screens/medicamentos-screen";
import { EtiquetasScreen } from "@/components/medtrace/screens/etiquetas-screen";
import { PedidosScreen } from "@/components/medtrace/screens/pedidos-screen";
import { EscaneoScreen } from "@/components/medtrace/screens/escaneo-screen";
import { MasScreen } from "@/components/medtrace/screens/mas-screen";

export default function MedTracePage() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [actionFlag, setActionFlag] = useState<string | null>(null);

  function handleAction(action: string) {
    if (action === "crear-lote") {
      setActionFlag("crear-lote");
      setActiveTab("etiquetas");
    } else if (action === "crear-pedido") {
      setActionFlag("crear-pedido");
      setActiveTab("pedidos");
    }
  }

  function handleTabChange(tab: TabId) {
    setActionFlag(null);
    setActiveTab(tab);
  }

  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <div className="min-h-screen bg-background">
        {activeTab === "inicio" && (
          <InicioScreen onNavigate={handleTabChange} onAction={handleAction} />
        )}
        {activeTab === "medicamentos" && <MedicamentosScreen />}
        {activeTab === "etiquetas" && (
          <EtiquetasScreen
            key={actionFlag === "crear-lote" ? "create" : "list"}
            autoCreate={actionFlag === "crear-lote"}
          />
        )}
        {activeTab === "pedidos" && (
          <PedidosScreen
            key={actionFlag === "crear-pedido" ? "create" : "list"}
            autoCreate={actionFlag === "crear-pedido"}
          />
        )}
        {activeTab === "escaneo" && <EscaneoScreen />}
        {activeTab === "mas" && <MasScreen />}
        <BottomTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </SWRConfig>
  );
}
