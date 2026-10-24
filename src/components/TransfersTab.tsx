import React, { useMemo } from 'react';
import {
  ArrowRightLeft,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatINR } from '../utils/engine';
import { Location } from '../types';

export const TransfersTab: React.FC = () => {
  const { analyses, batches, drugs, transferStock, currentProfile } = useInventory();

  const transferOpportunities = useMemo(() => {
    const opps: {
      id: string;
      batchId: string;
      batchNo: string;
      drugName: string;
      unitCost: number;
      fromLocation: Location;
      toLocation: Location;
      qtyToTransfer: number;
      rupeesSaved: number;
      reason: string;
    }[] = [];

    const locStocks = new Map<string, Map<Location, number>>();
    for (const b of batches) {
      if (b.status !== 'active') continue;
      if (!locStocks.has(b.drugId)) {
        locStocks.set(b.drugId, new Map());
      }
      const cur = locStocks.get(b.drugId)!.get(b.location) || 0;
      locStocks.get(b.drugId)!.set(b.location, cur + b.qty);
    }

    for (const item of analyses) {
      if (item.batch.status !== 'active' || item.wasteQty <= 0) continue;

      const drug = item.drug;
      const drugLocs = locStocks.get(drug.id);
      if (!drugLocs) continue;

      const otherLocs: Location[] = (['Main Store', 'Ward A', 'Ward B'] as Location[]).filter(
        l => l !== item.batch.location
      );

      for (const targetLoc of otherLocs) {
        const stockAtTarget = drugLocs.get(targetLoc) || 0;
        const isShort = stockAtTarget < Math.max(5, drug.dailyUsage * 2);

        if (isShort) {
          const qty = item.wasteQty;
          const saved = qty * drug.unitCost;

          opps.push({
            id: `TRF-OPP-${item.batch.id}-${targetLoc}`,
            batchId: item.batch.id,
            batchNo: item.batch.batchNo,
            drugName: drug.name,
            unitCost: drug.unitCost,
            fromLocation: item.batch.location,
            toLocation: targetLoc,
            qtyToTransfer: qty,
            rupeesSaved: saved,
            reason: `${qty} units doomed in ${item.batch.location}. ${targetLoc} has only ${stockAtTarget} units on hand.`,
          });
          break;
        }
      }
    }

    return opps;
  }, [analyses, batches, drugs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            <span>Inter-Ward Rebalance & Stock Transfers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automatically pairs locations experiencing doomed waste with wards facing imminent shortages. Transferring stock rebalances floor inventory with zero extra procurement cost.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs font-mono text-orange-800">
          Matched Opportunities: <strong className="text-orange-600 font-bold">{transferOpportunities.length}</strong>
        </div>
      </div>

      <div className="space-y-4">
        {transferOpportunities.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-base font-bold text-slate-900">All hospital wards are currently balanced!</p>
            <p className="text-xs text-slate-500 mt-1">Zero pending surplus-to-shortage transfer recommendations.</p>
          </div>
        ) : (
          transferOpportunities.map(opp => (
            <div
              key={opp.id}
              className="bg-white border border-slate-200/90 hover:border-orange-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 card-hover-lift"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{opp.drugName}</span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    Batch: {opp.batchNo}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{opp.fromLocation} (Surplus)</span>
                  </span>

                  <ArrowRight className="w-4 h-4 text-orange-500" />

                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{opp.toLocation} (Shortage)</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-orange-600 font-bold mr-1">Transfer Rationale:</span>
                  <span>{opp.reason}</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">₹ Saved on Transfer</div>
                  <div className="text-2xl font-black text-emerald-600">{formatINR(opp.rupeesSaved)}</div>
                  <div className="text-[11px] text-slate-500">{opp.qtyToTransfer} units to shift</div>
                </div>

                <button
                  onClick={() => transferStock(opp.batchId, opp.toLocation, opp.qtyToTransfer)}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1-Click Approve</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
