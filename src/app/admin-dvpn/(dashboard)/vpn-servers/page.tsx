"use client";

import { useEffect, useState, useCallback } from "react";
import { ServerCard } from "@/components/admin/server-card";
import { ServerModal } from "@/components/admin/server-modal";
import { DeleteConfirmModal } from "@/components/admin/delete-confirm-modal";
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

interface HealthData {
  server_id: string;
  marzban: {
    users_active: number;
    total_users: number;
  } | null;
}

export default function VpnServersPage() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [healthMap, setHealthMap] = useState<Map<string, HealthData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editServerId, setEditServerId] = useState<string | undefined>();
  const [deleteServerId, setDeleteServerId] = useState<string | null>(null);
  const [deleteServerName, setDeleteServerName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Toast for test results & toggle
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const [srvRes, healthRes] = await Promise.all([
        fetch("/api/admin/vpn/servers"),
        fetch("/api/admin/vpn/health"),
      ]);
      if (!srvRes.ok) throw new Error("Failed to fetch servers");
      const srvJson = await srvRes.json();
      setServers(srvJson.servers || []);

      if (healthRes.ok) {
        const healthJson = await healthRes.json();
        const map = new Map<string, HealthData>();
        for (const h of healthJson.servers || []) {
          map.set(h.server_id, h);
        }
        setHealthMap(map);
      }
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

  function handleEdit(id: string) {
    setEditServerId(id);
    setModalMode("edit");
  }

  async function handleTest(id: string) {
    setToast({ message: "Testing connection...", type: "success" });
    try {
      const res = await fetch(`/api/admin/vpn/servers/${id}/test`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.status === "ok") {
        setToast({ message: `Connected (${json.latency_ms}ms)`, type: "success" });
      } else {
        setToast({ message: json.error || "Connection failed", type: "error" });
      }
    } catch {
      setToast({ message: "Test request failed", type: "error" });
    }
  }

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    try {
      const res = await fetch(`/api/admin/vpn/servers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setToast({
        message: `Server ${currentlyActive ? "deactivated" : "activated"}`,
        type: "success",
      });
      fetchServers();
    } catch {
      setToast({ message: "Failed to toggle server status", type: "error" });
    }
  }

  function handleDeleteClick(id: string) {
    const srv = servers.find((s) => s.id === id);
    setDeleteServerId(id);
    setDeleteServerName(srv?.name || "this server");
  }

  async function handleDeleteConfirm() {
    if (!deleteServerId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vpn/servers/${deleteServerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteServerId(null);
      setToast({ message: "Server deleted", type: "success" });
      fetchServers();
    } catch {
      setToast({ message: "Failed to delete server", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  function handleModalSaved() {
    setModalMode(null);
    setEditServerId(undefined);
    fetchServers();
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
            onClick={() => {
              setEditServerId(undefined);
              setModalMode("create");
            }}
            className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer"
          >
            Add Server
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Marzban"}
          </button>
          <button
            onClick={fetchServers}
            className="px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            toast.type === "success"
              ? "bg-accent-teal/10 border border-accent-teal/20 text-accent-teal"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

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
          {servers.map((srv) => {
            const health = healthMap.get(srv.id);
            return (
              <ServerCard
                key={srv.id}
                server={srv}
                usersOnline={health?.marzban?.users_active ?? null}
                usersTotal={health?.marzban?.total_users ?? null}
                onEdit={handleEdit}
                onTest={handleTest}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
              />
            );
          })}
          {servers.length === 0 && (
            <p className="col-span-full text-center text-text-muted py-8">
              No servers found
            </p>
          )}
        </div>
      )}

      {/* Server Modal */}
      {modalMode && (
        <ServerModal
          mode={modalMode}
          serverId={editServerId}
          onClose={() => {
            setModalMode(null);
            setEditServerId(undefined);
          }}
          onSaved={handleModalSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteServerId && (
        <DeleteConfirmModal
          title="Delete Server"
          message={`Are you sure you want to delete "${deleteServerName}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteServerId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
