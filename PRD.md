# PRD: Doppler VPN

**Version:** 1.0  
**Author:** Claude  
**Date:** January 19, 2026  
**Status:** Approved

---

## 1. Overview

Doppler VPN is a privacy-focused virtual private network service targeting users who prioritize online anonymity, ad-free browsing, and content filtering. The product offers a seamless, registration-free experience with powerful ad-blocking and category-based filtering capabilities.

### Problem Statement
Users face constant privacy invasion, intrusive advertising, and tracking across the web. Most VPN services require lengthy registration processes, collect user data, and offer limited content filtering options.

### Solution
Doppler VPN provides a no-registration, privacy-first VPN with built-in advanced ad-blocking, customizable content filtering by category and blocklist, and support for up to 10 devices on a single subscription.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target (3 months) |
|------|--------|-------------------|
| User Acquisition | App Downloads | 10,000 |
| Conversion | Free Trial → Paid | 15% |
| Revenue | MRR | $15,000 |
| Retention | 30-day retention | 60% |
| SEO | Organic traffic | 5,000 visits/month |

---

## 3. Target Users

### Primary Persona: Privacy-Conscious Individual
- **Demographics:** 25-45, tech-savvy, global
- **Pain Points:** Concerned about online tracking, tired of ads, wants simple privacy solution
- **Needs:** No-logs VPN, easy setup, ad blocking, multi-device support
- **Behavior:** Research-driven, reads reviews, values transparency

### Secondary Persona: Content Filter User
- **Demographics:** Parents, professionals, anyone needing content control
- **Pain Points:** Need to block specific content categories
- **Needs:** Granular content filtering, custom blocklists

---

## 4. Product Features

### Core Features
1. **No-Logs VPN** - Zero data collection, complete privacy
2. **Advanced Ad Blocker** - System-wide ad blocking
3. **Category Filtering** - Block content by category (adult, gambling, social media, etc.)
4. **Custom Blocklists** - Import/manage custom domain blocklists
5. **10-Device Support** - Single subscription covers 10 devices
6. **No Registration Required** - Start using immediately
7. **WireGuard Protocol** - Fast, modern, secure protocol

### Platform Support
- iOS (iPhone & iPad)
- macOS
- Android

### Server Infrastructure
- Launch: 10 server locations (8 free + 2 premium)
- Month 1 target: 10 locations minimum

---

## 5. User Stories

### US-001: Landing Page View
**Story Points:** 3  
**Priority:** High

**Description:** As a visitor, I want to see a compelling landing page so that I understand what Doppler VPN offers and can download the app.

**Acceptance Criteria:**
- [ ] Hero section with value proposition and download CTA
- [ ] Features section highlighting key benefits
- [ ] Pricing section with all plan options
- [ ] FAQ section answering common questions
- [ ] Footer with legal links
- [ ] Fully responsive (mobile-first)
- [ ] Dark cinematic design theme
- [ ] Page load < 3s
- [ ] npm run typecheck passes
- [ ] npm run lint passes

---

### US-002: Multi-language Support
**Story Points:** 5  
**Priority:** High

**Description:** As an international user, I want to view the site in my language so that I can understand the content.

**Acceptance Criteria:**
- [ ] English (en) - LTR - default
- [ ] Hebrew (he) - RTL
- [ ] Language switcher in navigation
- [ ] URL-based locale routing (/en, /he)
- [ ] RTL layout support with proper mirroring
- [ ] All content translated via JSON files
- [ ] SEO metadata per language
- [ ] hreflang tags implemented
- [ ] npm run typecheck passes

---

### US-003: Download CTA Flow
**Story Points:** 2  
**Priority:** High

**Description:** As a visitor, I want to easily download the app for my device so that I can start using Doppler VPN.

**Acceptance Criteria:**
- [ ] Auto-detect user's platform (iOS, macOS, Android)
- [ ] Direct links to App Store / Google Play
- [ ] Platform badges displayed
- [ ] Multiple CTA placements (hero, pricing, footer)
- [ ] Track clicks via Google Tag Manager

---

### US-004: Pricing Display
**Story Points:** 2  
**Priority:** High

**Description:** As a visitor, I want to see clear pricing options so that I can choose the right plan.

