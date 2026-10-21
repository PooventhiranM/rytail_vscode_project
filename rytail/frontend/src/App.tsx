import React, { useState } from 'react';
import { UserRole } from './types';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ProductMasterView } from './pages/ProductMaster';
import { StoreMasterView } from './pages/StoreMaster';
import { InventoryView } from './pages/InventoryView';
import { FirstAllocationWizard } from './pages/FirstAllocationWizard';
import { ReplenishmentView } from './pages/ReplenishmentView';
import { StoreTransferView } from './pages/StoreTransferView';
import { Store360View } from './pages/Store360View';
import { Product360View } from './pages/Product360View';
import { AllocationActualsView } from './pages/AllocationActualsView';
import { PlanningRunsView } from './pages/PlanningRunsView';
import { ApprovalsView } from './pages/ApprovalsView';
import { DataQualityView } from './pages/DataQualityView';
import { AuditLogsView } from './pages/AuditLogsView';
import { ConfigView } from './pages/ConfigView';
import { AICopilotView } from './pages/AICopilotView';
import { WarehouseMapView } from './pages/WarehouseMapView';
import { BarcodeScannerView } from './pages/BarcodeScannerView';
import { StockCountsView } from './pages/StockCountsView';
import { DataConnectorsView } from './pages/DataConnectorsView';
import { FloatingAICopilot } from './components/FloatingAICopilot';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const MainApp: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Merchandiser');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'allocation':
        return <FirstAllocationWizard />;
      case 'replenishment':
        return <ReplenishmentView />;
      case 'transfers':
        return <StoreTransferView />;
      case 'warehouse-map':
        return <WarehouseMapView />;
      case 'scanner':
        return <BarcodeScannerView />;
      case 'stock-counts':
        return <StockCountsView />;
      case 'connectors':
        return <DataConnectorsView />;
      case 'store-360':
        return <Store360View />;
      case 'product-360':
        return <Product360View />;
      case 'actuals':
        return <AllocationActualsView />;
      case 'inventory':
        return <InventoryView />;
      case 'products':
        return <ProductMasterView />;
      case 'stores':
        return <StoreMasterView />;
      case 'planning':
        return <PlanningRunsView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'data-quality':
        return <DataQualityView />;
      case 'audit':
        return <AuditLogsView />;
      case 'config':
        return <ConfigView />;
      case 'copilot':
        return <AICopilotView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          userRole={userRole}
          setUserRole={setUserRole}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Circular AI Copilot Button & Pop Up Modal */}
      <FloatingAICopilot />
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <MainApp />
  </ThemeProvider>
);

export default App;
