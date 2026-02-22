"use client";

import Link from "next/link";

interface ServerCardProps {
  server: {
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
  };
}

const flagEmoji: Record<string, string> = {
  DE: "\u{1F1E9}\u{1F1EA}",
  RU: "\u{1F1F7}\u{1F1FA}",
  CH: "\u{1F1E8}\u{1F1ED}",
  GB: "\u{1F1EC}\u{1F1E7}",
  US: "\u{1F1FA}\u{1F1F8}",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const protocolLabels: Record<string, string> = {
  wireguard: "WG",
  marzban: "VLESS",
  udp: "UDP",
  vless: "VLESS",
  shadowsocks: "SS",
  trojan: "Trojan",
};

const platformLabels: Record<string, { label: string; color: string }> = {
  ios: { label: "iOS", color: "text-blue-400" },
  android: { label: "Android", color: "text-green-400" },
  telegram: { label: "TG", color: "text-sky-400" },
  desktop: { label: "Desktop", color: "text-purple-400" },
  unknown: { label: "Other", color: "text-text-muted" },
};

export function ServerCard({ server }: ServerCardProps) {
  const flag = flagEmoji[server.country_code] || server.country_code;
  const isOnline = server.is_active && (server.live !== null || !server.protocols.includes("marzban"));

  return (
    <Link
      href={`/admin-dvpn/vpn/users?server_id=${server.id}`}
      className="block bg-bg-secondary border border-overlay/10 rounded-xl p-5 hover:border-accent-teal/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <h3 className="text-sm font-medium text-text-primary">{server.name}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`text-xs ${isOnline ? "text-green-400" : "text-red-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Live stats (Marzban servers only) */}
      {server.live && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-text-muted">
          {server.live.cpu_usage !== null && (
            <div>
              CPU <span className="text-text-primary">{server.live.cpu_usage.toFixed(0)}%</span>
            </div>
          )}
          {server.live.mem_used !== null && server.live.mem_total !== null && (
            <div>
              RAM{" "}
              <span className="text-text-primary">
                {formatBytes(server.live.mem_used)}
              </span>
            </div>
          )}
          <div>
            <span className="text-text-muted">&#8595;</span>{" "}
            <span className="text-text-primary">{formatBytes(server.live.bandwidth_in)}</span>
          </div>
          <div>
            <span className="text-text-muted">&#8593;</span>{" "}
            <span className="text-text-primary">{formatBytes(server.live.bandwidth_out)}</span>
          </div>
        </div>
      )}

      {/* User counts by platform */}
      <div className="space-y-1 mb-3">
        {Object.entries(server.user_counts.by_platform).length > 0 ? (
          Object.entries(server.user_counts.by_platform).map(([platform, count]) => {
            const info = platformLabels[platform] || platformLabels.unknown;
            return (
              <div key={platform} className="flex items-center justify-between text-xs">
                <span className={info.color}>{info.label}</span>
                <span className="text-text-primary font-medium">{count}</span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-text-muted">No users synced</p>
        )}
      </div>

      {/* Protocol tags */}
      <div className="flex gap-1.5 flex-wrap">
        {server.protocols.map((p) => (
          <span
            key={p}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-overlay/5 border border-overlay/10 text-text-muted"
          >
            {protocolLabels[p] || p}
          </span>
        ))}
      </div>

      {/* Total footer */}
      <div className="mt-3 pt-3 border-t border-overlay/5 flex items-center justify-between text-xs">
        <span className="text-text-muted">Total users</span>
        <span className="text-text-primary font-semibold">{server.user_counts.total}</span>
      </div>
    </Link>
  );
}
