"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface HealthResult {
  server_id: string;
  name: string;
  country_code: string;
  ip_address: string;
  status: "healthy" | "degraded" | "down" | "no_agent";
  latency_ms: number | null;
  marzban: {
    cpu_usage: number | null;
    mem_used: number | null;
    mem_total: number | null;
    users_active: number;
    total_users: number;
    bandwidth_in: number;
    bandwidth_out: number;
  } | null;
  error: string | null;
}

/** Convert country code (e.g. "US", "US2", "DE2") to flag emoji using first 2 chars */
function countryFlag(code: string): string {
  const base = code.slice(0, 2).toUpperCase();
  if (base.length < 2 || !/^[A-Z]{2}$/.test(base)) return code;
  return String.fromCodePoint(
    ...Array.from(base).map((c) => c.codePointAt(0)! - 0x41 + 0x1f1e6),
  );
}

const statusConfig: Record<string, { dot: string; text: string; bg: string; border: string; label: string }> = {
  healthy: { dot: "bg-green-500", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Healthy" },
  degraded: { dot: "bg-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Degraded" },
  down: { dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Down" },
  no_agent: { dot: "bg-yellow-500/60", text: "text-yellow-400/60", bg: "bg-yellow-500/5", border: "border-yellow-500/10", label: "No Agent" },
};

function formatMs(ms: number | null): string {
  if (ms === null) return "---";
  return `${ms}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function HealthMonitor() {
  const [servers, setServers] = useState<HealthResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vpn/health");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setServers(data.servers);
      setCheckedAt(data.checked_at);
    } catch {
      // Keep stale data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealth, 60_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchHealth]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" }) + " UTC";
  };

  const healthyCount = servers.filter((s) => s.status === "healthy").length;
  const degradedCount = servers.filter((s) => s.status === "degraded").length;
  const downCount = servers.filter((s) => s.status === "down").length;
  const totalUsers = servers.reduce((sum, s) => sum + (s.marzban?.total_users ?? 0), 0);
  const activeUsers = servers.reduce((sum, s) => sum + (s.marzban?.users_active ?? 0), 0);

  return (
    <div className="bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden mb-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-overlay/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${downCount > 0 ? "bg-red-500 animate-pulse" : degradedCount > 0 ? "bg-yellow-500" : "bg-green-500"}`} />
            <h3 className="text-sm font-semibold text-text-primary">Health Monitor</h3>
          </div>
          {loading && (
            <svg className="w-3.5 h-3.5 text-accent-teal animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-2">
          {checkedAt && (
            <span className="text-[11px] text-text-muted tabular-nums">
              {formatTime(checkedAt)}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
              autoRefresh
                ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
                : "border-overlay/10 text-text-muted hover:text-text-primary hover:bg-overlay/5"
            }`}
          >
            {autoRefresh ? "Auto 60s" : "Auto off"}
          </button>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-2.5 py-1 text-[11px] font-medium border border-overlay/10 rounded-md text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Check
          </button>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-overlay/5">
        <div className="bg-bg-secondary px-4 py-3 text-center">
          <p className="text-lg font-bold text-text-primary tabular-nums">{servers.length}</p>
          <p className="text-[11px] text-text-muted">Servers</p>
        </div>
        <div className="bg-bg-secondary px-4 py-3 text-center">
          <p className="text-lg font-bold text-green-400 tabular-nums">{healthyCount}</p>
          <p className="text-[11px] text-text-muted">Online</p>
        </div>
        <div className="bg-bg-secondary px-4 py-3 text-center">
          <p className="text-lg font-bold text-text-primary tabular-nums">{totalUsers}</p>
          <p className="text-[11px] text-text-muted">Total Users</p>
        </div>
        <div className="bg-bg-secondary px-4 py-3 text-center">
          <p className="text-lg font-bold text-accent-teal tabular-nums">{activeUsers}</p>
          <p className="text-[11px] text-text-muted">Active Now</p>
        </div>
      </div>

      {/* Server rows */}
      <div className="divide-y divide-overlay/5">
        {servers.map((s) => {
          const config = statusConfig[s.status] || statusConfig.down;
          const flag = countryFlag(s.country_code);
          const isExpanded = expandedId === s.server_id;
          const memPercent = s.marzban?.mem_used && s.marzban?.mem_total
            ? Math.round((s.marzban.mem_used / s.marzban.mem_total) * 100)
            : null;

          return (
            <div key={s.server_id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : s.server_id)}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-overlay/5 transition-colors cursor-pointer text-start"
              >
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot} ${s.status === "down" ? "animate-pulse" : ""}`} />

                {/* Flag + name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base">{flag}</span>
                  <span className="text-sm font-medium text-text-primary truncate">{s.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.border} border ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-4 text-[11px] text-text-muted tabular-nums shrink-0">
                  {s.marzban && (
                    <span>
                      <span className="text-text-primary">{s.marzban.users_active}</span>/{s.marzban.total_users} users
                    </span>
                  )}
                  <span className={s.latency_ms !== null && s.latency_ms > 500 ? "text-yellow-400" : s.latency_ms !== null && s.latency_ms > 1000 ? "text-red-400" : ""}>
                    {formatMs(s.latency_ms)}
                  </span>
                </div>

                {/* Expand chevron */}
                <svg
                  className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-bg-primary/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* IP */}
                    <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-overlay/5">
                      <p className="text-[10px] text-text-muted mb-0.5">IP Address</p>
                      <p className="text-xs text-text-primary font-mono">{s.ip_address}</p>
                    </div>
                    {/* Latency */}
                    <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-overlay/5">
                      <p className="text-[10px] text-text-muted mb-0.5">Latency</p>
                      <p className={`text-xs font-medium tabular-nums ${s.latency_ms !== null && s.latency_ms > 500 ? "text-yellow-400" : "text-text-primary"}`}>
                        {formatMs(s.latency_ms)}
                      </p>
                    </div>
                    {/* CPU */}
                    {s.marzban?.cpu_usage !== null && s.marzban?.cpu_usage !== undefined && (
                      <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-overlay/5">
                        <p className="text-[10px] text-text-muted mb-0.5">CPU Usage</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-medium tabular-nums ${(s.marzban.cpu_usage ?? 0) > 80 ? "text-red-400" : (s.marzban.cpu_usage ?? 0) > 50 ? "text-yellow-400" : "text-text-primary"}`}>
                            {s.marzban.cpu_usage?.toFixed(0)}%
                          </p>
                          <div className="flex-1 h-1.5 bg-overlay/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${(s.marzban.cpu_usage ?? 0) > 80 ? "bg-red-500" : (s.marzban.cpu_usage ?? 0) > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(s.marzban.cpu_usage ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Memory */}
                    {memPercent !== null && s.marzban && (
                      <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-overlay/5">
                        <p className="text-[10px] text-text-muted mb-0.5">Memory</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-medium tabular-nums ${memPercent > 80 ? "text-red-400" : memPercent > 50 ? "text-yellow-400" : "text-text-primary"}`}>
                            {memPercent}%
                          </p>
                          <div className="flex-1 h-1.5 bg-overlay/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${memPercent > 80 ? "bg-red-500" : memPercent > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(memPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {formatBytes(s.marzban.mem_used ?? 0)} / {formatBytes(s.marzban.mem_total ?? 0)}
                        </p>
                      </div>
                    )}
                    {/* Bandwidth */}
                    {s.marzban && (s.marzban.bandwidth_in > 0 || s.marzban.bandwidth_out > 0) && (
                      <div className="bg-bg-secondary rounded-lg px-3 py-2 border border-overlay/5 col-span-2">
                        <p className="text-[10px] text-text-muted mb-0.5">Bandwidth</p>
                        <p className="text-xs text-text-primary">
                          <span className="text-green-400">{formatBytes(s.marzban.bandwidth_in)}</span>
                          <span className="text-text-muted mx-1">in</span>
                          <span className="text-accent-teal">{formatBytes(s.marzban.bandwidth_out)}</span>
                          <span className="text-text-muted mx-1">out</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Error message */}
                  {s.error && (
                    <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-[11px] text-red-400">{s.error}</p>
                    </div>
                  )}
                  {s.status === "no_agent" && (
                    <div className="mt-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-[11px] text-yellow-400">No monitoring agent installed on this server</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {servers.length === 0 && !loading && (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-text-muted">No health data available</p>
        </div>
      )}
    </div>
  );
}
