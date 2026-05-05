import { supabase } from '../supabase';
import type { FetchMetaResult } from '../types';

/**
 * Call the Supabase Edge Function `fetch-meta` with the user's JWT.
 * Returns null fields on any network / auth failure.
 */
export async function fetchMeta(url: string): Promise<FetchMetaResult> {
  const empty: FetchMetaResult = {
    title: null,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
  };

  try {
    const { data, error } = await supabase.functions.invoke<FetchMetaResult>('fetch-meta', {
      body: { url },
    });

    if (error || !data) {
      return empty;
    }

    return {
      title: data.title ?? null,
      description: data.description ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      favicon_url: data.favicon_url ?? null,
      site_name: data.site_name ?? null,
    };
  } catch {
    return empty;
  }
}
