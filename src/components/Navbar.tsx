import React from 'react';
import {
  Pill,
  RotateCcw,
  HelpCircle,
  ShieldAlert,
  PlusCircle,
  ArrowRightLeft,
  Sliders,
  Users,
  LayoutDashboard,
  Home,
} from 'lucide-react';
import { TODAY } from '../config/constants';
import { useInventory } from '../context/InventoryContext';

export type MainView = 'landing' | 'profiles' | 'app';

interface NavbarProps {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  activeAppTab: 'today' | 'inventory' | 'procurement' | 'transfers';
  setActiveAppTab: (tab: 'today' | 'inventory' | 'procurement' | 'transfers') => void;
  onOpenAssumptions: () => void;
  onOpenRecall: () => void;
  onOpenReceive: () => void;
  onOpenCustomizer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mainView,
  setMainView,
  activeAppTab,
  setActiveAppTab,
  onOpenAssumptions,
  onOpenRecall,
  onOpenReceive,
  onOpenCustomizer,
}) => {
  const { resetDemoData, currentProfile, settings } = useInventory();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Institution Info */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setMainView('landing')}
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black group-hover:scale-105 transition-transform">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    Expiry<span className="text-orange-600">IQ</span>
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 rounded-full">
                    PS-56
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {settings.hospitalName} &bull; Clinical Intelligence
                </p>
              </div>
            </button>
          </div>

          {/* Primary View Switcher: Landing vs User Profiles vs Decision App */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setMainView('landing')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center space-x-1.5 ${
                mainView === 'landing'
                  ? 'bg-white text-orange-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              onClick={() => setMainView('profiles')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center space-x-1.5 ${
                mainView === 'profiles'
                  ? 'bg-white text-orange-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Profiles</span>
            </button>

            <button
              onClick={() => setMainView('app')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center space-x-1.5 ${
                mainView === 'app'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Decision App</span>
            </button>
          </nav>

          {/* Right Area: Profile Chip & Quick Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Active Profile Pill */}
            <button
              onClick={() => setMainView('profiles')}
              title={`Logged in as ${currentProfile.name} (${currentProfile.role})`}
              className="flex items-center space-x-2 pl-1.5 pr-3 py-1 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 rounded-full transition-all shadow-xs"
            >
              <img
                src={currentProfile.avatar}
                alt={currentProfile.name}
                className="w-7 h-7 rounded-full object-cover border border-orange-200"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentProfile.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-orange-600 font-semibold leading-tight">
                  {currentProfile.role.split(' ')[0]}
                </div>
              </div>
            </button>

            {/* Customizer */}
            <button
              onClick={onOpenCustomizer}
              title="Hospital Customization & Settings"
              className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-slate-200/80"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Assumptions */}
            <button
              onClick={onOpenAssumptions}
              title="Formulas & Clinical Logic Inspector"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Demo */}
            <button
              onClick={() => {
                if (window.confirm('Reset demo data to initial seed (45 batches with hero scenarios)?')) {
                  resetDemoData();
                }
              }}
              title="Reset Demo Data"
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navbar if in 'app' view: 4 Tabs + Tools */}
        {mainView === 'app' && (
          <div className="flex items-center justify-between py-2.5 border-t border-slate-100 overflow-x-auto">
            {/* Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveAppTab('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeAppTab === 'today'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Today Action Queue
              </button>

              <button
                onClick={() => setActiveAppTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeAppTab === 'inventory'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                FEFO Inventory
              </button>

              <button
                onClick={() => setActiveAppTab('procurement')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeAppTab === 'procurement'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Predictive Procurement
              </button>

              <button
                onClick={() => setActiveAppTab('transfers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeAppTab === 'transfers'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Inter-Ward Transfers</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 pl-3">
              <button
                onClick={onOpenReceive}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Receive Stock</span>
              </button>

              <button
                onClick={onOpenRecall}
                className="px-2.5 py-1 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center space-x-1 shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Recall Check</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
