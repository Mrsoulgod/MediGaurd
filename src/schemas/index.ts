import { z } from 'zod';

export const LocationTypeSchema = z.enum([
  'CENTRAL_PHARMACY',
  'ICU',
  'EMERGENCY',
  'PEDIATRICS',
  'OT_SATELLITE',
]);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const StorageCapabilitySchema = z.enum(['AMBIENT', 'COLD_CHAIN', 'CONTROLLED_SUBSTANCE']);
export type StorageCapability = z.infer<typeof StorageCapabilitySchema>;

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: LocationTypeSchema,
  storageCapabilities: z.array(StorageCapabilitySchema),
  active: z.boolean().default(true),
  image: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const CriticalitySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type Criticality = z.infer<typeof CriticalitySchema>;

export const MedicineSchema = z.object({
  id: z.string(),
  sku: z.string(),
  genericName: z.string(),
  brandName: z.string().optional(),
  category: z.string(),
  unit: z.string(), // e.g. "vial", "strip", "bottle"
  unitCostPaise: z.number().int().nonnegative(), // stored in paise (1 INR = 100 paise) to prevent float issues
  criticality: CriticalitySchema,
  storageRequirement: StorageCapabilitySchema,
  packageSize: z.number().int().positive().default(1),
  image: z.string(),
  active: z.boolean().default(true),
});
export type Medicine = z.infer<typeof MedicineSchema>;

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  leadTimeDays: z.number().int().positive(),
  acceptsReturns: z.boolean(),
  returnWindowDays: z.number().int().nonnegative(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

export const BatchStatusSchema = z.enum(['ACTIVE', 'QUARANTINED', 'RECALLED', 'BLOCKED', 'EXPIRED']);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;

export const BatchSchema = z.object({
  id: z.string(),
  medicineId: z.string(),
  supplierId: z.string(),
  batchCode: z.string(),
  expiresOn: z.string(), // YYYY-MM-DD
  unitCostPaise: z.number().int().nonnegative(),
  receivedOn: z.string(),
  status: BatchStatusSchema,
  qrCode: z.string().optional(),
});
export type Batch = z.infer<typeof BatchSchema>;

export const StockBalanceSchema = z.object({
  batchId: z.string(),
  locationId: z.string(),
  quantity: z.number().int().nonnegative(),
  version: z.number().int().default(1),
});
export type StockBalance = z.infer<typeof StockBalanceSchema>;

export const MovementTypeSchema = z.enum([
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'RETURN',
  'DISPOSAL',
  'ADJUSTMENT',
]);
export type MovementType = z.infer<typeof MovementTypeSchema>;

export const StockMovementSchema = z.object({
  id: z.string(),
  idempotencyKey: z.string(),
  batchId: z.string(),
  type: MovementTypeSchema,
  fromLocationId: z.string().nullable(),
  toLocationId: z.string().nullable(),
  quantity: z.number().int().positive(),
  actorId: z.string(),
  occurredAt: z.string(),
  reason: z.string(),
  referenceId: z.string().optional(),
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

export const FacilityTypeSchema = z.enum(['HOSPITAL_PHARMACY', 'LOCAL_PHARMACY']);
export type FacilityType = z.infer<typeof FacilityTypeSchema>;

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: UserRoleSchema.default('STAFF'),
  assignedLocationId: z.string(),
  email: z.string(),
  avatar: z.string(),
  departmentTitle: z.string().optional(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  facilityType: FacilityTypeSchema.default('HOSPITAL_PHARMACY'),
  facilityName: z.string().optional(),
  storeArea: z.string().optional(),
  drugLicenseNo: z.string().optional(),
  active: z.boolean().default(true),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SharedListingStatusSchema = z.enum([
  'AVAILABLE',
  'REQUESTED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
]);
export type SharedListingStatus = z.infer<typeof SharedListingStatusSchema>;

export const SharedMedicineListingSchema = z.object({
  id: z.string(),
  ownerStoreId: z.string(),
  ownerStoreName: z.string(),
  ownerOwnerName: z.string(),
  ownerCity: z.string(),
  ownerPhone: z.string(),
  medicineName: z.string(),
  medicineSku: z.string(),
  batchCode: z.string(),
  expiresOn: z.string(),
  availableUnits: z.number().int().positive(),
  unitPricePaise: z.number().int().positive(),
  discountPercent: z.number().int().default(30),
  status: SharedListingStatusSchema.default('AVAILABLE'),
  requestedByStoreId: z.string().optional(),
  requestedByStoreName: z.string().optional(),
  requestedUnits: z.number().int().positive().optional(),
  createdAt: z.string(),
  notes: z.string().optional(),
});
export type SharedMedicineListing = z.infer<typeof SharedMedicineListingSchema>;

export const NotificationSeveritySchema = z.enum(['critical', 'warning', 'info']);
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;

export const NotificationTypeSchema = z.enum([
  'CRITICAL_EXPIRY',
  'TRANSFER_SUGGESTION',
  'RETURN_WINDOW',
  'COUNT_DISCREPANCY',
  'BATCH_IMPORT',
  'SHARED_MEDICINE',
  'SYSTEM',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const AppNotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean().default(false),
  actionScreen: z.string().optional(),
  targetId: z.string().optional(),
  severity: NotificationSeveritySchema.default('info'),
});
export type AppNotification = z.infer<typeof AppNotificationSchema>;

export const RequestStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ORDERED',
  'RECEIVED',
  'EXECUTED',
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const TransferRequestSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  sourceLocationId: z.string(),
  destinationLocationId: z.string(),
  quantity: z.number().int().positive(),
  rationale: z.string(),
  status: RequestStatusSchema,
  projectedValuePaise: z.number().int().nonnegative(),
  requestedBy: z.string(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
  compatibilityChecks: z.object({
    storageMatch: z.boolean(),
    shelfLifeSufficient: z.boolean(),
    donorSurplusConfirmed: z.boolean(),
    batchActive: z.boolean(),
  }),
});
export type TransferRequest = z.infer<typeof TransferRequestSchema>;

export const ProcurementRequestSchema = z.object({
  id: z.string(),
  medicineId: z.string(),
  locationId: z.string(),
  supplierId: z.string(),
  suggestedQty: z.number().int().positive(),
  approvedQty: z.number().int().positive().optional(),
  unitCostPaise: z.number().int().positive(),
  status: RequestStatusSchema,
  priorityExplanation: z.string(),
  coverageDays: z.number(),
  stockoutProjectedDate: z.string(),
  requestedBy: z.string(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
});
export type ProcurementRequest = z.infer<typeof ProcurementRequestSchema>;

export const PhysicalCountSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  locationId: z.string(),
  systemQuantity: z.number().int().nonnegative(),
  countedQuantity: z.number().int().nonnegative(),
  discrepancy: z.number().int(),
  status: z.enum(['PENDING_REVIEW', 'APPROVED_RECONCILED', 'REJECTED']),
  submittedBy: z.string(),
  approvedBy: z.string().optional(),
  submittedAt: z.string(),
});
export type PhysicalCount = z.infer<typeof PhysicalCountSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  beforeState: z.record(z.string(), z.unknown()).nullable(),
  afterState: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  notes: z.string().optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const RuleConfigSchema = z.object({
  expiryWarningDaysRed: z.number().int().default(15),
  expiryWarningDaysYellow: z.number().int().default(30),
  expiryWarningDaysNeutral: z.number().int().default(60),
  safetyStockDaysDefault: z.number().int().default(3),
  targetCoverageDaysDefault: z.number().int().default(30),
  hospitalTimezone: z.string().default('Asia/Kolkata'),
  demoFixedDate: z.string().default('2026-10-24'),
});
export type RuleConfig = z.infer<typeof RuleConfigSchema>;
