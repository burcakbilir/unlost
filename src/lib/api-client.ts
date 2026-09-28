export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "DELETE" });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}
