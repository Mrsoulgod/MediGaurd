import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Zap,
  ShieldAlert,
  Calendar,
  Building,
  Info,
  X,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatINR } from '../utils/engine';
import { BatchAnalysis, Drug } from '../types';

export const InventoryTab: React.FC = () => {
  const { analyses, quarantineBatch } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sortField, setSortField] = useState<'daysToExpiry' | 'qty' | 'wasteValue'>('daysToExpiry');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  // Timeline buckets
  const timelineBuckets = useMemo(() => {
    let expired = 0;
    let within30 = 0;
    let within60 = 0;
    let within90 = 0;
    let beyond90 = 0;

    for (const item of analyses) {
      if (item.batch.status !== 'active') continue;
      const d = item.daysToExpiry;
      if (d <= 0) expired += item.batch.qty;
      else if (d <= 30) within30 += item.batch.qty;
      else if (d <= 60) within60 += item.batch.qty;
      else if (d <= 90) within90 += item.batch.qty;
      else beyond90 += item.batch.qty;
    }

    const total = Math.max(1, expired + within30 + within60 + within90 + beyond90);
    return {
      expired: { count: expired, pct: Math.round((expired / total) * 100) },
      within30: { count: within30, pct: Math.round((within30 / total) * 100) },
      within60: { count: within60, pct: Math.round((within60 / total) * 100) },
      within90: { count: within90, pct: Math.round((within90 / total) * 100) },
      beyond90: { count: beyond90, pct: Math.round((beyond90 / total) * 100) },
    };
  }, [analyses]);

  // Filtered & sorted
  const filteredBatches = useMemo(() => {
    return analyses
      .filter(item => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesDrug = item.drug.name.toLowerCase().includes(q);
          const matchesBatch = item.batch.batchNo.toLowerCase().includes(q);
          const matchesSupplier = item.supplier.name.toLowerCase().includes(q);
          if (!matchesDrug && !matchesBatch && !matchesSupplier) return false;
        }

        if (locationFilter !== 'ALL' && item.batch.location !== locationFilter) {
          return false;
        }

        if (statusFilter !== 'ALL') {
          if (statusFilter === 'quarantined' && item.batch.status !== 'quarantined') return false;
          if (statusFilter === 'recalled' && item.batch.status !== 'recalled') return false;
          if (statusFilter === 'active' && item.batch.status !== 'active') return false;
          if (['expired', 'red', 'amber', 'green'].includes(statusFilter)) {
            if (item.expiryStatus !== statusFilter || item.batch.status !== 'active') return false;
          }
        }

        if (criticalOnly && !item.drug.critical) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'daysToExpiry') diff = a.daysToExpiry - b.daysToExpiry;
        if (sortField === 'qty') diff = a.batch.qty - b.batch.qty;
        if (sortField === 'wasteValue') diff = a.wasteValue - b.wasteValue;
        return sortAsc ? diff : -diff;
      });
  }, [analyses, searchQuery, locationFilter, statusFilter, criticalOnly, sortField, sortAsc]);

  const selectedDrugBatches = useMemo(() => {
    if (!selectedDrug) return [];
    return analyses.filter(a => a.drug.id === selectedDrug.id);
  }, [analyses, selectedDrug]);

  const renderStatusChip = (item: BatchAnalysis) => {
    if (item.batch.status === 'recalled') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          RECALLED
        </span>
      );
    }
    if (item.batch.status === 'quarantined') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          QUARANTINED
        </span>
      );
    }
    if (item.daysToExpiry <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
          EXPIRED ({Math.abs(item.daysToExpiry)}d ago)
        </span>
      );
    }
    if (item.expiryStatus === 'red') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          RED ({item.daysToExpiry}d)
        </span>
      );
    }
    if (item.expiryStatus === 'amber') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          AMBER ({item.daysToExpiry}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        GREEN ({item.daysToExpiry}d)
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Expiry Timeline & Distribution */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Hospital Expiry Timeline Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active medication units distributed across expiration horizons
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-2 sm:mt-0">
            Total Batches: <strong className="text-orange-600 font-bold">{analyses.length}</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200">
            <div
              style={{ width: `${timelineBuckets.expired.pct}%` }}
              className="bg-slate-400 hover:brightness-110 transition-all rounded-l-full"
              title={`Expired: ${timelineBuckets.expired.count} units`}
            />
            <div
              style={{ width: `${timelineBuckets.within30.pct}%` }}
              className="bg-rose-500 hover:brightness-110 transition-all"
              title={`< 30 Days: ${timelineBuckets.within30.count} units`}
            />
            <div
              style={{ width: `${timelineBuckets.within60.pct}%` }}
              className="bg-orange-500 hover:brightness-110 transition-all"
              title={`31-60 Days: ${timelineBuckets.within60.count} units`}
            />
            <div
              style={{ width: `${timelineBuckets.within90.pct}%` }}
              className="bg-amber-400 hover:brightness-110 transition-all"
              title={`61-90 Days: ${timelineBuckets.within90.count} units`}
            />
            <div
              style={{ width: `${timelineBuckets.beyond90.pct}%` }}
              className="bg-emerald-500 hover:brightness-110 transition-all rounded-r-full"
              title={`> 90 Days: ${timelineBuckets.beyond90.count} units`}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Expired ({timelineBuckets.expired.count} u)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>&lt; 30d ({timelineBuckets.within30.count} u)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>31-60d ({timelineBuckets.within60.count} u)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>61-90d ({timelineBuckets.within90.count} u)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>&gt; 90d ({timelineBuckets.beyond90.count} u)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine name, batch number, or supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Locations</option>
              <option value="Main Store">Main Store</option>
              <option value="Ward A">Ward A</option>
              <option value="Ward B">Ward B</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="expired">Expired</option>
              <option value="red">Red Alert</option>
              <option value="amber">Amber Watch</option>
              <option value="green">Green Safe</option>
              <option value="quarantined">Quarantined</option>
              <option value="recalled">Recalled</option>
            </select>
          </div>

          <button
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              criticalOnly
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical Only
          </button>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-4 px-4 font-bold">Medicine / Drug</th>
                <th className="py-4 px-4 font-bold">Batch No.</th>
                <th className="py-4 px-4 font-bold">Location</th>
                <th className="py-4 px-4 font-bold">Quantity</th>
                <th
                  onClick={() => {
                    if (sortField === 'daysToExpiry') setSortAsc(!sortAsc);
                    else {
                      setSortField('daysToExpiry');
                      setSortAsc(true);
                    }
                  }}
                  className="py-4 px-4 font-bold cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Expiry / Days</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 font-bold">Status / FEFO</th>
                <th className="py-4 px-4 font-bold">Supplier</th>
                <th className="py-4 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No batches match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(item => {
                  const isHero = item.batch.batchNo === 'MERO-2025-780';
                  return (
                    <tr
                      key={item.batch.id}
                      className={`hover:bg-orange-50/30 transition-colors ${
                        isHero ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium">
                        <button
                          onClick={() => setSelectedDrug(item.drug)}
                          className="hover:text-orange-600 text-left font-bold text-slate-900 flex items-center space-x-1.5 group"
                        >
                          <span>{item.drug.name}</span>
                          <Info className="w-3 h-3 text-slate-400 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{item.drug.form}</span>
                          <span>&bull;</span>
                          <span>₹{item.drug.unitCost}/unit</span>
                          {item.drug.critical && (
                            <span className="text-rose-600 font-bold">&bull; Critical</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {item.batch.batchNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {item.batch.location}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900">{item.batch.qty}</span>
                        {item.wasteQty > 0 && item.batch.status === 'active' && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            {item.wasteQty} wasted ({formatINR(item.wasteValue)})
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-800">{item.batch.expiry}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.daysToExpiry <= 0
                            ? 'Expired'
                            : `${item.daysToExpiry} days left`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {renderStatusChip(item)}
                          {item.isEarliestBatch && item.batch.status === 'active' && item.daysToExpiry > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                              <Zap className="w-2.5 h-2.5 mr-1 text-orange-600" />
                              USE FIRST
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{item.supplier.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Lead: {item.supplier.leadTimeDays}d &bull; Return: {item.supplier.returnWindowDays}d
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.batch.status === 'active' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Quarantine batch ${item.batch.batchNo}?`)) {
                                quarantineBatch(item.batch.id, 'Quarantined by Clinical Staff');
                              }
                            }}
                            title="Quarantine batch"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drug Details Drawer */}
      {selectedDrug && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedDrug.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDrug.category} &bull; {selectedDrug.form}</p>
                </div>
                <button
                  onClick={() => setSelectedDrug(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Daily Usage</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedDrug.dailyUsage > 0 ? `${selectedDrug.dailyUsage} u/day` : '0 u/day'}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Unit Cost</div>
                  <div className="text-base font-extrabold text-orange-600 mt-1">₹{selectedDrug.unitCost}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Batches</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">{selectedDrugBatches.length}</div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Batches on Hand
                </h4>
                {selectedDrugBatches.map(b => (
                  <div
                    key={b.batch.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{b.batch.batchNo}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Location: {b.batch.location} &bull; Qty: <strong>{b.batch.qty}</strong> &bull; Expiry: {b.batch.expiry}
                      </div>
                    </div>
                    <div>{renderStatusChip(b)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setSelectedDrug(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
