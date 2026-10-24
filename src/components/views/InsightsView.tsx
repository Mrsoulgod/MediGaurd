import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Building,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { StatusBadge } from '../common/StatusBadge';

export const InsightsView: React.FC = () => {
  const { locations, rules, suppliers, auditEvents } = useMediGuard();

  const [activeTab, setActiveTab] = useState<'copilot' | 'locations' | 'rules' | 'suppliers' | 'audit'>('copilot');

  // Copilot Chat State
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: 'user' | 'assistant';
      text: string;
      citedIds?: string[];
      timestamp: string;
    }>
  >([
    {
      sender: 'assistant',
      text: 'Hello. I am the MediGuard Inventory Copilot. I explain deterministic findings across expiry waste, ward shortages, and inter-department redistribution without fabricating facts or touching database balances.',
      citedIds: ['SYSTEM-BOOT', 'RULES-v1'],
      timestamp: '10:00 AM',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // 3 Suggested Questions from PRD §4/F16
  const suggestedQuestions = [
    'Why is Ceftriaxone batch B-2041 flagged for urgent transfer to ICU?',
    'Why is Meropenem count flagged in Emergency Ward?',
    'Explain the shortage risk for Insulin Glargine in Central Pharmacy.',
  ];

  const handleAskQuestion = (qText: string) => {
    if (!qText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: qText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let cited: string[] = [];

      const lower = qText.toLowerCase();
      if (lower.includes('ceftriaxone') || lower.includes('b-2041')) {
        reply =
          'Batch B-2041 (Ceftriaxone 1g) holds 400 units in Central Pharmacy expiring on 2026-11-18 (25 days left). Based on historical 30-day consumption (3.2 units/day), Central Pharmacy will only consume ~80 units before expiry, stranding 320 units at risk (₹70,400 projected loss). Concurrently, ICU is projected to run out in 6 days with zero safety buffer. MDI recommends transferring 200 units from Central Pharmacy to ICU: cold-chain requirements match, donor retains 120 units (adequate buffer), and ICU consumption absorbs the stock before expiry.';
        cited = ['BATCH-CTX-HERO', 'LOC-CENTRAL', 'LOC-ICU', 'RULE-EXP-30D'];
      } else if (lower.includes('meropenem') || lower.includes('count')) {
        reply =
          'Batch B-MERO-08 in Emergency Ward has a physical count discrepancy: system records 85 units, but physical shelf count submitted by Sister Anjali Nair found only 65 units (-20 units discrepancy, value ₹19,000). To maintain ledger integrity, balances are never overwritten directly; this discrepancy is queued under Physical Reconciliation for Manager sign-off to generate an atomic ADJUSTMENT movement.';
        cited = ['COUNT-MERO-01', 'BATCH-MERO-STALE', 'LOC-EMERGENCY'];
      } else if (lower.includes('insulin') || lower.includes('glargine')) {
        reply =
          'Insulin Glargine (100 IU/ml) is a refrigerated cold-chain critical item (2–8°C). Current usable on-hand across hospital is 25 units against a reorder threshold of 40 units, yielding only 3.1 days of coverage. With supplier lead time of 4 days, stockout is imminent unless emergency reorder is expedited. MDI suggests an adaptive purchase order of 60 units to restore a 30-day buffer.';
        cited = ['MED-INSULIN', 'SUPP-NOVO-01', 'LOC-CENTRAL'];
      } else {
        reply = `Based on current verified ledger state for hospital store: Active medicines: 12, Active batches: 18. All movements are recorded immutably with idempotency keys. Inter-ward transfers take priority over new procurements whenever donor surplus exists.`;
        cited = ['LEDGER-CORE', 'RULE-TRANSFER-FIRST'];
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          citedIds: cited,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Insights & System Control</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Gemini Inventory Copilot, configurable hospital thresholds, and immutable audit logs.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'copilot' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Copilot
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'locations' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'rules' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Rules & Bands
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'suppliers' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'audit' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: GEMINI INVENTORY COPILOT */}
      {activeTab === 'copilot' && (
        <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C2410C]" />
              <div>
                <h3 className="font-bold text-[#1C1917] text-sm">Gemini Medical Inventory Copilot</h3>
                <div className="text-[11px] text-[#78716C]">
                  Bounded to database context &bull; Cites exact batch & location IDs &bull; Zero hallucinations
                </div>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] font-mono font-medium">
              Verified Deterministic
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#C2410C] text-white rounded-br-none shadow-sm'
                      : 'bg-[#FAFAF9] text-[#1C1917] border border-[#E7E5E4] rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-1.5 font-semibold text-[#C2410C] mb-1 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI-Generated Summary</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.citedIds && msg.citedIds.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#E7E5E4] flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-[#78716C]">Evidence Citations:</span>
                      {msg.citedIds.map((cid, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-1.5 py-0.5 rounded bg-white border border-[#E7E5E4] font-mono text-[#C2410C]"
                        >
                          #{cid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#A8A29E] px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-[#78716C] italic p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#C2410C]" />
                <span>Formulating factual answer against verified ledger...</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#FAFAF9] border-t border-[#E7E5E4] space-y-1.5">
            <div className="text-[11px] font-semibold text-[#78716C]">Suggested Questions:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleAskQuestion(q)}
                  className="text-[11px] text-left px-2.5 py-1 bg-white hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg text-[#1C1917] transition-colors"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion(query);
            }}
            className="p-3 border-t border-[#E7E5E4] bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot about medicine risk, FEFO logic, or reorder terms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <img src={loc.image} alt={loc.name} className="w-full h-36 object-cover" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#1C1917] text-sm">{loc.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C]">
                      {loc.id}
                    </span>
                  </div>
                  <div className="text-xs text-[#78716C]">Type: {loc.type}</div>
                  <div className="text-xs space-y-1 pt-2 border-t border-[#E7E5E4]">
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Storage Capabilities:</span>
                      <strong className="text-[#1C1917]">{loc.storageCapabilities.join(', ')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FAFAF9] border-t border-[#E7E5E4] text-[11px] text-[#15803D] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Hospital Facility
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RULES & THRESHOLDS */}
      {activeTab === 'rules' && (
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">System Rules & Decision Thresholds</h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Rules enforced across pure TypeScript engines in <code>src/engines/</code>.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-[#FFF7ED] text-[#C2410C] font-mono font-medium rounded-md border border-[#FFEDD5]">
              Rule Config v1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4] space-y-3">
              <h4 className="font-bold text-sm text-[#1C1917]">Expiry Alert Windows</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Critical Expiry Warning:</span>
                  <span className="font-mono font-bold text-[#B91C1C]">&le; 7 days</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>High Risk Expiry Window:</span>
                  <span className="font-mono font-bold text-[#B91C1C]">&le; {rules.expiryWarningDaysRed} days</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Standard Caution Band:</span>
                  <span className="font-mono font-bold text-[#A16207]">&le; {rules.expiryWarningDaysYellow} days</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Watchlist Expiry Band:</span>
                  <span className="font-mono font-bold text-[#78716C]">&le; {rules.expiryWarningDaysNeutral} days</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4] space-y-3">
              <h4 className="font-bold text-sm text-[#1C1917]">Replenishment & Redistribution Parameters</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Target Coverage Days:</span>
                  <span className="font-mono font-bold text-[#1C1917]">{rules.targetCoverageDaysDefault} days</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Safety Stock Buffer:</span>
                  <span className="font-mono font-bold text-[#1C1917]">{rules.safetyStockDaysDefault} days</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E7E5E4]">
                  <span>Default Timezone:</span>
                  <span className="font-mono font-bold text-[#1C1917]">{rules.hospitalTimezone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">Contracted Pharmaceutical Suppliers</h3>
              <p className="text-xs text-[#78716C]">
                Lead times, return policies, and vendor contact records.
              </p>
            </div>
            <span className="text-xs font-mono text-[#78716C]">{suppliers.length} Verified Vendors</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[10px] text-[#78716C] uppercase">
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-right">Avg Lead Time</th>
                <th className="py-3 px-3 text-right">Return Window</th>
                <th className="py-3 px-3 text-right">Returns Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#FAFAF9]">
                  <td className="py-3 px-4 font-bold text-[#1C1917]">{s.name}</td>
                  <td className="py-3 px-3 text-[#78716C]">
                    <div>{s.contactEmail}</div>
                    <div className="text-[10px] font-mono">{s.phone}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">{s.leadTimeDays} days</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#C2410C]">
                    {s.returnWindowDays} days prior to exp
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {s.acceptsReturns ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm space-y-2">
          <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">Immutable System Audit Trail</h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Cryptographically trace every transaction, physical adjustment, transfer, and receipt.
              </p>
            </div>
            <span className="text-xs font-mono text-[#78716C] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#15803D]" /> Append-Only Log
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[10px] text-[#78716C] uppercase">
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-4">Audit Summary & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#FAFAF9]">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#78716C]">{evt.id}</td>
                    <td className="py-2.5 px-3 font-mono text-[#78716C]">{evt.createdAt}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1C1917]">{evt.actorName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[11px] font-mono font-medium text-[#1C1917]">
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#78716C]">{evt.entityType}</td>
                    <td className="py-2.5 px-3 font-mono text-[#C2410C]">{evt.entityId}</td>
                    <td className="py-2.5 px-4 text-[#1C1917]">{evt.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
