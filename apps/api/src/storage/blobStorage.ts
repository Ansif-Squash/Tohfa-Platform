import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { config } from '../config.js';

export interface SignedUploadTarget {
  uploadUrl: string;
  fileUrl: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
  expiresAt: string;
  resumable: boolean;
}

export interface GenerateUploadOptions {
  key: string;
  contentType: string;
  sizeBytes: number;
  expiresInMinutes?: number;
  purpose: string;
}

export interface BlobStorage {
  generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget>;
  getPublicUrl(key: string): string;
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export class InMemoryBlobStorage implements BlobStorage {
  private readonly store = new Map<string, { data: Buffer; contentType: string }>();
  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const expiresAt = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000).toISOString();
    return {
      uploadUrl: `${this.baseUrl}/v1/uploads/mock/${options.key}`,
      fileUrl: this.getPublicUrl(options.key),
      method: 'PUT',
      headers: {
        'Content-Type': options.contentType,
        'x-ms-blob-type': 'BlockBlob',
      },
      expiresAt,
      resumable: false,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/storage/${key}`;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    this.store.set(key, { data, contentType });
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer | null> {
    return this.store.get(key)?.data ?? null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class AzureBlobStorage implements BlobStorage {
  private readonly client: BlobServiceClient;
  private readonly containerName: string;

  constructor(connectionString: string, containerName = config.AZURE_BLOB_CONTAINER) {
    this.client = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(options.key);

    const expiresOn = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000);
    const permissions = BlobSASPermissions.parse('w'); // write-only permission

    // Derive SAS from connection string credentials
    const sasToken = await this.generateSasToken(options.key, permissions, expiresOn);
    const uploadUrl = `${blockBlobClient.url}?${sasToken}`;
    const fileUrl = this.getPublicUrl(options.key);

    return {
      uploadUrl,
      fileUrl,
      method: 'PUT',
      headers: {
        'Content-Type': options.contentType,
        'x-ms-blob-type': 'BlockBlob',
      },
      expiresAt: expiresOn.toISOString(),
      resumable: false,
    };
  }

  getPublicUrl(key: string): string {
    const containerClient = this.client.getContainerClient(this.containerName);
    return containerClient.getBlockBlobClient(key).url;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async download(key: string): Promise<Buffer | null> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    try {
      const downloadResponse = await blockBlobClient.downloadToBuffer();
      return downloadResponse;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const containerClient = this.client.getContainerClient(this.containerName);
    await containerClient.deleteBlob(key);
  }

  private async generateSasToken(
    blobName: string,
    permissions: BlobSASPermissions,
    expiresOn: Date,
  ): Promise<string> {
    if (this.client.credential instanceof StorageSharedKeyCredential) {
      return generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName,
          permissions,
          expiresOn,
        },
        this.client.credential,
      ).toString();
    }
    return '';
  }
}

export function createBlobStorage(): BlobStorage {
  if (config.AZURE_STORAGE_CONNECTION_STRING.length > 0 && !config.isTest) {
    return new AzureBlobStorage(
      config.AZURE_STORAGE_CONNECTION_STRING,
      config.AZURE_BLOB_CONTAINER,
    );
  }
  return new InMemoryBlobStorage();
}

export const defaultBlobStorage = createBlobStorage();
