import React, { useState } from 'react';
import {
  Building,
  RotateCcw,
  Sparkles,
  Home,
  Users,
  LayoutDashboard,
  Sliders,
  Bell,
  LogIn,
  Bot,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { UserRole } from '../../schemas';
import { NotificationCenter } from '../NotificationCenter';

interface TopBarProps {
  pageTitle: string;
  activeMainView?: 'landing' | 'login' | 'profiles' | 'app';
  onSwitchMainView?: (view: 'landing' | 'login' | 'profiles' | 'app') => void;
  onOpenCustomizer?: () => void;
  onOpenGemini?: () => void;
  onNavigateScreen?: (screen: any) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  activeMainView = 'app',
  onSwitchMainView,
  onOpenCustomizer,
  onOpenGemini,
  onNavigateScreen,
}) => {
  const {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    users,
    currentUser,
    loginUser,
    switchUser,
    loadHeroScenario,
    resetDemoData,
    hospitalName,
    notifications,
  } = useMediGuard();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchUser(e.target.value as UserRole);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E5E4] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mode Switcher + Hospital Title */}
      <div className="flex items-center space-x-3">
        {onSwitchMainView && (
          <div className="flex items-center bg-[#FAFAF9] p-1 rounded-lg border border-[#E7E5E4] mr-2">
            <button
              onClick={() => onSwitchMainView('landing')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeMainView === 'landing'
                  ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              onClick={() => onSwitchMainView('login')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeMainView === 'login'
                  ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>

            <button
              onClick={() => onSwitchMainView('profiles')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeMainView === 'profiles'
                  ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Profiles</span>
            </button>

            <button
              onClick={() => onSwitchMainView('app')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeMainView === 'app'
                  ? 'bg-[#C2410C] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Decision Engine</span>
            </button>
          </div>
        )}

        <div className="hidden md:flex flex-col">
          <div className="text-sm font-bold text-[#1C1917] tracking-tight">{pageTitle}</div>
          <div className="text-[10px] text-[#78716C] leading-none truncate max-w-xs">{hospitalName}</div>
        </div>
      </div>

      {/* Right: Filters, Gemini AI, Notifications, Customizer, Role Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Gemini AI Trigger Button */}
        {onOpenGemini && (
          <button
            onClick={onOpenGemini}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C2410C] animate-pulse" />
            <span className="hidden sm:inline">Gemini AI</span>
          </button>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Hospital Alerts & Notifications"
            className="p-2 text-[#78716C] hover:text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigateScreen={onNavigateScreen}
          />
        </div>

        {/* Location Filter */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-[#FAFAF9] border border-[#E7E5E4] px-2.5 py-1.5 rounded-lg text-xs font-medium">
          <Building className="w-3.5 h-3.5 text-[#78716C]" />
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="bg-transparent text-[#1C1917] focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="ALL">All Departments</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customizer Modal Button */}
        {onOpenCustomizer && (
          <button
            onClick={onOpenCustomizer}
            title="Customize Hospital & Rules"
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* Load Demo Scenario button per DESIGN.md §4 */}
        <button
          onClick={() => {
            if (window.confirm('Load hero scenario (Central Pharmacy Ceftriaxone surplus & ICU shortage)?')) {
              loadHeroScenario();
            }
          }}
          className="text-xs font-medium text-[#C2410C] hover:text-[#9A3412] hover:underline px-2 py-1 hidden xl:flex items-center space-x-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load scenario</span>
        </button>

        {/* Pharmacy Facility / Store Switcher */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#E7E5E4]">
          <div className="flex items-center space-x-2 bg-white border border-[#E7E5E4] px-2.5 py-1 rounded-lg">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-[#E7E5E4]"
            />
            <div className="text-left text-xs">
              <span className="font-semibold text-[#1C1917] mr-1 hidden sm:inline">
                {currentUser.name.split(' ')[0]}
              </span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  loginUser(e.target.value);
                }}
                className="font-bold text-[11px] bg-transparent text-[#C2410C] cursor-pointer focus:outline-none max-w-[140px] truncate"
                title="Switch active pharmacy or chemist profile"
              >
                <optgroup label="🏥 Hospital Pharmacy">
                  {users
                    .filter((u) => (u.facilityType || 'HOSPITAL_PHARMACY') === 'HOSPITAL_PHARMACY')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Hospital)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🏪 Local Medical Owners">
                  {users
                    .filter((u) => u.facilityType === 'LOCAL_PHARMACY')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.facilityName ? u.facilityName.split(' ')[0] : 'Chemist'})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Reset Demo button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to clean initial Apollo Formulary seed?')) {
                resetDemoData();
              }
            }}
            title="Reset Demo Data"
            className="p-1.5 text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors border border-transparent hover:border-[#FEE2E2]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
