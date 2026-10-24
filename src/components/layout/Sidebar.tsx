import React from 'react';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  Shield,
  Pill,
  Store,
  Share2,
} from 'lucide-react';

import { useMediGuard } from '../../context/MediGuardContext';

export type NavScreen = 'dashboard' | 'inventory' | 'risks' | 'procurement' | 'insights' | 'network';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate }) => {
  const { hospitalName, rules, currentUser } = useMediGuard();
  const isLocalChemist = currentUser.facilityType === 'LOCAL_PHARMACY';

  const navItems: { id: NavScreen; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'network',
      label: 'Chemist Exchange',
      icon: <Share2 className="w-4 h-4" />,
      badge: 'B2B Peer',
    },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'risks', label: 'Risks & Decisions', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'procurement', label: 'Procurement', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'insights', label: 'Insights & AI', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-[220px] bg-white border-r border-[#E7E5E4] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E7E5E4] flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-bold shadow-xs">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base text-[#1C1917] tracking-tight">MediGuard</span>
              <span className="text-xs font-bold text-[#EA580C]">AI</span>
            </div>
            <div className="text-[10px] text-[#78716C] font-medium leading-none">Decision Engine</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative text-left ${
                  isActive
                    ? 'bg-[#FFF7ED] text-[#C2410C] font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAFAF9]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#EA580C] rounded-r" />
                  )}
                  <span className={isActive ? 'text-[#C2410C]' : 'text-[#78716C]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Identity Footer */}
      <div className="p-4 border-t border-[#E7E5E4] bg-[#FAFAF9] text-xs text-[#78716C]">
        <div className="flex items-center space-x-2 mb-1">
          {isLocalChemist ? (
            <Store className="w-3.5 h-3.5 text-[#C2410C]" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[#C2410C]" />
          )}
          <span className="font-semibold text-[#1C1917] truncate">
            {isLocalChemist ? currentUser.facilityName || 'Local Chemist' : hospitalName}
          </span>
        </div>
        <div className="text-[11px] text-[#78716C] font-mono truncate">
          {isLocalChemist ? currentUser.storeArea || 'Community Network' : rules.hospitalTimezone}
        </div>
      </div>
    </aside>
  );
};
