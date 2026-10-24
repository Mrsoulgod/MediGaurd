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
  Store,
  ThermometerSnowflake,
  ShieldCheck,
  Package,
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

  const essentialDrugs = [
    {
      name: 'Ceftriaxone 1g Injection',
      brand: 'Monocef 1g',
      category: 'Broad-Spectrum Cephalosporin',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      caseStudy: 'Surplus of 320 vials at Central Pharmacy dynamically rerouted to ICU before day 25.',
      tag: 'Critical Anti-Infective',
      color: 'border-red-200 bg-red-50/50',
    },
    {
      name: 'Meropenem 1g IV Infusion',
      brand: 'Meronem 1g',
      category: 'Carbapenem Antibiotic',
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
      caseStudy: 'Stored in 2°C–8°C cold chain. 45-day Cipla distributor return window monitored in real time.',
      tag: 'Cold Chain Protected',
      color: 'border-blue-200 bg-blue-50/50',
    },
    {
      name: 'Amoxicillin + Clavulanic Acid 625mg',
      brand: 'Augmentin 625 Duo',
      category: 'Penicillin Antibiotic',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
      caseStudy: 'Shared across retail chemists at 30% discount to fulfill local acute prescription demand.',
      tag: 'Chemist Exchange',
      color: 'border-amber-200 bg-amber-50/50',
    },
    {
      name: 'Enoxaparin Sodium 40mg/0.4ml',
      brand: 'Clexane Prefilled',
      category: 'Low Molecular Weight Heparin',
      image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=500&auto=format&fit=crop&q=80',
      caseStudy: 'High-cost anticoagulant with strict zero-stockout protocol in OT and Emergency units.',
      tag: 'High Criticality',
      color: 'border-emerald-200 bg-emerald-50/50',
    },
  ];

  return (
    <div className="space-y-16 pb-16 text-[#1C1917] animate-in fade-in duration-300">
      {/* 1. Clinical Hero Section */}
      <section className="relative pt-4 sm:pt-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
              <span>{hospitalName}</span>
              <span className="text-[#C2410C]/40">&bull;</span>
              <span className="font-mono">Central Expiry Decision Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15]">
              Eliminate Medicine Expiry with{' '}
              <span className="text-[#C2410C] underline decoration-[#C2410C]/30 underline-offset-4">
                Predictive Clinical Decisions
              </span>
            </h1>

            <p className="text-base text-[#78716C] leading-relaxed max-w-xl">
              Hospitals and retail chemists lose lakhs when expiry is tracked solely as calendar dates on shelves. Swasti couples real-time consumption rates with batch shelf life, directing inter-department transfers and peer chemist exchanges to prevent waste before stock expires.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onEnterApp('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold shadow-sm transition-all transform hover:-translate-y-0.5 glow-orange"
              >
                <span>Launch Central Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToProfiles}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917] text-sm font-medium transition-all shadow-2xs card-hover-lift"
              >
                <Users className="w-4 h-4 text-[#C2410C]" />
                <span>Sign In / Switch Store</span>
              </button>

              <button
                onClick={onOpenCustomizer}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                <Sliders className="w-4 h-4" />
                <span>System Parameters</span>
              </button>
            </div>

            {/* Active Session Strip */}
            <div className="pt-2 flex items-center gap-3 text-xs text-[#78716C]">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#E7E5E4]"
                />
                <span>
                  Active identity: <strong className="text-[#1C1917]">{currentUser.name}</strong> ({currentUser.facilityName || currentUser.role})
                </span>
              </div>
              <span>&bull;</span>
              <span className="font-mono text-[#C2410C]">{rules.demoFixedDate} (Fixed Audit Clock)</span>
            </div>
          </div>

          {/* Right Clinical Photography Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#E7E5E4] shadow-lg bg-white card-hover-lift group">
              <img
                src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80"
                alt="Hospital Pharmacy Clinical Storage"
                className="w-full h-84 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#FFEDD5]">
                  Central Pharmacy & Retail Dispensary
                </div>
                <div className="text-base font-bold">Cold-Chain & Ambient Inventory Monitoring</div>
                <div className="text-xs text-stone-300 mt-1.5 flex flex-wrap items-center gap-2 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>100% FEFO Adherence</span>
                  </span>
                  <span>&bull;</span>
                  <span>Zero Unreviewed Discards</span>
                </div>
              </div>
            </div>

            {/* Overlay Metric Pill */}
            <div className="absolute -bottom-5 -left-4 bg-white border border-[#E7E5E4] p-4 rounded-xl shadow-md flex items-center gap-3.5 text-xs card-hover-lift">
              <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-[#1C1917] text-sm">₹4,20,000+ Waste Prevented</div>
                <div className="text-[#78716C]">Via Inter-Ward & Chemist Redistribution</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Verified Formulary Metrics */}
      <section className="bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-7 shadow-xs card-hover-lift">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#E7E5E4]">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#1C1917] tabular-nums">
              {kpiStats.activeMedicinesCount}
            </div>
            <div className="text-xs text-[#78716C] font-medium">Active Formulations</div>
            <div className="text-[11px] text-[#15803D] font-medium">Antibiotics, Biologics, Vials</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#1C1917] tabular-nums">
              {kpiStats.activeBatchesCount}
            </div>
            <div className="text-xs text-[#78716C] font-medium">Verified Batches</div>
            <div className="text-[11px] text-[#78716C]">GS1 / 2D Barcode Indexed</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#B91C1C] tabular-nums">
              {formatPaiseINR(kpiStats.projectedAtRiskPaise)}
            </div>
            <div className="text-xs text-[#78716C] font-medium">Projected Near-Expiry Value</div>
            <div className="text-[11px] text-[#A16207] font-medium">Flagged for FEFO / Transfer</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#15803D] tabular-nums">
              {kpiStats.pendingApprovalsCount}
            </div>
            <div className="text-xs text-[#78716C] font-medium">Pending Manager Actions</div>
            <div className="text-[11px] text-[#15803D] font-medium">Transfers & Count Verifications</div>
          </div>
        </div>
      </section>

      {/* 3. Essential Formulations Showcase (High-Res Packaging & Pill Imagery) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-[11px] font-semibold mb-1">
              <span>Formulary Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
              Essential Formulations Under Active Decision Monitoring
            </h2>
            <p className="text-xs text-[#78716C]">
              High-value anti-infectives, biologics, and retail formulations protected from expiration discard.
            </p>
          </div>
          <button
            onClick={() => onEnterApp('dashboard')}
            className="text-xs text-[#C2410C] font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Central Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {essentialDrugs.map((drug, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-xl overflow-hidden card-hover-lift flex flex-col justify-between group shadow-2xs ${drug.color}`}
            >
              <div>
                <div className="relative h-36 overflow-hidden bg-stone-100">
                  <img
                    src={drug.image}
                    alt={drug.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-[#1C1917] shadow-xs border border-stone-200">
                      {drug.tag}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] leading-snug">{drug.brand}</div>
                    <div className="text-[11px] text-[#78716C]">{drug.name}</div>
                    <div className="text-[10px] font-medium text-[#C2410C] mt-0.5">{drug.category}</div>
                  </div>

                  <p className="text-xs text-[#78716C] leading-relaxed pt-1 border-t border-stone-200/60">
                    {drug.caseStudy}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/80 border-t border-stone-200/60 text-[11px] text-[#C2410C] font-semibold flex items-center justify-between">
                <span>View Expiry Schedule</span>
                <span>&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Real Clinical Problem vs Deterministic Solution */}
      <section className="space-y-6">
        <div className="text-left space-y-1 max-w-2xl">
          <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
            Clinical Inventory Reality vs. Naive Alerting
          </h2>
          <p className="text-sm text-[#78716C]">
            Alerts alone cause alarm fatigue. Swasti calculates clinical feasibility before suggesting any action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Clinical Problem */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 sm:p-7 space-y-4 card-hover-lift shadow-2xs">
            <div className="flex items-center gap-2.5 text-[#B91C1C] font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] animate-ping" />
              <span>The Operational Pitfall: Shelf Date Tracking</span>
            </div>

            <ul className="space-y-3.5 text-xs text-[#78716C] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-[#B91C1C] font-bold text-sm leading-none">&times;</span>
                <span>
                  <strong>False Security:</strong> A batch of Ceftriaxone 1g is labeled green because it expires in 25 days, yet the ward only burns 2 vials/week. 320 vials will expire untouched.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#B91C1C] font-bold text-sm leading-none">&times;</span>
                <span>
                  <strong>Simultaneous Shortages:</strong> While Central Pharmacy sits on doomed surplus, the Intensive Care Unit runs out of the same antibiotic in 5 days.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#B91C1C] font-bold text-sm leading-none">&times;</span>
                <span>
                  <strong>Naive Procurement:</strong> Purchasing teams reorder blind quantities without subtracting expiring stock or factoring approved intra-hospital transfers.
                </span>
              </li>
            </ul>
          </div>

          {/* Card 2: Deterministic Solution */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 sm:p-7 space-y-4 card-hover-lift shadow-2xs">
            <div className="flex items-center gap-2.5 text-[#15803D] font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <span>The Swasti Standard: Deterministic Decision Logic</span>
            </div>

            <ul className="space-y-3.5 text-xs text-[#78716C] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Predictive Ward Burn Rates:</strong> Weighted 60/40 forecast blends 7-day and 30-day usage to calculate exact unconsumed units before expiry.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Verified Inter-Department Redistribution:</strong> Matches donor surplus with recipient deficit, checking storage capabilities (cold-chain) and transit shelf life.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Adaptive Reorder & Reverse Logistics:</strong> Excludes doomed stock, factors approved inbound transfers, and flags supplier return windows (e.g. 45 days).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Real Hospital Departments Under Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Hospital Ward Facilities Under Management
            </h2>
            <p className="text-xs text-[#78716C]">
              Physical locations with designated storage parameters and clinical lead times.
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
              className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden card-hover-lift cursor-pointer transition-all shadow-2xs flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 font-bold text-sm text-white">
                    {loc.name}
                  </span>
                </div>
                <div className="p-4 space-y-2">
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

      {/* 6. Dual Operating Modes: Hospital Pharmacy vs Local Chemist Network */}
      <section className="bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 space-y-6 card-hover-lift shadow-xs">
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
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Sign In or Switch Pharmacy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Mode 1: Hospital Pharmacy */}
          <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E7E5E4] space-y-3 card-hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold shadow-2xs">
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
                onClick={() => onEnterApp('dashboard')}
                className="font-semibold text-[#C2410C] hover:underline"
              >
                Launch Decision Engine &rarr;
              </button>
            </div>
          </div>

          {/* Mode 2: Local Chemist Peer Medicine Sharing */}
          <div className="p-5 rounded-xl bg-[#FFF7ED]/50 border border-[#FFEDD5] space-y-3 card-hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold shadow-2xs">
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
                onClick={() => onEnterApp('dashboard')}
                className="font-semibold text-[#C2410C] hover:underline"
              >
                Open Chemist Exchange &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Regulatory & Traceability Banner */}
      <section className="p-5 rounded-2xl bg-[#FAFAF9] border border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C] shadow-2xs card-hover-lift">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E5E4] flex items-center justify-center text-[#15803D] shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[#1C1917]">Clinical Traceability Standard</div>
            <div>Append-only audit ledger &bull; Idempotency keys &bull; Zero patient health data stored</div>
          </div>
        </div>

        <button
          onClick={() => onEnterApp('insights')}
          className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1"
        >
          <span>Audit Log & Rules Engine</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
};
