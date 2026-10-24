import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { ParsedCSVBatchRow } from '../../context/MediGuardContext';

interface BatchCsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchCsvUploadModal: React.FC<BatchCsvUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { medicines, locations, addBatchesFromCSV } = useMediGuard();

  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCSVBatchRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `medicineSku,batchCode,expiresOn,quantity,locationId,unitCostPaise
MED-CTX-1G,CTX-NEW-2027,2027-04-15,250,LOC-CENTRAL,14500
MED-MERO-1G,MERO-APR-09,2026-12-30,80,LOC-ICU,85000
MED-ENOX-40,ENOX-BATCH-77,2027-01-20,120,LOC-EMERGENCY,42000
MED-PCM-650,PCM-BULK-2027,2027-08-10,500,LOC-CENTRAL,3200
MED-PIPTAZ-45,PIP-DEC-2026,2026-12-18,60,LOC-ICU,49500`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mediguard_batch_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    setCsvText(sampleCsvContent);
    parseCsv(sampleCsvContent);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      setParseErrors(['CSV file must contain a header row and at least one data row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('medicinesku');
    const batchIdx = headers.indexOf('batchcode');
    const expIdx = headers.indexOf('expireson');
    const qtyIdx = headers.indexOf('quantity');
    const locIdx = headers.indexOf('locationid');
    const costIdx = headers.indexOf('unitcostpaise');

    if (skuIdx === -1 || batchIdx === -1 || expIdx === -1 || qtyIdx === -1) {
      setParseErrors([
        'CSV must contain mandatory headers: medicineSku, batchCode, expiresOn, quantity',
      ]);
      setParsedRows([]);
      return;
    }

    const rows: ParsedCSVBatchRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 4) continue;

      const sku = parts[skuIdx];
      const batchCode = parts[batchIdx];
      const expiresOn = parts[expIdx];
      const qty = parseInt(parts[qtyIdx], 10);
      const loc = locIdx !== -1 ? parts[locIdx] : 'LOC-CENTRAL';
      const cost = costIdx !== -1 ? parseInt(parts[costIdx], 10) : undefined;

      const medFound = medicines.find(
        (m) => m.sku.toLowerCase() === sku.toLowerCase() || m.id.toLowerCase() === sku.toLowerCase()
      );

      if (!medFound) {
        errors.push(`Row ${i + 1}: SKU "${sku}" does not match active formulary medicines.`);
      }

      rows.push({
        medicineSku: sku,
        batchCode,
        expiresOn,
        quantity: isNaN(qty) ? 0 : qty,
        locationId: loc,
        unitCostPaise: cost,
      });
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;

    const res = addBatchesFromCSV(parsedRows);
    if (res.errors.length > 0 && res.successCount === 0) {
      setParseErrors(res.errors);
    } else {
      setUploadSuccess(`Successfully ingested ${res.successCount} batches into the medicine ledger!`);
      setTimeout(() => {
        setUploadSuccess(null);
        onClose();
      }, 1600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#E7E5E4] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#C2410C]" />
            <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
              Batch Intake & CSV Upload
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#78716C] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Instructions and Template Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl text-[#C2410C]">
            <div className="space-y-0.5">
              <div className="font-bold text-xs">Bulk Medicine Batch Ingestion</div>
              <div className="text-[11px] text-[#78716C]">
                Import supplier shipments directly using CSV format (SKU, Batch, Expiry, Units).
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FFEDD5] hover:border-[#C2410C] text-[#C2410C] text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Data</span>
              </button>
            </div>
          </div>

          {/* Upload Area / Dropzone */}
          <div>
            <label className="block font-semibold text-[#1C1917] mb-1.5">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-[#E7E5E4] hover:border-[#C2410C] rounded-xl p-5 text-center transition-colors bg-[#FAFAF9]">
              <FileText className="w-8 h-8 text-[#78716C] mx-auto mb-2" />
              <div className="text-xs font-medium text-[#1C1917]">
                Choose a .csv file from your computer
              </div>
              <div className="text-[11px] text-[#78716C] mt-1">
                Drag and drop or browse files
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-3 text-xs text-[#78716C] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#C2410C] file:text-white hover:file:bg-[#9A3412] cursor-pointer"
              />
            </div>
          </div>

          {/* Direct CSV Paste / Edit Area */}
          <div>
            <label className="block font-semibold text-[#1C1917] mb-1">
              Or Paste CSV Data Directly:
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCsv(e.target.value);
              }}
              placeholder="medicineSku,batchCode,expiresOn,quantity,locationId,unitCostPaise"
              className="w-full font-mono text-xs bg-white border border-[#E7E5E4] rounded-lg p-2.5 focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
            />
          </div>

          {/* Validation Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl space-y-1 text-[#B91C1C]">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Validation Warnings ({parseErrors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {parseErrors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-[#15803D] font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold text-[#1C1917]">
                <span>Parsed Batch Preview ({parsedRows.length} rows)</span>
                <span className="text-[11px] text-[#78716C]">
                  Targeting Central Pharmacy & Inpatient Wards
                </span>
              </div>

              <div className="border border-[#E7E5E4] rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[#78716C]">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Batch Code</th>
                      <th className="p-2">Expiry Date</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Ward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4] font-mono text-[11px]">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-[#FAFAF9]">
                        <td className="p-2 font-semibold text-[#1C1917]">{r.medicineSku}</td>
                        <td className="p-2 text-[#C2410C] font-bold">{r.batchCode}</td>
                        <td className="p-2">{r.expiresOn}</td>
                        <td className="p-2">{r.quantity}</td>
                        <td className="p-2 text-[#78716C]">{r.locationId || 'LOC-CENTRAL'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={parsedRows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
          >
            <span>Confirm & Ingest Batches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
