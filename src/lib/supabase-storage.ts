import { getClient } from './supabase/client';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'default';

export interface UploadOptions {
  bucket?: string;
  upsert?: boolean;
  contentType?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  options: UploadOptions = {}
) {
  const supabase = getClient();
  const bucket = options.bucket || DEFAULT_BUCKET;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options.upsert ?? false,
      contentType: options.contentType,
    });

  if (error) throw error;
  return data;
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(path: string, bucket?: string) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .download(path);

  if (error) throw error;
  return data;
}

/**
 * Get a public URL for a file
 */
export function getPublicUrl(path: string, bucket?: string) {
  const supabase = getClient();
  const { data } = supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Get a signed URL for private files (expires in 1 hour by default)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600,
  bucket?: string
) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(folder?: string, bucket?: string) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .list(folder || '');

  if (error) throw error;
  return data;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string, bucket?: string) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .remove([path]);

  if (error) throw error;
  return data;
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(paths: string[], bucket?: string) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucket || DEFAULT_BUCKET)
    .remove(paths);

  if (error) throw error;
  return data;
}
