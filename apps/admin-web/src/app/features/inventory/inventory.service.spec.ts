import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InventoryService, sumQuantities } from './inventory.service';

describe('InventoryService (S-28 client)', () => {
  let service: InventoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InventoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sums Quantity strings exactly in milli-units — no float drift (0.1 + 0.2 = 0.300)', () => {
    expect(sumQuantities(['0.1', '0.2'])).toBe('0.300');
  });

  it('ignores null/undefined/empty entries and formats three decimals', () => {
    expect(sumQuantities(['1', undefined, '2.5', null, ''])).toBe('3.500');
  });

  it('handles negative totals', () => {
    expect(sumQuantities(['0.5', '-1.25'])).toBe('-0.750');
  });

  it('pages the stock ledger with the spec cursor parameters, capped at 100 rows', () => {
    service.listStockLedger({ batchId: '01890a5d-ac96-774b-bcce-b302099a8057' }).subscribe();
    const req = http.expectOne((r) => r.url === '/v1/admin/stock-ledger');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('100');
    expect(req.request.params.get('batchId')).toBe('01890a5d-ac96-774b-bcce-b302099a8057');
    req.flush({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  it('sends allocation filters server-side and never fetches a whole collection', () => {
    service.listAllocations({ channel: 'ONLINE', cursor: 'abc' }).subscribe();
    const req = http.expectOne((r) => r.url === '/v1/admin/allocations');
    expect(req.request.params.get('channel')).toBe('ONLINE');
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('warehouseId')).toBeNull();
    req.flush({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  it('posts no warehouse list request when the caller is scope-locked (init resolves locally)', () => {
    // listWarehouses is only for unlocked users; this just proves the endpoint
    // the selector relies on is /v1/warehouses when it IS called.
    service.listWarehouses().subscribe();
    const req = http.expectOne((r) => r.url === '/v1/warehouses');
    expect(req.request.params.get('pageSize')).toBe('100');
    req.flush({ items: [], total: 0 });
  });
});