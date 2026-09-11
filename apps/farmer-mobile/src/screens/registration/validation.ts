import type {
  RegistrationDraft,
  Step1PersonalData,
  Step2FarmData,
  Step3LocationData,
  Step4DocumentsData,
} from '../../storage/registrationDraft';

export interface StepValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface CrossStepValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep(step: number, data: unknown): StepValidationResult {
  const errors: Record<string, string> = {};

  if (step === 1) {
    const s1 = (data ?? {}) as Step1PersonalData;
    if (!s1.fullName || s1.fullName.trim().length < 2) {
      errors['fullName'] = 'Full name must be at least 2 characters.';
    }
    if (!s1.mobile || !/^\+[1-9][0-9]{7,14}$/.test(s1.mobile.trim())) {
      errors['mobile'] = 'Valid mobile number starting with +91 is required.';
    }
    const aadhaarInput = (s1.aadhaarNumber || s1.aadhaarLast4 || '').replace(/\s+/g, '').trim();
    if (!aadhaarInput || aadhaarInput.length < 4) {
      errors['aadhaarLast4'] = 'Aadhaar / ID Number is required.';
    }
  } else if (step === 2) {
    const s2 = (data ?? {}) as Step2FarmData;
    if (!s2.farms || s2.farms.length === 0) {
      errors['farms'] = 'At least one farm must be registered.';
    } else {
      const first = s2.farms[0];
      if (!first?.name || first.name.trim().length === 0) {
        errors['farmName'] = 'Farm name is required.';
      }
      if (!first?.typeOfFarming) {
        errors['typeOfFarming'] = 'Type of farming is required.';
      }
      if (!first?.experienceYears || first.experienceYears <= 0) {
        errors['experienceYears'] = 'Experience must be greater than zero.';
      }
      if (!first?.totalAreaAcres || first.totalAreaAcres <= 0) {
        errors['acreage'] = 'Total acreage must be greater than zero.';
      }
      if (!first?.numberOfFarms || first.numberOfFarms <= 0) {
        errors['numberOfFarms'] = 'Number of farms must be at least 1.';
      }
    }
  } else if (step === 3) {
    const s3 = (data ?? {}) as Step3LocationData;
    if (s3.latitude === undefined || s3.longitude === undefined) {
      errors['coordinates'] = 'GPS location or manual coordinates must be specified.';
    }
  } else if (step === 4) {
    const s4 = (data ?? {}) as Step4DocumentsData;
    if (!s4.documents || s4.documents.length === 0) {
      errors['documents'] = 'At least one document must be uploaded.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCrossStepSubmission(draft: RegistrationDraft): CrossStepValidationResult {
  const errors: string[] = [];

  const s1Check = validateStep(1, draft.step1);
  if (!s1Check.valid) {
    errors.push('Step 1 (Personal Details) is incomplete or invalid.');
  }

  const s2Check = validateStep(2, draft.step2);
  if (!s2Check.valid) {
    errors.push('Step 2 (Farm Details) is incomplete or invalid.');
  }

  const s3Check = validateStep(3, draft.step3);
  if (!s3Check.valid) {
    errors.push('Step 3 (Location) is incomplete or invalid.');
  }

  const documents = draft.step4?.documents ?? [];
  const hasIdProof = documents.some((d) => d.docType === 'ID_PROOF');
  const hasFarmDoc = documents.some((d) => d.docType === 'FARM_DOC');

  if (!hasIdProof || !hasFarmDoc) {
    errors.push('Mandatory documents are required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
