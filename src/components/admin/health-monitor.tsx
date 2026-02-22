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

const flagEmoji: Record<string, string> = {
  DE: "\u{1F1E9}\u{1F1EA}",
  RU: "\u{1F1F7}\u{1F1FA}",
  CH: "\u{1F1E8}\u{1F1ED}",
  GB: "\u{1F1EC}\u{1F1E7}",
  US: "\u{1F1FA}\u{1F1F8}",
};

const statusColors: Record<string, { dot: string; text: string }> = {
  healthy: { dot: "bg-green-500", text: "text-green-400" },
  degraded: { dot: "bg-yellow-500", text: "text-yellow-400" },
  down: { dot: "bg-red-500", text: "text-red-400" },
  no_agent: { dot: "bg-yellow-500/60", text: "text-yellow-400/60" },
};

function formatMs(ms: number | null): string {
  if (ms === null) return "---";
  return `${ms}ms`;
}

export function HealthMonitor() {
  const [servers, setServers] = useState<HealthResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  return (
    <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Health Monitor</span>
          {loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
              autoRefresh
                ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
                : "border-overlay/10 text-text-muted hover:text-text-primary hover:bg-overlay/5"
            }`}
          >
            Auto: {autoRefresh ? "60s" : "off"}
          </button>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-2 py-1 text-[10px] border border-overlay/10 rounded text-text-muted hover:text-text-primary hover:bg-overlay/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Server pills */}
      <div className="flex flex-wrap gap-3">
        {servers.map((s) => {
          const colors = statusColors[s.status] || statusColors.down;
          const flag = flagEmoji[s.country_code] || s.country_code;
          const isHovered = hoveredId === s.server_id;

          return (
            <div
              key={s.server_id}
              className="relative flex flex-col items-center gap-1 cursor-default"
              onMouseEnter={() => setHoveredId(s.server_id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${colors.dot} ${s.status === "down" ? "animate-pulse" : ""}`} />
                <span className="text-sm">{flag}</span>
                <span className={`text-xs font-medium ${colors.text}`}>{s.country_code}</span>
              </div>
              <span className="text-[10px] text-text-muted tabular-nums">{formatMs(s.latency_ms)}</span>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-10 bg-bg-primary border border-overlay/20 rounded-lg p-3 shadow-lg min-w-[180px]">
                  <p className="text-xs font-medium text-text-primary mb-1">{s.name}</p>
                  <p className="text-[10px] text-text-muted mb-1">{s.ip_address}</p>
                  {s.marzban && (
                    <div className="space-y-0.5 text-[10px]">
                      <p className="text-text-muted">
                        Users: <span className="text-text-primary">{s.marzban.total_users}</span>{" "}
                        ({s.marzban.users_active} online)
                      </p>
                      {s.marzban.cpu_usage !== null && (
                        <p className="text-text-muted">
                          CPU: <span className="text-text-primary">{s.marzban.cpu_usage.toFixed(0)}%</span>
                        </p>
                      )}
                    </div>
                  )}
                  {s.status === "no_agent" && (
                    <p className="text-[10px] text-yellow-400/60">No monitoring agent</p>
                  )}
                  {s.error && (
                    <p className="text-[10px] text-red-400 mt-1">{s.error}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timestamp */}
      {checkedAt && (
        <p className="text-[10px] text-text-muted mt-2">
          Last checked: {formatTime(checkedAt)}
        </p>
      )}
    </div>
  );
}
