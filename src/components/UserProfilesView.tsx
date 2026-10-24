import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  ArrowRight,
  X,
  Sparkles,
  KeyRound,
  Store,
  Share2,
  MapPin,
  FileText,
  Building2,
  Lock,
} from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';
import { UserRole, UserProfile, FacilityType } from '../schemas';

interface UserProfilesViewProps {
  onSelectAndLaunch: (tab?: any) => void;
}

export const UserProfilesView: React.FC<UserProfilesViewProps> = ({ onSelectAndLaunch }) => {
  const {
    users,
    currentUser,
    loginUser,
    addUserProfile,
    toggleUserStatus,
    locations,
    hospitalName,
  } = useMediGuard();

  const [activeTab, setActiveTab] = useState<'ALL' | 'LOCAL' | 'HOSPITAL'>('LOCAL');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<UserProfile | null>(null);
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // New Profile Form State
  const [newName, setNewName] = useState('');
  const [newFacilityType, setNewFacilityType] = useState<FacilityType>('LOCAL_PHARMACY');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreArea, setNewStoreArea] = useState('');
  const [newDrugLicenseNo, setNewDrugLicenseNo] = useState('');
  const [newAssignedLoc, setNewAssignedLoc] = useState('LOC-ICU');
  const [newTitle, setNewTitle] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAvatar, setNewAvatar] = useState(
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80'
  );

  const localChemistProfiles = users.filter((u) => u.facilityType === 'LOCAL_PHARMACY');
  const hospitalProfiles = users.filter(
    (u) => (u.facilityType || 'HOSPITAL_PHARMACY') === 'HOSPITAL_PHARMACY'
  );

  const displayedProfiles =
    activeTab === 'LOCAL'
      ? localChemistProfiles
      : activeTab === 'HOSPITAL'
      ? hospitalProfiles
      : users;

  const handleLaunchWithProfile = (profile: UserProfile, targetScreen: string = 'dashboard') => {
    loginUser(profile.id);
    onSelectAndLaunch(targetScreen);
  };

  const handleOpenLoginModal = (profile: UserProfile) => {
    setSelectedUserForLogin(profile);
    setLoginPin('1234');
    setLoginError(null);
    setIsLoginModalOpen(true);
  };

  const handleVerifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForLogin) return;

    if (loginPin.length < 4) {
      setLoginError('Security PIN must be at least 4 digits.');
      return;
    }

    loginUser(selectedUserForLogin.id);
    setIsLoginModalOpen(false);
    onSelectAndLaunch(selectedUserForLogin.facilityType === 'LOCAL_PHARMACY' ? 'network' : 'dashboard');
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addUserProfile({
      name: newName.trim(),
      role: 'STAFF',
      assignedLocationId: newAssignedLoc,
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@medinet.in`,
      avatar: newAvatar,
      departmentTitle:
        newFacilityType === 'LOCAL_PHARMACY'
          ? `Owner & Pharmacist — ${newStoreName || 'Retail Chemist'}`
          : newTitle.trim() || `Clinical Pharmacist`,
      employeeId:
        newEmpId.trim() ||
        (newFacilityType === 'LOCAL_PHARMACY'
          ? `CHM-${Math.floor(100 + Math.random() * 900)}`
          : `APO-${Math.floor(100 + Math.random() * 900)}`),
      phone: newPhone.trim() || '+91 98100 00000',
      facilityType: newFacilityType,
      facilityName:
        newFacilityType === 'LOCAL_PHARMACY'
          ? newStoreName || 'Local Medical Store'
          : hospitalName,
      storeArea: newStoreArea.trim() || 'Sector 14, Gurugram',
      drugLicenseNo: newDrugLicenseNo.trim() || '20B/HR-88991',
      active: true,
    });

    setIsAddUserModalOpen(false);
    setNewName('');
    setNewStoreName('');
    setNewStoreArea('');
    setNewDrugLicenseNo('');
    setNewTitle('');
    setNewEmpId('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <div className="space-y-8 pb-16 text-[#1C1917]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E5E4] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Pharmacy Profiles Directory</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
            Local Medical Owners & Hospital Pharmacy Profiles
          </h1>
          <p className="text-sm text-[#78716C] mt-1 max-w-2xl">
            Each local medical store owner can interact, list surplus batches, and claim peer stock to prevent medicine expiration.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Medical Owner</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-[#FAFAF9] p-1 rounded-xl border border-[#E7E5E4]">
          <button
            onClick={() => setActiveTab('LOCAL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'LOCAL'
                ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Local Medical Store Owners ({localChemistProfiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HOSPITAL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HOSPITAL'
                ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Pharmacy Staff ({hospitalProfiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-[#C2410C] shadow-xs border border-[#E7E5E4]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <span>All Profiles ({users.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#78716C] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#15803D]" />
          <span>Peer Medicine Sharing Active Across All Verified Stores</span>
        </div>
      </div>

      {/* 3. Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProfiles.map((profile) => {
          const isCurrentSession = currentUser.id === profile.id;
          const isLocal = profile.facilityType === 'LOCAL_PHARMACY';

          return (
            <div
              key={profile.id}
              className={`bg-white rounded-xl border p-6 flex flex-col justify-between space-y-5 transition-all shadow-xs ${
                isCurrentSession
                  ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-sm'
                  : 'border-[#E7E5E4] hover:border-[#C2410C]'
              } ${!profile.active ? 'opacity-60 bg-[#FAFAF9]' : ''}`}
            >
              {/* Profile Card Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E7E5E4] shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-base text-[#1C1917] leading-snug truncate">
                        {profile.name}
                      </div>
                      <div className="text-xs font-semibold text-[#C2410C] truncate">
                        {profile.facilityName || profile.departmentTitle}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                        {isLocal ? '🏪 Local Medical Owner' : '🏥 Hospital Pharmacy'}
                      </span>
                    </div>
                  </div>

                  {isCurrentSession && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] shrink-0">
                      Active
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="pt-2 border-t border-[#E7E5E4] space-y-1.5 text-xs text-[#78716C]">
                  {profile.storeArea && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                      <span className="truncate">Area: <strong>{profile.storeArea}</strong></span>
                    </div>
                  )}

                  {profile.drugLicenseNo && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        DL: <strong>{profile.drugLicenseNo}</strong>
                      </span>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                      <span className="font-mono text-[11px]">{profile.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                    <span className="font-mono text-[11px] truncate">{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#E7E5E4] space-y-2">
                <div className="flex items-center gap-2">
                  {isLocal ? (
                    <button
                      onClick={() => handleLaunchWithProfile(profile, 'network')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Chemist Exchange</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLaunchWithProfile(profile, 'dashboard')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors shadow-xs"
                    >
                      <span>Hospital Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenLoginModal(profile)}
                    title="Authenticate with PIN"
                    className="px-2.5 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg hover:border-[#C2410C]"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                </div>

                {currentUser.id !== profile.id && (
                  <button
                    onClick={() => toggleUserStatus(profile.id)}
                    className="w-full text-center text-[10px] text-[#78716C] hover:text-[#B91C1C] py-0.5"
                  >
                    {profile.active ? 'Deactivate Store Profile' : 'Reactivate Store Profile'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. REGISTER NEW MEDICAL STORE MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Register New Medical Store Owner</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">Facility Type</label>
                  <select
                    value={newFacilityType}
                    onChange={(e) => setNewFacilityType(e.target.value as FacilityType)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  >
                    <option value="LOCAL_PHARMACY">🏪 Local Retail Pharmacy</option>
                    <option value="HOSPITAL_PHARMACY">🏥 Hospital Central Pharmacy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">Owner / Pharmacist Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Gupta"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  />
                </div>
              </div>

              {newFacilityType === 'LOCAL_PHARMACY' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1C1917] mb-1">Medical Store Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gupta Medicos & Surgical"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1C1917] mb-1">Area / Location</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sector 56, Gurugram"
                        value={newStoreArea}
                        onChange={(e) => setNewStoreArea(e.target.value)}
                        className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1917] mb-1">Drug License Number (Form 20B/21B)</label>
                    <input
                      type="text"
                      placeholder="e.g. 20B/HR-67123"
                      value={newDrugLicenseNo}
                      onChange={(e) => setNewDrugLicenseNo(e.target.value)}
                      className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 font-mono focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98110 55432"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. owner@guptamedicos.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm"
                >
                  Register Store & Enable Sharing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PIN LOGIN MODAL */}
      {isLoginModalOpen && selectedUserForLogin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Store Authentication</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyLogin} className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4]">
                <img
                  src={selectedUserForLogin.avatar}
                  alt={selectedUserForLogin.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4]"
                />
                <div>
                  <div className="font-bold text-sm text-[#1C1917]">{selectedUserForLogin.name}</div>
                  <div className="text-[11px] font-medium text-[#C2410C]">
                    {selectedUserForLogin.facilityName || selectedUserForLogin.departmentTitle}
                  </div>
                  {selectedUserForLogin.storeArea && (
                    <div className="text-[10px] text-[#78716C]">{selectedUserForLogin.storeArea}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">
                  Store Security PIN
                </label>
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-center tracking-widest text-base focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  required
                />
                <div className="text-[10px] text-[#78716C] mt-1 text-center">
                  Default Demo PIN: <code className="font-bold text-[#1C1917]">1234</code>
                </div>
              </div>

              {loginError && <div className="text-[#B91C1C] text-center font-medium">{loginError}</div>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-3 py-2 font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm text-center"
                >
                  Enter Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
