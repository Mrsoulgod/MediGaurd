import {
  StockMovement,
  StockBalance,
  Batch,
  AuditEvent,
  MovementType,
  UserProfile,
} from '../schemas';

export interface PostMovementParams {
  idempotencyKey: string;
  batchId: string;
  type: MovementType;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  actor: UserProfile;
  reason: string;
  referenceId?: string;
  nowDateStr: string;
}

export interface MovementTransactionResult {
  movement: StockMovement;
  auditEvent: AuditEvent;
  updatedBalances: StockBalance[];
}

/**
 * Service simulating the PostgreSQL post_movement RPC transaction.
 * Enforces all 10 hard invariants: idempotency, >= 0 balance, active batch check,
 * and immutable audit entry creation.
 */
export function executeAtomicMovement(
  params: PostMovementParams,
  currentBalances: StockBalance[],
  currentMovements: StockMovement[],
  batches: Batch[]
): MovementTransactionResult {
  const {
    idempotencyKey,
    batchId,
    type,
    fromLocationId,
    toLocationId,
    quantity,
    actor,
    reason,
    referenceId,
    nowDateStr,
  } = params;

  // 1. Check idempotency: if already posted with this key, reject duplicate
  const existing = currentMovements.find(m => m.idempotencyKey === idempotencyKey);
  if (existing) {
    throw new Error(`Idempotency conflict: Movement with key ${idempotencyKey} has already executed.`);
  }

  if (quantity <= 0) {
    throw new Error('Movement quantity must be positive.');
  }

  // 2. Validate batch eligibility
  const batch = batches.find(b => b.id === batchId);
  if (!batch) {
    throw new Error(`Batch ID ${batchId} not found.`);
  }

  const isExpired = batch.expiresOn <= nowDateStr;
  if ((type === 'ISSUE' || type === 'TRANSFER' || type === 'RETURN') && (batch.status !== 'ACTIVE' || isExpired)) {
    throw new Error(`Batch ${batch.batchCode} is not eligible for ${type} (Status: ${batch.status}, Expired: ${isExpired}).`);
  }

  // 3. Clone balances for transaction
  const balancesCopy = currentBalances.map(b => ({ ...b }));

  let beforeFromBal = 0;
  let afterFromBal = 0;
  let beforeToBal = 0;
  let afterToBal = 0;

  // Deduct from source if fromLocationId is present
  if (fromLocationId) {
    const fromIndex = balancesCopy.findIndex(
      b => b.batchId === batchId && b.locationId === fromLocationId
    );

    if (fromIndex === -1 || balancesCopy[fromIndex].quantity < quantity) {
      const currentQty = fromIndex !== -1 ? balancesCopy[fromIndex].quantity : 0;
      throw new Error(`Insufficient stock at source location. Available: ${currentQty}, Requested: ${quantity}.`);
    }

    beforeFromBal = balancesCopy[fromIndex].quantity;
    balancesCopy[fromIndex].quantity -= quantity;
    balancesCopy[fromIndex].version += 1;
    afterFromBal = balancesCopy[fromIndex].quantity;
  }

  // Add to destination if toLocationId is present
  if (toLocationId) {
    const toIndex = balancesCopy.findIndex(
      b => b.batchId === batchId && b.locationId === toLocationId
    );

    if (toIndex !== -1) {
      beforeToBal = balancesCopy[toIndex].quantity;
      balancesCopy[toIndex].quantity += quantity;
      balancesCopy[toIndex].version += 1;
      afterToBal = balancesCopy[toIndex].quantity;
    } else {
      beforeToBal = 0;
      afterToBal = quantity;
      balancesCopy.push({
        batchId,
        locationId: toLocationId,
        quantity,
        version: 1,
      });
    }
  }

  // 4. Create immutable movement ledger record
  const movement: StockMovement = {
    id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    idempotencyKey,
    batchId,
    type,
    fromLocationId,
    toLocationId,
    quantity,
    actorId: actor.id,
    occurredAt: `${nowDateStr}T${new Date().toISOString().split('T')[1]}`,
    reason,
    referenceId,
  };

  // 5. Create immutable audit event
  const auditEvent: AuditEvent = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorId: actor.id,
    actorName: actor.name,
    action: `POST_${type}`,
    entityType: 'STOCK_BALANCE',
    entityId: `${batchId}`,
    beforeState: {
      fromBalance: beforeFromBal,
      toBalance: beforeToBal,
    },
    afterState: {
      fromBalance: afterFromBal,
      toBalance: afterToBal,
      movementId: movement.id,
    },
    createdAt: movement.occurredAt,
    notes: `${actor.name} (${actor.role}) posted ${type} of ${quantity} units. Reason: ${reason}`,
  };

  return {
    movement,
    auditEvent,
    updatedBalances: balancesCopy,
  };
}
