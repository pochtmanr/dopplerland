import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MarzbanServerConfig {
  id: string;
  apiUrl: string;
  apiKey: string;
  adminUser: string;
  adminPass: string;
  serverId: string; // vpn_servers.id
  label: string;
}

interface TokenCache {
  token: string;
  expiry: number;
}

const tokenCache = new Map<string, TokenCache>();

interface VpnServerRow {
  id: string;
  name: string;
  country_code: string;
  marzban_api_url: string | null;
  marzban_admin_user: string | null;
  marzban_admin_pass: string | null;
  marzban_api_key: string | null;
}

/**
 * Load all Marzban-enabled servers from Supabase.
 * Pass an existing supabase client if you have one (from requireAdmin),
 * otherwise a service-role admin client is created automatically.
 */
export async function loadMarzbanServers(
  supabase?: SupabaseClient,
): Promise<MarzbanServerConfig[]> {
  const client = supabase ?? createAdminClient();

  const { data, error } = await client
    .from("vpn_servers")
    .select("id, name, country_code, marzban_api_url, marzban_admin_user, marzban_admin_pass, marzban_api_key")
    .not("marzban_api_url", "is", null)
    .eq("is_active", true)
    .returns<VpnServerRow[]>();

  if (error) throw new Error(`Failed to load Marzban servers: ${error.message}`);

  return (data || []).map((row) => ({
    id: row.country_code.toLowerCase(),
    apiUrl: row.marzban_api_url!,
    apiKey: row.marzban_api_key || "",
    adminUser: row.marzban_admin_user || "",
    adminPass: row.marzban_admin_pass || "",
    serverId: row.id,
    label: row.name,
  }));
}

async function getToken(server: MarzbanServerConfig): Promise<string> {
  const cached = tokenCache.get(server.serverId);
  if (cached && Date.now() < cached.expiry) return cached.token;

  const res = await fetch(`${server.apiUrl}/admin/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(server.apiKey ? { "X-Marzban-Key": server.apiKey } : {}),
    },
    body: `username=${encodeURIComponent(server.adminUser)}&password=${encodeURIComponent(server.adminPass)}`,
  });

  if (!res.ok) throw new Error(`Marzban ${server.label} auth failed: ${res.status}`);
  const data = await res.json();
  tokenCache.set(server.serverId, { token: data.access_token, expiry: Date.now() + 55 * 60 * 1000 });
  return data.access_token;
}

async function marzbanFetchForServer(server: MarzbanServerConfig, path: string, options: RequestInit = {}) {
  const token = await getToken(server);
  const res = await fetch(`${server.apiUrl}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(server.apiKey ? { "X-Marzban-Key": server.apiKey } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Marzban ${server.label} API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Multi-instance client factory
export function createMarzbanClient(server: MarzbanServerConfig) {
  const fetchFn = (path: string, options?: RequestInit) => marzbanFetchForServer(server, path, options);
  return {
    config: server,
    getSystem: () => fetchFn("/system"),
    getUsers: (offset = 0, limit = 50) => fetchFn(`/users?offset=${offset}&limit=${limit}`),
    getUser: (username: string) => fetchFn(`/user/${encodeURIComponent(username)}`),
    createUser: (data: Record<string, unknown>) => fetchFn("/user", { method: "POST", body: JSON.stringify(data) }),
    updateUser: (username: string, data: Record<string, unknown>) => fetchFn(`/user/${encodeURIComponent(username)}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteUser: (username: string) => fetchFn(`/user/${encodeURIComponent(username)}`, { method: "DELETE" }),
  };
}
