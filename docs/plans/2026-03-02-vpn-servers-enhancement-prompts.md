# VPN Servers Tab Enhancement — Agent Prompts

**Date:** 2026-03-02
**Usage:** Copy-paste each prompt into a fresh Claude Code context. Run them in order (1→2→3).

---

## Prompt 1: Backend — CRUD API Routes for VPN Servers

```
Act as a senior backend engineer. You're adding CRUD operations for VPN servers in a Next.js 15 admin panel backed by Supabase.

## Current State

The admin panel at `/admin-dvpn/vpn-servers` currently only lists servers. We need full CRUD.

### Database: `vpn_servers` table (Supabase, project ref: fzlrhmjdjjzcgstaeblu)

Columns:
- id (uuid, PK)
- name (text, NOT NULL)
- country (text, NOT NULL)
- country_code (text, NOT NULL) — e.g. "DE", "US2"
- city (text, NOT NULL)
- ip_address (text, NOT NULL)
- port (integer)
- protocol (text) — "wireguard", "vless", "tcp", etc.
- config_data (text, NOT NULL)
- is_active (boolean, default true)
- is_premium (boolean)
- load_percentage (integer)
- latency_ms (integer)
- speed_mbps (numeric)
- score (integer)
- operator (text)
- uptime_seconds (bigint)
- total_users (bigint)
- marzban_api_url (text) — if set, server has Marzban agent
- marzban_admin_user (text)
- marzban_admin_pass (text)
- marzban_api_key (text)
- created_at (timestamptz)
- updated_at (timestamptz)

RLS: Enabled. Only `service_role` policy exists (no anon/authenticated access).

### Auth Pattern

All admin routes use:
```typescript
import { requireAdmin } from "@/lib/admin-auth";

const { admin, adminClient, error } = await requireAdmin();
if (!admin) return NextResponse.json({ error }, { status: 401 });
// adminClient = service-role Supabase client (bypasses RLS)
```

### Existing route: `src/app/api/admin/vpn/servers/route.ts`
Currently only has GET. File pattern:
```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  // ... query adminClient.from("vpn_servers") ...
}
```

## Task

### 1. Add POST to `src/app/api/admin/vpn/servers/route.ts`

Create a new server. Required fields: name, country, country_code, city, ip_address. Optional: port, protocol, is_active, is_premium, marzban_api_url, marzban_admin_user, marzban_admin_pass, marzban_api_key, config_data.

Validate:
- name, country, country_code, city, ip_address are non-empty strings
- country_code is 2-4 uppercase alphanumeric chars
- ip_address matches IPv4 pattern
- port is 1-65535 if provided
- Return 400 with specific field errors on validation failure

Insert using `adminClient.from("vpn_servers").insert(...)`.

### 2. Create `src/app/api/admin/vpn/servers/[id]/route.ts`

Three methods:

**GET** — Fetch single server by ID. Return ALL fields including marzban credentials (admin-only endpoint). Return 404 if not found.

**PUT** — Update server. Accept partial updates (any subset of fields). Validate same rules as POST for provided fields. Set `updated_at` to now. Return updated server.

**DELETE** — Soft-delete by setting `is_active = false`, OR hard-delete if query param `?hard=true`. Before hard delete, check if any vpn_users reference this server_id — if so, return 409 with count of linked users. Return `{ success: true }`.

### 3. Create `src/app/api/admin/vpn/servers/[id]/test/route.ts`

**POST** — Test connectivity to a server's Marzban instance:
- Fetch the server from DB by ID
- If no marzban_api_url, return `{ status: "no_agent" }`
- Try to authenticate and call getSystem() using the marzban client from `@/lib/marzban`
- Return `{ status: "healthy", latency_ms: X, system: {...} }` on success
- Return `{ status: "down", error: "message" }` on failure
- Use a 10-second timeout (AbortController)

### Security Requirements
- ALL routes must call `requireAdmin()` first
- DELETE requires `requireAdmin("admin")` (admin role only, not editor)
- NEVER expose marzban credentials in the POST/PUT response — only in GET single server
- Validate all input server-side, never trust client data
- Use parameterized queries only (Supabase client handles this)

### Code Style
- TypeScript strict
- Use `adminClient` for all Supabase queries
- Error responses: `{ error: "message" }` with appropriate HTTP status
- Success responses: `{ server: {...} }` for single, `{ servers: [...] }` for list
- No default exports on route files
```

---

## Prompt 2: Frontend — Server Management UI