**Acceptance Criteria:**
- [ ] 7-day free trial highlighted
- [ ] Monthly: $7.99/month
- [ ] 6-month plan displayed
- [ ] Annual: $79.99/year (best value)
- [ ] Feature comparison between plans
- [ ] Money-back guarantee displayed

---

### US-005: SEO Optimization
**Story Points:** 5  
**Priority:** High

**Description:** As a business, I want the site optimized for search engines so that we rank for VPN-related keywords.

**Acceptance Criteria:**
- [ ] Dynamic meta titles/descriptions per page
- [ ] OpenGraph images for social sharing
- [ ] Twitter Card support
- [ ] JSON-LD structured data (Product, FAQ, Organization)
- [ ] Sitemap.xml generation
- [ ] robots.txt configuration
- [ ] Canonical URLs
- [ ] hreflang for multi-language
- [ ] Core Web Vitals optimized
- [ ] Image optimization with Next.js Image

---

### US-006: Privacy Policy Page
**Story Points:** 2  
**Priority:** High

**Description:** As a visitor, I want to read the privacy policy so that I understand how my data is handled.

**Acceptance Criteria:**
- [ ] Clear, readable privacy policy
- [ ] Last updated date
- [ ] Multi-language support
- [ ] Proper SEO metadata
- [ ] Link in footer and legal sections

---

### US-007: Terms of Service Page
**Story Points:** 2  
**Priority:** High

**Description:** As a visitor, I want to read the terms of service so that I understand the usage agreement.

**Acceptance Criteria:**
- [ ] Complete terms of service content
- [ ] Last updated date
- [ ] Multi-language support
- [ ] Proper SEO metadata
- [ ] Link in footer and legal sections

---

### US-008: Analytics Integration
**Story Points:** 2  
**Priority:** Medium

**Description:** As a business, I want to track user behavior so that we can optimize the site.

**Acceptance Criteria:**
- [ ] Google Tag Manager integration
- [ ] Google Analytics 4 setup
- [ ] Event tracking for CTA clicks
- [ ] Conversion tracking for downloads
- [ ] Privacy-compliant implementation

---

## 6. Functional Requirements

### FR-1: Landing Page Components
**Priority:** Must Have

**Components:**
1. **Navbar** - Logo, nav links, language switcher, download CTA
2. **Hero** - Headline, subheadline, download buttons, app mockup
3. **Features** - Icon grid/bento showing key features
4. **How It Works** - Step-by-step process
5. **Pricing** - Plan comparison cards
6. **FAQ** - Accordion with common questions
7. **Footer** - Links, legal, app badges

### FR-2: Internationalization (i18n)
**Priority:** Must Have

**Implementation:**
- next-intl for routing and translations
- JSON translation files per locale
- URL structure: /[locale]/page
- Default locale: English (en)
- Supported: English (en), Hebrew (he)
- RTL CSS support for Hebrew
- Dynamic metadata generation per locale

### FR-3: SEO Infrastructure
**Priority:** Must Have

**Implementation:**
- Metadata API for all pages
- generateMetadata for dynamic pages
- OpenGraph image generation
- JSON-LD schemas: Product, FAQPage, Organization
- Automated sitemap.xml
- Configured robots.txt
- hreflang alternate links

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1
- Lighthouse Performance Score > 90
- Lighthouse SEO Score > 95

### NFR-2: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios met
- Focus indicators visible

### NFR-3: Browser Support
- Chrome (last 2 versions)
- Safari (last 2 versions)
- Firefox (last 2 versions)
- Edge (last 2 versions)
- Mobile Safari iOS 14+
- Chrome Android

---

## 8. Technical Architecture

### Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (customized)
- **i18n:** next-intl
- **Analytics:** Google Tag Manager + GA4
- **Hosting:** Vercel
- **Domain:** TBD

### Design System
- **Theme:** Dark cinematic (inspired by Figma design)
- **Primary Font:** Playfair Display (serif headlines)
- **Body Font:** DM Sans (sans-serif body)
- **Colors:** Deep black bg, off-white text, teal accents
- **Effects:** Noise overlay, gradient backgrounds, atmospheric imagery

