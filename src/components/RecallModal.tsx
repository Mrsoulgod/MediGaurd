import React, { useState } from 'react';
import { X, ShieldAlert, Search, AlertOctagon, CheckCircle2, Building } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface RecallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecallModal: React.FC<RecallModalProps> = ({ isOpen, onClose }) => {
  const { batches, drugs, recallBatchByNumber, quarantineBatch } = useInventory();
  const [searchBatchNo, setSearchBatchNo] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const matchingBatches = batches.filter(
    b => searchBatchNo.trim() && b.batchNo.toLowerCase().includes(searchBatchNo.toLowerCase().trim())
  );

  const totalAffectedUnits = matchingBatches.reduce((acc, curr) => acc + curr.qty, 0);

  const handleExecuteRecall = () => {
    if (!searchBatchNo.trim()) return;
    recallBatchByNumber(searchBatchNo.trim());
    setSuccessMsg(`Batch ${searchBatchNo} quarantined hospital-wide across all locations.`);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-orange-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-2xl text-white shadow-md shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Manufacturer Recall & Quarantine</h3>
              <p className="text-xs text-slate-500">Search batch number to inspect hospital presence and isolate stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Printed Manufacturer Batch Number
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. CTX-2025-501 or MERO-2025-780..."
                value={searchBatchNo}
                onChange={e => setSearchBatchNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {searchBatchNo.trim() && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Affected Locations: <strong className="text-slate-900">{matchingBatches.length}</strong></span>
                <span>Total Units: <strong className="text-rose-600 font-bold">{totalAffectedUnits}</strong></span>
              </div>

              {matchingBatches.length === 0 ? (
                <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                  No matching batch found in active or quarantined hospital records.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {matchingBatches.map(b => {
                    const drug = drugs.find(d => d.id === b.drugId);
                    return (
                      <div
                        key={b.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{drug?.name || b.drugId}</div>
                          <div className="text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{b.location}</span>
                            </span>
                            <span>&bull;</span>
                            <span>Qty: <strong className="text-slate-800">{b.qty}</strong> units</span>
                            <span>&bull;</span>
                            <span>Status: <strong className={b.status === 'recalled' ? 'text-rose-600' : 'text-amber-600'}>{b.status}</strong></span>
                          </div>
                        </div>

                        {b.status === 'active' && (
                          <button
                            onClick={() => quarantineBatch(b.id, 'Manufacturer Recall Quarantine')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                          >
                            Quarantine Location
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {matchingBatches.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleExecuteRecall}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Quarantine Batch Everywhere ({totalAffectedUnits} units)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
