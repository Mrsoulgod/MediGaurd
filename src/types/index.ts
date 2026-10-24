export type Location = 'Main Store' | 'Ward A' | 'Ward B';

export type BatchStatus = 'active' | 'quarantined' | 'recalled';

export type ExpiryStatusColor = 'expired' | 'red' | 'amber' | 'green';

export type ActionType = 'discard' | 'transfer' | 'return' | 'use_first' | 'review' | 'no_action';

export interface Drug {
  id: string;
  name: string;
  category: string;
  form: string;
  unitCost: number; // in ₹
  dailyUsage: number; // units per day system-wide
  critical: boolean; // emergency or life-critical
  coldChain: boolean; // insulin, vaccines, biologics
  substituteIds?: string[];
  shelfLifeDays?: number; // total standard shelf life in days
}

export interface Supplier {
  id: string;
  name: string;
  leadTimeDays: number;
  returnWindowDays: number; // supplier accepts returns this many days before expiry
  contactEmail?: string;
  phone?: string;
}

export interface Batch {
  id: string;
  drugId: string;
  batchNo: string;
  location: Location;
  qty: number;
  expiry: string; // ISO 'YYYY-MM-DD'
  supplierId: string;
  status: BatchStatus;
  receivedDate?: string;
}

export interface BatchAnalysis {
  batch: Batch;
  drug: Drug;
  supplier: Supplier;
  daysToExpiry: number;
  expiryStatus: ExpiryStatusColor;
  usableQty: number;
  wasteQty: number;
  wasteValue: number; // in ₹
  recommendedAction: ActionType;
  actionExplanation: string;
  isEarliestBatch: boolean;
  deadlineDays: number;
  transferTargetLocation?: Location;
  returnByDate?: string;
}

export interface TodayAction {
  id: string;
  batchId: string;
  drug: Drug;
  batch: Batch;
  action: ActionType;
  why: string;
  rupeesAtRisk: number;
  deadline: string;
  deadlineDays: number;
  score: number;
  urgencyFactor: number;
  criticalWeight: number;
  fromLocation: Location;
  toLocation?: Location;
  transferQty?: number;
  returnByDate?: string;
}

export interface ProcurementItem {
  drug: Drug;
  supplier: Supplier;
  usableStock: number;
  wastedStock: number;
  totalStock: number;
  reorderPoint: number;
  stockoutDays: number;
  stockoutDate: string;
  reorderQty: number;
  orderCost: number;
  procurementRank: number;
  stockoutRisk: number;
  substitutes: Drug[];
  isEmergencyStockout: boolean; // stockout <= leadTimeDays
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  drugName: string;
  batchNo: string;
  location: string;
  details: string;
  rupeesSaved?: number;
}

export type RoleId = 'pharmacist' | 'procurement' | 'ward_nurse' | 'director';

export interface UserProfile {
  id: RoleId;
  name: string;
  role: string;
  department: string;
  avatar: string;
  tagline: string;
  keyResponsibility: string;
  defaultTab: 'today' | 'inventory' | 'procurement' | 'transfers';
  badges: string[];
}

export interface AppCustomizationSettings {
  safetyStockDays: number; // default 3
  targetCoverDays: number; // default 30
  minShelfLifePct: number; // default 70
  themeAccent: 'orange' | 'amber' | 'coral';
  layoutDensity: 'comfortable' | 'compact' | 'spacious';
  hospitalName: string;
}
