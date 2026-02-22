"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ServerCard } from "@/components/admin/server-card";

interface ServerOverview {
  id: string;
  name: string;
  country: string;
  country_code: string;
  ip_address: string;
  protocols: string[];
  is_active: boolean;
  live: {
    cpu_usage: number | null;
    mem_used: number | null;
    mem_total: number | null;
    online_users: number;
    bandwidth_in: number;
    bandwidth_out: number;
  } | null;
  user_counts: {
    total: number;
    active: number;
    by_platform: Record<string, number>;
    by_protocol: Record<string, number>;
  };
}

interface OverviewData {
  servers: ServerOverview[];
  totals: {
    total_users: number;
    online_users: number;
    by_platform: Record<string, number>;
    by_protocol: Record<string, number>;
  };
}

const platformColors: Record<string, string> = {
  ios: "text-blue-400",
  android: "text-green-400",
  telegram: "text-sky-400",
  desktop: "text-purple-400",
  unknown: "text-text-muted",
};

const platformLabels: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  telegram: "Telegram",
  desktop: "Desktop",
  unknown: "Other",
};

export default function VpnOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vpn/overview");
      if (!res.ok) throw new Error("Failed to fetch overview");
      const json = await res.json();
      setData(json);
      setError("");
    } catch {
      setError("Failed to load VPN overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/admin/vpn/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const json = await res.json();
      const summary = json.results
        .map((r: { server: string; synced: number; errors: number }) => `${r.server}: ${r.synced} synced, ${r.errors} errors`)
        .join(" | ");
      setSyncResult(summary);
      fetchData(); // refresh after sync
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">VPN Servers</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {syncing ? "Syncing..." : "Sync Marzban"}
          </button>
          <button
            onClick={fetchData}
            className="px-3 py-2 text-xs border border-overlay/10 rounded-lg text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

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

      {/* Global totals */}
      {data && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="px-3 py-1.5 bg-bg-secondary border border-overlay/10 rounded-lg text-sm">
            <span className="text-text-muted">Total: </span>
            <span className="text-text-primary font-semibold">{data.totals.total_users}</span>
          </div>
          <div className="px-3 py-1.5 bg-bg-secondary border border-overlay/10 rounded-lg text-sm">
            <span className="text-text-muted">Online: </span>
            <span className="text-green-400 font-semibold">{data.totals.online_users}</span>
          </div>
          {Object.entries(data.totals.by_platform).map(([platform, count]) => (
            <span
              key={platform}
              className={`text-sm ${platformColors[platform] || platformColors.unknown}`}
            >
              {platformLabels[platform] || platform}: <span className="font-semibold">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Server grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {data.servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      {/* View all link */}
      <div className="flex justify-center">
        <Link
          href="/admin-dvpn/vpn/users"
          className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors"
        >
          View All Users
        </Link>
      </div>
    </div>
  );
}
