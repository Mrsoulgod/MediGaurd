import React, { useState } from 'react';
import {
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Undo2,
  Trash2,
  CheckCircle2,
  Zap,
  Filter,
  Flame,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatINR } from '../utils/engine';
import { ActionType, Location } from '../types';

export const TodayTab: React.FC = () => {
  const {
    todayActions,
    totalAtRiskRupees,
    savedRupees,
    expiredBatchesCount,
    criticalStockoutsCount,
    executeAction,
    currentProfile,
  } = useInventory();

  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');

  // Filter actions
  const filteredActions = todayActions.filter(action => {
    if (selectedLocation !== 'ALL' && action.fromLocation !== selectedLocation) {
      return false;
    }
    if (selectedActionType !== 'ALL' && action.action !== selectedActionType) {
      return false;
    }
    return true;
  });

  const getActionBadge = (type: ActionType) => {
    switch (type) {
      case 'discard':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3 mr-1 text-rose-600" />
            DISCARD
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ArrowRightLeft className="w-3 h-3 mr-1 text-indigo-600" />
            TRANSFER
          </span>
        );
      case 'return':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Undo2 className="w-3 h-3 mr-1 text-amber-600" />
            RETURN TO SUPPLIER
          </span>
        );
      case 'use_first':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Zap className="w-3 h-3 mr-1 text-emerald-600" />
            USE FIRST (FEFO)
          </span>
        );
      case 'review':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-orange-600" />
            URGENT REVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Role Context Bar */}
      <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <img
            src={currentProfile.avatar}
            alt={currentProfile.name}
            className="w-10 h-10 rounded-xl object-cover border border-orange-200"
          />
          <div>
            <div className="text-xs font-bold text-orange-800 flex items-center space-x-1.5">
              <span>Viewing Active Decisions as:</span>
              <span className="text-slate-900 font-extrabold">{currentProfile.name}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentProfile.keyResponsibility}</p>
          </div>
        </div>

        <div className="text-xs font-semibold text-orange-700 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-xs">
          Role Scope: <strong className="text-slate-900">{currentProfile.role}</strong>
        </div>
      </div>

      {/* 4 Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ₹ At Risk Total */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm card-hover-lift relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Predicted ₹ At Risk</span>
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(totalAtRiskRupees)}
            </div>
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1 inline" />
              Doomed waste without action
            </p>
          </div>
        </div>

        {/* Card 2: ₹ Saved This Session */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm card-hover-lift relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">₹ Saved This Session</span>
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {formatINR(savedRupees)}
            </div>
            <p className="mt-1 text-xs text-emerald-700/80 font-medium flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Prevented via Done & Transfers
            </p>
          </div>
        </div>

        {/* Card 3: Expired Batches */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm card-hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expired Batches</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {expiredBatchesCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">Immediate disposal required</p>
          </div>
        </div>

        {/* Card 4: Stockouts Within 7 Days */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm card-hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stockouts &le; 7 Days</span>
            <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-orange-600 tracking-tight">
              {criticalStockoutsCount}
            </div>
            <p className="mt-1 text-xs text-orange-700/80 font-medium">Critical drugs below lead time</p>
          </div>
        </div>
      </div>

      {/* Main Action Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        {/* Title and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Ranked Daily Action Queue
              </h2>
              <span className="px-2.5 py-0.5 text-xs bg-orange-100 text-orange-800 font-bold rounded-full">
                {filteredActions.length} Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prioritized by Urgency Factor &times; ₹ Impact &times; Critical Weight. Execute with one click.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Wards & Stores</option>
                <option value="Main Store">Main Store</option>
                <option value="Ward A">Ward A</option>
                <option value="Ward B">Ward B</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value)}
                className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Action Types</option>
                <option value="transfer">Transfer</option>
                <option value="return">Return to Supplier</option>
                <option value="use_first">Use First</option>
                <option value="discard">Discard</option>
                <option value="review">Urgent Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Cards List */}
        <div className="space-y-4">
          {filteredActions.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-base font-bold text-slate-900">All priority actions completed for this view!</p>
              <p className="text-xs text-slate-500 mt-1">Zero pending critical waste alerts under these filters.</p>
            </div>
          ) : (
            filteredActions.slice(0, 7).map((action, idx) => {
              const isHeroBatch = action.batch.batchNo === 'MERO-2025-780';
              return (
                <div
                  key={action.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 card-hover-lift ${
                    isHeroBatch
                      ? 'bg-orange-50/40 border-orange-300 ring-2 ring-orange-400/20 shadow-md'
                      : 'bg-white border-slate-200/90 hover:border-orange-200'
                  }`}
                >
                  {/* Left Column */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionBadge(action.action)}
                        <span className="font-extrabold text-slate-900 text-base">
                          {action.drug.name}
                        </span>
                        {action.drug.critical && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                            CRITICAL
                          </span>
                        )}
                        {action.drug.coldChain && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md">
                            COLD CHAIN
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-3 gap-y-1">
                        <span>Batch: <strong className="text-slate-800 font-mono">{action.batch.batchNo}</strong></span>
                        <span>&bull;</span>
                        <span>Location: <strong className="text-slate-800">{action.fromLocation}</strong></span>
                        {action.toLocation && (
                          <>
                            <span>&rarr;</span>
                            <span className="text-indigo-600 font-bold">{action.toLocation}</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>Qty: <strong className="text-slate-800">{action.batch.qty} units</strong></span>
                        <span>&bull;</span>
                        <span className="text-orange-700 font-semibold">
                          Deadline: {action.deadline}
                        </span>
                      </div>

                      {/* Explainability Line */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-700">
                        <span className="font-bold text-orange-600 mr-1.5">Clinical Rationale:</span>
                        <span>{action.why}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex items-center justify-between md:justify-end space-x-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">₹ At Risk</div>
                      <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                        {formatINR(action.rupeesAtRisk)}
                      </div>
                    </div>

                    <button
                      onClick={() => executeAction(action)}
                      className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute Done</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
