import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Batch,
  Drug,
  Supplier,
  BatchAnalysis,
  TodayAction,
  ProcurementItem,
  AuditLogEntry,
  Location,
  UserProfile,
  RoleId,
  AppCustomizationSettings,
} from '../types';
import { INITIAL_BATCHES, INITIAL_DRUGS, INITIAL_SUPPLIERS } from '../data/seedData';
import { USER_PROFILES } from '../data/userProfiles';
import { analyzeBatches, getTodayActions, calculateProcurement } from '../utils/engine';
import { TODAY } from '../config/constants';

interface InventoryContextType {
  batches: Batch[];
  drugs: Drug[];
  suppliers: Supplier[];
  analyses: BatchAnalysis[];
  todayActions: TodayAction[];
  procurementList: ProcurementItem[];
  savedRupees: number;
  auditLogs: AuditLogEntry[];
  totalAtRiskRupees: number;
  expiredBatchesCount: number;
  criticalStockoutsCount: number;
  dismissedActionIds: string[];
  
  // User Profile
  currentProfile: UserProfile;
  switchProfile: (profileId: RoleId) => void;
  userProfiles: UserProfile[];

  // App Customizations
  settings: AppCustomizationSettings;
  updateSettings: (newSettings: Partial<AppCustomizationSettings>) => void;

  // Handlers
  executeAction: (action: TodayAction) => void;
  quarantineBatch: (batchId: string, reason?: string) => void;
  recallBatchByNumber: (batchNo: string) => void;
  transferStock: (batchId: string, targetLocation: Location, transferQty: number) => void;
  resetDemoData: () => void;
  addNewBatch: (batch: Omit<Batch, 'id'>) => void;
}

const STORAGE_KEYS = {
  BATCHES: 'expiry_iq_batches_v1',
  SAVED_RUPEES: 'expiry_iq_saved_rupees_v1',
  AUDIT_LOGS: 'expiry_iq_audit_logs_v1',
  DISMISSED_ACTIONS: 'expiry_iq_dismissed_actions_v1',
  CURRENT_PROFILE: 'expiry_iq_current_profile_v1',
  SETTINGS: 'expiry_iq_settings_v1',
};

