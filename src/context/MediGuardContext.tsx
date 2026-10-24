import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Location,
  Medicine,
  Supplier,
  Batch,
  StockBalance,
  StockMovement,
  TransferRequest,
  ProcurementRequest,
  PhysicalCount,
  AuditEvent,
  UserProfile,
  RuleConfig,
  UserRole,
  AppNotification,
  SharedMedicineListing,
  SharedListingStatus,
} from '../schemas';
import {
  SEED_LOCATIONS,
  SEED_MEDICINES,
  SEED_SUPPLIERS,
  SEED_BATCHES,
  SEED_BALANCES,
  SEED_USERS,
  SEED_SHARED_LISTINGS,
  DEFAULT_RULES,
} from '../data/seedData';
import { executeAtomicMovement, PostMovementParams } from '../services/movements';
import { evaluateBestNextActions, MDICandidate } from '../engines/mdi';
import { calculateExpiry } from '../engines/expiry';

export interface ParsedCSVBatchRow {
  medicineSku: string;
  batchCode: string;
  expiresOn: string;
  quantity: number;
  locationId?: string;
  unitCostPaise?: number;
  supplierId?: string;
}

interface MediGuardContextType {
  locations: Location[];
  medicines: Medicine[];
  suppliers: Supplier[];
  batches: Batch[];
  balances: StockBalance[];
  movements: StockMovement[];
  transferRequests: TransferRequest[];
  procurementRequests: ProcurementRequest[];
  physicalCounts: PhysicalCount[];
  auditEvents: AuditEvent[];
  rules: RuleConfig;
  updateRules: (updates: Partial<RuleConfig>) => void;
  hospitalName: string;
  setHospitalName: (name: string) => void;
  users: UserProfile[];
  addUserProfile: (profile: Omit<UserProfile, 'id'>) => void;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => void;
  toggleUserStatus: (userId: string) => void;
  currentUser: UserProfile;
  switchUser: (role: UserRole) => void;
  loginUser: (userId: string) => void;
  loginAsHospital: () => void;
  loginAsLocalStore: (storeUserId: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;

  // Local Chemist B2B Medicine Sharing Network
  sharedListings: SharedMedicineListing[];
  postSharedListing: (listing: {
    medicineName: string;
    medicineSku: string;
    batchCode: string;
    expiresOn: string;
    availableUnits: number;
    unitPricePaise: number;
    discountPercent: number;
    notes?: string;
  }) => void;
  requestSharedListing: (listingId: string, requestedUnits: number, notes?: string) => void;
  updateSharedListingStatus: (listingId: string, status: SharedListingStatus) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;

  // Batch CSV Ingestion
  addBatchesFromCSV: (rows: ParsedCSVBatchRow[]) => { successCount: number; errors: string[] };

  // Manual Medicine & Batch Intake
  addNewMedicineWithBatch: (params: {
    brandName: string;
    genericName: string;
    category: string;
    batchCode: string;
    expiresOn: string;
    quantity: number;
    unitCostPaise: number;
    storageRequirement?: 'AMBIENT' | 'COLD_CHAIN' | 'CONTROLLED_SUBSTANCE';
    unit?: string;
    packageSize?: number;
    locationId?: string;
    image?: string;
  }) => { success: boolean; message: string; batchId?: string };

  // Transactions
  postMovement: (params: Omit<PostMovementParams, 'actor' | 'nowDateStr'>) => void;
  proposeTransfer: (batchId: string, sourceLocId: string, destLocId: string, qty: number, rationale: string) => void;
  decideTransfer: (requestId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => void;
  proposeProcurement: (medicineId: string, locationId: string, suggestedQty: number, priorityNotes: string) => void;
  decideProcurement: (requestId: string, decision: 'APPROVE' | 'REJECT', approvedQty?: number) => void;
  receiveProcurement: (requestId: string) => void;
  submitPhysicalCount: (batchId: string, locationId: string, countedQty: number) => void;
  decidePhysicalCount: (countId: string, decision: 'APPROVE' | 'REJECT') => void;

  // Reset & Scenarios
  loadHeroScenario: () => void;
  resetDemoData: () => void;

  // Computed Derived State
  mdiCandidates: MDICandidate[];
  kpiStats: {
    activeMedicinesCount: number;
    activeBatchesCount: number;
    lowStockItemsCount: number;
    nearExpiryUnits: number;
    projectedAtRiskPaise: number;
    pendingApprovalsCount: number;
  };
}

const STORAGE_KEYS = {
  BATCHES: 'mediguard_batches_v1',
  BALANCES: 'mediguard_balances_v1',
  MOVEMENTS: 'mediguard_movements_v1',
  TRANSFERS: 'mediguard_transfers_v1',
  PROCUREMENT: 'mediguard_procurement_v1',
  COUNTS: 'mediguard_counts_v1',
  AUDIT: 'mediguard_audit_v1',
  USER_ID: 'mediguard_user_id_v2',
  USERS: 'mediguard_users_list_v2',
  MEDICINES: 'mediguard_medicines_v2',
  RULES: 'mediguard_rules_config_v1',
  HOSPITAL_NAME: 'mediguard_hospital_name_v1',
  NOTIFICATIONS: 'mediguard_notifications_v1',
  SHARED_LISTINGS: 'mediguard_shared_listings_v1',
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-01',
    type: 'CRITICAL_EXPIRY',
    title: 'Urgent: Ceftriaxone 1g Inpatient Surplus',
    message: 'Batch BATCH-CTX-HERO expires in 25 days with 320 unconsumed vials at Central Pharmacy. Transfer recommended to ICU.',
    timestamp: '2026-10-24 08:30',
    read: false,
    actionScreen: 'risks',
    targetId: 'BATCH-CTX-HERO',
    severity: 'critical',
  },
  {
    id: 'NOTIF-02',
    type: 'RETURN_WINDOW',
    title: 'Supplier Return Window Alert',
    message: 'Cipla return agreement (45-day window) closes in 5 days for Ceftriaxone surplus batch. Value: ₹46,400.',
    timestamp: '2026-10-24 09:15',
    read: false,
    actionScreen: 'risks',
    targetId: 'SUP-CIPLA',
    severity: 'warning',
  },
  {
    id: 'NOTIF-03',
    type: 'COUNT_DISCREPANCY',
    title: 'Physical Reconciliation Discrepancy',
    message: 'Meropenem 1g (Batch MERO-2026-STALE) in Emergency Dispensary has discrepancy of -20 vials awaiting review.',
    timestamp: '2026-10-24 10:00',
    read: false,
    actionScreen: 'inventory',
    targetId: 'BATCH-MERO-STALE',
    severity: 'warning',
  },
  {
    id: 'NOTIF-04',
    type: 'TRANSFER_SUGGESTION',
    title: 'Optimal Transfer Route Computed',
    message: 'MDI Engine calculated positive clinical feasibility: Move 180 units Ceftriaxone to ICU before day 15.',
    timestamp: '2026-10-24 11:00',
    read: true,
    actionScreen: 'risks',
    severity: 'info',
  },
];

const MediGuardContext = createContext<MediGuardContextType | undefined>(undefined);

export const MediGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations] = useState<Location[]>(SEED_LOCATIONS);
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('mediguard_medicines_v2');
    return saved ? JSON.parse(saved) : SEED_MEDICINES;
  });
  const [suppliers] = useState<Supplier[]>(SEED_SUPPLIERS);

  const [hospitalName, setHospitalName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.HOSPITAL_NAME) || 'Apollo Institute of Medical Sciences';
  });

  const [rules, setRules] = useState<RuleConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) return SEED_USERS;
    try {
      const parsed: UserProfile[] = JSON.parse(saved);
      // Ensure all seed users exist (especially local chemists)
      const existingIds = new Set(parsed.map(u => u.id));
      const missing = SEED_USERS.filter(su => !existingIds.has(su.id));
      return [...parsed, ...missing];
    } catch {
      return SEED_USERS;
    }
  });

  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return saved ? JSON.parse(saved) : SEED_BATCHES;
  });

  const [balances, setBalances] = useState<StockBalance[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCES);
    return saved ? JSON.parse(saved) : SEED_BALANCES;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : [
      {
        id: 'MOV-INIT-001',
        idempotencyKey: 'INIT-KEY-001',
        batchId: 'BATCH-CTX-HERO',
        type: 'RECEIPT',
        fromLocationId: null,
        toLocationId: 'LOC-CENTRAL',
        quantity: 400,
        actorId: 'USER-SUPERADMIN',
        occurredAt: `${DEFAULT_RULES.demoFixedDate}T08:00:00Z`,
        reason: 'Initial verified stock intake by Central Pharmacy',
      },
    ];
  });

  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROCUREMENT);
    return saved ? JSON.parse(saved) : [];
  });

  const [physicalCounts, setPhysicalCounts] = useState<PhysicalCount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COUNTS);
    return saved ? JSON.parse(saved) : [
      {
        id: 'COUNT-MERO-01',
        batchId: 'BATCH-MERO-STALE',
        locationId: 'LOC-EMERGENCY',
        systemQuantity: 85,
        countedQuantity: 65,
        discrepancy: -20,
        status: 'PENDING_REVIEW',
        submittedBy: 'Sister Anjali Nair',
        submittedAt: `${DEFAULT_RULES.demoFixedDate} 09:15`,
      },
    ];
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : [
      {
        id: 'AUDIT-INIT',
        actorId: 'USER-SUPERADMIN',
        actorName: 'Dr. Vikram Malhotra',
        action: 'SYSTEM_BOOT',
        entityType: 'HOSPITAL_STORE',
        entityId: 'ALL',
        beforeState: null,
        afterState: { status: 'INITIALIZED', date: DEFAULT_RULES.demoFixedDate },
        createdAt: `${DEFAULT_RULES.demoFixedDate} 08:00`,
        notes: 'MediGuard AI verified deterministic clinical engine boot.',
      },
    ];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [sharedListings, setSharedListings] = useState<SharedMedicineListing[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHARED_LISTINGS);
    return saved ? JSON.parse(saved) : SEED_SHARED_LISTINGS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const found = users.find(u => u.id === saved) || SEED_USERS.find(u => u.id === saved);
    return found || users[0] || SEED_USERS[0];
  });

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOSPITAL_NAME, hospitalName);
  }, [hospitalName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transferRequests));
  }, [transferRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROCUREMENT, JSON.stringify(procurementRequests));
  }, [procurementRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COUNTS, JSON.stringify(physicalCounts));
  }, [physicalCounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditEvents));
  }, [auditEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHARED_LISTINGS, JSON.stringify(sharedListings));
  }, [sharedListings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, currentUser.id);
  }, [currentUser]);

  // Daily consumption rate map for simulation
  const dailyRatesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const med of medicines) {
      for (const loc of locations) {
        // High usage for Ceftriaxone & Normal Saline in ICU/Central, lower for others
        let rate = 2;
        if (med.id === 'MED-01') rate = loc.id === 'LOC-CENTRAL' ? 5 : loc.id === 'LOC-ICU' ? 4 : 2;
        else if (med.id === 'MED-03') rate = loc.id === 'LOC-CENTRAL' ? 3 : 1;
        else if (med.id === 'MED-08') rate = loc.id === 'LOC-CENTRAL' ? 15 : 8;
        else if (med.id === 'MED-02') rate = 2;
        map.set(`${med.id}_${loc.id}`, rate);
      }
    }
    return map;
  }, [medicines, locations]);

  // Derived MDI Candidates
  const mdiCandidates = useMemo(() => {
    return evaluateBestNextActions(
      batches,
      medicines,
      locations,
      suppliers,
      balances,
      dailyRatesMap,
      rules.demoFixedDate
    );
  }, [batches, medicines, locations, suppliers, balances, dailyRatesMap, rules]);

  // Derived Overview KPI Statistics
  const kpiStats = useMemo(() => {
    let nearExpiryUnits = 0;
    let projectedAtRiskPaise = 0;
    let lowStockCount = 0;

    // Filter balances if a specific location is selected
    const activeBalances = balances.filter(b => {
      if (b.quantity <= 0) return false;
      if (selectedLocationId !== 'ALL' && b.locationId !== selectedLocationId) return false;
      return true;
    });

    for (const bal of activeBalances) {
      const b = batches.find(x => x.id === bal.batchId);
      if (!b) continue;

      const expiry = calculateExpiry(b.expiresOn, rules.demoFixedDate, rules);
      if (expiry.isActionable) {
        nearExpiryUnits += bal.quantity;
        projectedAtRiskPaise += bal.quantity * b.unitCostPaise;
      }
    }

    // Check low stock
    for (const med of medicines) {
      const totalMedStock = activeBalances
        .filter(bal => {
          const b = batches.find(x => x.id === bal.batchId);
          return b && b.medicineId === med.id && b.status === 'ACTIVE';
        })
        .reduce((sum, c) => sum + c.quantity, 0);

      if (totalMedStock <= 30) {
        lowStockCount += 1;
      }
    }

    const pendingApprovalsCount =
      transferRequests.filter(r => r.status === 'PENDING').length +
      procurementRequests.filter(r => r.status === 'PENDING').length +
      physicalCounts.filter(c => c.status === 'PENDING_REVIEW').length;

    return {
      activeMedicinesCount: medicines.filter(m => m.active).length,
      activeBatchesCount: batches.filter(b => b.status === 'ACTIVE').length,
      lowStockItemsCount: lowStockCount,
      nearExpiryUnits,
      projectedAtRiskPaise,
      pendingApprovalsCount,
    };
  }, [batches, balances, medicines, selectedLocationId, rules, transferRequests, procurementRequests, physicalCounts]);

  // --------------------------------------------------------------------------
  // ACTIONS & TRANSACTIONS
  // --------------------------------------------------------------------------

  const postMovement = (params: Omit<PostMovementParams, 'actor' | 'nowDateStr'>) => {
    const result = executeAtomicMovement(
      {
        ...params,
        actor: currentUser,
        nowDateStr: rules.demoFixedDate,
      },
      balances,
      movements,
      batches
    );

    setBalances(result.updatedBalances);
    setMovements(prev => [result.movement, ...prev]);
    setAuditEvents(prev => [result.auditEvent, ...prev]);
  };

  /**
   * F11: Inter-department transfer proposal
   */
  const proposeTransfer = (
    batchId: string,
    sourceLocId: string,
    destLocId: string,
    qty: number,
    rationale: string
  ) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const newReq: TransferRequest = {
      id: `TRF-${Date.now().toString().slice(-4)}`,
      batchId,
      sourceLocationId: sourceLocId,
      destinationLocationId: destLocId,
      quantity: qty,
      rationale,
      status: 'PENDING',
      projectedValuePaise: qty * batch.unitCostPaise,
      requestedBy: currentUser.name,
      createdAt: `${rules.demoFixedDate} 10:00`,
      compatibilityChecks: {
        storageMatch: true,
        shelfLifeSufficient: true,
        donorSurplusConfirmed: true,
        batchActive: true,
      },
    };

    setTransferRequests(prev => [newReq, ...prev]);

    setAuditEvents(prev => [
      {
        id: `AUDIT-${Date.now()}`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'PROPOSE_TRANSFER',
        entityType: 'TRANSFER_REQUEST',
        entityId: newReq.id,
        beforeState: null,
        afterState: { ...newReq },
        createdAt: newReq.createdAt,
        notes: `Transfer proposed: ${qty} units of Batch ${batch.batchCode} from ${sourceLocId} to ${destLocId}.`,
      },
      ...prev,
    ]);
  };

  /**
   * Manager decides transfer. If APPROVED, atomic RPC posts movement and updates both locations!
   */
  const decideTransfer = (requestId: string, decision: 'APPROVE' | 'REJECT', notes = '') => {
    const req = transferRequests.find(r => r.id === requestId);
    if (!req) return;

    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Forbidden: Manager approval required to decide transfers.');
      return;
    }

    if (decision === 'APPROVE') {
      // Execute atomic movement!
      postMovement({
        idempotencyKey: `EXEC-TRF-${req.id}`,
        batchId: req.batchId,
        type: 'TRANSFER',
        fromLocationId: req.sourceLocationId,
        toLocationId: req.destinationLocationId,
        quantity: req.quantity,
        reason: `Approved Transfer ${req.id}: ${req.rationale}. ${notes}`,
        referenceId: req.id,
      });

      setTransferRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'EXECUTED', approvedBy: currentUser.name }
            : r
        )
      );
    } else {
      setTransferRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'REJECTED', approvedBy: currentUser.name }
            : r
        )
      );

      setAuditEvents(prev => [
        {
          id: `AUDIT-${Date.now()}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'REJECT_TRANSFER',
          entityType: 'TRANSFER_REQUEST',
          entityId: req.id,
          beforeState: { status: 'PENDING' },
          afterState: { status: 'REJECTED', rejectionReason: notes },
          createdAt: `${rules.demoFixedDate} 10:15`,
          notes: `Transfer rejected by ${currentUser.name}: ${notes}`,
        },
        ...prev,
      ]);
    }
  };

  /**
   * F13: Procurement Request
   */
  const proposeProcurement = (
    medicineId: string,
    locationId: string,
    suggestedQty: number,
    priorityNotes: string
  ) => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const supplier = suppliers[0];

    const newReq: ProcurementRequest = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      medicineId,
      locationId,
      supplierId: supplier.id,
      suggestedQty,
      unitCostPaise: med.unitCostPaise,
      status: 'PENDING',
      priorityExplanation: priorityNotes,
      coverageDays: 4.5,
      stockoutProjectedDate: '2026-10-29',
      requestedBy: currentUser.name,
      createdAt: `${rules.demoFixedDate} 11:00`,
    };

    setProcurementRequests(prev => [newReq, ...prev]);
  };

  /**
   * F13: Decide Procurement (Approval does NOT add stock!)
   */
  const decideProcurement = (requestId: string, decision: 'APPROVE' | 'REJECT', approvedQty?: number) => {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Forbidden: Manager approval required.');
      return;
    }

    setProcurementRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          approvedQty: approvedQty || r.suggestedQty,
          approvedBy: currentUser.name,
        };
      })
    );

    setAuditEvents(prev => [
      {
        id: `AUDIT-${Date.now()}`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: `DECIDE_PROCUREMENT_${decision}`,
        entityType: 'PROCUREMENT_REQUEST',
        entityId: requestId,
        beforeState: { status: 'REQUESTED' },
        afterState: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
        createdAt: `${rules.demoFixedDate} 11:30`,
        notes: `Procurement request ${requestId} ${decision} by ${currentUser.name}. (Approval does not change stock)`,
      },
      ...prev,
    ]);
  };

  /**
   * F13: Receive Procurement (Adds stock via RECEIPT movement)
   */
  const receiveProcurement = (requestId: string) => {
    const req = procurementRequests.find(r => r.id === requestId);
    if (!req) return;

    // Find or create batch
    const qty = req.approvedQty || req.suggestedQty;
    const batch = batches.find(b => b.medicineId === req.medicineId && b.status === 'ACTIVE') || batches[0];

    postMovement({
      idempotencyKey: `RECEIPT-PO-${req.id}`,
      batchId: batch.id,
      type: 'RECEIPT',
      fromLocationId: null,
      toLocationId: req.locationId,
      quantity: qty,
      reason: `Procurement Receipt for PO ${req.id}`,
      referenceId: req.id,
    });

    setProcurementRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'RECEIVED' } : r))
    );
  };

  /**
   * F05: Physical Count & Reconciliation
   */
  const submitPhysicalCount = (batchId: string, locationId: string, countedQty: number) => {
    const bal = balances.find(b => b.batchId === batchId && b.locationId === locationId);
    const systemQty = bal ? bal.quantity : 0;
    const discrepancy = countedQty - systemQty;

    const newCount: PhysicalCount = {
      id: `CNT-${Date.now().toString().slice(-4)}`,
      batchId,
      locationId,
      systemQuantity: systemQty,
      countedQuantity: countedQty,
      discrepancy,
      status: 'PENDING_REVIEW',
      submittedBy: currentUser.name,
      submittedAt: `${rules.demoFixedDate} 12:00`,
    };

    setPhysicalCounts(prev => [newCount, ...prev]);
  };

  const decidePhysicalCount = (countId: string, decision: 'APPROVE' | 'REJECT') => {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Forbidden: Manager approval required to reconcile physical counts.');
      return;
    }

    const count = physicalCounts.find(c => c.id === countId);
    if (!count) return;

    if (decision === 'APPROVE') {
      // Adjust balance atomically
      const adjustmentType: PostMovementParams['type'] = 'ADJUSTMENT';
      const absQty = Math.abs(count.discrepancy);

      if (count.discrepancy < 0) {
        // shortage: decrease from location
        postMovement({
          idempotencyKey: `ADJ-${count.id}`,
          batchId: count.batchId,
          type: adjustmentType,
          fromLocationId: count.locationId,
          toLocationId: null,
          quantity: absQty,
          reason: `Physical count reconciliation ${count.id} discrepancy (${count.discrepancy} units). Approved by ${currentUser.name}`,
          referenceId: count.id,
        });
      } else if (count.discrepancy > 0) {
        // surplus: increase at location
        postMovement({
          idempotencyKey: `ADJ-${count.id}`,
          batchId: count.batchId,
          type: adjustmentType,
          fromLocationId: null,
          toLocationId: count.locationId,
          quantity: absQty,
          reason: `Physical count reconciliation ${count.id} surplus (+${count.discrepancy} units). Approved by ${currentUser.name}`,
          referenceId: count.id,
        });
      }

      setPhysicalCounts(prev =>
        prev.map(c =>
          c.id === countId
            ? { ...c, status: 'APPROVED_RECONCILED', approvedBy: currentUser.name }
            : c
        )
      );
    } else {
      setPhysicalCounts(prev =>
        prev.map(c =>
          c.id === countId
            ? { ...c, status: 'REJECTED', approvedBy: currentUser.name }
            : c
        )
      );
    }
  };

  const loadHeroScenario = () => {
    // Re-seeds the required hero scenario cleanly
    setBatches(SEED_BATCHES);
    setBalances(SEED_BALANCES);
    setTransferRequests([]);
    setProcurementRequests([]);
  };

  const addUserProfile = (profileData: Omit<UserProfile, 'id'>) => {
    const newId = `USER-${Date.now().toString().slice(-4)}`;
    const newUser: UserProfile = {
      id: newId,
      ...profileData,
      active: true,
    };
    setUsers(prev => [newUser, ...prev]);
    setAuditEvents(prev => [
      {
        id: `AUDIT-${Date.now()}`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'CREATE_USER_PROFILE',
        entityType: 'USER_PROFILE',
        entityId: newId,
        beforeState: null,
        afterState: newUser as unknown as Record<string, unknown>,
        createdAt: `${rules.demoFixedDate} 12:00`,
        notes: `New staff profile registered by Super Admin ${currentUser.name}: ${newUser.name} (${newUser.role} - ${newUser.departmentTitle || newUser.assignedLocationId})`,
      },
      ...prev,
    ]);
  };

  const updateUserProfile = (userId: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const updated = { ...u, active: !u.active };
        setAuditEvents(auditPrev => [
          {
            id: `AUDIT-${Date.now()}`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: updated.active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
            entityType: 'USER_PROFILE',
            entityId: userId,
            beforeState: { active: u.active },
            afterState: { active: updated.active },
            createdAt: `${rules.demoFixedDate} 12:00`,
            notes: `Profile for ${u.name} status toggled to ${updated.active ? 'Active' : 'Inactive'}`,
          },
          ...auditPrev,
        ]);
        return updated;
      })
    );
  };

  const loginUser = (userId: string) => {
    let target = users.find(u => u.id === userId) || SEED_USERS.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(STORAGE_KEYS.USER_ID, target.id);

      // Ensure target is preserved in users list
      setUsers(prev => {
        if (!prev.some(u => u.id === target!.id)) {
          const updated = [...prev, target!];
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      setAuditEvents(prev => [
        {
          id: `AUDIT-${Date.now()}`,
          actorId: target!.id,
          actorName: target!.name,
          action: 'STAFF_LOGIN',
          entityType: 'SESSION',
          entityId: target!.id,
          beforeState: null,
          afterState: { role: target!.role, location: target!.assignedLocationId },
          createdAt: `${rules.demoFixedDate} 12:05`,
          notes: `${target!.name} authenticated into workspace (${target!.facilityName || target!.departmentTitle})`,
        },
        ...prev,
      ]);
    }
  };

  const loginAsHospital = () => {
    const hospitalUser = users.find(u => u.facilityType === 'HOSPITAL_PHARMACY') || users[0];
    loginUser(hospitalUser.id);
  };

  const loginAsLocalStore = (storeUserId: string) => {
    loginUser(storeUserId);
  };

  // Peer-to-Peer Medicine Sharing Network
  const postSharedListing = (listing: {
    medicineName: string;
    medicineSku: string;
    batchCode: string;
    expiresOn: string;
    availableUnits: number;
    unitPricePaise: number;
    discountPercent: number;
    notes?: string;
  }) => {
    const newListing: SharedMedicineListing = {
      ...listing,
      id: `SHARE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ownerStoreId: currentUser.id,
      ownerStoreName: currentUser.facilityName || `${currentUser.name}'s Medical Store`,
      ownerOwnerName: currentUser.name,
      ownerCity: currentUser.storeArea || 'Local City Chemist Hub',
      ownerPhone: currentUser.phone || '+91 98000 00000',
      status: 'AVAILABLE',
      createdAt: `${rules.demoFixedDate} ${new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}`,
    };

    setSharedListings(prev => [newListing, ...prev]);

    addNotification({
      type: 'SHARED_MEDICINE',
      title: 'Surplus Medicine Listed for Local Exchange',
      message: `${currentUser.name} posted ${listing.availableUnits} units of ${listing.medicineName} at ${listing.discountPercent}% off to neighboring chemists.`,
      actionScreen: 'risks',
      severity: 'info',
    });
  };

  const requestSharedListing = (listingId: string, requestedUnits: number, notes?: string) => {
    setSharedListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return {
          ...l,
          status: 'REQUESTED',
          requestedByStoreId: currentUser.id,
          requestedByStoreName: currentUser.facilityName || `${currentUser.name}'s Chemist`,
          requestedUnits,
          notes: notes || l.notes,
        };
      }
      return l;
    }));

    addNotification({
      type: 'SHARED_MEDICINE',
      title: 'Peer Medicine Stock Claimed',
      message: `${currentUser.facilityName || currentUser.name} requested ${requestedUnits} units from local chemist network.`,
      actionScreen: 'risks',
      severity: 'warning',
    });
  };

  const updateSharedListingStatus = (listingId: string, status: SharedListingStatus) => {
    setSharedListings(prev => prev.map(l => l.id === listingId ? { ...l, status } : l));
  };

  const switchUser = (role: UserRole) => {
    const found = users.find(u => u.role === role && u.active);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(STORAGE_KEYS.USER_ID, found.id);
    }
  };

  const updateRules = (updates: Partial<RuleConfig>) => {
    setRules(prev => {
      const next = { ...prev, ...updates };
      setAuditEvents(auditPrev => [
        {
          id: `AUDIT-${Date.now()}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'UPDATE_HOSPITAL_RULES',
          entityType: 'RULE_CONFIG',
          entityId: 'RULES-v1',
          beforeState: prev as unknown as Record<string, unknown>,
          afterState: next as unknown as Record<string, unknown>,
          createdAt: `${rules.demoFixedDate} 12:10`,
          notes: `Decision thresholds adjusted by ${currentUser.name}`,
        },
        ...auditPrev,
      ]);
      return next;
    });
  };

  // Notification Handlers
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: `${rules.demoFixedDate} ${new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}`,
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Batch CSV Ingestion
  const addBatchesFromCSV = (rows: ParsedCSVBatchRow[]) => {
    const errors: string[] = [];
    let successCount = 0;
    const newBatches: Batch[] = [];
    const newBalancesMap = new Map<string, number>();
    const newMedsToAdd: Medicine[] = [];

    rows.forEach((row, idx) => {
      const trimmedSku = row.medicineSku.trim();
      let med = medicines.find(
        m => m.sku.toLowerCase() === trimmedSku.toLowerCase() ||
             m.id.toLowerCase() === trimmedSku.toLowerCase() ||
             (m.brandName && m.brandName.toLowerCase().includes(trimmedSku.toLowerCase())) ||
             m.genericName.toLowerCase().includes(trimmedSku.toLowerCase())
      ) || newMedsToAdd.find(
        m => m.sku.toLowerCase() === trimmedSku.toLowerCase() || m.id.toLowerCase() === trimmedSku.toLowerCase()
      );

      if (!med) {
        // Auto-create medicine from CSV so ANY medicine can be added!
        const cleanSku = trimmedSku.toUpperCase().replace(/[^A-Z0-9-]/g, '') || `MED-${idx + 1}`;
        const newMed: Medicine = {
          id: `MED-${cleanSku}`,
          sku: cleanSku,
          genericName: trimmedSku,
          brandName: trimmedSku,
          category: 'ANTIBIOTIC',
          unit: 'strip',
          unitCostPaise: row.unitCostPaise || 1500,
          storageRequirement: 'AMBIENT',
          packageSize: 10,
          criticality: 'MEDIUM',
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
          active: true,
        };
        newMedsToAdd.push(newMed);
        med = newMed;
      }

      if (!row.batchCode || !row.batchCode.trim()) {
        errors.push(`Row ${idx + 1}: Missing batch code.`);
        return;
      }
      if (!row.expiresOn || isNaN(Date.parse(row.expiresOn))) {
        errors.push(`Row ${idx + 1}: Invalid expiry date "${row.expiresOn}" (must be YYYY-MM-DD).`);
        return;
      }
      const qty = Number(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${idx + 1}: Quantity must be greater than 0.`);
        return;
      }

      const locId = row.locationId && locations.some(l => l.id === row.locationId) ? row.locationId : 'LOC-CENTRAL';
      const cleanCode = row.batchCode.trim().toUpperCase();
      const batchId = `BATCH-${cleanCode.replace(/[^A-Z0-9]/g, '-')}`;

      const alreadyExists = batches.some(b => b.id === batchId || b.batchCode === cleanCode) ||
        newBatches.some(b => b.id === batchId || b.batchCode === cleanCode);
      if (alreadyExists) {
        errors.push(`Row ${idx + 1}: Batch code "${cleanCode}" already exists.`);
        return;
      }

      const newBatch: Batch = {
        id: batchId,
        medicineId: med.id,
        supplierId: row.supplierId || suppliers[0].id,
        batchCode: cleanCode,
        expiresOn: row.expiresOn.trim(),
        unitCostPaise: row.unitCostPaise || med.unitCostPaise,
        receivedOn: rules.demoFixedDate,
        status: 'ACTIVE',
        qrCode: `QR-${cleanCode}`,
      };

      newBatches.push(newBatch);
      newBalancesMap.set(`${batchId}_${locId}`, qty);
      successCount++;
    });

    if (newMedsToAdd.length > 0) {
      setMedicines(prev => {
        const next = [...prev, ...newMedsToAdd];
        localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(next));
        return next;
      });
    }

    if (newBatches.length > 0) {
      setBatches(prev => {
        const next = [...prev, ...newBatches];
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(next));
        return next;
      });

      setBalances(prev => {
        const next = [...prev];
        newBalancesMap.forEach((qty, key) => {
          const [bId, lId] = key.split('_');
          const idx = next.findIndex(b => b.batchId === bId && b.locationId === lId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          } else {
            next.push({ batchId: bId, locationId: lId, quantity: qty, version: 1 });
          }
        });
        localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(next));
        return next;
      });

      // Audit Log
      setAuditEvents(prev => [
        {
          id: `AUDIT-${Date.now()}`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'BATCH_CSV_IMPORT',
          entityType: 'BATCH',
          entityId: `IMPORT-${Date.now()}`,
          beforeState: null,
          afterState: { importedBatches: successCount, batchCodes: newBatches.map(b => b.batchCode) },
          createdAt: `${rules.demoFixedDate} 12:15`,
          notes: `Batch upload via CSV: ${successCount} batches ingested into ${currentUser.departmentTitle || 'Formulary'}.`,
        },
        ...prev,
      ]);

      // Notification
      addNotification({
        type: 'BATCH_IMPORT',
        title: 'Batch Inventory Imported via CSV',
        message: `Successfully ingested ${successCount} verified batches into formulary.`,
        actionScreen: 'inventory',
        severity: 'info',
      });
    }

    return { successCount, errors };
  };

  // Manual Medicine & Batch Intake
  const addNewMedicineWithBatch = (params: {
    brandName: string;
    genericName: string;
    category: string;
    batchCode: string;
    expiresOn: string;
    quantity: number;
    unitCostPaise: number;
    storageRequirement?: 'AMBIENT' | 'COLD_CHAIN' | 'CONTROLLED_SUBSTANCE';
    unit?: string;
    packageSize?: number;
    locationId?: string;
    image?: string;
  }) => {
    const trimmedBrand = params.brandName.trim();
    const trimmedGeneric = params.genericName.trim();
    const cleanCode = params.batchCode.trim().toUpperCase();

    if (!trimmedBrand && !trimmedGeneric) {
      return { success: false, message: 'Please provide either a brand name or generic formula name.' };
    }
    if (!cleanCode) {
      return { success: false, message: 'Batch number/code is required.' };
    }
    if (!params.expiresOn || isNaN(Date.parse(params.expiresOn))) {
      return { success: false, message: 'Valid expiry date (YYYY-MM-DD) is required.' };
    }
    if (!params.quantity || params.quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    // 1. Locate or create Medicine
    let med = medicines.find(
      (m) =>
        (trimmedBrand && m.brandName && m.brandName.toLowerCase() === trimmedBrand.toLowerCase()) ||
        (trimmedGeneric && m.genericName.toLowerCase() === trimmedGeneric.toLowerCase())
    );

    let createdMed: Medicine | null = null;
    if (!med) {
      const cleanSku = (trimmedBrand || trimmedGeneric)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '-')
        .slice(0, 14);

      createdMed = {
        id: `MED-${cleanSku}-${Date.now().toString().slice(-4)}`,
        sku: cleanSku,
        genericName: trimmedGeneric || trimmedBrand,
        brandName: trimmedBrand || undefined,
        category: params.category || 'ANTIBIOTIC',
        unit: params.unit || 'strip',
        unitCostPaise: params.unitCostPaise || 2000,
        storageRequirement: params.storageRequirement || 'AMBIENT',
        packageSize: params.packageSize || 10,
        criticality: 'MEDIUM',
        image:
          params.image ||
          (params.storageRequirement === 'COLD_CHAIN'
            ? 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&auto=format&fit=crop&q=80'),
        active: true,
      };

      setMedicines((prev) => {
        const next = [...prev, createdMed!];
        localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(next));
        return next;
      });
      med = createdMed;
    }

    // 2. Batch Creation
    const batchId = `BATCH-${cleanCode.replace(/[^A-Z0-9]/g, '-')}`;
    const targetLocId =
      params.locationId && locations.some((l) => l.id === params.locationId)
        ? params.locationId
        : currentUser.assignedLocationId && locations.some((l) => l.id === currentUser.assignedLocationId)
        ? currentUser.assignedLocationId
        : 'LOC-CENTRAL';

    const existingBatch = batches.find((b) => b.id === batchId || b.batchCode === cleanCode);

    if (existingBatch) {
      // Just increase stock in target location
      setBalances((prev) => {
        const next = [...prev];
        const idx = next.findIndex((b) => b.batchId === existingBatch.id && b.locationId === targetLocId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + params.quantity };
        } else {
          next.push({ batchId: existingBatch.id, locationId: targetLocId, quantity: params.quantity, version: 1 });
        }
        localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(next));
        return next;
      });
    } else {
      const newBatch: Batch = {
        id: batchId,
        medicineId: med.id,
        supplierId: suppliers[0]?.id || 'SUP-01',
        batchCode: cleanCode,
        receivedOn: `${rules.demoFixedDate}`,
        expiresOn: params.expiresOn,
        unitCostPaise: params.unitCostPaise || med.unitCostPaise,
        status: 'ACTIVE',
      };

      setBatches((prev) => {
        const next = [...prev, newBatch];
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(next));
        return next;
      });

      setBalances((prev) => {
        const next = [...prev, { batchId, locationId: targetLocId, quantity: params.quantity, version: 1 }];
        localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(next));
        return next;
      });
    }

    // 3. Movement Ledger
    const newMovement: StockMovement = {
      id: `MOV-ADD-${Date.now()}`,
      idempotencyKey: `KEY-ADD-${batchId}-${Date.now()}`,
      batchId: existingBatch ? existingBatch.id : batchId,
      type: 'RECEIPT',
      fromLocationId: null,
      toLocationId: targetLocId,
      quantity: params.quantity,
      actorId: currentUser.id,
      occurredAt: `${rules.demoFixedDate}T12:00:00Z`,
      reason: `Manual medicine registration by ${currentUser.facilityName || currentUser.name}`,
    };

    setMovements((prev) => {
      const next = [newMovement, ...prev];
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(next));
      return next;
    });

    // 4. Notification
    addNotification({
      type: 'BATCH_IMPORT',
      title: 'Medicine Added to Inventory',
      message: `${trimmedBrand || trimmedGeneric} (Batch ${cleanCode}) — ${params.quantity} units added. Expiry: ${params.expiresOn}.`,
      actionScreen: 'inventory',
      severity: 'info',
    });

    return {
      success: true,
      message: `Successfully added ${trimmedBrand || trimmedGeneric} (${params.quantity} units, Batch ${cleanCode}) to inventory.`,
      batchId,
    };
  };

  const resetDemoData = () => {
    localStorage.clear();
    setBatches(SEED_BATCHES);
    setBalances(SEED_BALANCES);
    setMovements([]);
    setTransferRequests([]);
    setProcurementRequests([]);
    setPhysicalCounts([]);
    setUsers(SEED_USERS);
    setCurrentUser(SEED_USERS[0]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSharedListings(SEED_SHARED_LISTINGS);
    setRules(DEFAULT_RULES);
    setHospitalName('Apollo Institute of Medical Sciences');
    setAuditEvents([
      {
        id: 'AUDIT-RESET',
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'DEMO_RESET',
        entityType: 'SYSTEM',
        entityId: 'ALL',
        beforeState: null,
        afterState: { status: 'RESET' },
        createdAt: `${rules.demoFixedDate} 08:00`,
        notes: 'Clinical dataset restored to initial Apollo Formulary seed.',
      },
    ]);
  };

  return (
    <MediGuardContext.Provider
      value={{
        locations,
        medicines,
        suppliers,
        batches,
        balances,
        movements,
        transferRequests,
        procurementRequests,
        physicalCounts,
        auditEvents,
        rules,
        updateRules,
        hospitalName,
        setHospitalName,
        users,
        addUserProfile,
        updateUserProfile,
        toggleUserStatus,
        currentUser,
        switchUser,
        loginUser,
        loginAsHospital,
        loginAsLocalStore,
        selectedLocationId,
        setSelectedLocationId,
        sharedListings,
        postSharedListing,
        requestSharedListing,
        updateSharedListingStatus,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        addNotification,
        addBatchesFromCSV,
        addNewMedicineWithBatch,
        postMovement,
        proposeTransfer,
        decideTransfer,
        proposeProcurement,
        decideProcurement,
        receiveProcurement,
        submitPhysicalCount,
        decidePhysicalCount,
        loadHeroScenario,
        resetDemoData,
        mdiCandidates,
        kpiStats,
      }}
    >
      {children}
    </MediGuardContext.Provider>
  );
};

export const useMediGuard = () => {
  const context = useContext(MediGuardContext);
  if (!context) {
    throw new Error('useMediGuard must be used within a MediGuardProvider');
  }
  return context;
};
