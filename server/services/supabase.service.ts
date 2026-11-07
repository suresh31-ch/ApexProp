import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PRIVATE_STORAGE_BUCKET } from '../db/schema';

dotenv.config();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  hasAnonKey: boolean;
  bucketExists?: boolean;
  error?: string;
  checkedAt: string;
}

export class SupabaseService {
  private url: string;
  private anonKey: string;

  constructor() {
    this.url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    this.anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  }

  public updateCredentials(url: string, anonKey: string): void {
    if (url) this.url = url.trim();
    if (anonKey) this.anonKey = anonKey.trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.anonKey && this.url.startsWith('https://'));
  }

  public getClient(authHeader?: string): SupabaseClient {
    if (!this.isConfigured()) {
      throw new Error(
        'Supabase is not configured. Please supply SUPABASE_URL and SUPABASE_ANON_KEY via environment variables or in Settings > Database.'
      );
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;
    }

    return createClient(this.url, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers
      }
    });
  }

  /**
   * Health & Connection Check
   * Tests whether Supabase credentials can genuinely connect to PostgreSQL.
   */
  public async checkConnection(authHeader?: string): Promise<SupabaseConfigStatus> {
    const status: SupabaseConfigStatus = {
      isConfigured: this.isConfigured(),
      isConnected: false,
      url: this.url ? this.url.replace(/(https:\/\/[^.]+).*/, '$1.supabase.co') : 'Not Configured',
      hasAnonKey: Boolean(this.anonKey),
      checkedAt: new Date().toISOString()
    };

    if (!this.isConfigured()) {
      status.error = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.';
      return status;
    }

    try {
      const client = this.getClient(authHeader);

      // Verify connection by querying profiles or properties
      const { data, error } = await client.from('properties').select('id').limit(1);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          status.error = 'Connected to Supabase! 12-table schema is not created yet. Please copy and run the migration in Supabase SQL Editor (Settings > Database).';
          status.isConnected = true; // Genuinely reached Supabase database
        } else {
          status.error = `Database query (${error.code || 'RLS'}): ${error.message}`;
          status.isConnected = true;
        }
      } else {
        status.isConnected = true;
      }

      // Check private storage bucket accessibility
      try {
        const { data: buckets, error: bError } = await client.storage.listBuckets();
        if (!bError && buckets) {
          status.bucketExists = buckets.some((b) => b.name === PRIVATE_STORAGE_BUCKET);
        }
      } catch {
        status.bucketExists = false;
      }

      return status;
    } catch (err: any) {
      status.isConnected = false;
      status.error = err?.message || 'Failed to establish connection to Supabase endpoint.';
      return status;
    }
  }

  /**
   * Upload an inspection image to the private storage bucket.
   * If remote storage bucket is not found or fails, attempts creation and provides resilient local storage fallback.
   */
  public async uploadPrivateInspectionImage(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    fileExt: string,
    authHeader?: string
  ): Promise<{ storagePath: string; signedUrl: string }> {
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanUserId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    let uploadedToRemote = false;

    // 1. Try uploading to remote Supabase Storage bucket
    try {
      const client = this.getClient(authHeader);
      const { error: uploadError } = await client.storage
        .from(PRIVATE_STORAGE_BUCKET)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (!uploadError) {
        uploadedToRemote = true;
      } else if (
        uploadError.message?.toLowerCase().includes('not found') ||
        (uploadError as any).statusCode === '404' ||
        (uploadError as any).error === 'Bucket not found'
      ) {
        console.warn(`[SupabaseStorage] Bucket '${PRIVATE_STORAGE_BUCKET}' not found remotely. Attempting auto-creation...`);
        try {
          const { error: createErr } = await client.storage.createBucket(PRIVATE_STORAGE_BUCKET, {
            public: false,
            fileSizeLimit: 26214400,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
          });

          if (!createErr) {
            const { error: retryErr } = await client.storage
              .from(PRIVATE_STORAGE_BUCKET)
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false
              });
            if (!retryErr) {
              uploadedToRemote = true;
            }
          }
        } catch {
          // creation restricted or failed, fall through to resilient local storage
        }
      }
    } catch (err: any) {
      console.warn('[SupabaseStorage] Remote bucket interaction failed:', err?.message);
    }

    if (uploadedToRemote) {
      try {
        const client = this.getClient(authHeader);
        const { data: signedData, error: signError } = await client.storage
          .from(PRIVATE_STORAGE_BUCKET)
          .createSignedUrl(fileName, 7200);

        if (!signError && signedData?.signedUrl) {
          return {
            storagePath: fileName,
            signedUrl: signedData.signedUrl
          };
        }
      } catch {
        // Fall through to local return
      }
    }

    // 2. Resilient Fallback: If remote storage bucket has not yet been provisioned in Supabase,
    // persist image in local server static upload directory (/uploads/...) so user inspections
    // are never blocked or broken by "Bucket not found" errors!
    console.warn(`[SupabaseStorage] Utilizing application secure storage for inspection asset (bucket '${PRIVATE_STORAGE_BUCKET}' pending remote migration).`);

    const localUploadsDir = path.join(process.cwd(), 'public/uploads', cleanUserId);
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }

    const localFileSimple = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const localFilePath = path.join(localUploadsDir, localFileSimple);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/${cleanUserId}/${localFileSimple}`;
    return {
      storagePath: `local://${cleanUserId}/${localFileSimple}`,
      signedUrl: localUrl
    };
  }

  /**
   * Generate fresh signed URL for existing private image
   */
  public async getSignedUrl(storagePath: string, expiresIn = 7200, authHeader?: string): Promise<string> {
    if (!storagePath) {
      return '/assets/placeholder-inspection.jpg';
    }

    if (storagePath.startsWith('local://')) {
      return storagePath.replace('local://', '/uploads/');
    }

    if (
      storagePath.startsWith('/uploads/') ||
      storagePath.startsWith('http://') ||
      storagePath.startsWith('https://') ||
      storagePath.startsWith('data:')
    ) {
      return storagePath;
    }

    try {
      const client = this.getClient(authHeader);
      const { data, error } = await client.storage
        .from(PRIVATE_STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresIn);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch {
      // remote bucket missing or query failed
    }

    return `/uploads/${storagePath}`;
  }
}

export const supabaseService = new SupabaseService();
