import React, { useState } from 'react';
import {
  Building2,
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  KeyRound,
  Mail,
  Phone,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Share2,
  MapPin,
  FileText,
  Zap,
} from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';
import { UserProfile, FacilityType } from '../schemas';

interface LoginPageProps {
  onLoginSuccess: (screen?: string) => void;
  onGoToOverview?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToOverview }) => {
  const { users, currentUser, loginUser, hospitalName, rules } = useMediGuard();

  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType>('LOCAL_PHARMACY');
  const [selectedUserId, setSelectedUserId] = useState<string>('CHM-RAMESH');
  const [pin, setPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPinHint, setShowPinHint] = useState(false);
  const [loginToast, setLoginToast] = useState<string | null>(null);

  // Filter profiles by facility
  const hospitalProfiles = users.filter(
    (u) => (u.facilityType || 'HOSPITAL_PHARMACY') === 'HOSPITAL_PHARMACY'
  );
  const localChemistProfiles = users.filter((u) => u.facilityType === 'LOCAL_PHARMACY');

  const activeFacilityProfiles =
    selectedFacilityType === 'HOSPITAL_PHARMACY' ? hospitalProfiles : localChemistProfiles;

  const selectedProfile =
    users.find((u) => u.id === selectedUserId) ||
    activeFacilityProfiles[0] ||
    localChemistProfiles[0] ||
    users[0];

  const handleFacilityChange = (type: FacilityType) => {
    setSelectedFacilityType(type);
    const firstInFacility = users.find((u) => (u.facilityType || 'HOSPITAL_PHARMACY') === type);
    if (firstInFacility) {
      setSelectedUserId(firstInFacility.id);
    }
  };

  const handleQuickLogin = (profile: UserProfile, targetScreen: string = 'dashboard') => {
    loginUser(profile.id);
    setLoginToast(`Logged in as ${profile.name} (${profile.facilityName || 'Pharmacy'})`);
    setTimeout(() => {
      onLoginSuccess(targetScreen);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent, targetScreen: string = 'dashboard') => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    loginUser(selectedProfile.id);
    setLoginToast(`Logged in as ${selectedProfile.name} (${selectedProfile.facilityName || 'Pharmacy'})`);
    setTimeout(() => {
      onLoginSuccess(targetScreen);
    }, 200);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6 text-[#1C1917]">
      {/* 1. Instant 1-Click Demo Persona Bar */}
      <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#C2410C] font-semibold">
          <Zap className="w-4 h-4 fill-[#C2410C]" />
          <span>Instant 1-Click Login:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Hospital Button */}
          {hospitalProfiles[0] && (
            <button
              onClick={() => handleQuickLogin(hospitalProfiles[0], 'dashboard')}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E7E5E4] hover:border-[#C2410C] font-medium text-[#1C1917] hover:text-[#C2410C] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>🏥 Hospital Pharmacy (Apollo Central)</span>
            </button>
          )}

          {/* Chemist Buttons */}
          {localChemistProfiles.map((chm) => (
            <button
              key={chm.id}
              onClick={() => handleQuickLogin(chm, 'dashboard')}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E7E5E4] hover:border-[#C2410C] font-medium text-[#1C1917] hover:text-[#C2410C] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>🏪 {chm.name.split(' ')[0]} ({chm.facilityName ? chm.facilityName.split(' ')[0] : 'Chemist'})</span>
            </button>
          ))}
        </div>
      </div>

      {loginToast && (
        <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{loginToast} — Redirecting to Central Medicine Dashboard...</span>
        </div>
      )}

      {/* 2. Header & Title */}
      <div className="text-center space-y-1.5 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold">
          <Building2 className="w-4 h-4" />
          <span>Pharmacy Portal Access</span>
          <span className="text-[#C2410C]/40">&bull;</span>
          <span className="font-mono">Central Medicines Management & Expiry Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1917]">
          Sign In to MediGuard
        </h1>
        <p className="text-xs sm:text-sm text-[#78716C]">
          Choose whether you are operating as an independent <strong>Local Community Pharmacy</strong> or a <strong>Hospital Central Pharmacy</strong>.
        </p>
      </div>

      {/* 3. Primary Choice: Hospital Pharmacy vs Local Pharmacy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Option A: Local Pharmacy (Active Default) */}
        <button
          type="button"
          onClick={() => handleFacilityChange('LOCAL_PHARMACY')}
          className={`relative overflow-hidden p-4 rounded-xl border text-left flex items-start gap-4 transition-all card-hover-lift ${
            selectedFacilityType === 'LOCAL_PHARMACY'
              ? 'bg-white border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-sm'
              : 'bg-white border-[#E7E5E4] hover:border-[#C2410C] opacity-85'
          }`}
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E7E5E4]">
            <img
              src="https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200&auto=format&fit=crop&q=80"
              alt="Local Pharmacy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#C2410C]/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-white drop-shadow" />
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1C1917]">Local Pharmacy / Chemist</span>
              {selectedFacilityType === 'LOCAL_PHARMACY' && (
                <span className="w-2 h-2 rounded-full bg-[#C2410C] animate-pulse" />
              )}
            </div>
            <div className="text-xs text-[#78716C] leading-relaxed">
              Retail chemists, medicine stock & expiry management, CSV batch additions, and the <strong>Peer Medicine Sharing Network</strong>.
            </div>
            <div className="text-[11px] font-mono text-[#C2410C] pt-1">
              {localChemistProfiles.length} Local Medical Owners Active
            </div>
          </div>
        </button>

        {/* Option B: Hospital Pharmacy */}
        <button
          type="button"
          onClick={() => handleFacilityChange('HOSPITAL_PHARMACY')}
          className={`relative overflow-hidden p-4 rounded-xl border text-left flex items-start gap-4 transition-all card-hover-lift ${
            selectedFacilityType === 'HOSPITAL_PHARMACY'
              ? 'bg-white border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-sm'
              : 'bg-white border-[#E7E5E4] hover:border-[#C2410C] opacity-85'
          }`}
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E7E5E4]">
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&auto=format&fit=crop&q=80"
              alt="Hospital Pharmacy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#C2410C]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white drop-shadow" />
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1C1917]">Hospital Central Pharmacy</span>
              {selectedFacilityType === 'HOSPITAL_PHARMACY' && (
                <span className="w-2 h-2 rounded-full bg-[#C2410C] animate-pulse" />
              )}
            </div>
            <div className="text-xs text-[#78716C] leading-relaxed">
              Inpatient health systems, ward redistribution (ICU, Emergency, OT), cold-chain storage & FEFO burn rate tracking.
            </div>
            <div className="text-[11px] font-mono text-[#C2410C] pt-1">
              {hospitalName}
            </div>
          </div>
        </button>
      </div>

      {/* 4. Main Login Card & Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Interactive PIN Login Form */}
        <div className="lg:col-span-5 bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-[#E7E5E4] pb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#1C1917]">
                {selectedFacilityType === 'LOCAL_PHARMACY' ? 'Chemist Account Login' : 'Hospital Staff Login'}
              </h2>
              <span className="text-[11px] font-mono text-[#C2410C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5]">
                {selectedFacilityType === 'LOCAL_PHARMACY' ? 'Retail Dispensary' : 'Inpatient Network'}
              </span>
            </div>
            <p className="text-xs text-[#78716C]">
              {selectedFacilityType === 'LOCAL_PHARMACY'
                ? 'Select your medical store to manage medicines, expiry dates, and CSV imports.'
                : 'Access central inpatient pharmacy and ward formulary.'}
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, 'dashboard')} className="space-y-5">
            {/* Identity Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                {selectedFacilityType === 'LOCAL_PHARMACY' ? 'Select Local Medical Store' : 'Hospital Pharmacist'}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-xs text-[#1C1917] focus:ring-2 focus:ring-[#C2410C] focus:outline-none cursor-pointer"
              >
                {activeFacilityProfiles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.facilityName || u.departmentTitle} ({u.storeArea || u.assignedLocationId})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Profile Summary Card */}
            {selectedProfile && (
              <div className="p-3.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl flex items-start gap-3">
                <img
                  src={selectedProfile.avatar}
                  alt={selectedProfile.name}
                  className="w-12 h-12 rounded-lg object-cover border border-[#E7E5E4] shrink-0"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="font-bold text-xs text-[#1C1917] truncate">{selectedProfile.name}</div>
                  <div className="text-[11px] font-medium text-[#C2410C] truncate">
                    {selectedProfile.facilityName || selectedProfile.departmentTitle}
                  </div>
                  {selectedProfile.drugLicenseNo && (
                    <div className="text-[10px] font-mono text-[#78716C] truncate flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#78716C]" />
                      <span>DL: {selectedProfile.drugLicenseNo}</span>
                    </div>
                  )}
                  {selectedProfile.storeArea && (
                    <div className="text-[10px] text-[#78716C] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#78716C]" />
                      <span>{selectedProfile.storeArea}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Account PIN / Passcode
                </label>
                <button
                  type="button"
                  onClick={() => setShowPinHint(!showPinHint)}
                  className="text-[11px] text-[#C2410C] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>PIN hint</span>
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-white border border-[#E7E5E4] rounded-lg focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  required
                />
              </div>

              {showPinHint && (
                <div className="mt-2 p-2 bg-[#FFF7ED] border border-[#FFEDD5] rounded text-[11px] text-[#C2410C]">
                  <strong>Demo Credentials:</strong> Security PIN is preset to <code className="font-mono font-bold">1234</code> for all accounts.
                </div>
              )}

              {errorMsg && (
                <div className="mt-2 text-[11px] text-[#B91C1C] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Central Medicine Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {selectedFacilityType === 'LOCAL_PHARMACY' && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProfile) loginUser(selectedProfile.id);
                    onLoginSuccess('network');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Open Peer Medicine Sharing Exchange</span>
                </button>
              )}
            </div>
          </form>

          {/* Security info */}
          <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between text-[11px] text-[#78716C]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#15803D]" />
              <span>TLS 1.3 Verified Session</span>
            </span>
            <span className="font-mono text-[#C2410C]">{rules.demoFixedDate}</span>
          </div>
        </div>

        {/* Right Column: Profiles Directory / Quick 1-Click Launch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#1C1917]">
                {selectedFacilityType === 'LOCAL_PHARMACY'
                  ? 'Local Medical Store Owners'
                  : 'Hospital Pharmacy Profiles'}
              </h2>
              <p className="text-xs text-[#78716C]">
                Click any profile to immediately sign in and manage medicines, batch expiry, and CSV uploads.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C] font-mono">
              {activeFacilityProfiles.length} Stores Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeFacilityProfiles.map((profile) => {
              const isSelected = selectedUserId === profile.id;
              return (
                <div
                  key={profile.id}
                  onClick={() => {
                    setSelectedUserId(profile.id);
                  }}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all card-hover-lift flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-xs glow-orange-subtle'
                      : 'border-[#E7E5E4] hover:border-[#C2410C]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#E7E5E4] shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="font-bold text-sm text-[#1C1917] truncate">{profile.name}</div>
                      <div className="text-[11px] font-medium text-[#C2410C] truncate">
                        {profile.facilityName || profile.departmentTitle}
                      </div>
                      {profile.storeArea && (
                        <div className="text-[10px] text-[#78716C] truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#78716C] shrink-0" />
                          <span>{profile.storeArea}</span>
                        </div>
                      )}
                      {profile.drugLicenseNo && (
                        <div className="text-[10px] font-mono text-[#78716C] truncate">
                          DL: {profile.drugLicenseNo}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#78716C] truncate max-w-[120px]">
                      {profile.phone || profile.employeeId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLogin(profile, 'dashboard');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explainer Banner */}
          <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] space-y-2 text-xs text-[#78716C]">
            <div className="font-semibold text-[#C2410C] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C2410C]" />
              <span>Central Medicines Management & Batch CSV Integration</span>
            </div>
            <p className="leading-relaxed text-[#1C1917]">
              Once signed in, access the <strong>Central Medicines Dashboard</strong> to inspect every batch's exact expiry date, countdown in days, at-risk valuation in ₹, and upload new medicine batches in bulk using CSV files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
