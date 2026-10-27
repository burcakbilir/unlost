// Carries the HTTP status alongside the message, so callers can tell an
// expired session (401) apart from a validation error without parsing text.
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError("You appear to be offline. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message ?? "Request failed", response.status);
  }

  return data as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, jsonInit("POST", body));
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, jsonInit("PUT", body));
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, jsonInit("PATCH", body));
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, body === undefined ? { method: "DELETE" } : jsonInit("DELETE", body));
}
