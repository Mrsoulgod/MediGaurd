import React, { useState } from 'react';
import { X, HelpCircle, FileText, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { TODAY, THRESHOLDS, DEFAULT_SAFETY_DAYS, DEFAULT_COVER_DAYS } from '../config/constants';
import { useInventory } from '../context/InventoryContext';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs, settings } = useInventory();
  const [activeTab, setActiveTab] = useState<'formulas' | 'audit'>('formulas');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-orange-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-md shadow-orange-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Assumptions, Clinical Logic & Audit Trail</h3>
              <p className="text-xs text-slate-500">PRD Section 8 verbatim equations & transparent calculation rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 px-6 pt-3">
          <button
            onClick={() => setActiveTab('formulas')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'formulas'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Mathematical Formulas (Section 8)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pharmacist Action Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {activeTab === 'formulas' ? (
            <div className="space-y-4">
              <div className="bg-orange-50/50 border border-orange-200/80 p-4 rounded-2xl">
                <div className="font-bold text-orange-800 uppercase tracking-wider text-[11px] mb-1">
                  1. Anchored Date Source of Truth
                </div>
                <p className="text-slate-700 font-medium">
                  Fixed Date Constant: <code className="text-orange-600 font-mono font-bold">TODAY = '{TODAY}'</code>
                </p>
                <p className="text-slate-500 mt-1">
                  Guarantees 100% deterministic, testable date math across venue Wi-Fi and presentation hardware without date drift.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  2. Expiry Status Thresholds (Section 8.1)
                </div>
                <div className="font-mono text-slate-700 font-semibold">
                  daysToExpiry = expiry - TODAY
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong className="text-slate-900">Normal Drugs:</strong> Expired &le; 0 (black), Red &lt; 30d, Amber &lt; 90d, Green &ge; 90d.</li>
                  <li><strong className="text-slate-900">Critical or Cold-Chain:</strong> Red &lt; 60d, Amber &lt; 120d, Green &ge; 120d.</li>
                  <li><strong className="text-slate-900">Quarantined / Recalled:</strong> Overrides everything, 0 usable stock.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  3. FEFO Consumption & Waste Prediction (Section 8.2)
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold">
                  usableQty = min(qty, dailyUsage &times; daysToExpiry - unitsAlreadyConsumedByEarlierBatches)
                  <br />
                  wasteQty = qty - usableQty
                  <br />
                  wasteValue = wasteQty &times; unitCost
                </div>
                <p className="text-slate-600">
                  Active batches sorted by earliest expiry first. Each batch is consumed at daily usage rate; remaining units that cannot be used before expiration are flagged as doomed waste.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  4. Predictive Reorder Math (Section 8.4)
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold">
                  usableStock = &sum; usableQty (doomed expiring stock strictly excluded)
                  <br />
                  reorderPoint = dailyUsage &times; (leadTimeDays + {settings.safetyStockDays} days safety)
                  <br />
                  reorderQty = dailyUsage &times; {settings.targetCoverDays} - usableStock
                  <br />
                  Procurement Rank = stockoutRisk &times; criticalWeight
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-[11px]">
                <strong>Clinical Note:</strong> Sample data only. ExpiryIQ is an administrative decision-support system; all critical medication alterations require review by a registered hospital pharmacist.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No actions recorded in this session.</p>
              ) : (
                auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-500">
                      Drug: <strong className="text-slate-800">{log.drugName}</strong> (Batch: {log.batchNo}) &bull; {log.location}
                    </div>
                    <div className="text-slate-700 font-medium">{log.details}</div>
                  </div>
                ))
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
