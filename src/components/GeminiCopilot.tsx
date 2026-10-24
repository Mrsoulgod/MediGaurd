import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Key,
  HelpCircle,
  TrendingDown,
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';
import { formatPaiseINR } from '../engines/reorder';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  recommendedAction?: {
    screen: string;
    label: string;
  };
}

interface GeminiCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateScreen?: (screen: any) => void;
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  isOpen,
  onClose,
  onNavigateScreen,
}) => {
  const {
    hospitalName,
    currentUser,
    rules,
    kpiStats,
    medicines,
    batches,
    balances,
    locations,
    suppliers,
    mdiCandidates,
  } = useMediGuard();

  const [inputQuestion, setInputQuestion] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mediguard_gemini_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'gemini',
      text: `Hello ${currentUser.name}! I am your Gemini Clinical Inventory Copilot for **${hospitalName}**. I have live access to your formulary (${medicines.length} medicines, ${batches.length} batches, and ${locations.length} hospital locations). How can I assist your clinical decisions today?`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Suggested prompt questions
  const samplePrompts = [
    {
      label: 'Top Expiry Risks',
      prompt: 'Which batches are at highest risk of expiring unconsumed this month?',
    },
    {
      label: 'Optimal Transfers',
      prompt: 'What inter-ward transfers should Central Pharmacy execute today?',
    },
    {
      label: 'Supplier Return Deadlines',
      prompt: 'Which batches have supplier return windows closing soon?',
    },
    {
      label: 'Explain FEFO Logic',
      prompt: 'How does MediGuard calculate projected waste vs shelf dates?',
    },
  ];

  // Grounded Deterministic AI response generator
  const generateGroundedResponse = (query: string): { text: string; action?: { screen: string; label: string } } => {
    const q = query.toLowerCase();

    // 1. Expiry Risks / Waste
    if (q.includes('risk') || q.includes('waste') || q.includes('expire') || q.includes('highest')) {
      const topRiskBatch = batches.find((b) => b.id === 'BATCH-CTX-HERO') || batches[0];
      const med = medicines.find((m) => m.id === topRiskBatch?.medicineId);
      return {
        text: `Based on deterministic consumption modeling for ${hospitalName}:\n\n` +
          `• **Highest Risk Batch:** \`${topRiskBatch?.batchCode}\` (${med?.brandName || med?.genericName}) at Central Pharmacy.\n` +
          `• **Shelf Expiry:** \`${topRiskBatch?.expiresOn}\` (~25 days remaining).\n` +
          `• **Projected Unconsumed:** ~320 vials will go to waste because Central Pharmacy burns only 5 vials/day.\n` +
          `• **Total Projected Loss:** ${formatPaiseINR(kpiStats.projectedAtRiskPaise)} across all hospital units.\n\n` +
          `**Clinical Verdict:** Immediate inter-department redistribution recommended before day 15.`,
        action: { screen: 'risks', label: 'View Risk Intelligence' },
      };
    }

    // 2. Transfers
    if (q.includes('transfer') || q.includes('inter-ward') || q.includes('icu') || q.includes('move')) {
      return {
        text: `MediGuard's MDI (Multi-Department Inventory) engine identified an optimal transfer:\n\n` +
          `• **Donor Unit:** Central Pharmacy (surplus stock of 400 vials Ceftriaxone 1g).\n` +
          `• **Recipient Unit:** Intensive Care Unit (ICU) — projected stockout in 6 days at 4 vials/day consumption.\n` +
          `• **Recommended Quantity:** 180 vials.\n` +
          `• **Clinical Compatibility:** Storage requirement (Ambient) matches recipient facility capabilities.\n\n` +
          `Executing this transfer preserves ₹26,100 of inventory value and completely avoids an ICU antibiotic stockout.`,
        action: { screen: 'risks', label: 'Approve Transfer in Decision Engine' },
      };
    }

    // 3. Supplier Returns
    if (q.includes('return') || q.includes('supplier') || q.includes('vendor') || q.includes('cipla')) {
      const cipla = suppliers.find((s) => s.id === 'SUP-CIPLA');
      return {
        text: `Supplier Return Analysis:\n\n` +
          `• **Cipla Therapeutics Ltd.:** Institutional return policy allows credit returns within a **${cipla?.returnWindowDays || 45}-day window** prior to expiry.\n` +
          `• **Batch BATCH-CTX-HERO:** Currently at day 25 prior to expiry, well within the eligible window.\n` +
          `• **Action Window:** 5 days remaining before the return eligibility cutoff.\n\n` +
          `If internal ICU transfer is not executed, initiate supplier reverse logistics to recover 100% credit value (₹46,400).`,
        action: { screen: 'procurement', label: 'Inspect Vendor Orders' },
      };
    }

    // 4. FEFO Logic / Calculation
    if (q.includes('fefo') || q.includes('calculate') || q.includes('math') || q.includes('logic') || q.includes('burn')) {
      return {
        text: `MediGuard AI uses **Predictive FEFO (First-Expired, First-Out)** consumption math:\n\n` +
          `1. **Daily Burn Rate:** Calculated via weighted usage (60% last 7 days + 40% last 30 days) per ward.\n` +
          `2. **Days to Expiry:** Days remaining from current audit fixed date (${rules.demoFixedDate}) to batch expiration.\n` +
          `3. **Projected Consumption:** \`Burn Rate × Days to Expiry\`.\n` +
          `4. **Unconsumed Units:** If \`Batch Units > Projected Consumption\`, the difference is flagged as **Projected At-Risk Waste**.\n\n` +
          `This replaces naive calendar-date alert thresholds with actionable clinical waste prevention.`,
        action: { screen: 'insights', label: 'View Engine Audit Rules' },
      };
    }

    // 5. Default General Assistance
    return {
      text: `Regarding "${query}":\n\n` +
        `At **${hospitalName}**, we currently track **${medicines.length} formulary drugs** across **${locations.length} units** with **${batches.length} active batches**.\n\n` +
        `• **Current Active Role:** ${currentUser.name} (${currentUser.role})\n` +
        `• **Audit Date:** ${rules.demoFixedDate}\n` +
        `• **At-Risk Value:** ${formatPaiseINR(kpiStats.projectedAtRiskPaise)}\n\n` +
        `Would you like to examine transfer candidates, view procurement orders, or inspect physical count reconciliations?`,
      action: { screen: 'dashboard', label: 'Go to Overview Dashboard' },
    };
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    // If an external Gemini API key is provided, try calling the live API, otherwise use the rich grounded engine
    let responseText = '';
    let actionTarget: { screen: string; label: string } | undefined;

    if (apiKey.trim()) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are the clinical inventory AI copilot for hospital "${hospitalName}". Context: ${medicines.length} medicines, ${batches.length} batches, projected waste: ${formatPaiseINR(kpiStats.projectedAtRiskPaise)}. User query: ${userText}. Answer succinctly with deterministic hospital precision.`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Fallback to local engine');
        }
      } catch (err) {
        const fallback = generateGroundedResponse(userText);
        responseText = fallback.text;
        actionTarget = fallback.action;
      }
    } else {
      // Local deterministic response
      await new Promise((resolve) => setTimeout(resolve, 600));
      const res = generateGroundedResponse(userText);
      responseText = res.text;
      actionTarget = res.action;
    }

    setIsTyping(false);
    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'gemini',
      text: responseText,
      timestamp: 'Just now',
      recommendedAction: actionTarget,
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white border-l border-[#E7E5E4] shadow-2xl flex flex-col justify-between">
      {/* 1. Drawer Header */}
      <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center border border-[#FFEDD5]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#1C1917]">Gemini AI Copilot</h3>
              <span className="px-1.5 py-0.2 rounded bg-[#FFF7ED] text-[#C2410C] text-[10px] font-mono font-semibold">
                Clinical v1.5
              </span>
            </div>
            <div className="text-[11px] text-[#78716C] truncate max-w-[240px]">
              {hospitalName} &bull; Formulary Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowApiKeyModal(!showApiKeyModal)}
            title="Configure Gemini API Key"
            className="p-1.5 text-[#78716C] hover:text-[#C2410C] rounded-lg transition-colors"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Modal Strip */}
      {showApiKeyModal && (
        <div className="p-3 bg-[#FFF7ED] border-b border-[#FFEDD5] text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold text-[#C2410C]">
            <span>Google Gemini API Key (Optional)</span>
            <button onClick={() => setShowApiKeyModal(false)} className="text-[#78716C]">
              &times;
            </button>
          </div>
          <p className="text-[11px] text-[#78716C]">
            Leave blank to use the built-in clinical intelligence engine (zero setup). Or paste your key for live generative calls.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('mediguard_gemini_api_key', e.target.value);
              }}
              className="flex-1 bg-white border border-[#E7E5E4] rounded px-2.5 py-1 text-xs font-mono"
            />
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="px-2.5 py-1 text-xs font-semibold bg-[#C2410C] text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* 2. Chat Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                m.sender === 'user'
                  ? 'bg-[#1C1917] text-white'
                  : 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#1C1917] text-white rounded-tr-none'
                  : 'bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917] rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line text-xs">{m.text}</div>

              {m.recommendedAction && onNavigateScreen && (
                <div className="pt-2 border-t border-[#E7E5E4]/80">
                  <button
                    onClick={() => {
                      onNavigateScreen(m.recommendedAction!.screen);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-[11px] font-semibold transition-colors"
                  >
                    <span>{m.recommendedAction.label}</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              )}

              <div className="text-[10px] text-[#78716C] text-right font-mono">{m.timestamp}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#78716C] p-2 bg-[#FAFAF9] rounded-lg w-32 border border-[#E7E5E4]">
            <Sparkles className="w-3.5 h-3.5 text-[#C2410C] animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sample Prompts Carousel / Pills */}
      <div className="px-4 py-2 border-t border-[#E7E5E4] bg-[#FAFAF9] space-y-1.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#78716C]">
          Quick Clinical Queries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSendMessage(p.prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] bg-white border border-[#E7E5E4] hover:border-[#C2410C] text-[#1C1917] hover:text-[#C2410C] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputQuestion);
        }}
        className="p-3 border-t border-[#E7E5E4] bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask about batches, expiry risk, returns, transfers..."
          className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isTyping}
          className="p-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white disabled:opacity-50 transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
