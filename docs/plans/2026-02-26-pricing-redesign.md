# Pricing Section Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the landing page pricing section from a single Plus card to a two-card Free vs Plus layout with correct Telegram-first pricing, shortened mobile-safe duration labels, and fix subscription guide prices.

**Architecture:** Two-card responsive layout (Free + Plus) using existing Card/Badge/Button components. Telegram prices shown as primary ($4/$20/$35). Duration selector uses shortened "1 Mo / 6 Mo / 12 Mo" labels. Subscription guide prices corrected. Guide pages link to pricing section.

**Tech Stack:** Next.js 15, Tailwind CSS v4, next-intl, existing design system components (Card, Badge, Button, Section, Reveal)

---

## Confirmed Pricing Data

| Plan | Telegram | iOS (US base) | iOS (EU) | Android |
|------|----------|---------------|----------|---------|
| Monthly | $4 | $6.99 | $7.99 | $6.99 |
| 6-Month | $20 | $29.99 | $29.99 | $29.99 |
| Annual | $35 | $39.99 | $39.99 | $39.99 |

**Free tier:** Full VPN, all servers, unlimited data, WireGuard + VLESS, 3 devices, no logs.
**Plus tier:** Everything in Free + ad blocker, category filter, custom blocklists, 10 devices, 24/7 support, Smart VPN (coming soon).
**Trial:** 7-day free trial of Plus features.

---

## Task 1: Update i18n pricing keys in en.json

**Files:**
- Modify: `messages/en.json` (pricing section)

**Step 1: Replace the pricing translation block**

Replace the existing `"pricing": { ... }` block with:

```json
"pricing": {
  "title": "Simple, transparent pricing",
  "subtitle": "Full VPN for free. Upgrade for premium features.",
  "freeBadge": "Free",
  "plusBadge": "Doppler Plus",
  "freeTitle": "Doppler VPN",
  "freeSubtitle": "Everything you need to stay private",
  "plusTitle": "Doppler Plus",
  "plusSubtitle": "Premium protection & control",
  "freePrice": "$0",
  "freePeriod": "forever",
  "durationSelector": "Choose subscription duration",
  "durations": {
    "monthly": "1 Mo",
    "sixMonth": "6 Mo",
    "annual": "12 Mo"
  },
  "bestValue": "Best",
  "billedMonthly": "Billed monthly",
  "billed": "Billed",
  "every6Months": "every 6 months",
  "perYear": "per year",
  "save": "Save",
  "freeFeatures": {
    "servers": "All server locations",
    "data": "Unlimited data",
    "protocols": "WireGuard + VLESS",
    "devices": "3 devices",
    "noLogs": "Zero-log policy"
  },
  "plusFeatures": {
    "everything": "Everything in Free",
    "adBlocker": "Ad blocker",
    "categoryFilter": "Category filter",
    "customBlocklist": "Custom blocklists",
    "devices": "10 devices",
    "support": "24/7 support",
    "smartVpn": "Smart VPN"
  },
  "comingSoon": "Soon",
  "freeCta": "Download App",
  "plusCta": "Start Free Trial",
  "trialNote": "7-day free trial included",
  "platformNote": "Prices shown for Telegram Bot. App Store & Google Play prices may vary.",
  "platformLink": "See all platform prices",
  "cancelAnytime": "Cancel anytime. No questions asked.",
  "guarantee": "30-day money-back guarantee",
  "pricesIn": "Prices shown in"
}
```

**Step 2: Verify the key structure is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"`
Expected: No error output

**Step 3: Commit**

```bash
git add messages/en.json
git commit -m "feat(pricing): update en.json with two-card pricing keys"
```

---

## Task 2: Rewrite pricing.tsx component

**Files:**
- Modify: `src/components/sections/pricing.tsx`

**Step 1: Rewrite the full component**

The component structure:

