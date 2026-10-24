import React, { useState } from 'react';
import { X, Sliders, CheckCircle2, RotateCcw, Building2, Clock, Shield } from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({ isOpen, onClose }) => {
  const { hospitalName, setHospitalName, rules, updateRules, currentUser } = useMediGuard();

  const [localHospitalName, setLocalHospitalName] = useState(hospitalName);
  const [localRedDays, setLocalRedDays] = useState(rules.expiryWarningDaysRed);
  const [localYellowDays, setLocalYellowDays] = useState(rules.expiryWarningDaysYellow);
  const [localNeutralDays, setLocalNeutralDays] = useState(rules.expiryWarningDaysNeutral);
  const [localSafetyDays, setLocalSafetyDays] = useState(rules.safetyStockDaysDefault);
  const [localCoverageDays, setLocalCoverageDays] = useState(rules.targetCoverageDaysDefault);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    setHospitalName(localHospitalName.trim() || 'Apollo Institute of Medical Sciences');
    updateRules({
      expiryWarningDaysRed: localRedDays,
      expiryWarningDaysYellow: localYellowDays,
      expiryWarningDaysNeutral: localNeutralDays,
      safetyStockDaysDefault: localSafetyDays,
      targetCoverageDaysDefault: localCoverageDays,
    });

    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 1000);
  };

  const handleResetDefaults = () => {
    setLocalHospitalName('Apollo Institute of Medical Sciences');
    setLocalRedDays(15);
    setLocalYellowDays(30);
    setLocalNeutralDays(60);
    setLocalSafetyDays(3);
    setLocalCoverageDays(30);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7E5E4] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] bg-[#FAFAF9]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#FFF7ED] border border-[#FFEDD5] rounded-lg text-[#C2410C]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1C1917] text-base">Hospital Formulary & Engine Customizer</h3>
              <p className="text-xs text-[#78716C]">Fine-tune hospital facility name, expiry alert windows, and coverage buffers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedFeedback ? (
          <div className="p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#15803D] mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-[#1C1917]">Hospital Parameters Saved</h4>
            <p className="text-xs text-[#78716C]">
              New thresholds applied in real-time across pure calculation engines and dashboard views.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">
            {/* Hospital Facility Name */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-[#1C1917] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#C2410C]" />
                <span>Hospital Facility / Institutional Name</span>
              </label>
              <input
                type="text"
                value={localHospitalName}
                onChange={(e) => setLocalHospitalName(e.target.value)}
                className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                placeholder="e.g. Apollo Institute of Medical Sciences"
                required
              />
            </div>

            {/* Expiry Warning Bands */}
            <div className="space-y-3 pt-2 border-t border-[#E7E5E4]">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#C2410C]" />
                  <span>Configurable Expiry Warning Bands (Days to Expiry)</span>
                </label>
                <span className="text-[10px] text-[#78716C]">Rules v1.0</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1 text-center">
                  <div className="font-semibold text-[#B91C1C]">Red (Urgent)</div>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={localRedDays}
                    onChange={(e) => setLocalRedDays(parseInt(e.target.value) || 15)}
                    className="w-full bg-white border border-[#E7E5E4] rounded p-1.5 text-center font-mono font-bold"
                  />
                  <div className="text-[10px] text-[#78716C]">&le; {localRedDays} days</div>
                </div>

                <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1 text-center">
                  <div className="font-semibold text-[#A16207]">Yellow (Caution)</div>
                  <input
                    type="number"
                    min="15"
                    max="45"
                    value={localYellowDays}
                    onChange={(e) => setLocalYellowDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-white border border-[#E7E5E4] rounded p-1.5 text-center font-mono font-bold"
                  />
                  <div className="text-[10px] text-[#78716C]">&le; {localYellowDays} days</div>
                </div>

                <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1 text-center">
                  <div className="font-semibold text-[#57534E]">Watchlist Band</div>
                  <input
                    type="number"
                    min="40"
                    max="90"
                    value={localNeutralDays}
                    onChange={(e) => setLocalNeutralDays(parseInt(e.target.value) || 60)}
                    className="w-full bg-white border border-[#E7E5E4] rounded p-1.5 text-center font-mono font-bold"
                  />
                  <div className="text-[10px] text-[#78716C]">&le; {localNeutralDays} days</div>
                </div>
              </div>
            </div>

            {/* Replenishment Buffers */}
            <div className="space-y-3 pt-2 border-t border-[#E7E5E4]">
              <label className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#C2410C]" />
                <span>Replenishment Buffers & Safety Stock</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1">
                  <div className="font-semibold text-[#1C1917]">Target Coverage Days</div>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={localCoverageDays}
                    onChange={(e) => setLocalCoverageDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-white border border-[#E7E5E4] rounded p-1.5 font-mono"
                  />
                  <div className="text-[10px] text-[#78716C]">Adaptive purchase order target</div>
                </div>

                <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1">
                  <div className="font-semibold text-[#1C1917]">Safety Stock Buffer (Days)</div>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={localSafetyDays}
                    onChange={(e) => setLocalSafetyDays(parseInt(e.target.value) || 3)}
                    className="w-full bg-white border border-[#E7E5E4] rounded p-1.5 font-mono"
                  />
                  <div className="text-[10px] text-[#78716C]">Emergency ward reserve margin</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E7E5E4]">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[#78716C] hover:text-[#1C1917] font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-[#78716C] hover:text-[#1C1917]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm"
                >
                  Apply Customization
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
