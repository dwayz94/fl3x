import type { ApiError } from "@fl3x/shared";
import { site } from "@/config/site";

export class ApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string | null; json?: unknown } = {},
): Promise<T> {
  const { token, json, headers, ...rest } = init;
  const res = await fetch(`${site.apiUrl}${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? "POST" : "GET"),
    headers: {
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(res.status, err?.error ?? "error", err?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
