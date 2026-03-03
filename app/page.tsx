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
import { LoginScreen } from "@/components/medtrace/screens/login-screen";
import { useAuthUser, logout } from "@/lib/store";

export default function MedTracePage() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [actionFlag, setActionFlag] = useState<string | null>(null);
  const { user, isLoading } = useAuthUser();

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
        {isLoading && (
          <div className="min-h-screen flex items-center justify-center text-muted-foreground">
            Cargando...
          </div>
        )}
        {!isLoading && !user && (
          <LoginScreen
            onLoginSuccess={() => {
              setActiveTab("inicio");
              setActionFlag(null);
            }}
          />
        )}
        {!isLoading && user && (
          <>
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
        {activeTab === "mas" && (
          <MasScreen
            onLogout={async () => {
              await logout();
              setActiveTab("inicio");
              setActionFlag(null);
            }}
          />
        )}
        <BottomTabs activeTab={activeTab} onTabChange={handleTabChange} />
          </>
        )}
      </div>
    </SWRConfig>
  );
}
