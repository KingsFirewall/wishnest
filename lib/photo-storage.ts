import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PhotoStorage } from "./api-handler";
import { supabaseUrl } from "./supabase/config";

export const PHOTO_BUCKET = "wish-photos";
let admin: SupabaseClient | undefined;

// The secret key bypasses Storage policies, so it is server-only. The bucket is
// private with no policies: browsers can never read it directly.
function storage() {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secret) throw new Error("Supabase Storage is not configured.");
  admin ??= createClient(supabaseUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin.storage.from(PHOTO_BUCKET);
}
export const photoStorage: PhotoStorage = {
  async put(id, bytes, contentType) {
    const path = `wishes/${id}`;
    const { error } = await storage().upload(path, bytes, { contentType, upsert: false });
    if (error) throw new Error("Photo upload failed.");
    return path;
  },
  async get(path) {
    const { data, error } = await storage().download(path);
    if (error || !data) return null;
    return data.stream();
  },
  async delete(path) { await storage().remove([path]); },
};
