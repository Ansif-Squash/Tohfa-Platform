import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RoleAssignment } from '../../core/auth.service';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';
import { WarehouseScopeService } from './warehouse-scope.service';

const OOTY = '00000000-0000-4000-8000-000000000001';
const COONoor = '00000000-0000-4000-8000-000000000002';

interface TestProfile {
  id: string;
  mobile: string;
  fullName: string;
  roles: RoleAssignment[];
}

function aUser(roles: RoleAssignment[]): TestProfile {
  return { id: 'user-1', mobile: '+911234567890', fullName: 'Test Admin', roles };
}

describe('WarehouseScopeService (S-28 / BR-30)', () => {
  let service: WarehouseScopeService;
  let auth: AuthService;
  let rbac: RbacService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WarehouseScopeService);
    auth = TestBed.inject(AuthService);
    rbac = TestBed.inject(RbacService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('locks the selector to the assigned warehouse for a view_own-only Sub Warehouse Admin', () => {
    rbac.setRoles(['SUB_WH_ADMIN']);
    // No RBAC matrix is loaded in the test, so can() is false for every code —
    // exactly the SUB_WH_ADMIN situation for warehouse.all.view. The lock is
    // therefore derived without any role comparison in component code.
    auth['currentUser'].set(aUser([{ code: 'SUB_WH_ADMIN', warehouseId: OOTY }]));

    service.init();

    expect(service.locked()).toBeTrue();
    expect(service.currentWarehouseId()).toBe(OOTY);

    // A locked admin cannot re-point the queries at another warehouse — the
    // select() call is refused, so table AND export stay scoped.
    service.select(COONoor);
    expect(service.currentWarehouseId()).toBe(OOTY);

    // And a locked user never fetches the warehouse master list.
    http.expectNone(() => true);
  });

  it('stays unlocked for a role holding warehouse.all.view and loads the selector options', () => {
    rbac.setRoles(['SUPER_ADMIN']);
    auth['currentUser'].set(aUser([{ code: 'SUPER_ADMIN' }]));

    service.init();

    expect(service.locked()).toBeFalse();
    const req = http.expectOne((r) => r.url === '/v1/warehouses');
    req.flush({ items: [{ id: OOTY, name: 'Ooty' }], total: 1 });

    expect(service.options().length).toBe(1);
    service.select(OOTY);
    expect(service.currentWarehouseId()).toBe(OOTY);
  });

  it('selects the first assigned warehouse when several are assigned', () => {
    rbac.setRoles(['SUB_WH_ADMIN']);
    auth['currentUser'].set(
      aUser([
        { code: 'SUB_WH_ADMIN', warehouseId: COONoor },
        { code: 'SUB_WH_ADMIN', warehouseId: OOTY },
      ]),
    );

    service.init();

    expect(service.currentWarehouseId()).toBe(COONoor);
  });
});