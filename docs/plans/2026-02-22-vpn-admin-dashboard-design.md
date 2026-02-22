# VPN Admin Dashboard Upgrade — Design Document

**Date:** 2026-02-22
**Author:** Roman Pochtman + Claude
**Status:** Approved

---

## 1. Problem Statement

The current Admin > VPN Users tab connects to a single Marzban instance (Germany) and shows:
- System stats: CPU, RAM, bandwidth, online count
- Flat user table: username, status, traffic, expiry, last online

**What's missing:**
- No visibility into 4 of 5 servers (Russia, Switzerland, UK, USA)
- No protocol breakdown (WireGuard vs Marzban/VLESS vs UDP)
- No user segmentation (iOS app, Android app, Telegram bot)
- No way to drill into a specific server's users
- WireGuard and UDP connections (app users) invisible in admin panel
- Russia Marzban (45.10.43.204:8000) disconnected from codebase

**Goal:** Unified view where the VPN tab shows all 5 servers, their health, user counts by category, with drill-down to filtered user tables.

---

## 2. Infrastructure Context

### Servers (from `vpn_servers` table)

| Server | IP | Protocol(s) | Marzban |
|--------|-----|-------------|---------|
| Germany WireGuard | 72.61.87.54 | wireguard | Yes (:9090) |
| Russia 1 | 45.10.43.204 | wireguard | Yes (:8000) |
| Switzerland (Zurich) | 82.38.64.45 | udp | No |
| UK (London) | 82.26.193.110 | udp | No |
| USA (New York) | 82.38.68.15 | udp | No |

### Current Architecture

- **Marzban** (DE only in code) — manages VLESS/Shadowsocks/Trojan users (Telegram subscription)
- **WireGuard API** (`/api/vpn/connect`, `/disconnect`, `/servers`) — serves iOS/Android app users
- **Supabase** — `accounts`, `device_sessions`, `telegram_links` tables (disconnected from VPN backends)
- **Two systems, no unified view**

### Chosen Approach: Backend Aggregator API

Single API route queries all backends in parallel, merges results, returns unified response. Frontend stays simple.

---

## 3. Database Schema

### New Table: `vpn_users`

Maps every VPN user to their platform, protocol, and server.

```sql
CREATE TABLE vpn_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to Supabase account (nullable — Marzban-only users may not have one)
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

  -- Server reference
  server_id UUID NOT NULL REFERENCES vpn_servers(id),

  -- Identity on the VPN backend
  backend_username TEXT NOT NULL,        -- Marzban username or WireGuard peer ID
  backend_type TEXT NOT NULL,            -- 'marzban' | 'wireguard' | 'udp'

  -- Segmentation
  platform TEXT NOT NULL,                -- 'ios' | 'android' | 'telegram' | 'desktop' | 'unknown'
  protocol TEXT NOT NULL,                -- 'vless' | 'shadowsocks' | 'trojan' | 'wireguard' | 'udp'

  -- Status (synced from backend or set manually)
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'disabled' | 'expired' | 'limited'

  -- Traffic & limits (cached from backend)
  used_traffic_bytes BIGINT DEFAULT 0,
  data_limit_bytes BIGINT,              -- null = unlimited
  expires_at TIMESTAMPTZ,               -- null = never
  last_online_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicates: one backend user per server
  UNIQUE(server_id, backend_username, backend_type)
);

-- Indexes for dashboard queries
CREATE INDEX idx_vpn_users_server ON vpn_users(server_id);
CREATE INDEX idx_vpn_users_platform ON vpn_users(platform);
CREATE INDEX idx_vpn_users_status ON vpn_users(status);
```

### Design Decisions

- `account_id` is nullable — existing Marzban users may not map to a Supabase account
- `backend_type` determines which API to call for CRUD operations
- Traffic data is cached here; source of truth remains the backend
- UNIQUE constraint prevents duplicate registrations per server

### Example Rows

```json
// iOS app user on Germany WireGuard
{
  "account_id": "abc-123",
  "server_id": "e462c96b-...",
  "backend_username": "peer_abc123",
  "backend_type": "wireguard",
  "platform": "ios",
  "protocol": "wireguard",
  "status": "active"
}

// Telegram user on Germany Marzban
{
  "account_id": null,
  "server_id": "e462c96b-...",
  "backend_username": "roman_tg",
  "backend_type": "marzban",
  "platform": "telegram",
  "protocol": "vless",
  "status": "active"
}
```

---

## 4. API Design

### 4a. `GET /api/admin/vpn/overview`

Returns all servers with live stats + aggregated user counts.

