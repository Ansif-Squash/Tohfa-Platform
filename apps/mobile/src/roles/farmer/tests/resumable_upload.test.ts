import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadWithResume, resetAllUploadSessions, getUploadSession } from '../api/uploader';

describe('Resumable Uploads (S-46)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAllUploadSessions();
  });

  it('resumes an interrupted upload from the last byte offset when resumable is true', async () => {
    const uploadUrl = 'https://storage.tohfa.in/blobs/aadhaar_doc.pdf';
    const fileUrl = 'https://storage.tohfa.in/public/aadhaar_doc.pdf';
    const totalData = new Uint8Array(128 * 1024); // 128 KB
    const chunkSize = 64 * 1024; // 64 KB per chunk -> 2 chunks

    let chunkCallCount = 0;
    const receivedRanges: string[] = [];

    // Simulate failure on chunk 2
    global.fetch = vi.fn(async (_url: RequestInfo | URL, options?: RequestInit) => {
      chunkCallCount++;
      const headers = (options?.headers ?? {}) as Record<string, string>;
      receivedRanges.push(headers['Content-Range'] || 'none');

      if (chunkCallCount === 1) {
        // Chunk 1 succeeds (0 - 65535)
        return new Response(null, { status: 200 });
      }

      // Chunk 2 fails (e.g. killed connection / process interrupt)
      throw new Error('Network connection drop');
    });

    // 1. Initial upload attempt
    await expect(
      uploadWithResume({
        uploadUrl,
        fileUrl,
        resumable: true,
        data: totalData,
        contentType: 'application/pdf',
        chunkSize,
      }),
    ).rejects.toThrow('Network connection drop');

    expect(chunkCallCount).toBe(2);
    expect(receivedRanges[0]).toBe('bytes 0-65535/131072');

    // Verify session state saved the 64KB progress
    const session = getUploadSession(uploadUrl);
    expect(session).toBeDefined();
    expect(session?.uploadedBytes).toBe(65536);

    // 2. Retry upload with the same target URL
    let retryChunkCallCount = 0;
    const retryRanges: string[] = [];

    global.fetch = vi.fn(async (_url: RequestInfo | URL, options?: RequestInit) => {
      retryChunkCallCount++;
      const headers = (options?.headers ?? {}) as Record<string, string>;
      retryRanges.push(headers['Content-Range'] || 'none');
      return new Response(null, { status: 200 });
    });

    const result = await uploadWithResume({
      uploadUrl,
      fileUrl,
      resumable: true,
      data: totalData,
      contentType: 'application/pdf',
      chunkSize,
    });

    // S-46: Only the remaining chunk was sent! It did NOT restart from byte 0.
    expect(result.resumed).toBe(true);
    expect(result.resumedFromByte).toBe(65536);
    expect(result.fileUrl).toBe(fileUrl);
    expect(retryChunkCallCount).toBe(1); // Only 1 chunk needed to finish!
    expect(retryRanges[0]).toBe('bytes 65536-131071/131072');
  });

  it('restarts from byte zero if resumable flag is false', async () => {
    const uploadUrl = 'https://storage.tohfa.in/blobs/non_resumable.jpg';
    const fileUrl = 'https://storage.tohfa.in/public/non_resumable.jpg';
    const totalData = new Uint8Array(128 * 1024);
    const chunkSize = 64 * 1024;

    let calls = 0;
    global.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response(null, { status: 200 });
      throw new Error('Interrupted');
    });

    // Initial attempt fails
    await expect(
      uploadWithResume({
        uploadUrl,
        fileUrl,
        resumable: false,
        data: totalData,
        contentType: 'image/jpeg',
        chunkSize,
      }),
    ).rejects.toThrow('Interrupted');

    // When resumable is false, session does not preserve offset
    const session = getUploadSession(uploadUrl);
    expect(session?.uploadedBytes).toBe(0);

    // Retry should start from zero
    let secondTryCalls = 0;
    global.fetch = vi.fn(async () => {
      secondTryCalls++;
      return new Response(null, { status: 200 });
    });

    const result = await uploadWithResume({
      uploadUrl,
      fileUrl,
      resumable: false,
      data: totalData,
      contentType: 'image/jpeg',
      chunkSize,
    });

    expect(result.resumed).toBe(false);
    expect(result.resumedFromByte).toBe(0);
    expect(secondTryCalls).toBe(2); // Both chunks uploaded
  });
});
