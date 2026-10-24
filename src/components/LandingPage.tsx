import React from 'react';
import {
  Shield,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Building2,
  Pill,
  Users,
  Sliders,
  Sparkles,
  Lock,
  ChevronRight,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';
import { formatPaiseINR } from '../engines/reorder';

interface LandingPageProps {
  onEnterApp: (screen?: any) => void;
  onGoToProfiles: () => void;
  onOpenCustomizer: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onGoToProfiles,
  onOpenCustomizer,
}) => {
  const { hospitalName, kpiStats, locations, medicines, rules, currentUser } = useMediGuard();

  return (
    <div className="space-y-16 pb-16 text-[#1C1917]">
      {/* 1. Clinical Hero Section */}
      <section className="relative pt-4 sm:pt-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
              <span>{hospitalName}</span>
              <span className="text-[#C2410C]/40">&bull;</span>
              <span className="font-mono">Clinical Inpatient Formulary</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15]">
              Eliminate Hospital Medicine Expiry with{' '}
              <span className="text-[#C2410C]">Predictive Clinical Actions</span>
            </h1>

            <p className="text-base text-[#78716C] leading-relaxed max-w-xl">
              Hospitals lose lakhs when expiry is tracked solely as calendar dates on shelves. MediGuard AI couples real-time ward consumption rates with batch shelf life, directing inter-department transfers to prevent waste before stock expires.
            </p>

            {/* Hero CTA Buttons - Exactly ONE filled primary button per DESIGN.md */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onEnterApp('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold shadow-sm transition-all"
              >
                <span>Launch Clinical Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToProfiles}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917] text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4 text-[#C2410C]" />
                <span>Staff Profiles & Roles</span>
              </button>

              <button
                onClick={onOpenCustomizer}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                <Sliders className="w-4 h-4" />
                <span>Hospital Settings</span>
              </button>
            </div>

            {/* Active Session Strip */}
            <div className="pt-3 flex items-center gap-3 text-xs text-[#78716C]">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#E7E5E4]"
                />
                <span>
                  Logged in as <strong className="text-[#1C1917]">{currentUser.name}</strong> ({currentUser.role})
                </span>
              </div>
              <span>&bull;</span>
              <span className="font-mono text-[#C2410C]">{rules.demoFixedDate} (Fixed Audit Time)</span>
            </div>
          </div>

          {/* Right Clinical Photography Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#E7E5E4] shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80"
                alt="Hospital Pharmacy Clinical Storage"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#EA580C]">
                  Central Pharmacy Dispensary
                </div>
                <div className="text-sm font-semibold">Cold-Chain & Ambient Inventory Monitoring</div>
                <div className="text-xs text-stone-300 mt-1 flex items-center gap-2 font-mono">
                  <span>✓ 100% FEFO Adherence</span>
                  <span>&bull;</span>
                  <span>✓ Zero Unreviewed Adjustments</span>
                </div>
              </div>
            </div>

            {/* Overlay Metric Pill */}
            <div className="absolute -bottom-5 -left-4 bg-white border border-[#E7E5E4] p-3.5 rounded-xl shadow-md flex items-center gap-3 text-xs">
              <div className="w-9 h-9 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#1C1917]">₹4,20,000+ Waste Prevented</div>
                <div className="text-[#78716C]">Via Inter-Ward Redistribution this Month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Verified Formulary Metrics */}
      <section className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#E7E5E4]">
          <div className="space-y-1">
            <div className="text-3xl font-bold font-mono text-[#1C1917] tabular-nums">
              {kpiStats.activeMedicinesCount}
            </div>
            <div className="text-xs text-[#78716C]">Active Medicines</div>
            <div className="text-[11px] text-[#15803D] font-medium">Antibiotics, Biologics, Vials</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl font-bold font-mono text-[#1C1917] tabular-nums">
              {kpiStats.activeBatchesCount}
            </div>
            <div className="text-xs text-[#78716C]">Verified Batches</div>
            <div className="text-[11px] text-[#78716C]">GS1 / 2D Barcode Indexed</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl font-bold font-mono text-[#B91C1C] tabular-nums">
              {formatPaiseINR(kpiStats.projectedAtRiskPaise)}
            </div>
            <div className="text-xs text-[#78716C]">Projected Near-Expiry Value</div>
            <div className="text-[11px] text-[#A16207] font-medium">Flagged for FEFO / Transfer</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl font-bold font-mono text-[#15803D] tabular-nums">
              {kpiStats.pendingApprovalsCount}
            </div>
            <div className="text-xs text-[#78716C]">Pending Manager Actions</div>
            <div className="text-[11px] text-[#15803D] font-medium">Transfers & Count Verifications</div>
          </div>
        </div>
      </section>

      {/* 3. Real Clinical Problem vs Deterministic Solution */}
      <section className="space-y-6">
        <div className="text-left space-y-1 max-w-2xl">
          <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
            Clinical Inventory Reality vs. Naive Alerting
          </h2>
          <p className="text-sm text-[#78716C]">
            Alerts alone cause alarm fatigue. MediGuard calculates clinical feasibility before suggesting any action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Clinical Problem */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#B91C1C] font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
              <span>The Operational Pitfall: Shelf Date Tracking</span>
            </div>

            <ul className="space-y-3 text-xs text-[#78716C] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&times;</span>
                <span>
                  <strong>False Security:</strong> A batch of Ceftriaxone 1g is labeled green because it expires in 25 days, yet the ward only burns 2 vials/week. 320 vials will expire untouched.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&times;</span>
                <span>
                  <strong>Simultaneous Shortages:</strong> While Central Pharmacy sits on doomed surplus, the Intensive Care Unit runs out of the same antibiotic in 5 days.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B91C1C] font-bold">&times;</span>
                <span>
                  <strong>Naive Procurement:</strong> Purchasing teams reorder blind quantities without subtracting expiring stock or factoring approved intra-hospital transfers.
                </span>
              </li>
            </ul>
          </div>

          {/* Card 2: Deterministic Solution */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#15803D] font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <span>The MediGuard Standard: Deterministic Decision Logic</span>
            </div>

            <ul className="space-y-3 text-xs text-[#78716C] leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Predictive Ward Burn Rates:</strong> Weighted 60/40 forecast blends 7-day and 30-day usage to calculate exact unconsumed units before expiry.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Verified Inter-Department Redistribution:</strong> Matches donor surplus with recipient deficit, checking storage capabilities (cold-chain) and transit shelf life.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Adaptive Reorder & Reverse Logistics:</strong> Excludes doomed stock, factors approved inbound transfers, and flags supplier return windows (e.g. 45 days).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Real Hospital Departments In-Scope */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Hospital Ward Facilities Under Management
            </h2>
            <p className="text-xs text-[#78716C]">
              Real physical locations with designated storage parameters and clinical lead times.
            </p>
          </div>
          <button
            onClick={() => onEnterApp('inventory')}
            className="text-xs text-[#C2410C] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Inspect All Balances</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => onEnterApp('inventory')}
              className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden hover:border-[#C2410C] cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <img src={loc.image} alt={loc.name} className="w-full h-36 object-cover" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#1C1917]">{loc.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C]">
                      {loc.id}
                    </span>
                  </div>
                  <div className="text-xs text-[#78716C]">Storage Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {loc.storageCapabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#FAFAF9] text-[#1C1917] border border-[#E7E5E4]"
                      >
                        {cap.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FAFAF9] border-t border-[#E7E5E4] text-[11px] text-[#C2410C] font-medium flex items-center justify-between">
                <span>View Ward Stock &rarr;</span>
                <span className="text-[#78716C] font-mono">FEFO Monitored</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Dual Operating Modes: Hospital Pharmacy vs Local Chemist Network */}
      <section className="bg-white border border-[#E7E5E4] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E7E5E4] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-[11px] font-semibold mb-1">
              <span>Dual Operating Modes</span>
            </div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Hospital Inpatient Health Systems vs. Local Chemist Medicine Sharing
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Built for acute inpatient hospital networks and local retail chemist communities.
            </p>
          </div>
          <button
            onClick={onGoToProfiles}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Sign In or Switch Pharmacy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Mode 1: Hospital Pharmacy */}
          <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E7E5E4] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold">
                  🏥
                </span>
                <div>
                  <div className="font-bold text-sm text-[#1C1917]">Hospital Central Pharmacy</div>
                  <div className="text-[11px] text-[#78716C]">Inpatient Acute Care Network</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                Active Formulary
              </span>
            </div>
            <p className="text-[#78716C] text-xs leading-relaxed">
              Handles multi-ward redistribution (moving near-expiry Ceftriaxone or Meropenem from Central Pharmacy to ICU), tracking cold-chain storage and high-volume inpatient burn rates.
            </p>
            <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between text-[11px]">
              <span className="text-[#78716C]">Wards: Central, ICU, Emergency, OT</span>
              <button
                onClick={() => onEnterApp('today')}
                className="font-semibold text-[#C2410C] hover:underline"
              >
                Launch Decision Engine &rarr;
              </button>
            </div>
          </div>

          {/* Mode 2: Local Chemist Peer Medicine Sharing */}
          <div className="p-5 rounded-xl bg-[#FFF7ED]/50 border border-[#FFEDD5] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold">
                  🏪
                </span>
                <div>
                  <div className="font-bold text-sm text-[#1C1917]">Local Medical Owners Exchange</div>
                  <div className="text-[11px] text-[#C2410C] font-medium">Peer-to-Peer Medicine Sharing</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                5 Verified Stores
              </span>
            </div>
            <p className="text-[#78716C] text-xs leading-relaxed">
              Local retail chemists interact directly: post near-expiry or surplus batches at 20-30% discount. Neighboring chemists claim them to fulfill immediate patient prescriptions, preventing 100% of medicine waste.
            </p>
            <div className="pt-2 border-t border-[#FFEDD5] flex items-center justify-between text-[11px]">
              <span className="text-[#78716C]">CarePlus, Sharma Med, CyberHub, CityMed</span>
              <button
                onClick={() => onEnterApp('transfers')}
                className="font-semibold text-[#C2410C] hover:underline"
              >
                Open Chemist Exchange &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hospital Trust & Regulatory Banner */}
      <section className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-[#15803D]" />
          <div>
            <div className="font-semibold text-[#1C1917]">Regulatory & Traceability Standard</div>
            <div>Postgres append-only ledger &bull; Idempotency keys &bull; Zero patient data stored</div>
          </div>
        </div>

        <button
          onClick={() => onEnterApp('insights')}
          className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1"
        >
          <span>Audit Log & Rules</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
};