### Key Technical Decisions
1. **Static Site Generation (SSG)** - All pages statically generated for performance
2. **Edge Middleware** - Locale detection and routing
3. **Server Components** - Default for all non-interactive components
4. **Client Components** - Only for interactive elements (FAQ accordion, mobile nav)
5. **No Database** - Static marketing site, no user data stored

---

## 9. Page Structure

```
/
├── /[locale]
│   ├── / (landing page)
│   ├── /privacy
│   └── /terms
├── /sitemap.xml
└── /robots.txt
```

### URL Examples
- English: `/en`, `/en/privacy`, `/en/terms`
- Hebrew: `/he`, `/he/privacy`, `/he/terms`

---

## 10. Content Requirements

### Hero Section
- **Tagline:** "Privacy without compromise"
- **Headline:** "Browse freely. Stay protected."
- **Subheadline:** "No-logs VPN with powerful ad blocking and content filtering. No registration required."
- **CTAs:** "Download for iOS", "Download for Android", "Download for Mac"

### Key Messaging
1. **Privacy First** - Zero logs, zero tracking
2. **Ad-Free Experience** - System-wide ad blocking
3. **Content Control** - Filter by category or custom blocklist
4. **Multi-Device** - 10 devices, one subscription
5. **Fast & Secure** - WireGuard protocol
6. **No Hassle** - No registration required

### FAQ Questions
1. What is Doppler VPN?
2. Is Doppler VPN really no-logs?
3. How does the ad blocker work?
4. What content categories can I filter?
5. How many devices can I use?
6. What platforms are supported?
7. How do I cancel my subscription?
8. Is there a free trial?

---

## 11. SEO Strategy

### Target Keywords
**Primary:**
- VPN with ad blocker
- No-log VPN
- Privacy VPN
- VPN no registration

**Secondary:**
- Best VPN for privacy
- VPN content filter
- VPN blocklist
- Fast VPN WireGuard

**Long-tail:**
- VPN that blocks ads and trackers
- VPN without account
- VPN for multiple devices
- VPN with parental controls

### Meta Title Template
- Home: "Doppler VPN - No-Logs VPN with Ad Blocker | Privacy First"
- Privacy: "Privacy Policy | Doppler VPN"
- Terms: "Terms of Service | Doppler VPN"

### Meta Description Template
- Home: "Protect your privacy with Doppler VPN. No-logs policy, powerful ad blocking, content filtering, and 10-device support. No registration required. Try free for 7 days."

---

## 12. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup | Day 1 | Project scaffold, i18n, design system |
| Development | Days 2-5 | All pages, components, translations |
| SEO | Day 6 | Metadata, schema, sitemap |
| Polish | Day 7 | Animations, testing, optimization |
| Launch | Day 8 | Deploy to Vercel, DNS setup |

---

## 13. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Translation delays | Medium | Medium | Start with EN only, add HE incrementally |
| Design iterations | Medium | Low | Use established design system |
| SEO ranking time | High | Medium | Focus on technical SEO, add content later |

---

## 14. Out of Scope (v1)

- User authentication/accounts
- Blog/content section
- Live chat support
- Server status page
- Affiliate program
- Additional languages (beyond EN, HE)
- Light theme toggle

---

## 15. Success Criteria

### Launch Checklist
- [ ] All pages render correctly in EN and HE
- [ ] RTL layout works perfectly for Hebrew
- [ ] All CTAs link to correct app stores
- [ ] Lighthouse scores > 90
- [ ] Mobile responsive on all breakpoints
- [ ] Google Tag Manager firing
- [ ] Sitemap submitted to Google Search Console
- [ ] SSL certificate active
- [ ] Custom domain configured

---

## Appendix: Design Tokens

```css
/* Colors */
--bg-primary: #0A0A0A
--bg-secondary: #141414
--bg-card: rgba(20, 20, 20, 0.8)
--text-primary: #F5F5F5
--text-muted: #9A9A9A
--accent: #D4C5A9
--glow: #1A4B5C

/* Typography */
--font-display: 'Playfair Display', serif
--font-body: 'DM Sans', sans-serif

/* Spacing */
--section-padding: 80px (desktop), 48px (mobile)
--container-max: 1280px

/* Border Radius */
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-full: 9999px
```
