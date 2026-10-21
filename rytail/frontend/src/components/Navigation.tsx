import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Layers, RefreshCw, ArrowLeftRight, CheckSquare,
  Truck, Scan, ClipboardCheck, Database, Search, X, ChevronLeft, ChevronRight,
  ShieldCheck, FileText, Settings, Sparkles, Store, ShoppingBag, Shield
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, userRole }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroup[] = useMemo(() => [
    {
      items: [
        { 
          id: 'dashboard', 
          label: 'Overview', 
          icon: LayoutDashboard, 
          roles: ['Admin', 'Merchandiser', 'Supply Chain / Planner', 'Business User', 'Data/Technical User'] 
        },
        { 
          id: 'copilot', 
          label: 'AI Command Center', 
          icon: Sparkles, 
          badge: 'Agentic',
          roles: ['Admin', 'Merchandiser', 'Supply Chain / Planner', 'Business User', 'Data/Technical User'] 
        },
      ]
    },
    {
      title: 'Planning',
      items: [
        { 
          id: 'allocation', 
          label: 'First Allocation', 
          icon: Layers, 
          roles: ['Admin', 'Merchandiser', 'Supply Chain / Planner'] 
        },
        { 
          id: 'replenishment', 
          label: 'Replenishment', 
          icon: RefreshCw, 
          roles: ['Admin', 'Supply Chain / Planner', 'Merchandiser'] 
        },
        { 
          id: 'approvals', 
          label: 'Recommendations & Approvals', 
          icon: CheckSquare, 
          roles: ['Admin', 'Supply Chain / Planner', 'Merchandiser'] 
        },
      ]
    },
    {
      title: 'Store Operations',
      items: [
        { 
          id: 'scanner', 
          label: 'Barcode Scanner', 
          icon: Scan, 
          roles: ['Admin', 'Merchandiser', 'Supply Chain / Planner', 'Business User', 'Data/Technical User'] 
        },
        { 
          id: 'inventory', 
          label: 'Inventory', 
          icon: ShoppingBag, 
          roles: ['Admin', 'Supply Chain / Planner', 'Merchandiser', 'Business User'] 
        },
        { 
          id: 'stock-counts', 
          label: 'Stock Counts', 
          icon: ClipboardCheck, 
          roles: ['Admin', 'Supply Chain / Planner', 'Business User'] 
        },
        { 
          id: 'transfers', 
          label: 'Transfers', 
          icon: ArrowLeftRight, 
          roles: ['Admin', 'Supply Chain / Planner'] 
        },
      ]
    },
    {
      title: 'Network',
      items: [
        { 
          id: 'warehouse-map', 
          label: 'Warehouse Map', 
          icon: Truck, 
          roles: ['Admin', 'Supply Chain / Planner', 'Merchandiser', 'Business User'] 
        },
      ]
    },
    {
      title: 'Data',
      items: [
        { 
          id: 'connectors', 
          label: 'Connectors & Sync', 
          icon: Database, 
          roles: ['Admin', 'Data/Technical User', 'Supply Chain / Planner'] 
        },
        { 
          id: 'data-quality', 
          label: 'Data Quality', 
          icon: ShieldCheck, 
          roles: ['Admin', 'Data/Technical User', 'Supply Chain / Planner'] 
        },
      ]
    },
    {
      title: 'Governance',
      items: [
        { 
          id: 'planning', 
          label: 'Reports & Scenarios', 
          icon: FileText, 
          roles: ['Admin', 'Merchandiser', 'Supply Chain / Planner'] 
        },
        { 
          id: 'audit', 
          label: 'Audit History', 
          icon: Shield, 
          roles: ['Admin', 'Supply Chain / Planner'] 
        },
        { 
          id: 'config', 
          label: 'Admin & Rules', 
          icon: Settings, 
          roles: ['Admin'] 
        },
      ]
    }
  ], []);

  // Filter items by role and search
  const filteredGroups = useMemo(() => {
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const hasRole = item.roles.includes(userRole);
        const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        return hasRole && (searchQuery ? matchesSearch : true);
      })
    })).filter(group => group.items.length > 0);
  }, [navGroups, userRole, searchQuery]);

  return (
    <aside
      className={`bg-card text-ink border-r border-border flex flex-col shrink-0 select-none transition-all duration-200 z-30 sticky top-0 h-screen ${
        isCollapsed ? 'w-[68px]' : 'w-[248px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-sm bg-primary text-ink-onPrimary flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-xs">
              RY
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-ink block truncate">
                RYTAIL
              </span>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider block font-medium">
                Operations Console
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-sm bg-primary text-ink-onPrimary flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
            RY
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-ink-muted hover:bg-sage hover:text-primary transition-colors focus:outline-none"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search (when expanded) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg border border-border text-xs rounded-sm pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder-ink-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-2 px-2 space-y-4">
        {filteredGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            {group.title && !isCollapsed && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors text-left relative ${
                    isActive
                      ? 'bg-sage text-primary font-semibold border-l-[3px] border-primary'
                      : 'text-ink-muted hover:bg-sage/50 hover:text-ink'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-ink-muted'}`} />

                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-ai-bg text-ai border border-ai/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Scope / Role Indicator */}
      <div className="p-3 border-t border-border bg-bg/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px]">
            <div className="min-w-0">
              <span className="text-ink-muted block text-[10px] uppercase font-medium">Logged in role</span>
              <span className="font-semibold text-ink truncate block">{userRole}</span>
            </div>
            <span className="bg-warning-bg text-warning border border-warning/30 font-bold px-1.5 py-0.5 rounded-sm text-[10px]">
              DEMO
            </span>
          </div>
        ) : (
          <div className="text-center">
            <span className="bg-warning-bg text-warning font-bold px-1 py-0.5 rounded-sm text-[9px]">
              DEMO
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
