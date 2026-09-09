import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('User Story 53 (S-53): Launch Readiness Review & Handover Verification', () => {
  const rootDir = path.resolve(__dirname, '../../../../../');
  const launchDocsDir = path.join(rootDir, 'docs/launch');

  it('verifies all mandatory launch handover documents exist under docs/launch/', () => {
    const requiredDocs = [
      'decision-register.md',
      'spec-defects.md',
      'deferrals.md',
      'phase-2-roadmap.md',
      'device-matrix.md',
      'store-listing-farmer.md',
      'store-listing-customer.md',
      'privacy-policy.md',
      'release-checklist.md',
    ];

    for (const doc of requiredDocs) {
      const docPath = path.join(launchDocsDir, doc);
      expect(fs.existsSync(docPath), `Missing launch document: ${doc}`).toBe(true);
    }
  });

  it('verifies decision-register.md covers all 13 open contradiction topics from rules.md', () => {
    const decisionRegisterPath = path.join(launchDocsDir, 'decision-register.md');
    const content = fs.readFileSync(decisionRegisterPath, 'utf8');

    // Assert coverage of all 13 contradictions
    for (let i = 1; i <= 13; i++) {
      const prefix = `C-${i < 10 ? '0' + i : i}`;
      expect(content).toContain(prefix);
    }

    expect(content).toContain('Audit Scoring Scale');
    expect(content).toContain('Automation (BR-38)');
    expect(content).toContain('Fulfilment Model (BR-21)');
    expect(content).toContain('Wallet Write Authority for MW / SW');
    expect(content).toContain('COD vs Wallet-First (BR-17)');
    expect(content).toContain('B2B / Horeca Allocation Source (BR-13)');
  });

  it('verifies spec-defects.md documents quantified defects and references spec:drift output', () => {
    const specDefectsPath = path.join(launchDocsDir, 'spec-defects.md');
    const content = fs.readFileSync(specDefectsPath, 'utf8');

    expect(content).toContain('spec:drift OK');
    expect(content).toContain('242 references resolve');
    expect(content).toContain('BR-07');
    expect(content).toContain('BR-16');
    expect(content).toContain('BR-17');
    expect(content).toContain('cart.manage_own');
  });

  it('verifies deferrals.md lists all consciously deferred features with day estimates', () => {
    const deferralsPath = path.join(launchDocsDir, 'deferrals.md');
    const content = fs.readFileSync(deferralsPath, 'utf8');

    expect(content).toContain('DEF-01');
    expect(content).toContain('DEF-10');
    expect(content).toContain('FMB Polygon');
    expect(content).toContain('Offline Resilient');
    expect(content).toContain('Doorstep Home Delivery');
    expect(content).toContain('107 Developer Days');
  });

  it('verifies phase-2-roadmap.md defines sequenced sprints and dependencies', () => {
    const roadmapPath = path.join(launchDocsDir, 'phase-2-roadmap.md');
    const content = fs.readFileSync(roadmapPath, 'utf8');

    expect(content).toContain('Sprint 1');
    expect(content).toContain('Sprint 2');
    expect(content).toContain('Sprint 3');
    expect(content).toContain('Sprint 4');
    expect(content).toContain('80 Developer Days');
  });

  it('verifies the golden-thread E2E integration test suite is present and configured', () => {
    const goldenThreadPath = path.join(rootDir, 'apps/api/src/modules/marketplace/golden-thread.e2e.test.ts');
    expect(fs.existsSync(goldenThreadPath)).toBe(true);

    const content = fs.readFileSync(goldenThreadPath, 'utf8');
    expect(content).toContain('Golden Thread');
  });
});
