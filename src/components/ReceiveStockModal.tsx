import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { TODAY, THRESHOLDS } from '../config/constants';
import { Location } from '../types';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({ isOpen, onClose }) => {
  const { drugs, suppliers, addNewBatch, settings } = useInventory();

  const [selectedDrugId, setSelectedDrugId] = useState(drugs[0]?.id || '');
  const [batchNo, setBatchNo] = useState('');
  const [location, setLocation] = useState<Location>('Main Store');
  const [qty, setQty] = useState<number>(50);
  const [expiry, setExpiry] = useState('2027-10-24');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceText, setInvoiceText] = useState('');
  const [showInvoiceParser, setShowInvoiceParser] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentDrug = drugs.find(d => d.id === selectedDrugId);

  let shelfLifeWarning = false;
  let remainingPercent = 100;

  if (currentDrug?.shelfLifeDays && expiry) {
    const expDate = new Date(expiry + 'T00:00:00');
    const todayDate = new Date(TODAY + 'T00:00:00');
    const remainingDays = Math.ceil((expDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    remainingPercent = Math.round((remainingDays / currentDrug.shelfLifeDays) * 100);

    if (remainingPercent < settings.minShelfLifePct) {
      shelfLifeWarning = true;
    }
  }

  const handleParseInvoice = () => {
    if (!invoiceText.trim()) return;

    const text = invoiceText.toLowerCase();
    const matchedDrug = drugs.find(d => text.includes(d.name.toLowerCase().split(' ')[0]));
    if (matchedDrug) setSelectedDrugId(matchedDrug.id);

    const batchMatch = invoiceText.match(/batch[:\s]+([A-Z0-9-]+)/i);
    if (batchMatch) setBatchNo(batchMatch[1]);
    else setBatchNo(`INV-${Date.now().toString().slice(-5)}`);

    const qtyMatch = invoiceText.match(/qty[:\s]+(\d+)/i) || invoiceText.match(/(\d+)\s*(vials|units|strips|bottles)/i);
    if (qtyMatch) setQty(parseInt(qtyMatch[1], 10));

    const dateMatch = invoiceText.match(/202[5-9]-\d{2}-\d{2}/);
    if (dateMatch) setExpiry(dateMatch[0]);

    setShowInvoiceParser(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNo.trim() || !expiry || qty <= 0) return;

    addNewBatch({
      drugId: selectedDrugId,
      batchNo: batchNo.trim().toUpperCase(),
      location,
      qty,
      expiry,
      supplierId: selectedSupplierId,
      status: 'active',
      receivedDate: TODAY,
    });

    setSuccessMsg(`Received ${qty} units of ${currentDrug?.name} into ${location}!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-orange-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-md shadow-orange-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Receive Medication Stock</h3>
              <p className="text-xs text-slate-500">Inbound shipment quality verification & automatic shelf-life calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Parser Toggle */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between bg-orange-50/60 p-3.5 rounded-2xl border border-orange-200/80">
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Have an electronic delivery note or vendor invoice?</span>
            </div>
            <button
              type="button"
              onClick={() => setShowInvoiceParser(!showInvoiceParser)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showInvoiceParser ? 'Hide Parser' : 'Paste Invoice (AI)'}</span>
            </button>
          </div>

          {showInvoiceParser && (
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Paste supplier invoice text snippet:
              </label>
              <textarea
                value={invoiceText}
                onChange={e => setInvoiceText(e.target.value)}
                placeholder="e.g. INVOICE #8921: Ceftriaxone 1g, Batch: CTX-2026-900, Qty: 150 vials, Expiry: 2028-06-30..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-mono h-20"
              />
              <button
                type="button"
                onClick={handleParseInvoice}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Auto-fill Rows from Invoice
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Medicine / Drug</label>
            <select
              value={selectedDrugId}
              onChange={e => setSelectedDrugId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
            >
              {drugs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (₹{d.unitCost} / {d.form}) {d.critical ? '• Critical' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Batch Number</label>
              <input
                type="text"
                required
                placeholder="e.g. B-2026-901"
                value={batchNo}
                onChange={e => setBatchNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity (Units)</label>
              <input
                type="number"
                min={1}
                required
                value={qty}
                onChange={e => setQty(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expiry Date</label>
              <input
                type="date"
                required
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ward / Location</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value as Location)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
              >
                <option value="Main Store">Main Store</option>
                <option value="Ward A">Ward A</option>
                <option value="Ward B">Ward B</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supplier</label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Lead: {s.leadTimeDays}d)
                </option>
              ))}
            </select>
          </div>

          {shelfLifeWarning && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Shelf Life Warning ({remainingPercent}% remaining):</strong>{' '}
                Standard hospital policy requires incoming stock to possess at least {settings.minShelfLifePct}% of manufacturer shelf life.
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              Accept & Add to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
