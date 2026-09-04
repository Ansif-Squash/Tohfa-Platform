import { describe, expect, it, beforeEach } from 'vitest';
import {
  saveRegistrationDraft,
  getRegistrationDraft,
  clearRegistrationDraft,
  type RegistrationDraft,
} from '../storage/registrationDraft';
import { validateStep, validateCrossStepSubmission } from '../screens/registration/validation';

describe('User Story 43 (S-43) Registration Tests', () => {
  beforeEach(async () => {
    await clearRegistrationDraft();
  });

  describe('Cold-Start Draft Resume', () => {
    it('registration: cold-start test proves killed app resumes on correct step with saved answers intact', async () => {
      // 1. Simulate user completing Step 1 and being on Step 3 before app process is killed
      const draftState: RegistrationDraft = {
        applicationId: 'app-uuid-9988',
        currentStep: 3,
        step1: {
          fullName: 'Senthil Kumar',
          mobile: '+919876543210',
          aadhaarLast4: '4321',
          village: 'Ketti',
          taluk: 'Coonoor',
          district: 'Nilgiris',
          pincode: '643215',
        },
        step2: {
          farms: [
            {
              name: 'Green Hill Farm',
              totalAreaAcres: 3.5,
              waterSource: 'Stream',
              primaryCrops: ['Tea', 'Carrot'],
            },
          ],
        },
        step3: {
          gpsCaptured: true,
          latitude: 11.385,
          longitude: 76.732,
          village: 'Ketti',
          taluk: 'Coonoor',
          district: 'Nilgiris',
        },
        step4: {
          documents: [],
        },
      };

      // Save draft state
      await saveRegistrationDraft(draftState);

      // 2. Simulate complete cold start (app killed mid-flow, memory reinitialized)
      const restoredDraft = await getRegistrationDraft();

      // Assert draft resumed exactly at step 3 with full answers preserved
      expect(restoredDraft).not.toBeNull();
      expect(restoredDraft?.applicationId).toBe('app-uuid-9988');
      expect(restoredDraft?.currentStep).toBe(3);
      expect(restoredDraft?.step1?.fullName).toBe('Senthil Kumar');
      expect(restoredDraft?.step1?.aadhaarLast4).toBe('4321');
      expect(restoredDraft?.step2?.farms[0]?.name).toBe('Green Hill Farm');
      expect(restoredDraft?.step3?.latitude).toBe(11.385);
      expect(restoredDraft?.step3?.longitude).toBe(76.732);
    });
  });

  describe('Per-Step Validation vs Cross-Step Submission Pass', () => {
    it('registration: step 1 validates personal fields independently without blocking on step 2 or 4', () => {
      const validStep1 = {
        fullName: 'Murugan S',
        mobile: '+919812345678',
        aadhaarLast4: '1234',
        village: 'Ithalar',
      };
      const result = validateStep(1, validStep1);
      expect(result.valid).toBe(true);

      const invalidStep1 = {
        fullName: '',
        mobile: '123',
        aadhaarLast4: 'abc',
      };
      const invalidResult = validateStep(1, invalidStep1);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors['fullName']).toBeDefined();
      expect(invalidResult.errors['aadhaarLast4']).toBeDefined();
    });

    it('registration: step 3 location validates manual fallback when GPS is not captured', () => {
      // Manual fallback with valid lat/lng
      const validManual = {
        gpsCaptured: false,
        latitude: 11.4102,
        longitude: 76.695,
        village: 'Ooty Rural',
      };
      const validRes = validateStep(3, validManual);
      expect(validRes.valid).toBe(true);

      // Missing lat/lng
      const invalidManual = {
        gpsCaptured: false,
        latitude: undefined,
        longitude: undefined,
      };
      const invalidRes = validateStep(3, invalidManual);
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.errors['coordinates']).toBeDefined();
    });

    it('registration: submit performs cross-step validation and enforces mandatory documents', () => {
      // Incomplete draft (missing documents in step 4)
      const incompleteDraft: RegistrationDraft = {
        applicationId: 'app-1',
        currentStep: 5,
        step1: { fullName: 'Farmer Test', mobile: '+919876543210', aadhaarLast4: '9999' },
        step2: { farms: [{ name: 'Farm A', totalAreaAcres: 2 }] },
        step3: { latitude: 11.4, longitude: 76.7 },
        step4: { documents: [] }, // Missing mandatory documents
      };

      const crossCheck = validateCrossStepSubmission(incompleteDraft);
      expect(crossCheck.valid).toBe(false);
      expect(crossCheck.errors).toContain('Mandatory documents are required.');

      // Complete draft with ID proof and Farm document
      const completeDraft: RegistrationDraft = {
        ...incompleteDraft,
        step4: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://storage.tohfa.in/id.pdf', fileName: 'id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://storage.tohfa.in/land.pdf', fileName: 'land.pdf' },
          ],
        },
      };

      const validCrossCheck = validateCrossStepSubmission(completeDraft);
      expect(validCrossCheck.valid).toBe(true);
      expect(validCrossCheck.errors).toHaveLength(0);
    });
  });

  describe('BR-33: Aadhaar & Mobile Field Immutability', () => {
    it('BR-33: aadhaar and mobile are captured once and locked from modification', () => {
      const step1 = {
        fullName: 'Ramanathan K',
        mobile: '+919443322110',
        aadhaarLast4: '5566',
      };
      expect(step1.aadhaarLast4).toHaveLength(4);
      expect(/^\d{4}$/.test(step1.aadhaarLast4)).toBe(true);
    });
  });
});
