"use client";

import { useState, useEffect, useRef } from "react";

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
  usersOnline?: number | null;
  usersTotal?: number | null;
  onEdit?: (id: string) => void;
  onTest?: (id: string) => void;
  onToggleActive?: (id: string, currentlyActive: boolean) => void;
  onDelete?: (id: string) => void;
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

export function ServerCard({
  server,
  usersOnline,
  usersTotal,
  onEdit,
  onTest,
  onToggleActive,
  onDelete,
}: ServerCardProps) {
  const flag = countryFlag(server.country_code);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
        <div className="flex items-center gap-2">
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

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded hover:bg-overlay/5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-bg-primary border border-overlay/10 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(server.id);
                  }}
                  className="px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors w-full text-left"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onTest?.(server.id);
                  }}
                  className="px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors w-full text-left"
                >
                  Test Connection
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleActive?.(server.id, server.is_active);
                  }}
                  className="px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors w-full text-left"
                >
                  {server.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(server.id);
                  }}
                  className="px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors w-full text-left"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
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

      {/* Users */}
      {usersTotal !== null && usersTotal !== undefined && (
        <div className="flex items-center justify-between text-xs text-text-muted mb-3">
          <span>Users</span>
          <span className="text-text-primary">
            <span className="text-green-400">{usersOnline ?? 0} online</span>
            {" / "}
            {usersTotal} total
          </span>
        </div>
      )}

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
