"use client";

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    country: string;
    country_code: string;
    ip_address: string;
    protocol: string;
    is_active: boolean;
    has_marzban: boolean;
  };
}

/** Convert country code (e.g. "US", "US2", "DE2") to flag emoji using first 2 chars */
function countryFlag(code: string): string {
  const base = code.slice(0, 2).toUpperCase();
  if (base.length < 2 || !/^[A-Z]{2}$/.test(base)) return code;
  return String.fromCodePoint(
    ...Array.from(base).map((c) => c.codePointAt(0)! - 0x41 + 0x1f1e6),
  );
}

const protocolLabels: Record<string, string> = {
  wireguard: "WG",
  marzban: "VLESS",
  udp: "UDP",
  vless: "VLESS",
  shadowsocks: "SS",
  trojan: "Trojan",
};

export function ServerCard({ server }: ServerCardProps) {
  const flag = countryFlag(server.country_code);

  return (
    <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <h3 className="text-sm font-medium text-text-primary">
            {server.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${server.is_active ? "bg-green-500" : "bg-red-500"}`}
          />
          <span
            className={`text-xs ${server.is_active ? "text-green-400" : "text-red-400"}`}
          >
            {server.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs text-text-muted mb-3">
        <div className="flex items-center justify-between">
          <span>IP</span>
          <span className="text-text-primary font-mono">
            {server.ip_address}
          </span>
        </div>
        {server.country && (
          <div className="flex items-center justify-between">
            <span>Country</span>
            <span className="text-text-primary">{server.country}</span>
          </div>
        )}
      </div>

      {/* Protocol tags */}
      <div className="flex gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-overlay/5 border border-overlay/10 text-text-muted">
          {protocolLabels[server.protocol] || server.protocol}
        </span>
        {server.has_marzban && server.protocol !== "marzban" && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent-teal/10 border border-accent-teal/20 text-accent-teal">
            Marzban
          </span>
        )}
        {!server.has_marzban && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/60">
            No agent
          </span>
        )}
      </div>
    </div>
  );
}
