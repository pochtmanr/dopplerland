# VPN Users Page Redesign

**Date:** 2026-03-02
**Status:** Approved

## Problem

The VPN Users admin page is a plain table with filters. No summary stats, no at-a-glance view of system health or growth. Admin has to mentally aggregate data from the table.

## Design

### Layout (top to bottom)

#### 1. Stats Cards Row

5 compact cards in a responsive horizontal row (`grid-cols-2 sm:grid-cols-5`):

| Card | Primary Value | Secondary |
|------|--------------|-----------|
| Total Users | count | `+N today` (green if > 0) |
| Active | count | green accent |
| Expired | count | red accent |
| Total Traffic | formatted bytes | across all servers |
| Online Now | count | green pulse dot, from health API |

#### 2. Breakdown Row

3 sections side-by-side (`grid-cols-1 sm:grid-cols-3`):

- **By Platform** — horizontal mini-bars showing count per platform (Telegram, iOS, Unknown)
- **By Server** — horizontal mini-bars showing user count per server with flag emoji
- **New Users (14d)** — SVG sparkline, ~60px tall, last 14 days, no external chart library

#### 3. Table

Existing table with filters preserved as-is. No changes to table structure.

### New API Endpoint

`GET /api/admin/vpn/stats` returns:

```json
{
  "totals": {
    "total": 30,
    "active": 5,
    "expired": 24,
    "limited": 1,
    "disabled": 0,
    "total_traffic_bytes": 25705899034,
    "new_today": 7
  },
  "by_platform": [
    { "platform": "telegram", "count": 25 },
    { "platform": "ios", "count": 5 }
  ],
  "by_server": [
    { "server_id": "...", "name": "Germany", "country_code": "DE", "count": 27 },
    ...
  ],
  "new_users_daily": [
    { "day": "2026-02-17", "count": 0 },
    { "day": "2026-02-18", "count": 3 },
    ...
  ]
}
```

Single SQL query with aggregations. Uses service-role client (adminClient) to bypass RLS.

### Platform Detection Fix

In Marzban sync (`/api/admin/vpn/sync`) and display logic:
- `ios_` prefix on backend_username -> platform `"ios"`
- `tg_` prefix -> platform `"telegram"` (already done)
- else -> `"unknown"`

### Data Flow

Page makes 3 parallel fetches on mount:
1. `GET /api/admin/vpn/stats` -> stats cards + breakdown + sparkline
2. `GET /api/admin/vpn/users?offset=0&limit=50` -> table data
3. `GET /api/admin/vpn/health` -> online now count

### Files to Create/Modify

1. **Create** `src/app/api/admin/vpn/stats/route.ts` — new stats endpoint
2. **Modify** `src/app/admin-dvpn/(dashboard)/vpn-users/page.tsx` — add stats section above table
3. **Create** `src/components/admin/vpn-stats.tsx` — stats cards + breakdown + sparkline component
4. **Modify** `src/app/api/admin/vpn/sync/route.ts` — platform detection for `ios_` prefix
5. **Modify** `src/app/admin-dvpn/(dashboard)/vpn-users/page.tsx` — display platform detection in `displayPlatform()`