```
Act as a senior frontend engineer. You're building server management UI for a Next.js 15 admin panel with Tailwind CSS v4.

## Design Language (MUST match exactly)

Dark theme tokens:
- Card: `bg-bg-secondary border border-overlay/10 rounded-xl p-5`
- Primary text: `text-text-primary`
- Muted text: `text-text-muted`
- Accent: `text-accent-teal`, `bg-accent-teal/10`, `border-accent-teal/20`
- Input: `w-full bg-overlay/5 border border-overlay/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-teal`
- Button (primary): `px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-lg text-sm hover:bg-accent-teal/30 transition-colors cursor-pointer`
- Button (secondary): `px-4 py-2 bg-overlay/5 text-text-muted rounded-lg text-sm hover:bg-overlay/10 transition-colors cursor-pointer`
- Button (danger): `px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors cursor-pointer`
- Modal overlay: `fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4`
- Modal body: `bg-bg-secondary border border-overlay/10 rounded-xl p-6 w-full max-w-md space-y-4`
- Error alert: `p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm`
- Success alert: `p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-lg text-accent-teal text-sm`
- Label: `text-[11px] uppercase tracking-wider text-text-muted`
- Status dot: `w-2 h-2 rounded-full bg-green-500` (active) / `bg-red-500` (inactive)

## API Endpoints Available

All return JSON. All require admin auth (cookie-based session).

- `GET /api/admin/vpn/servers` → `{ servers: [...] }` (list, no credentials)
- `GET /api/admin/vpn/servers/:id` → `{ server: {...} }` (single, includes marzban creds)
- `POST /api/admin/vpn/servers` → `{ server: {...} }` (create)
- `PUT /api/admin/vpn/servers/:id` → `{ server: {...} }` (update)
- `DELETE /api/admin/vpn/servers/:id` → `{ success: true }` (soft delete)
- `DELETE /api/admin/vpn/servers/:id?hard=true` → `{ success: true }` (hard delete)
- `POST /api/admin/vpn/servers/:id/test` → `{ status, latency_ms?, system?, error? }` (test connectivity)
- `GET /api/admin/vpn/health` → `{ servers: [...], checked_at }` (health data with users_active, total_users)

### Server object shape (from GET list):
```ts
{
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
```

### Server object shape (from GET single — includes credentials):
```ts
{
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  ip_address: string;
  port: number;
  protocol: string;
  is_active: boolean;
  is_premium: boolean;
  config_data: string;
  marzban_api_url: string | null;
  marzban_admin_user: string | null;
  marzban_admin_pass: string | null;
  marzban_api_key: string | null;
  created_at: string;
  updated_at: string;
}
```

## Task

### 1. Update `src/components/admin/server-card.tsx`

Add to each server card:
- A "..." (three-dot) menu button in top-right corner (next to the status dot)
- On click, show a small dropdown with: "Edit", "Test Connection", "Deactivate"/"Activate" (toggle), "Delete"
- Dropdown: `absolute right-0 top-full mt-1 bg-bg-primary border border-overlay/10 rounded-lg shadow-lg py-1 min-w-[140px] z-10`
- Each item: `px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/5 cursor-pointer transition-colors w-full text-left`
- Delete item: `text-red-400 hover:bg-red-500/10`
- Close dropdown on click outside (useEffect with document click listener)

Props to add:
```ts
onEdit?: (id: string) => void;
onTest?: (id: string) => void;
onToggleActive?: (id: string, currentlyActive: boolean) => void;
onDelete?: (id: string) => void;
```

### 2. Create `src/components/admin/server-modal.tsx`

A modal component for both creating and editing servers.

Props:
```ts
interface ServerModalProps {
  mode: "create" | "edit";
  serverId?: string; // if edit, fetch server data on mount
  onClose: () => void;
  onSaved: () => void; // callback after successful create/update
}
```

Behavior:
- In "edit" mode: fetch `GET /api/admin/vpn/servers/:id` on mount to populate form (show skeleton while loading)
- Form fields (2-column grid on desktop, stack on mobile):
  - Row 1: Name (text), Country (text)
  - Row 2: Country Code (text, max 4 chars), City (text)
  - Row 3: IP Address (text), Port (number)
  - Row 4: Protocol (select: wireguard, vless, tcp, shadowsocks, trojan, udp)
  - Row 5: Is Active (toggle/checkbox), Is Premium (toggle/checkbox)
  - Separator line with "Marzban Configuration" label
  - Row 6: Marzban API URL (text, placeholder "https://server:port")
  - Row 7: Marzban Admin User (text), Marzban Admin Pass (text, type=password)
  - Row 8: Marzban API Key (text, optional)
  - A "Test Connection" button next to Marzban fields that calls POST /api/admin/vpn/servers/:id/test (only in edit mode) and shows result inline
- Submit button: "Create Server" or "Save Changes"
- Show validation errors inline per field
- Show API errors in alert box at top of modal
- Disable submit while saving (show "Saving...")

### 3. Create `src/components/admin/delete-confirm-modal.tsx`

Small confirmation modal. Reusable.

Props:
```ts
interface DeleteConfirmProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
```

Render: Modal with title, message, red "Delete" button and gray "Cancel" button. Show "Deleting..." on loading.

### 4. Update `src/app/admin-dvpn/(dashboard)/vpn-servers/page.tsx`

Read the current file first. Then:

- Add "Add Server" button in the header next to "Sync Marzban" and "Refresh"
- Add state: `modalMode` ("create" | "edit" | null), `editServerId`, `deleteServerId`, `testingServerId`
- Wire up ServerCard callbacks:
  - onEdit → open ServerModal in edit mode
  - onDelete → open DeleteConfirmModal, on confirm call `DELETE /api/admin/vpn/servers/:id`, refresh list
  - onToggleActive → call `PUT /api/admin/vpn/servers/:id` with `{ is_active: !current }`, refresh list
  - onTest → call `POST /api/admin/vpn/servers/:id/test`, show result as a brief toast/alert
- Add ServerModal rendering when modalMode is set
- Add DeleteConfirmModal rendering when deleteServerId is set

## Requirements
- "use client" on all components
- TypeScript strict, named exports
- No external UI libraries (no headlessui, no radix — pure Tailwind)
- Click outside modal closes it (but not during save)
- Escape key closes modals
- Password fields should have a show/hide toggle
- All fetch calls should have error handling
- Match existing admin panel styling exactly — refer to the design tokens above
```

---

## Prompt 3: Security & QA Review

```
Act as a senior security engineer. Review the VPN servers admin CRUD implementation for security vulnerabilities, logic errors, and quality issues.

## Scope

Review these files thoroughly:
- src/app/api/admin/vpn/servers/route.ts (GET + POST)
- src/app/api/admin/vpn/servers/[id]/route.ts (GET + PUT + DELETE)
- src/app/api/admin/vpn/servers/[id]/test/route.ts (POST)
- src/components/admin/server-card.tsx
- src/components/admin/server-modal.tsx
- src/components/admin/delete-confirm-modal.tsx
- src/app/admin-dvpn/(dashboard)/vpn-servers/page.tsx
- src/lib/admin-auth.ts
- src/lib/marzban.ts

## Security Checklist — Verify Each

### Authentication & Authorization
- [ ] Every API route calls `requireAdmin()` before any logic
- [ ] DELETE operations require `requireAdmin("admin")` (admin role, not editor)
- [ ] No route exposes data without auth check
- [ ] Auth failure returns 401, not 500

### Input Validation
- [ ] All user input is validated server-side (not just client-side)
- [ ] IP address validation uses proper regex (no open patterns)
- [ ] Country code is alphanumeric only (no SQL injection via string)
- [ ] Port is bounded to 1-65535
- [ ] No SQL injection possible (should use Supabase parameterized queries)
- [ ] UUID parameters are validated before use in queries
- [ ] No prototype pollution in body parsing

### Credential Security
- [ ] Marzban credentials (admin_user, admin_pass, api_key) are NEVER returned in list endpoints
- [ ] Credentials are only returned in the single-server GET (admin only)
- [ ] No credentials logged to console in production
- [ ] Password inputs use type="password" in frontend
- [ ] No credentials in URL query parameters

### SSRF Prevention
- [ ] The "test connection" endpoint doesn't allow arbitrary URL testing
- [ ] It only tests the marzban_api_url stored in the database, not a user-provided URL
- [ ] If a user-provided URL is used, it must be validated against allowlist

### Data Integrity
- [ ] Hard delete checks for foreign key references (vpn_users)
- [ ] Soft delete (is_active=false) doesn't break related queries
- [ ] Updated_at is set on modifications
- [ ] No race conditions in create (duplicate name/IP checks if needed)

### Frontend Security
- [ ] No dangerouslySetInnerHTML
- [ ] XSS prevention: user input rendered with React (auto-escaped)
- [ ] No client-side credential storage (localStorage, etc.)
- [ ] Modal doesn't leak state between open/close cycles

### Error Handling
- [ ] API errors don't leak stack traces or internal details
- [ ] Database errors are caught and returned as generic messages
- [ ] Marzban connection errors are caught with timeout
- [ ] Frontend handles all error states gracefully

## Output Format

For each issue found, provide:
1. **Severity**: Critical / High / Medium / Low
2. **File**: exact path and line number
3. **Issue**: what's wrong
4. **Fix**: exact code change needed

If no issues are found in a category, explicitly state "PASS".

Also run: `npx tsc --noEmit` and report any TypeScript errors.
```

---

## Execution Order

1. **Prompt 1** → Creates all backend API routes (CRUD + test)
2. **Prompt 2** → Creates frontend components (modal, cards, page updates)
3. **Prompt 3** → Security review of everything built in 1+2

Each prompt is self-contained — paste into a fresh context with no prior conversation needed.