```typescript
interface VpnOverviewResponse {
  servers: ServerOverview[];
  totals: {
    total_users: number;
    online_users: number;
    by_platform: Record<string, number>;  // { ios: 42, android: 38, telegram: 120 }
    by_protocol: Record<string, number>;  // { wireguard: 80, vless: 95, udp: 25 }
  };
}

interface ServerOverview {
  id: string;
  name: string;
  country: string;
  country_code: string;
  ip_address: string;
  protocols: string[];           // ["wireguard", "marzban"] or ["udp"]

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
```

**Backend logic:**
1. Fetch all servers from `vpn_servers`
2. In parallel: Marzban DE system stats, Marzban RU system stats, `vpn_users` aggregation
3. If a Marzban instance is unreachable, `live: null` for that server
4. Merge and return

### 4b. `GET /api/admin/vpn/users`

Paginated, filterable user list.

**Query params:** `server_id`, `platform`, `protocol`, `status`, `search`, `offset`, `limit`

```typescript
interface VpnUsersResponse {
  users: VpnUserRow[];
  total: number;
  filters: {
    server_id: string | null;
    platform: string | null;
    protocol: string | null;
    status: string | null;
  };
}

interface VpnUserRow {
  id: string;
  backend_username: string;
  backend_type: string;
  platform: string;
  protocol: string;
  status: string;
  server_name: string;
  server_country_code: string;
  used_traffic_bytes: number;
  data_limit_bytes: number | null;
  expires_at: string | null;
  last_online_at: string | null;
  account_id: string | null;
}
```

### 4c. `GET /api/admin/vpn/users/:id`

Enhanced user detail. Fetches live data from the appropriate backend based on `backend_type`.

### 4d. `POST /api/admin/vpn/sync`

Backfills existing Marzban users into `vpn_users`. Fetches all users from both Marzban instances, inserts missing rows with `platform=unknown`.

---

## 5. Multi-Server Marzban Configuration

### Environment Variables

Replace single-server config with multi-server:

```env
# Germany Marzban
MARZBAN_DE_API_URL=http://72.61.87.54:9090/marzban-api
MARZBAN_DE_ADMIN_USER=admin
MARZBAN_DE_ADMIN_PASS=<from-env>
MARZBAN_DE_API_KEY=<from-env>
MARZBAN_DE_SERVER_ID=e462c96b-af8b-4f09-b989-3ad9aec63413

# Russia Marzban
MARZBAN_RU_API_URL=http://45.10.43.204:8000/marzban-api
MARZBAN_RU_ADMIN_USER=admin
MARZBAN_RU_ADMIN_PASS=<from-env>
MARZBAN_RU_API_KEY=<from-env>
MARZBAN_RU_SERVER_ID=078dadc9-871a-4d56-aa7a-f6ec6296bd59
```

### Marzban Library Update

Refactor `src/lib/marzban.ts` from single-instance to multi-instance:

```typescript
// Current: hardcoded single instance
getMarzbanToken() → single token
marzbanFetch(path) → single base URL

// New: instance-aware
getMarzbanClient(serverId: string) → { token, fetch, getSystem, getUsers, ... }
```

Server-to-Marzban mapping stored as a config map derived from env vars.

---

## 6. UI Structure

### Component Hierarchy

```
vpn/page.tsx (Server Overview — default view)
├── VpnOverviewHeader
│   ├── Title + Refresh button
│   └── Global totals (total users, online, platform badges)
│
├── ServerGrid
│   └── ServerCard (clickable → navigates to filtered users)
│       ├── Country flag + name + status indicator
│       ├── Live stats (CPU, RAM, bandwidth) — when available
│       ├── User count badges: iOS | Android | Telegram
│       └── Protocol tags
│
└── "View All Users" button

vpn/users/page.tsx (Filtered Users Table)
├── FilterBar (server, platform, protocol, status, search)
├── UsersTable (paginated)
│   └── Columns: Username, Server, Platform, Protocol, Status, Traffic, Expires, Last Online
└── Pagination

vpn/users/[id]/page.tsx (User Detail — enhanced existing)
```

### Component Files (`src/components/admin/`)

| File | Purpose |
|------|---------|
| `vpn-overview-header.tsx` | Title, refresh, global totals |
| `server-card.tsx` | Individual server card |
| `server-grid.tsx` | Grid layout of cards |
| `vpn-filter-bar.tsx` | Filter dropdowns + search |
| `vpn-users-table.tsx` | Paginated users table |

### State Management

- Plain React `useState` + URL search params for filters
- No global store — VPN tab is self-contained
- Filters in URL params (`?server_id=...&platform=ios`) so server card links work naturally
- Manual refresh button triggers re-fetch

### Navigation Flow