const DEFAULT_SETTINGS: AppCustomizationSettings = {
  safetyStockDays: 3,
  targetCoverDays: 30,
  minShelfLifePct: 70,
  themeAccent: 'orange',
  layoutDensity: 'comfortable',
  hospitalName: 'Apollo Care Multispecialty',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Batches state with LocalStorage persistence
  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved batches, using seed:', e);
      }
    }
    return INITIAL_BATCHES;
  });

  // 2. Drugs & Suppliers
  const [drugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  // 3. User Profile state
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE);
    if (saved) {
      const found = USER_PROFILES.find(p => p.id === saved);
      if (found) return found;
    }
    return USER_PROFILES[0];
  });

  // 4. Customization Settings
  const [settings, setSettings] = useState<AppCustomizationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 5. Saved ₹ Counter
  const [savedRupees, setSavedRupees] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_RUPEES);
    return saved ? Number(saved) : 0;
  });

  // 6. Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse audit logs:', e);
      }
    }
    return [
      {
        id: 'LOG-001',
        timestamp: `${TODAY} 08:30`,
        action: 'System Initialized',
        drugName: 'System',
        batchNo: 'N/A',
        location: 'All Wards',
        details: 'Initial inventory evaluated with FEFO engine for 45 batches.',
      },
    ];
  });

  // 7. Dismissed actions
  const [dismissedActionIds, setDismissedActionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISMISSED_ACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // LocalStorage synchronizations
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_RUPEES, savedRupees.toString());
  }, [savedRupees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_ACTIONS, JSON.stringify(dismissedActionIds));
  }, [dismissedActionIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, currentProfile.id);
  }, [currentProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Derived Calculations
  const analyses = useMemo(() => {
    return analyzeBatches(batches, drugs, suppliers);
  }, [batches, drugs, suppliers]);

  const allTodayActions = useMemo(() => {
    return getTodayActions(analyses);
  }, [analyses]);

  const todayActions = useMemo(() => {
    return allTodayActions.filter(a => !dismissedActionIds.includes(a.id));
  }, [allTodayActions, dismissedActionIds]);

  const procurementList = useMemo(() => {
    return calculateProcurement(drugs, suppliers, batches, analyses);
  }, [drugs, suppliers, batches, analyses]);

  // KPI Calculations
  const totalAtRiskRupees = useMemo(() => {
    return analyses.reduce((acc, curr) => acc + (curr.batch.status === 'active' ? curr.wasteValue : 0), 0);
  }, [analyses]);

  const expiredBatchesCount = useMemo(() => {
    return analyses.filter(a => a.daysToExpiry <= 0 && a.batch.status === 'active').length;
  }, [analyses]);

  const criticalStockoutsCount = useMemo(() => {
    return procurementList.filter(p => p.drug.critical && p.stockoutDays <= 7).length;
  }, [procurementList]);

  // Profile switcher
  const switchProfile = (profileId: RoleId) => {
    const p = USER_PROFILES.find(item => item.id === profileId);
    if (p) setCurrentProfile(p);
  };

  // Settings updater
  const updateSettings = (newSettings: Partial<AppCustomizationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: `${TODAY} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      ...entry,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const executeAction = (action: TodayAction) => {
    let rupeesSavedDelta = 0;

    setBatches(prev => {
      return prev.map(b => {
        if (b.id !== action.batchId) return b;

        if (action.action === 'discard') {
          rupeesSavedDelta = action.rupeesAtRisk;
          return { ...b, qty: 0, status: 'quarantined' as const };
        }

        if (action.action === 'return') {
          const returnQty = action.transferQty || b.qty;
          rupeesSavedDelta = returnQty * action.drug.unitCost;
          const remainingQty = Math.max(0, b.qty - returnQty);
          return { ...b, qty: remainingQty };
        }

        if (action.action === 'transfer' && action.toLocation) {
          const transferQty = action.transferQty || b.qty;
          rupeesSavedDelta = transferQty * action.drug.unitCost;
          return { ...b, qty: Math.max(0, b.qty - transferQty) };
        }

        if (action.action === 'use_first' || action.action === 'review') {
          rupeesSavedDelta = action.rupeesAtRisk;
          return b;
        }

        return b;
      });
    });

    if (action.action === 'transfer' && action.toLocation) {
      const transferQty = action.transferQty || 1;
      setBatches(prev => {
        const existingInTarget = prev.find(
          b => b.drugId === action.drug.id && b.location === action.toLocation && b.batchNo === `${action.batch.batchNo}-TRF`
        );

        if (existingInTarget) {
          return prev.map(b => (b.id === existingInTarget.id ? { ...b, qty: b.qty + transferQty } : b));
        } else {
          const newBatch: Batch = {
            id: `B-TRF-${Date.now().toString().slice(-4)}`,
            drugId: action.drug.id,
            batchNo: `${action.batch.batchNo}-TRF`,
            location: action.toLocation!,
            qty: transferQty,
            expiry: action.batch.expiry,
            supplierId: action.batch.supplierId,
            status: 'active',
          };
          return [...prev, newBatch];
        }
      });
    }

    setSavedRupees(prev => prev + rupeesSavedDelta);
    setDismissedActionIds(prev => [...prev, action.id]);

    addAuditLog({
      action: action.action.toUpperCase(),
      drugName: action.drug.name,
      batchNo: action.batch.batchNo,
      location: action.fromLocation + (action.toLocation ? ` → ${action.toLocation}` : ''),
      details: `${action.why} (Signed off by ${currentProfile.name})`,
      rupeesSaved: rupeesSavedDelta,
    });
  };

  const transferStock = (batchId: string, targetLocation: Location, transferQty: number) => {
    const sourceBatch = batches.find(b => b.id === batchId);
    if (!sourceBatch) return;

    const drug = drugs.find(d => d.id === sourceBatch.drugId);
    if (!drug) return;

    const savedAmount = transferQty * drug.unitCost;

    setBatches(prev => {
      const updated = prev.map(b => {
        if (b.id === batchId) {
          return { ...b, qty: Math.max(0, b.qty - transferQty) };
        }
        return b;
      });

      const existingInTarget = updated.find(
        b => b.drugId === sourceBatch.drugId && b.location === targetLocation && b.batchNo === sourceBatch.batchNo
      );

      if (existingInTarget) {
        return updated.map(b => (b.id === existingInTarget.id ? { ...b, qty: b.qty + transferQty } : b));
      } else {
        const newBatch: Batch = {
          id: `B-${Date.now().toString().slice(-4)}`,
          drugId: sourceBatch.drugId,
          batchNo: sourceBatch.batchNo,
          location: targetLocation,
          qty: transferQty,
          expiry: sourceBatch.expiry,
          supplierId: sourceBatch.supplierId,
          status: 'active',
        };
        return [...updated, newBatch];
      }
    });

    setSavedRupees(prev => prev + savedAmount);

    addAuditLog({
      action: 'TRANSFER_APPROVED',
      drugName: drug.name,
      batchNo: sourceBatch.batchNo,
      location: `${sourceBatch.location} → ${targetLocation}`,
      details: `Transferred ${transferQty} units to prevent waste. Authorized by ${currentProfile.name}.`,
      rupeesSaved: savedAmount,
    });
  };

  const quarantineBatch = (batchId: string, reason = 'Flagged for Quality Hold') => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const drug = drugs.find(d => d.id === batch.drugId);

    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, status: 'quarantined' as const } : b))
    );

    addAuditLog({
      action: 'QUARANTINE',
      drugName: drug?.name || 'Unknown',
      batchNo: batch.batchNo,
      location: batch.location,
      details: `${reason}. Processed by ${currentProfile.name}.`,
    });
  };

  const recallBatchByNumber = (batchNo: string) => {
    let affectedCount = 0;
    let drugName = '';

    setBatches(prev =>
      prev.map(b => {
        if (b.batchNo.toLowerCase().trim() === batchNo.toLowerCase().trim()) {
          affectedCount += b.qty;
          const d = drugs.find(item => item.id === b.drugId);
          if (d) drugName = d.name;
          return { ...b, status: 'recalled' as const };
        }
        return b;
      })
    );

    addAuditLog({
      action: 'MANUFACTURER_RECALL',
      drugName: drugName || 'Multiple Drugs',
      batchNo: batchNo,
      location: 'All Locations',
      details: `Recalled ${affectedCount} units across hospital. Isolated by ${currentProfile.name}.`,
    });
  };

  const addNewBatch = (newBatchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...newBatchData,
      id: `B-${Date.now().toString().slice(-4)}`,
    };

    setBatches(prev => [newBatch, ...prev]);

    const drug = drugs.find(d => d.id === newBatch.drugId);
    addAuditLog({
      action: 'STOCK_RECEIVED',
      drugName: drug?.name || 'New Drug',
      batchNo: newBatch.batchNo,
      location: newBatch.location,
      details: `Received ${newBatch.qty} units with expiry on ${newBatch.expiry}. Verified by ${currentProfile.name}.`,
    });
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.SAVED_RUPEES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DISMISSED_ACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);

    setBatches(INITIAL_BATCHES);
    setSavedRupees(0);
    setDismissedActionIds([]);
    setSettings(DEFAULT_SETTINGS);
    setAuditLogs([
      {
        id: 'LOG-RESET',
        timestamp: `${TODAY} 09:00`,
        action: 'DEMO_RESET',
        drugName: 'System',
        batchNo: 'ALL',
        location: 'All Locations',
        details: 'Demo dataset restored to initial state (45 batches, hero examples intact).',
      },
    ]);
  };

  return (
    <InventoryContext.Provider
      value={{
        batches,
        drugs,
        suppliers,
        analyses,
        todayActions,
        procurementList,
        savedRupees,
        auditLogs,
        totalAtRiskRupees,
        expiredBatchesCount,
        criticalStockoutsCount,
        dismissedActionIds,
        currentProfile,
        switchProfile,
        userProfiles: USER_PROFILES,
        settings,
        updateSettings,
        executeAction,
        quarantineBatch,
        recallBatchByNumber,
        transferStock,
        resetDemoData,
        addNewBatch,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
