"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey } from "./config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl!, supabasePublishableKey!);
}