1. **Sidebar → VPN Users** → Server overview grid (default)
2. **Click server card** → Users table pre-filtered to that server
3. **Click "View All Users"** → Users table, no filters
4. **Click user row** → User detail page

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│ VPN Users                                    [↻ Refresh] │
│ 200 total · 45 online · iOS: 42 · Android: 38 · TG: 120 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ DE Germany   │  │ RU Russia    │  │ CH Switzerland│   │
│  │ ● Online     │  │ ● Online     │  │ ● Online     │   │
│  │ CPU 12% RAM 4G│ │ CPU 8% RAM 2G│  │              │   │
│  │ ↓3.2GB ↑1.1GB│  │ ↓1.8GB ↑0.6GB│  │              │   │
│  │──────────────│  │──────────────│  │──────────────│   │
│  │ iOS: 20      │  │ iOS: 12      │  │ iOS: 5       │   │
│  │ Android: 15  │  │ Android: 10  │  │ Android: 8   │   │
│  │ Telegram: 50 │  │ Telegram: 40 │  │              │   │
│  │──────────────│  │──────────────│  │──────────────│   │
│  │ WG · VLESS   │  │ WG · VLESS   │  │ UDP          │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │ GB UK London │  │ US USA NY   │  [View All Users →]   │
│  │ ● Online     │  │ ● Online     │                      │
│  │ iOS: 3       │  │ iOS: 2       │                      │
│  │ Android: 4   │  │ Android: 1   │                      │
│  │──────────────│  │──────────────│                      │
│  │ UDP          │  │ UDP          │                      │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Multi-backend latency | `Promise.allSettled` — all backends queried in parallel. Unreachable servers don't block. |
| Large user base | Pagination (50/page). Aggregated counts use SQL `COUNT(*)`, not array length. |
| Supabase query speed | Indexed on `server_id`, `platform`, `status`. JOIN to `vpn_servers` for names. |
| Marzban rate limits | Manual refresh only — no polling. Admin panel has 1-2 viewers. |
| Future caching | Optional 60-second in-memory cache in API route if Marzban becomes slow. |

---

## 8. Edge Cases

| Scenario | Handling |
|----------|----------|
| Same user on multiple servers | Separate `vpn_users` rows per server. Table shows server name per row. |
| Same person via Telegram + WireGuard | Two rows: `platform=telegram, backend_type=marzban` + `platform=ios, backend_type=wireguard`. Linked via `account_id`. |
| Marzban server unreachable | Server card shows "Offline" badge, `live: null`. User counts from Supabase still display. |
| Stale traffic data | `vpn_users` caches traffic. User detail fetches live data from backend. Sync endpoint refreshes cache. |
| Existing Marzban users not in vpn_users | Sync endpoint backfills with `platform=unknown`. Admin can re-tag. |
| User created via Telegram bot | Bot inserts `vpn_users` row with `platform=telegram` at creation. |
| User created via iOS/Android app | App connect flow inserts `vpn_users` row with appropriate platform. |
| Multi-device (same account) | Separate `vpn_users` rows per device/platform. Totals count each device. |

---

## 9. Data Sync Strategy

### Initial Rollout

1. Create `vpn_users` table via Supabase migration
2. Run `POST /api/admin/vpn/sync` to backfill existing Marzban users (DE + RU)
3. Backfilled users get `platform=unknown` — admin can re-tag
4. Going forward, all creation flows (bot, app, admin) insert into `vpn_users` at creation time

### No Background Sync Needed

Data is written at the source. The `vpn_users` table is kept current by the creation/deletion flows themselves. The sync endpoint exists for reconciliation if drift occurs.

---

## 10. Files to Create/Modify

### New Files
- `src/app/api/admin/vpn/overview/route.ts` — aggregated server overview
- `src/app/api/admin/vpn/users/route.ts` — filtered users list (new endpoint)
- `src/app/api/admin/vpn/users/[id]/route.ts` — enhanced user detail
- `src/app/api/admin/vpn/sync/route.ts` — backfill/reconciliation
- `src/app/admin-dvpn/(dashboard)/vpn/users/page.tsx` — filtered users table page
- `src/app/admin-dvpn/(dashboard)/vpn/users/[id]/page.tsx` — user detail page (moved)
- `src/components/admin/vpn-overview-header.tsx`
- `src/components/admin/server-card.tsx`
- `src/components/admin/server-grid.tsx`
- `src/components/admin/vpn-filter-bar.tsx`
- `src/components/admin/vpn-users-table.tsx`

### Modified Files
- `src/lib/marzban.ts` — refactor to multi-instance
- `src/app/admin-dvpn/(dashboard)/vpn/page.tsx` — replace with server overview
- `.env.local` — add Marzban RU credentials
