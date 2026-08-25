import type { Executor } from '../../db/pool.js';

export interface UploadRow {
  id: string;
  storage_key: string;
  bucket: string;
  mime_type: string;
  size_bytes: string;
  checksum: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_public: boolean;
  uploaded_by: string | null;
  created_at: Date;
}

export interface CreateUploadParams {
  storageKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string | undefined;
  isPublic?: boolean | undefined;
  entityType?: string | undefined;
  entityId?: string | undefined;
}

export interface UploadsRepo {
  createUpload(db: Executor, params: CreateUploadParams): Promise<UploadRow>;
  findByKey(db: Executor, storageKey: string): Promise<UploadRow | null>;
  findById(db: Executor, id: string): Promise<UploadRow | null>;
}

export const uploadsRepo: UploadsRepo = {
  async createUpload(db, params) {
    const result = await db.query<UploadRow>(
      `INSERT INTO uploads (storage_key, bucket, mime_type, size_bytes, uploaded_by, is_public, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, storage_key, bucket, mime_type, size_bytes::text, checksum,
                 entity_type, entity_id, is_public, uploaded_by, created_at`,
      [
        params.storageKey,
        params.bucket,
        params.mimeType,
        params.sizeBytes,
        params.uploadedBy ?? null,
        params.isPublic ?? false,
        params.entityType ?? null,
        params.entityId ?? null,
      ],
    );
    return result.rows[0]!;
  },

  async findByKey(db, storageKey) {
    const result = await db.query<UploadRow>(
      `SELECT id, storage_key, bucket, mime_type, size_bytes::text, checksum,
              entity_type, entity_id, is_public, uploaded_by, created_at
         FROM uploads
        WHERE storage_key = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [storageKey],
    );
    return result.rows[0] ?? null;
  },

  async findById(db, id) {
    const result = await db.query<UploadRow>(
      `SELECT id, storage_key, bucket, mime_type, size_bytes::text, checksum,
              entity_type, entity_id, is_public, uploaded_by, created_at
         FROM uploads
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },
};
