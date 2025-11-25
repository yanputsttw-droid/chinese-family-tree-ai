export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  deathDate?: string; // YYYY-MM-DD (Optional)
  originFamilyCode?: string; // The family code this record belongs to
  
  // Spouse Details (Flattened for easier Excel mapping)
  spouse?: string; // Name
  spouseBirthDate?: string;
  spouseDeathDate?: string;
  spousePhotoUrl?: string;

  description?: string; // Additional notes
  children: Person[];
  
  // Calculated/Derived fields usually handled in UI, but kept here for data structure
  photoUrl?: string; 
}

export interface FamilyTreeData {
  root: Person;
  name: string; // Family Name (e.g., "李氏家族")
}

export interface FamilyAccount {
  code: string; // Unique ID (e.g., "FAM001")
  name: string; // Display Name
  password?: string; // Admin password
  root: Person; // The tree data
}

export interface LinkRequest {
  id: string;
  fromFamilyCode: string; // The branch family (B)
  toFamilyCode: string;   // The main family (A)
  targetName: string;     // Name of the connection node (e.g. "Li San")
  targetBirthYear: string; // Birth year to verify identity
  status: 'pending' | 'approved' | 'rejected';
  isHidden?: boolean;     // Allow A to shield B
  timestamp: number;
}

export enum GeminiModel {
  FLASH_LITE = 'gemini-2.5-flash', // Corrected to valid model name
  PRO_PREVIEW = 'gemini-3-pro-preview', // Complex reasoning & thinking
  FLASH_IMAGE = 'gemini-2.5-flash-image', // Image editing/analysis
  PRO_IMAGE = 'gemini-3-pro-image-preview', // High res image
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  type?: 'text' | 'image' | 'analysis';
  imageUrl?: string;
  isThinking?: boolean;
}