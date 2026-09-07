/**
 * Local draft persistence for Farmer Registration (S-43).
 * Survives process kills and cold starts.
 */

export interface Step1PersonalData {
  fullName?: string | undefined;
  mobile?: string | undefined;
  dob?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED' | undefined;
  aadhaarLast4?: string | undefined;
  farmingExperienceYears?: number | undefined;
  addressLine1?: string | undefined;
  addressLine2?: string | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
  pincode?: string | undefined;
}

export interface FarmItemData {
  name: string;
  totalAreaAcres: number;
  waterSource?: string | undefined;
  primaryCrops?: string[] | undefined;
}

export interface Step2FarmData {
  farms: FarmItemData[];
}

export interface Step3LocationData {
  gpsCaptured?: boolean | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
}

export interface DocumentItemData {
  docType: 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE' | 'OTHER';
  fileUrl: string;
  fileName?: string | undefined;
}

export interface Step4DocumentsData {
  documents: DocumentItemData[];
}

export interface Step5ReviewData {
  confirmed?: boolean | undefined;
  notes?: string | undefined;
}

export interface RegistrationDraft {
  applicationId: string;
  currentStep: number;
  step1?: Step1PersonalData | undefined;
  step2?: Step2FarmData | undefined;
  step3?: Step3LocationData | undefined;
  step4?: Step4DocumentsData | undefined;
  step5?: Step5ReviewData | undefined;
}

const DRAFT_STORAGE_KEY = 'TOHFA_FARMER_REGISTRATION_DRAFT_V1';

let memoryDraft: RegistrationDraft | null = null;

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): KeyValueStorage | null {
  try {
    const g = globalThis as unknown as { localStorage?: KeyValueStorage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function saveRegistrationDraft(draft: RegistrationDraft): Promise<void> {
  memoryDraft = JSON.parse(JSON.stringify(draft));
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // Ignore storage failure
  }
}

export async function getRegistrationDraft(): Promise<RegistrationDraft | null> {
  if (memoryDraft !== null) {
    return JSON.parse(JSON.stringify(memoryDraft));
  }
  try {
    const storage = getStorage();
    if (storage) {
      const item = storage.getItem(DRAFT_STORAGE_KEY);
      if (item) {
        memoryDraft = JSON.parse(item);
        return memoryDraft;
      }
    }
  } catch {
    // Ignore read failure
  }
  return null;
}

export async function clearRegistrationDraft(): Promise<void> {
  memoryDraft = null;
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // Ignore removal failure
  }
}