```
Pricing (exported)
├── Section (id="pricing", bg-bg-secondary/30)
│   ├── SectionHeader (title, subtitle)
│   ├── Reveal (max-w-4xl mx-auto)
│   │   └── div (grid: 1col mobile, 2col md+)
│   │       ├── FreeCard
│   │       │   ├── Badge "Free" (variant="default")
│   │       │   ├── Title + Subtitle
│   │       │   ├── Price: $0 /forever
│   │       │   ├── Feature list (5 items, single column)
│   │       │   └── Button "Download App" (variant="outline", href="/apps")
│   │       └── PlusCard (teal border, teal gradient bg)
│   │           ├── Badge "Doppler Plus" (variant="teal")
│   │           ├── Title + Subtitle
│   │           ├── DurationSelector (1 Mo / 6 Mo / 12 Mo)
│   │           ├── PriceDisplay ($4, $20, $35)
│   │           ├── Feature list (7 items, single column, "Smart VPN" has "Soon" badge)
│   │           ├── Button "Start Free Trial" (variant="primary", href=telegram bot)
│   │           ├── Trial note text
│   │           └── Platform note + link to /guide/subscription
│   ├── Reveal (guarantee text)
│   └── p (region indicator - removed, no longer needed since we show Telegram prices)
```

**Key implementation details:**

1. **Remove region detection entirely** — no more US/EU price switching. Show Telegram prices only ($4/$20/$35).
2. **Price data simplified:**
```typescript
const PRICES: Record<Duration, PriceData> = {
  monthly: { total: 4, monthly: 4, savings: null },
  sixMonth: { total: 20, monthly: 3.33, savings: 17 },
  annual: { total: 35, monthly: 2.92, savings: 27 },
};
```
3. **Duration selector** keeps existing sliding pill + keyboard navigation, just with shortened labels from i18n.
4. **Desktop grid:** `grid grid-cols-1 md:grid-cols-5 gap-6` — Free card takes `md:col-span-2`, Plus card takes `md:col-span-3`.
5. **Mobile order:** Plus card first (`order-first md:order-last` on Plus, `order-last md:order-first` on Free).
6. **Free card:** Standard border (`border-overlay/10`), no gradient, `padding="lg"`.
7. **Plus card:** Teal border (`border-accent-teal/30`), gradient (`bg-gradient-to-b from-accent-teal/5 to-transparent`), `padding="lg"`.
8. **Feature checkmark SVG** — reuse existing inline SVG (teal for Plus, text-muted for Free).
9. **Smart VPN line** gets a small `Badge` with "Soon" text next to it.
10. **Platform note** links to `/guide/subscription` using `Link` from i18n/navigation.

**Step 2: Run type check**

Run: `npm run typecheck`
Expected: No errors in pricing.tsx

**Step 3: Run dev server and visual check**

Run: `npm run dev`
Check: localhost:3000/#pricing renders both cards correctly

**Step 4: Commit**

```bash
git add src/components/sections/pricing.tsx
git commit -m "feat(pricing): redesign to two-card Free vs Plus layout"
```

---

## Task 3: Update all 20 non-English locale files

**Files:**
- Modify: `messages/ar.json`, `messages/de.json`, `messages/es.json`, `messages/fa.json`, `messages/fr.json`, `messages/he.json`, `messages/hi.json`, `messages/id.json`, `messages/ja.json`, `messages/ko.json`, `messages/ms.json`, `messages/pt.json`, `messages/ru.json`, `messages/sw.json`, `messages/th.json`, `messages/tl.json`, `messages/tr.json`, `messages/ur.json`, `messages/vi.json`, `messages/zh.json`

**Step 1: For each locale file, replace the `"pricing"` block**

Match the exact same key structure as en.json. For now, use English values as placeholders — translation can be done later via the blog translation pipeline or manually.

