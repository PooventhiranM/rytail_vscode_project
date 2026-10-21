import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Search, Bell, Sun, Moon, Store, Shield, CheckCircle2, ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole, setUserRole, selectedBrand, setSelectedBrand, selectedRegion, setSelectedRegion
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeStore, setActiveStore] = useState('E0100');

  const roles: UserRole[] = [
    'Admin',
    'Merchandiser',
    'Supply Chain / Planner',
    'Business User',
    'Data/Technical User'
  ];

  return (
    <header className="h-14 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left: Global Search (SKU / Barcode / Store / Scenario ID) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, barcode (890123...), store (E0100)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-bg border border-border text-xs rounded pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder-ink-muted transition-all"
          />
        </div>
      </div>

      {/* Center/Right: Store Selector & Filters */}
      <div className="hidden md:flex items-center gap-3 text-xs">
        {/* Active Store Selector */}
        <div className="flex items-center gap-1.5 bg-bg border border-border rounded px-2.5 py-1">
          <Store className="w-3.5 h-3.5 text-primary" />
          <span className="text-ink-muted font-medium text-[11px]">Store:</span>
          <select
            value={activeStore}
            onChange={(e) => setActiveStore(e.target.value)}
            className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="E0100">E0100 - Phoenix Marketcity BLR</option>
            <option value="E0101">E0101 - Forum South BLR</option>
            <option value="E0102">E0102 - Express Avenue MAA</option>
            <option value="E0103">E0103 - Nexus Koramangala BLR</option>
            <option value="ALL">All Stores (168 Network)</option>
          </select>
        </div>

        {/* Region Filter */}
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-bg border border-border text-ink font-medium rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-xs"
        >
          <option value="ALL">All Regions</option>
          <option value="North">North Region</option>
          <option value="South">South Region</option>
          <option value="East">East Region</option>
          <option value="West">West Region</option>
        </select>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-warning-bg border border-warning/30 text-warning text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          <span>DEMO</span>
        </div>

        {/* Notifications */}
        <button
          className="p-1.5 rounded hover:bg-sage text-ink-muted hover:text-primary transition-colors relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-accent absolute top-1 right-1" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-sage text-ink-muted hover:text-primary transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Role Selector */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-sage border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
            {userRole[0]}
          </div>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="bg-bg border border-border text-ink text-xs font-medium rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
