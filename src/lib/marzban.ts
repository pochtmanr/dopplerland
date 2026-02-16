const MARZBAN_API_URL = process.env.MARZBAN_API_URL || "http://72.61.87.54:9090/marzban-api";
const MARZBAN_API_KEY = process.env.MARZBAN_API_KEY || "";
const MARZBAN_ADMIN_USER = process.env.MARZBAN_ADMIN_USER || "";
const MARZBAN_ADMIN_PASS = process.env.MARZBAN_ADMIN_PASS || "";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getMarzbanToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${MARZBAN_API_URL}/admin/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Marzban-Key": MARZBAN_API_KEY,
    },
    body: `username=${encodeURIComponent(MARZBAN_ADMIN_USER)}&password=${encodeURIComponent(MARZBAN_ADMIN_PASS)}`,
  });

  if (!res.ok) throw new Error(`Marzban auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // refresh after 55min
  return cachedToken!;
}

export async function marzbanFetch(path: string, options: RequestInit = {}) {
  const token = await getMarzbanToken();
  const res = await fetch(`${MARZBAN_API_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Marzban-Key": MARZBAN_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Marzban API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const getSystem = () => marzbanFetch("/system");
export const getUsers = (offset = 0, limit = 50) => marzbanFetch(`/users?offset=${offset}&limit=${limit}`);
export const getUser = (username: string) => marzbanFetch(`/user/${encodeURIComponent(username)}`);
export const createUser = (data: Record<string, unknown>) => marzbanFetch("/user", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (username: string, data: Record<string, unknown>) => marzbanFetch(`/user/${encodeURIComponent(username)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUser = (username: string) => marzbanFetch(`/user/${encodeURIComponent(username)}`, { method: "DELETE" });