**Important:** The duration labels "1 Mo" / "6 Mo" / "12 Mo" should stay as-is across all locales (they're short enough to be universal). Translators can localize later.

**Step 2: Verify all JSON files parse correctly**

Run: `for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK: $f" || echo "FAIL: $f"; done`
Expected: All OK

**Step 3: Commit**

```bash
git add messages/*.json
git commit -m "feat(pricing): update pricing keys in all 20 locale files"
```

---

## Task 4: Fix subscription guide prices

**Files:**
- Modify: `src/app/[locale]/guide/subscription/page.tsx`

**Step 1: Update the hardcoded price table**

Replace the table body rows (lines 83-100) with correct prices:

```tsx
<tr>
  <td className="p-4 text-text-primary font-medium">{t("plans.monthly")}</td>
  <td className="p-4 text-text-muted">$6.99/mo</td>
  <td className="p-4 text-text-muted">$6.99/mo</td>
  <td className="p-4 text-accent-teal font-medium">$4/mo</td>
</tr>
<tr>
  <td className="p-4 text-text-primary font-medium">{t("plans.sixMonth")}</td>
  <td className="p-4 text-text-muted">$29.99</td>
  <td className="p-4 text-text-muted">$29.99</td>
  <td className="p-4 text-accent-teal font-medium">$20</td>
</tr>
<tr>
  <td className="p-4 text-text-primary font-medium">{t("plans.annual")}</td>
  <td className="p-4 text-text-muted">$39.99</td>
  <td className="p-4 text-text-muted">$39.99</td>
  <td className="p-4 text-accent-teal font-medium">$35</td>
</tr>
```

Note: iOS EU prices ($7.99/mo) are not shown in this table since it's USD-focused. The iOS column header says "App Store" which covers both.

**Step 2: Commit**

```bash
git add src/app/[locale]/guide/subscription/page.tsx
git commit -m "fix(guide): correct subscription prices to match actual pricing"
```

---

## Task 5: Add pricing link to device guide pages

**Files:**
- Modify: `src/app/[locale]/guide/[device]/page.tsx`

**Step 1: Read the full device guide page to find the CTA/link section**

Look for the bottom section with navigation links. Add a link to `/#pricing` with text from i18n.

**Step 2: Add a "See pricing" link**

At the bottom of each device guide page, alongside existing navigation links (like "Back to guides"), add:

```tsx
<Link
  href="/#pricing"
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-overlay/10 text-text-muted text-sm font-medium hover:border-accent-teal/20 hover:text-text-primary transition-colors"
>
  {t("seePricing")} &rarr;
</Link>
```

This requires adding a `"seePricing": "See pricing plans"` key to the device guide i18n namespace.

**Step 3: Add the i18n key to all locale files**

Add `"seePricing": "See pricing plans"` to the guide device translation namespace in `messages/en.json` and all locale files.

**Step 4: Commit**

```bash
git add src/app/[locale]/guide/[device]/page.tsx messages/*.json
git commit -m "feat(guide): add pricing link to device guide pages"
```

---

## Task 6: Add pricing link to guide hub page

**Files:**
- Modify: `src/app/[locale]/guide/page.tsx`

**Step 1: In the "Learn More" section (lines 101-145), the subscription card already exists and links to `/guide/subscription`. No additional card needed — the subscription guide itself has the pricing table.**

However, add a subtle CTA banner between the "Learn More" and "Telegram Section" sections:

```tsx
<div className="rounded-2xl border border-accent-teal/20 bg-accent-teal/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal shrink-0">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  </div>
  <div>
    <h3 className="text-base font-semibold text-text-primary mb-0.5">{t("pricingBanner.title")}</h3>
    <p className="text-sm text-text-muted">{t("pricingBanner.desc")}</p>
  </div>
  <Link
    href="/#pricing"
    className="sm:ms-auto px-4 py-2 rounded-lg bg-accent-teal/15 text-accent-teal font-semibold text-sm whitespace-nowrap hover:bg-accent-teal/25 transition-colors"
  >
    {t("pricingBanner.cta")} &rarr;
  </Link>
</div>
```

**Step 2: Add i18n keys**

In the guide namespace of en.json:
```json
"pricingBanner": {
  "title": "Free VPN, premium optional",
  "desc": "All servers are free. Upgrade to Plus for ad blocking, content filters, and more.",
  "cta": "See plans"
}
```

**Step 3: Commit**

```bash
git add src/app/[locale]/guide/page.tsx messages/*.json
git commit -m "feat(guide): add pricing banner to guide hub page"
```

---

## Task 7: Build verification

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit any fixes if needed**

---

## Summary of all files touched

| File | Action |
|------|--------|
| `messages/en.json` | Modify pricing keys, add guide pricing banner keys |
| `messages/*.json` (20 files) | Mirror pricing key structure |
| `src/components/sections/pricing.tsx` | Full rewrite — two-card layout |
| `src/app/[locale]/guide/subscription/page.tsx` | Fix price table values |
| `src/app/[locale]/guide/[device]/page.tsx` | Add pricing link |
| `src/app/[locale]/guide/page.tsx` | Add pricing banner |

**No files created. No files deleted. No new components. No new dependencies.**
