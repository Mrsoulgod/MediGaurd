import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { InventoryProvider } from './context/InventoryContext';
import { MediGuardProvider, useMediGuard } from './context/MediGuardContext';
import { Sidebar, NavScreen } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { UserProfilesView } from './components/UserProfilesView';
import { OverviewView } from './components/views/OverviewView';
import { InventoryView } from './components/views/InventoryView';
import { RisksView } from './components/views/RisksView';
import { ProcurementView } from './components/views/ProcurementView';
import { InsightsView } from './components/views/InsightsView';
import { LocalPharmacyNetworkView } from './components/views/LocalPharmacyNetworkView';
import { CustomizerModal } from './components/CustomizerModal';
import { GeminiCopilot } from './components/GeminiCopilot';

export type MainAppView = 'landing' | 'login' | 'profiles' | 'app';

const MediGuardAppContent: React.FC = () => {
  const [mainView, setMainView] = useState<MainAppView>('landing');
  const [navScreen, setNavScreen] = useState<NavScreen>('dashboard');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);

  const { switchUser } = useMediGuard();

  const handleLaunchApp = (targetScreen?: NavScreen) => {
    if (targetScreen) setNavScreen(targetScreen);
    setMainView('app');
  };

  const getScreenTitle = (screen: NavScreen): string => {
    switch (screen) {
      case 'dashboard':
        return 'Overview & Daily Action List';
      case 'network':
        return 'Local Chemist Medicine Exchange (P2P)';
      case 'inventory':
        return 'Medicine Inventory & Ledger';
      case 'risks':
        return 'Risk Intelligence & Decisions';
      case 'procurement':
        return 'Procurement & Purchasing';
      case 'insights':
        return 'Insights & Hospital Admin';
      default:
        return 'MediGuard AI';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] flex flex-col font-sans relative">
      {/* Top Global Bar */}
      <TopBar
        pageTitle={mainView === 'app' ? getScreenTitle(navScreen) : 'MediGuard AI — Hospital Decision Platform'}
        activeMainView={mainView}
        onSwitchMainView={setMainView}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenGemini={() => setIsGeminiOpen(true)}
        onNavigateScreen={(screen) => {
          setNavScreen(screen);
          setMainView('app');
        }}
      />

      {/* View 1: Platform Overview Landing Page */}
      {mainView === 'landing' && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <LandingPage
            onEnterApp={(tab) => {
              if (tab === 'today') setNavScreen('dashboard');
              else if (tab === 'inventory') setNavScreen('inventory');
              else if (tab === 'procurement') setNavScreen('procurement');
              else if (tab === 'transfers') setNavScreen('risks');
              setMainView('app');
            }}
            onGoToProfiles={() => setMainView('login')}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />
        </div>
      )}

      {/* View 2: Multi-Facility Login Page (Hospital Pharmacy vs Local Pharmacy) */}
      {mainView === 'login' && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <LoginPage
            onLoginSuccess={(screen) => {
              if (screen) setNavScreen(screen as any);
              setMainView('app');
            }}
            onGoToOverview={() => setMainView('landing')}
          />
        </div>
      )}

      {/* View 3: User Profiles & Super Admin Management Page */}
      {mainView === 'profiles' && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <UserProfilesView
            onSelectAndLaunch={(tab) => {
              if (tab === 'network') {
                setNavScreen('network');
              } else if (tab === 'today') {
                setNavScreen('dashboard');
              } else if (tab === 'inventory') {
                setNavScreen('inventory');
              } else if (tab === 'procurement') {
                setNavScreen('procurement');
              } else {
                setNavScreen('risks');
              }
              setMainView('app');
            }}
          />
        </div>
      )}

      {/* View 4: Full Desktop Decision Engine Application with Sidebar */}
      {mainView === 'app' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (220px white) */}
          <Sidebar currentScreen={navScreen} onNavigate={setNavScreen} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[1400px]">
            {navScreen === 'dashboard' && <OverviewView onNavigate={setNavScreen} />}
            {navScreen === 'network' && <LocalPharmacyNetworkView />}
            {navScreen === 'inventory' && <InventoryView />}
            {navScreen === 'risks' && <RisksView />}
            {navScreen === 'procurement' && <ProcurementView />}
            {navScreen === 'insights' && <InsightsView />}
          </main>
        </div>
      )}

      {/* Floating Gemini AI Quick Copilot Button */}
      <button
        onClick={() => setIsGeminiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#C2410C] hover:bg-[#9A3412] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 text-xs font-semibold transition-all transform hover:-translate-y-0.5"
      >
        <Sparkles className="w-4 h-4 animate-spin text-white" />
        <span>Gemini AI Copilot</span>
      </button>

      {/* Gemini AI Side Drawer */}
      <GeminiCopilot
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        onNavigateScreen={(screen) => {
          setNavScreen(screen);
          setMainView('app');
        }}
      />

      {/* Customizer Modal for Orange / White customization */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <InventoryProvider>
      <MediGuardProvider>
        <MediGuardAppContent />
      </MediGuardProvider>
    </InventoryProvider>
  );
};

export default App;
