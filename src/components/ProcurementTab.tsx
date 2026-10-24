import React, { useState, useMemo } from 'react';
import {
  Download,
  AlertOctagon,
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatINR } from '../utils/engine';
import { TODAY } from '../config/constants';

export const ProcurementTab: React.FC = () => {
  const { procurementList, settings } = useInventory();

  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [criticalFilter, setCriticalFilter] = useState(false);

  const filteredList = useMemo(() => {
    return procurementList.filter(item => {
      if (criticalFilter && !item.drug.critical) return false;
      return true;
    });
  }, [procurementList, criticalFilter]);

  const groupedBySupplierMap = useMemo(() => {
    const map = new Map<string, typeof filteredList>();
    for (const item of filteredList) {
      const sName = item.supplier.name;
      if (!map.has(sName)) {
        map.set(sName, []);
      }
      map.get(sName)!.push(item);
    }
    return map;
  }, [filteredList]);

  const totalOrderValue = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + curr.orderCost, 0);
  }, [filteredList]);

  const emergencyCount = useMemo(() => {
    return filteredList.filter(item => item.isEmergencyStockout).length;
  }, [filteredList]);

  const exportToCSV = () => {
    const headers = [
      'Priority Rank',
      'Drug Name',
      'Category',
      'Critical',
      'Supplier',
      'Supplier Lead Time (Days)',
      'Usable Stock (Safe)',
      'Doomed Expiring Stock',
      'Reorder Point',
      'Projected Stockout Date',
      'Days Until Stockout',
      'Reorder Qty (30d Cover)',
      'Unit Cost (INR)',
      'Estimated Order Cost (INR)',
      'Suggested Substitute',
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      `"${item.drug.name}"`,
      `"${item.drug.category}"`,
      item.drug.critical ? 'YES' : 'NO',
      `"${item.supplier.name}"`,
      item.supplier.leadTimeDays,
      item.usableStock,
      item.wastedStock,
      item.reorderPoint,
      item.stockoutDate,
      item.stockoutDays,
      item.reorderQty,
      item.drug.unitCost,
      item.orderCost,
      item.substitutes.length > 0 ? `"${item.substitutes.map(s => s.name).join('; ')}"` : 'None',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExpiryIQ_Procurement_Order_${TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Predictive Procurement & Purchase Orders
            </h2>
            <span className="px-2.5 py-0.5 text-xs bg-orange-100 text-orange-800 font-bold rounded-full font-mono">
              {filteredList.length} Items Below Reorder Point
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Calculated strictly using <strong className="text-orange-600">Usable Stock</strong> — stock doomed to expire unused is deducted from inventory before computing reorders to eliminate hidden shortages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right px-4 py-2 bg-orange-50 border border-orange-200 rounded-2xl">
            <div className="text-[10px] text-orange-700 uppercase font-bold">Estimated Order Value</div>
            <div className="text-xl font-black text-orange-600">{formatINR(totalOrderValue)}</div>
          </div>

          <button
            onClick={exportToCSV}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export PO (CSV)</span>
          </button>
        </div>
      </div>

      {/* Emergency Stockout Banner */}
      {emergencyCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-800">
          <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-bold text-rose-900">
              {emergencyCount} Critical Drug(s) will stock out before shipment arrives:
            </strong>{' '}
            Stockout is projected inside the supplier lead time window. Immediate approval of substitute therapies is required.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              groupBySupplier
                ? 'bg-orange-50 border-orange-300 text-orange-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Group by Supplier</span>
          </button>

          <button
            onClick={() => setCriticalFilter(!criticalFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              criticalFilter
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Critical Only</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Formula: <span className="text-slate-800 font-semibold">Reorder Qty = (Daily Usage &times; {settings.targetCoverDays}d) - Usable Stock</span>
        </div>
      </div>

      {/* Table */}
      {!groupBySupplier ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 font-bold">Priority</th>
                  <th className="py-4 px-4 font-bold">Drug / Medicine</th>
                  <th className="py-4 px-4 font-bold">Stock Health (Usable vs Doomed)</th>
                  <th className="py-4 px-4 font-bold">Reorder Point</th>
                  <th className="py-4 px-4 font-bold">Stockout Timeline</th>
                  <th className="py-4 px-4 font-bold">Order Qty ({settings.targetCoverDays}d Cover)</th>
                  <th className="py-4 px-4 font-bold">Supplier & Lead</th>
                  <th className="py-4 px-4 font-bold">Substitute Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      All drug inventory levels are currently above reorder thresholds.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr
                      key={item.drug.id}
                      className={`hover:bg-orange-50/20 transition-colors ${
                        item.isEmergencyStockout ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                            item.isEmergencyStockout
                              ? 'bg-rose-500 text-white'
                              : idx < 3
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-150 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{item.drug.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {item.drug.category} {item.drug.critical && '• Critical (2x Weight)'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-extrabold text-emerald-600">
                          {item.usableStock} u <span className="text-xs font-normal text-slate-500">safe</span>
                        </div>
                        {item.wastedStock > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            {item.wastedStock} units doomed (deducted)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-800">{item.reorderPoint} u</span>
                        <div className="text-[10px] text-slate-400">
                          {item.drug.dailyUsage}u/d &times; ({item.supplier.leadTimeDays}d + {settings.safetyStockDays}d safe)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800">{item.stockoutDate}</div>
                        <div className="text-[10px]">
                          {item.isEmergencyStockout ? (
                            <span className="text-rose-600 font-bold flex items-center">
                              <AlertOctagon className="w-3 h-3 mr-0.5 inline" />
                              {item.stockoutDays}d (inside {item.supplier.leadTimeDays}d lead!)
                            </span>
                          ) : (
                            <span className="text-slate-500">{item.stockoutDays} days remaining</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.reorderQty} units
                        </div>
                        <div className="text-[10px] text-orange-600 font-mono font-bold">
                          {formatINR(item.orderCost)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">{item.supplier.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Lead: {item.supplier.leadTimeDays} days
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.substitutes.length > 0 ? (
                          <div className="space-y-1">
                            {item.substitutes.map(sub => (
                              <div
                                key={sub.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                <Zap className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                                <span>{sub.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">No direct substitute</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedBySupplierMap.entries()).map(([supplierName, items]) => (
            <div key={supplierName} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-slate-900 text-sm">{supplierName}</h3>
                  <span className="text-xs text-slate-400">({items.length} items)</span>
                </div>
                <div className="text-xs font-mono text-orange-600 font-extrabold">
                  Group Total: {formatINR(items.reduce((a, c) => a + c.orderCost, 0))}
                </div>
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.drug.id}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.drug.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Stockout: {item.stockoutDate} ({item.stockoutDays}d cover)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">Order: {item.reorderQty} units</div>
                      <div className="text-orange-600 font-mono font-bold">{formatINR(item.orderCost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
