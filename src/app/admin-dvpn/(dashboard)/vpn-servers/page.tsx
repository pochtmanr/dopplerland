"use client";

import { useEffect, useState, useCallback } from "react";
import { ServerCard } from "@/components/admin/server-card";
import { HealthMonitor } from "@/components/admin/health-monitor";
import { AdminLoader } from "@/components/admin/admin-loader";

interface ServerInfo {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  ip_address: string;
  port: number;
  protocol: string;
  is_active: boolean;
  has_marzban: boolean;
}

export default function VpnServersPage() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vpn/servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      const json = await res.json();
      setServers(json.servers || []);
      setError("");
    } catch {
      setError("Failed to load servers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/admin/vpn/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const json = await res.json();
      const summary = json.results
        .map(
          (r: { server: string; synced: number; errors: number }) =>
            `${r.server}: ${r.synced} synced, ${r.errors} errors`
        )
        .join(" | ");
      setSyncResult(summary);
      fetchServers();
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
          VPN Servers
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {syncing ? "Syncing..." : "Sync Marzban"}
          </button>
          <button
            onClick={fetchServers}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {syncResult && (
        <div className="mb-4 p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-lg text-accent-teal text-sm">
          {syncResult}
        </div>
      )}

      <HealthMonitor />

      {loading ? (
        <AdminLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((srv) => (
            <ServerCard key={srv.id} server={srv} />
          ))}
          {servers.length === 0 && (
            <p className="col-span-full text-center text-text-muted py-8">
              No servers found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
