/**
 * Catalog source registry — Supabase CRUD with JSON fallback.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient } from "./persistenceUtils.js";
import {
  normalizeRegistryEntry,
  registryEntryToRow,
} from "../../catalogAcquisition/sourceRegistry/registryLoader.js";

const TABLE = BACKEND_CONFIG.tables.catalogSourceRegistry;

function resolveClient(client) {
  return client || optionalClient();
}

export async function listCatalogSourceRegistry(client = null) {
  const supabase = resolveClient(client);
  if (!supabase) return { ok: false, skipped: true, reason: "not_configured" };

  const { data, error } = await supabase.from(TABLE).select("*").order("brand");
  if (error) return { ok: false, error: mapSupabaseError(error) };
  return { ok: true, data: (data || []).map(normalizeRegistryEntry) };
}

export async function upsertCatalogSourceRegistryEntry(entry, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) return { ok: false, skipped: true, reason: "not_configured" };

  const row = {
    ...registryEntryToRow(entry),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return { ok: false, error: mapSupabaseError(error) };
  return { ok: true, data: normalizeRegistryEntry(data) };
}

export async function markRegistryNeedsVerification(familySlug, notes = null, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) return { ok: false, skipped: true, reason: "not_configured" };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "needs_verification",
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("family_slug", familySlug)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: mapSupabaseError(error) };
  return { ok: true, data: data ? normalizeRegistryEntry(data) : null };
}
