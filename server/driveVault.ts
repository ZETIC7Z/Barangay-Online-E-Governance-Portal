import fs from 'fs';
import path from 'path';

export interface DriveFileRecord {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'chat_image' | 'kyc_id' | 'kyc_selfie' | 'emergency_photo' | 'subpoena_doc';
  residentId: string;
  residentName: string;
  driveFolderName: string;
  driveFolderId: string;
  publicUrl: string;
  uploadedBy: string;
  createdAt: string;
}

const VAULT_ROOT = path.resolve(process.env.GOOGLE_DRIVE_VAULT_ROOT || './storage/google_drive_vault');
const INDEX_FILE = path.join(VAULT_ROOT, 'drive_vault_index.json');

fs.mkdirSync(VAULT_ROOT, { recursive: true });

export function sanitizeFolderName(name: string, idSuffix?: string): string {
  const clean = (name || 'Resident_Account')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_');
  return idSuffix ? `${clean}_${idSuffix.slice(-6)}` : clean;
}

export function ensureResidentDriveFolder(residentName: string, residentId: string): {
  folderName: string;
  folderId: string;
  folderPath: string;
  metadata: any;
} {
  const folderName = sanitizeFolderName(residentName, residentId);
  const folderPath = path.join(VAULT_ROOT, folderName);
  fs.mkdirSync(folderPath, { recursive: true });

  const metaPath = path.join(folderPath, '_gdrive_folder_meta.json');
  let metadata: any;
  if (fs.existsSync(metaPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      metadata = null;
    }
  }

  if (!metadata) {
    metadata = {
      driveFolderId: `GDRIVE-MTG-${Buffer.from(folderName).toString('hex').slice(0, 12).toUpperCase()}`,
      folderName,
      ownerName: residentName,
      ownerId: residentId,
      barangay: 'Barangay Matatag, Lamitan City, Basilan (7302)',
      provider: 'Google Drive Cloud Media Vault (Synced)',
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  return {
    folderName,
    folderId: metadata.driveFolderId,
    folderPath,
    metadata,
  };
}

export function loadDriveIndex(): DriveFileRecord[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveDriveIndex(records: DriveFileRecord[]) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export function saveBase64ToResidentDrive(params: {
  residentId: string;
  residentName: string;
  base64Data: string;
  originalName?: string;
  category: DriveFileRecord['category'];
  uploadedBy: string;
}): DriveFileRecord {
  const { folderName, folderId, folderPath } = ensureResidentDriveFolder(
    params.residentName,
    params.residentId
  );

  let mimeType = 'image/png';
  let ext = 'png';
  let rawBase64 = params.base64Data;

  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(params.base64Data);
  if (match) {
    mimeType = match[1];
    rawBase64 = match[2];
    ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  const timestamp = Date.now();
  const safeOrig = (params.originalName || `${params.category}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${timestamp}_${safeOrig}`;
  const filePath = path.join(folderPath, fileName);

  fs.writeFileSync(filePath, buffer);

  const record: DriveFileRecord = {
    id: `DRV-${timestamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    fileName,
    originalName: params.originalName || fileName,
    mimeType,
    sizeBytes: buffer.length,
    category: params.category,
    residentId: params.residentId,
    residentName: params.residentName,
    driveFolderName: folderName,
    driveFolderId: folderId,
    publicUrl: `/drive-vault/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`,
    uploadedBy: params.uploadedBy,
    createdAt: new Date().toISOString(),
  };

  const index = loadDriveIndex();
  index.unshift(record);
  saveDriveIndex(index);

  return record;
}
