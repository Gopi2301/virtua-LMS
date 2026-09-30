import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

export interface StoredAssetResult {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  url: string;
}

const UPLOAD_ROOT_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensures a directory exists on the server filesystem.
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Stores an asset file locally on the server filesystem.
 * 
 * @param file The uploaded file object (Multer file or buffer representation)
 * @param subfolder Target subfolder inside uploads (defaults to 'resources')
 * @returns Stored asset metadata for the database (fileName, fileSize, mimeType, storageKey, url)
 */
export async function saveAssetToServer(
  file: UploadedFileInput,
  subfolder: string = 'resources',
): Promise<StoredAssetResult> {
  const targetDir = path.join(UPLOAD_ROOT_DIR, subfolder);
  await ensureDirectoryExists(targetDir);

  const cleanOriginalName = path.basename(file.originalname).replace(/\s+/g, '_');
  const uniqueId = randomUUID().slice(0, 8);
  const storedFileName = `${Date.now()}_${uniqueId}_${cleanOriginalName}`;
  const destinationPath = path.join(targetDir, storedFileName);

  if (file.buffer) {
    await fs.writeFile(destinationPath, file.buffer);
  } else if (file.path) {
    await fs.copyFile(file.path, destinationPath);
  } else {
    throw new Error('No buffer or file path provided for file storage');
  }

  const storageKey = path.posix.join(subfolder, storedFileName);
  const publicUrl = `/uploads/${storageKey}`;

  return {
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storageKey,
    url: publicUrl,
  };
}

/**
 * Deletes an asset file from the server storage if it exists.
 * 
 * @param storageKey The storage key of the file (e.g. 'resources/12345_file.pdf')
 */
export async function deleteAssetFromServer(storageKey: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_ROOT_DIR, storageKey);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Resolves the absolute server filesystem path for a given storage key.
 */
export function getAssetServerPath(storageKey: string): string {
  return path.join(UPLOAD_ROOT_DIR, storageKey);
}
