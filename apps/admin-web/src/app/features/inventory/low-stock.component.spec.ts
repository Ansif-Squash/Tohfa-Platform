import { CRITICAL_STATUSES, orderBatchesAscending } from './low-stock.component';
import type { BatchView } from './inventory.service';

function aBatch(partial: Partial<BatchView>): BatchView {
  return {
    id: 'b-1',
    batchCode: 'OOT-1',
    warehouseId: 'w-1',
    cropId: 'c-1',
    grade: 'GRADE_1',
    goodsReceiptId: null,
    sourceFarmerId: null,
    qtyReceivedKg: '100.000',
    qtyAvailableKg: '50.000',
    storageLocation: null,
    receivedOn: '2026-08-28',
    expiryOn: null,
    status: 'ACTIVE',
    ...partial,
  };
}

describe('low-stock ordering (S-28 screen 4)', () => {
  it('ranks batches by remaining quantity, lowest first', () => {
    const ordered = orderBatchesAscending([
      aBatch({ id: 'b-high', qtyAvailableKg: '12.500' }),
      aBatch({ id: 'b-low', qtyAvailableKg: '0.125' }),
      aBatch({ id: 'b-mid', qtyAvailableKg: '3.000' }),
    ]);
    expect(ordered.map((batch) => batch.id)).toEqual(['b-low', 'b-mid', 'b-high']);
  });

  it('compares in integer milli-kg so decimal strings never drift', () => {
    const ordered = orderBatchesAscending([
      aBatch({ id: 'b-a', qtyAvailableKg: '0.2' }),
      aBatch({ id: 'b-b', qtyAvailableKg: '0.15' }),
      aBatch({ id: 'b-c', qtyAvailableKg: '0.2' }),
    ]);
    expect(ordered[0]!.id).toBe('b-b');
    expect(ordered.map((batch) => batch.id).sort()).toEqual(['b-a', 'b-b', 'b-c']);
  });

  it('never mutates the input list', () => {
    const input = [
      aBatch({ id: 'b-2', qtyAvailableKg: '1' }),
      aBatch({ id: 'b-1', qtyAvailableKg: '9' }),
    ];
    orderBatchesAscending(input);
    expect(input.map((batch) => batch.id)).toEqual(['b-2', 'b-1']);
  });

  it('flags only API-declared critical statuses — no invented threshold', () => {
    expect(CRITICAL_STATUSES).toEqual(['DEPLETED', 'EXPIRED', 'WRITTEN_OFF']);
  });
});