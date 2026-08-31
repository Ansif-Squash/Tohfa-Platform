import { computeBucketCards, EMPTY_BUCKETS } from './allocation-dashboard.component';
import type { AllocationView } from './inventory.service';

function anAllocation(
  partial: Partial<AllocationView> & Pick<AllocationView, 'channel'>,
): AllocationView {
  return {
    id: 'a-1',
    warehouseId: 'w-1',
    cropId: 'c-1',
    allocationDate: '2026-08-28',
    allocatedQtyKg: '0.000',
    consumedQtyKg: '0.000',
    computedBy: 'AUTO',
    ...partial,
  };
}

describe('computeBucketCards (S-28 / BR-12)', () => {
  it('always renders the four channel buckets', () => {
    const cards = computeBucketCards([]);
    expect(cards.map((card) => card.channel)).toEqual([
      'ONLINE',
      'LIVE_MARKET',
      'RESERVE',
      'BUFFER',
    ]);
    expect(cards.every((card) => card.allocated === '0.000')).toBeTrue();
  });

  it('sums each bucket exactly from the API quantities (0.1 + 0.2 = 0.300, no float drift)', () => {
    const cards = computeBucketCards([
      anAllocation({
        channel: 'ONLINE',
        allocatedQtyKg: '0.1',
        consumedQtyKg: '0.05',
        reservedQtyKg: '0.0',
        availableQtyKg: '0.1',
      }),
      anAllocation({
        channel: 'ONLINE',
        allocatedQtyKg: '0.2',
        consumedQtyKg: '0.05',
        reservedQtyKg: '0.0',
        availableQtyKg: '0.15',
      }),
      anAllocation({
        channel: 'BUFFER',
        allocatedQtyKg: '1',
        consumedQtyKg: '0.25',
        reservedQtyKg: '0.1',
        availableQtyKg: '0.65',
      }),
    ]);

    const online = cards[0]!;
    expect(online.allocated).toBe('0.300');
    expect(online.consumed).toBe('0.100');
    expect(online.reserved).toBe('0.000');
    expect(online.available).toBe('0.250');

    const buffer = cards.find((card) => card.channel === 'BUFFER')!;
    expect(buffer.allocated).toBe('1.000');
    expect(buffer.available).toBe('0.650');
  });

  it('flags reserved/available as not exposed only when the API omits them for the whole bucket', () => {
    const cards = computeBucketCards([
      anAllocation({ channel: 'RESERVE', allocatedQtyKg: '5' }),
      anAllocation({ channel: 'ONLINE', allocatedQtyKg: '2', reservedQtyKg: '0' }),
    ]);

    const reserve = cards.find((card) => card.channel === 'RESERVE')!;
    expect(reserve.reservedNotExposed).toBeTrue();
    expect(reserve.availableNotExposed).toBeTrue();

    const online = cards.find((card) => card.channel === 'ONLINE')!;
    expect(online.reservedNotExposed).toBeFalse();
    expect(online.reserved).toBe('0.000');
  });

  it('starts from a stable empty state', () => {
    expect(EMPTY_BUCKETS.length).toBe(4);
    expect(EMPTY_BUCKETS.every((card) => card.reservedNotExposed && card.availableNotExposed))
      .withContext('an empty dashboard shows the gap note, never invented numbers')
      .toBeTrue();
  });
});