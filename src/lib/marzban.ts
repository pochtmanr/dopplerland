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

function loadServerConfigs(): MarzbanServerConfig[] {
  const servers: MarzbanServerConfig[] = [];

  // Germany Marzban
  const deUrl = process.env.MARZBAN_DE_API_URL || process.env.MARZBAN_API_URL;
  if (deUrl) {
    servers.push({
      id: "de",
      apiUrl: deUrl,
      apiKey: process.env.MARZBAN_DE_API_KEY || process.env.MARZBAN_API_KEY || "",
      adminUser: process.env.MARZBAN_DE_ADMIN_USER || process.env.MARZBAN_ADMIN_USER || "",
      adminPass: process.env.MARZBAN_DE_ADMIN_PASS || process.env.MARZBAN_ADMIN_PASS || "",
      serverId: process.env.MARZBAN_DE_SERVER_ID || "e462c96b-af8b-4f09-b989-3ad9aec63413",
      label: "Germany",
    });
  }

  // Russia Marzban
  const ruUrl = process.env.MARZBAN_RU_API_URL;
  if (ruUrl) {
    servers.push({
      id: "ru",
      apiUrl: ruUrl,
      apiKey: process.env.MARZBAN_RU_API_KEY || "",
      adminUser: process.env.MARZBAN_RU_ADMIN_USER || "",
      adminPass: process.env.MARZBAN_RU_ADMIN_PASS || "",
      serverId: process.env.MARZBAN_RU_SERVER_ID || "078dadc9-871a-4d56-aa7a-f6ec6296bd59",
      label: "Russia",
    });
  }

  return servers;
}

let _configs: MarzbanServerConfig[] | null = null;

export function getMarzbanServers(): MarzbanServerConfig[] {
  if (!_configs) _configs = loadServerConfigs();
  return _configs;
}

export function getMarzbanServer(id: string): MarzbanServerConfig | undefined {
  return getMarzbanServers().find((s) => s.id === id);
}

export function getMarzbanServerByServerId(serverId: string): MarzbanServerConfig | undefined {
  return getMarzbanServers().find((s) => s.serverId === serverId);
}

async function getToken(server: MarzbanServerConfig): Promise<string> {
  const cached = tokenCache.get(server.id);
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
  tokenCache.set(server.id, { token: data.access_token, expiry: Date.now() + 55 * 60 * 1000 });
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

// Backward-compatible exports (use DE server by default)
function getDefaultServer(): MarzbanServerConfig {
  const servers = getMarzbanServers();
  if (servers.length === 0) throw new Error("No Marzban servers configured");
  return servers[0];
}

export const getMarzbanToken = () => getToken(getDefaultServer());
export const marzbanFetch = (path: string, options?: RequestInit) => marzbanFetchForServer(getDefaultServer(), path, options);
export const getSystem = () => marzbanFetch("/system");
export const getUsers = (offset = 0, limit = 50) => marzbanFetch(`/users?offset=${offset}&limit=${limit}`);
export const getUser = (username: string) => marzbanFetch(`/user/${encodeURIComponent(username)}`);
export const createUser = (data: Record<string, unknown>) => marzbanFetch("/user", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (username: string, data: Record<string, unknown>) => marzbanFetch(`/user/${encodeURIComponent(username)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUser = (username: string) => marzbanFetch(`/user/${encodeURIComponent(username)}`, { method: "DELETE" });
