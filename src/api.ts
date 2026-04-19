import Constants from 'expo-constants';
import type { SummaryResult } from './types';

function readConfig(): { baseUrl: string; token: string } {
  const extra =
    (Constants.expoConfig?.extra as { backendUrl?: string; backendToken?: string } | undefined) ??
    {};
  return {
    baseUrl:
      (process.env.EXPO_PUBLIC_LINKS_BACKEND_URL as string | undefined) ??
      extra.backendUrl ??
      '',
    token:
      (process.env.EXPO_PUBLIC_LINKS_BACKEND_TOKEN as string | undefined) ??
      extra.backendToken ??
      '',
  };
}

export class BackendError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'BackendError';
  }
}

export async function summarize(url: string): Promise<SummaryResult> {
  const { baseUrl, token } = readConfig();
  if (!baseUrl || !token) {
    throw new BackendError(
      'Backend not configured. Set EXPO_PUBLIC_LINKS_BACKEND_URL and EXPO_PUBLIC_LINKS_BACKEND_TOKEN.',
    );
  }
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/summarize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new BackendError(
      `summarize failed: ${bodyText}`,
      response.status,
    );
  }
  const body = (await response.json()) as { summary: string; title: string | null };
  return { summary: body.summary, title: body.title };
}

export function isBackendConfigured(): boolean {
  const { baseUrl, token } = readConfig();
  return !!baseUrl && !!token;
}
