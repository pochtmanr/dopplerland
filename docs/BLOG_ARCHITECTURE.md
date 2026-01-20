# Doppler VPN Blog Architecture Specification

## 1. Architectural Goal

Design a multilingual, SEO-optimized blog system for the Doppler VPN marketing website that stores content in Supabase, renders standalone indexable pages per language (en/he), supports RTL for Hebrew, and scales for future AI-driven content automation via n8n—without requiring any in-app authoring UI.

---

## 2. Supabase Data Structure

### 2.1 Database Schema

```sql
-- =====================================================
-- BLOG POSTS (Language-agnostic base record)
-- =====================================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT,                          -- Single image per post (Supabase Storage URL)
  image_alt_en VARCHAR(255),               -- Alt text for English
  image_alt_he VARCHAR(255),               -- Alt text for Hebrew
  author_name VARCHAR(100) DEFAULT 'Doppler Team',
  status VARCHAR(20) DEFAULT 'draft',      -- 'draft' | 'published' | 'archived'
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Index for efficient queries
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- =====================================================
-- BLOG POST TRANSLATIONS (One row per language)
-- =====================================================
CREATE TABLE blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,              -- 'en' | 'he'

  -- Content
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,                   -- Short preview for cards (150-200 chars)
  content TEXT NOT NULL,                   -- Full blog content (Markdown or HTML)

  -- SEO Fields
  meta_title VARCHAR(70),                  -- SEO title (falls back to title)
  meta_description VARCHAR(160),           -- SEO description (falls back to excerpt)
  og_title VARCHAR(70),                    -- OpenGraph title (falls back to meta_title)
  og_description VARCHAR(200),             -- OpenGraph description

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_post_locale UNIQUE (post_id, locale),
  CONSTRAINT valid_locale CHECK (locale IN ('en', 'he'))
);

-- Index for fast locale lookups
CREATE INDEX idx_translations_post_locale ON blog_post_translations(post_id, locale);
CREATE INDEX idx_translations_locale ON blog_post_translations(locale);

-- =====================================================
-- TAGS (Language-agnostic)
-- =====================================================
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,       -- URL-friendly: 'privacy-tips'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON blog_tags(slug);

-- =====================================================
-- TAG TRANSLATIONS
-- =====================================================
CREATE TABLE blog_tag_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,              -- Display name: 'Privacy Tips' / 'טיפים לפרטיות'

  CONSTRAINT unique_tag_locale UNIQUE (tag_id, locale),
  CONSTRAINT valid_locale CHECK (locale IN ('en', 'he'))
);

CREATE INDEX idx_tag_translations_tag_locale ON blog_tag_translations(tag_id, locale);

-- =====================================================
-- POST-TAG JUNCTION TABLE
-- =====================================================
CREATE TABLE blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON blog_post_tags(tag_id);

-- =====================================================
-- INTERNAL LINKS (For related posts)
-- =====================================================
CREATE TABLE blog_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  link_order INT DEFAULT 0,                -- Order of display

  CONSTRAINT no_self_link CHECK (source_post_id != target_post_id),
  CONSTRAINT unique_link UNIQUE (source_post_id, target_post_id)
);

CREATE INDEX idx_internal_links_source ON blog_internal_links(source_post_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON blog_post_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.2 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────────┐
│   blog_posts    │───────│  blog_post_translations  │
│─────────────────│  1:N  │──────────────────────────│
│ id (PK)         │       │ id (PK)                  │
│ slug (unique)   │       │ post_id (FK)             │
│ image_url       │       │ locale (en|he)           │
│ image_alt_en    │       │ title                    │
│ image_alt_he    │       │ excerpt                  │
│ author_name     │       │ content                  │
│ status          │       │ meta_title               │
│ published_at    │       │ meta_description         │
│ created_at      │       │ og_title                 │
│ updated_at      │       │ og_description           │
└────────┬────────┘       └──────────────────────────┘
         │
         │ M:N
         │
┌────────┴────────┐
│  blog_post_tags │
│─────────────────│       ┌─────────────────┐       ┌───────────────────────┐
│ post_id (FK)    │       │   blog_tags     │───────│ blog_tag_translations │
│ tag_id (FK)     │───────│─────────────────│  1:N  │───────────────────────│
└─────────────────┘       │ id (PK)         │       │ id (PK)               │
                          │ slug (unique)   │       │ tag_id (FK)           │
         │                └─────────────────┘       │ locale (en|he)        │
         │                                          │ name                  │
         │                                          └───────────────────────┘
         │
┌────────┴────────────┐
│ blog_internal_links │
│─────────────────────│
│ source_post_id (FK) │
│ target_post_id (FK) │
│ link_order          │
└─────────────────────┘
```

### 2.3 Supabase Storage Bucket

```sql
-- Create a public bucket for blog images
-- Execute via Supabase Dashboard > Storage > New Bucket

Bucket Name: blog-images
Public: Yes (allows direct URL access)
File Size Limit: 5MB
Allowed MIME Types: image/jpeg, image/png, image/webp, image/avif
```

**Image URL Pattern:**
```
https://seakhlgyzkerxabitgoo.supabase.co/storage/v1/object/public/blog-images/{filename}
```

### 2.4 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_internal_links ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read translations" ON blog_post_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_translations.post_id
      AND blog_posts.status = 'published'
    )
  );

CREATE POLICY "Public can read tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can read tag translations" ON blog_tag_translations
  FOR SELECT USING (true);

CREATE POLICY "Public can read post tags" ON blog_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.status = 'published'
    )
  );

CREATE POLICY "Public can read internal links" ON blog_internal_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_internal_links.source_post_id
      AND blog_posts.status = 'published'
    )
  );

-- Service role can do everything (for n8n/automation)
-- The service_role key bypasses RLS by default
```

---

## 3. Multilingual Routing & Page Generation

### 3.1 URL Structure

| Page | English URL | Hebrew URL |
|------|-------------|------------|
| Blog Index | `/en/blog` | `/he/blog` |
| Blog Post | `/en/blog/{slug}` | `/he/blog/{slug}` |
| Tag Filter | `/en/blog?tag={tag-slug}` | `/he/blog?tag={tag-slug}` |

**Key Principles:**
- Single `slug` shared across all languages (language-agnostic identifier)
- Locale prefix determines language of content
- No language suffix in slugs (not `/blog/vpn-guide-en`)
- Query params for tag filtering (preserves clean URLs)

### 3.2 File Structure (App Router)

```
src/app/[locale]/
├── blog/
│   ├── page.tsx                 # Blog index page
│   └── [slug]/
│       └── page.tsx             # Individual blog post page
```

### 3.3 Blog Index Page (`src/app/[locale]/blog/page.tsx`)

```typescript
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BlogIndex } from "@/components/blog/blog-index";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const baseUrl = "https://doppler.com";

  return {
    title: t("indexTitle"),
    description: t("indexDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: {
        en: `${baseUrl}/en/blog`,
        he: `${baseUrl}/he/blog`,
        "x-default": `${baseUrl}/en/blog`,
      },
    },
    openGraph: {
      title: t("indexTitle"),
      description: t("indexDescription"),
      url: `${baseUrl}/${locale}/blog`,
      locale: locale === "he" ? "he_IL" : "en_US",
      type: "website",
    },
  };
}

export default async function BlogIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tag } = await searchParams;
  setRequestLocale(locale);

  // Fetch posts happens in the component or via server action
  return <BlogIndex locale={locale} activeTagSlug={tag} />;
}
```

### 3.4 Blog Post Page (`src/app/[locale]/blog/[slug]/page.tsx`)

```typescript
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BlogPost } from "@/components/blog/blog-post";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate all post pages at build time
export async function generateStaticParams() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  const params: { locale: string; slug: string }[] = [];

  for (const post of posts || []) {
    for (const locale of routing.locales) {
      params.push({ locale, slug: post.slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = createClient();
  const baseUrl = "https://doppler.com";

  const { data: post } = await supabase
    .from("blog_posts")
    .select(`
      slug,
      image_url,
      blog_post_translations!inner (
        title,
        excerpt,
        meta_title,
        meta_description,
        og_title,
        og_description
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("blog_post_translations.locale", locale)
    .single();

  if (!post) return { title: "Not Found" };

  const translation = post.blog_post_translations[0];
  const title = translation.meta_title || translation.title;
  const description = translation.meta_description || translation.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog/${slug}`,
      languages: {
        en: `${baseUrl}/en/blog/${slug}`,
        he: `${baseUrl}/he/blog/${slug}`,
        "x-default": `${baseUrl}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: translation.og_title || title,
      description: translation.og_description || description,
      url: `${baseUrl}/${locale}/blog/${slug}`,
      locale: locale === "he" ? "he_IL" : "en_US",
      type: "article",
      images: post.image_url ? [{ url: post.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: translation.og_title || title,
      description: translation.og_description || description,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = createClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_post_translations!inner (*),
      blog_post_tags (
        blog_tags (
          slug,
          blog_tag_translations (locale, name)
        )
      ),
      blog_internal_links!source_post_id (
        target_post_id,
        link_order,
        blog_posts!target_post_id (
          slug,
          image_url,
          blog_post_translations (locale, title, excerpt)
        )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("blog_post_translations.locale", locale)
    .single();

  if (!post || error) {
    notFound();
  }

  return <BlogPost post={post} locale={locale} />;
}
```

### 3.5 Dynamic Sitemap Integration

Update `src/app/sitemap.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const locales = ["en", "he"];
const baseUrl = "https://doppler.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published");

  // Static pages
  const staticPages = ["", "/privacy", "/terms", "/blog"];
  const staticEntries = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "/blog" ? "daily" : "weekly" as const,
      priority: page === "" ? 1.0 : page === "/blog" ? 0.9 : 0.5,
    }))
  );

  // Blog post pages
  const blogEntries = (posts || []).flatMap((post) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  return [...staticEntries, ...blogEntries];
}
```

---

## 4. SEO & Indexing Requirements

### 4.1 Per-Page SEO Checklist

#### Blog Index Page
| Element | Value |
|---------|-------|
| `<title>` | "{locale-specific} Blog - Doppler VPN" (max 60 chars) |
| `<meta name="description">` | "{locale-specific description}" (max 160 chars) |
| `<link rel="canonical">` | `https://doppler.com/{locale}/blog` |
| `<link rel="alternate" hreflang="en">` | `https://doppler.com/en/blog` |
| `<link rel="alternate" hreflang="he">` | `https://doppler.com/he/blog` |
| `<link rel="alternate" hreflang="x-default">` | `https://doppler.com/en/blog` |
| OpenGraph `og:type` | `website` |
| OpenGraph `og:locale` | `en_US` or `he_IL` |

#### Blog Post Page
| Element | Value |
|---------|-------|
| `<title>` | `{meta_title \|\| title}` (max 60 chars) |
| `<meta name="description">` | `{meta_description \|\| excerpt}` (max 160 chars) |
| `<link rel="canonical">` | `https://doppler.com/{locale}/blog/{slug}` |
| `<link rel="alternate" hreflang="en">` | `https://doppler.com/en/blog/{slug}` |
| `<link rel="alternate" hreflang="he">` | `https://doppler.com/he/blog/{slug}` |
| `<link rel="alternate" hreflang="x-default">` | `https://doppler.com/en/blog/{slug}` |
| OpenGraph `og:type` | `article` |
| OpenGraph `og:image` | Post's `image_url` (1200x630 recommended) |
| Twitter `twitter:card` | `summary_large_image` |

### 4.2 Structured Data (JSON-LD)

#### Blog Post Article Schema

```typescript
// src/components/seo/blog-json-ld.tsx
export function BlogPostJsonLd({
  post,
  locale,
}: {
  post: BlogPostWithTranslation;
  locale: string;
}) {
  const translation = post.blog_post_translations[0];
  const baseUrl = "https://doppler.com";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: translation.title,
    description: translation.excerpt,
    image: post.image_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: post.author_name || "Doppler Team",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Doppler VPN",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${locale}/blog/${post.slug}`,
    },
    inLanguage: locale === "he" ? "he-IL" : "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}
```

#### Blog Index BreadcrumbList Schema

```typescript
export function BlogIndexJsonLd({ locale }: { locale: string }) {
  const baseUrl = "https://doppler.com";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/${locale}/blog`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
```

### 4.3 Image SEO Requirements

| Requirement | Implementation |
|-------------|----------------|
| Alt text | Locale-specific: `image_alt_en` / `image_alt_he` |
| Format | WebP or AVIF preferred (fallback to JPEG) |
| Size | 1200x630 for OG images, responsive for content |
| Lazy loading | Native `loading="lazy"` for below-fold images |
| Next.js Image | Use `next/image` for automatic optimization |

### 4.4 Robots & Indexing Rules

```typescript
// Update src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://doppler.com/sitemap.xml",
  };
}
```

---

## 5. UI Components

### 5.1 Blog Index Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVBAR                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           BLOG HEADER                                      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Title: "Doppler VPN Blog" (h1)                     │  │  │
│  │  │  Subtitle: "Privacy tips, security insights..."     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           TAG FILTER BAR                                   │  │
│  │  ┌─────┐ ┌──────────┐ ┌────────┐ ┌───────────┐ ┌───────┐  │  │
│  │  │ All │ │ Security │ │Privacy │ │VPN Guides │ │ Tips  │  │  │
│  │  └─────┘ └──────────┘ └────────┘ └───────────┘ └───────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           BLOG POST GRID (3 columns on desktop)            │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │   IMAGE     │  │   IMAGE     │  │   IMAGE     │        │  │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤        │  │
│  │  │ [Tag] [Tag] │  │ [Tag]       │  │ [Tag] [Tag] │        │  │
│  │  │ Title       │  │ Title       │  │ Title       │        │  │
│  │  │ Excerpt...  │  │ Excerpt...  │  │ Excerpt...  │        │  │
│  │  │ Date        │  │ Date        │  │ Date        │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │   ...       │  │   ...       │  │   ...       │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           PAGINATION (if needed)                           │  │
│  │           [1] [2] [3] ... [Next →]                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         FOOTER                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Component: `BlogIndex`**
- Fetches posts with active tag filter (via searchParams)
- Grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- Card click navigates to `/{locale}/blog/{slug}`
- Tag click updates URL with `?tag={tag-slug}`

### 5.2 Blog Post Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVBAR                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  BREADCRUMB: Home > Blog > {Post Title}                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ARTICLE HEADER                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [Tag] [Tag]                                        │  │  │
│  │  │  <h1>Article Title</h1>                             │  │  │
│  │  │  <p>Author • Published Date • 5 min read</p>        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FEATURED IMAGE                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                                                      │  │  │
│  │  │              [Full-width Image]                      │  │  │
│  │  │                                                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ARTICLE CONTENT (max-width: 768px, centered)              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  <article>                                          │  │  │
│  │  │    Rendered Markdown/HTML content                   │  │  │
│  │  │    - Headings (h2, h3)                              │  │  │
│  │  │    - Paragraphs                                     │  │  │
│  │  │    - Lists                                          │  │  │
│  │  │    - Code blocks                                    │  │  │
│  │  │    - Blockquotes                                    │  │  │
│  │  │  </article>                                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TAGS SECTION                                              │  │
│  │  ┌─────┐ ┌──────────┐ ┌────────┐                          │  │
│  │  │ Tag │ │ Tag      │ │ Tag    │                          │  │
│  │  └─────┘ └──────────┘ └────────┘                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  RELATED POSTS (Internal Links)                            │  │
│  │  <h2>Related Articles</h2>                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │ [Image]     │  │ [Image]     │  │ [Image]     │        │  │
│  │  │ Title       │  │ Title       │  │ Title       │        │  │
│  │  │ Excerpt...  │  │ Excerpt...  │  │ Excerpt...  │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  CTA SECTION                                               │  │
│  │  "Ready to protect your privacy? Try Doppler VPN today"    │  │
│  │  [Download Now]                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         FOOTER                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Component: `BlogPost`**
- Article content rendered via markdown parser (e.g., `react-markdown`)
- Prose styling via Tailwind Typography plugin
- Related posts from `blog_internal_links` table
- Tags link back to filtered blog index

### 5.3 Homepage Blog Section (Below "Get Started")

```
┌─────────────────────────────────────────────────────────────────┐
│  SECTION: LATEST FROM OUR BLOG                                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <SectionHeader>                                           │  │
│  │    Title: "Latest from Our Blog"                           │  │
│  │    Subtitle: "Privacy tips and VPN insights"               │  │
│  │  </SectionHeader>                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   BLOG CARD 1   │ │   BLOG CARD 2   │ │   BLOG CARD 3   │   │
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │   │
│  │ │   IMAGE     │ │ │ │   IMAGE     │ │ │ │   IMAGE     │ │   │
│  │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │   │
│  │ [Tag]           │ │ [Tag] [Tag]     │ │ [Tag]           │   │
│  │ <h3>Title</h3>  │ │ <h3>Title</h3>  │ │ <h3>Title</h3>  │   │
│  │ <p>Excerpt</p>  │ │ <p>Excerpt</p>  │ │ <p>Excerpt</p>  │   │
│  │ Read more →     │ │ Read more →     │ │ Read more →     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  [View All Posts →]                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component: `HomeBlogSection`**
- Fetches latest 3 published posts
- Reuses `BlogCard` component
- "View All Posts" links to `/{locale}/blog`
- Placed between CTA and Footer on homepage

### 5.4 Shared Components

```
src/components/blog/
├── blog-index.tsx           # Blog index page container
├── blog-post.tsx            # Blog post page container
├── blog-card.tsx            # Reusable post preview card
├── blog-tag-filter.tsx      # Tag filter bar component
├── blog-tags.tsx            # Tag badges display
├── blog-breadcrumb.tsx      # Breadcrumb navigation
├── blog-content.tsx         # Markdown content renderer
├── blog-related-posts.tsx   # Related posts section
├── blog-cta.tsx             # Post-article CTA
└── home-blog-section.tsx    # Homepage blog preview section
```

---

## 6. RTL (Hebrew) Handling

### 6.1 Layout-Level RTL

The existing infrastructure already sets `dir="rtl"` on `<html>` for Hebrew. Additional blog-specific considerations:

```typescript
// src/components/blog/blog-content.tsx
import { isRtlLocale } from "@/i18n/routing";

export function BlogContent({
  content,
  locale
}: {
  content: string;
  locale: string;
}) {
  const isRtl = isRtlLocale(locale);

  return (
    <article
      className={cn(
        "prose prose-invert max-w-none",
        // RTL-specific prose adjustments
        isRtl && "prose-rtl"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
```

### 6.2 Typography RTL Rules

Add to `globals.css`:

```css
/* RTL Typography for Blog */
[dir="rtl"] .prose {
  text-align: right;
}

[dir="rtl"] .prose h1,
[dir="rtl"] .prose h2,
[dir="rtl"] .prose h3,
[dir="rtl"] .prose h4 {
  text-align: right;
}

[dir="rtl"] .prose ul,
[dir="rtl"] .prose ol {
  padding-right: 1.5rem;
  padding-left: 0;
}

[dir="rtl"] .prose blockquote {
  border-right-width: 4px;
  border-left-width: 0;
  padding-right: 1rem;
  padding-left: 0;
}

[dir="rtl"] .prose code {
  direction: ltr;
  unicode-bidi: embed;
}
```

### 6.3 Component RTL Patterns

```typescript
// Use logical properties instead of left/right
// ❌ Bad
className="ml-4 text-left"

// ✅ Good
className="ms-4 text-start"

// For flexbox direction in RTL
className="flex flex-row rtl:flex-row-reverse"

// For absolute positioning
className="start-0 end-auto rtl:start-auto rtl:end-0"
```

### 6.4 Blog Card RTL Example

```typescript
export function BlogCard({ post, locale }: BlogCardProps) {
  const isRtl = isRtlLocale(locale);

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group block"
    >
      <Card className="overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[16/9]">
          <Image
            src={post.image_url}
            alt={isRtl ? post.image_alt_he : post.image_alt_en}
            fill
            className="object-cover"
          />
        </div>

        {/* Content - automatically RTL via parent dir */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map((tag) => (
              <Badge key={tag.slug}>{tag.name}</Badge>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-text-muted text-sm line-clamp-3">
            {post.excerpt}
          </p>

          <time className="text-xs text-text-muted mt-3 block">
            {formatDate(post.published_at, locale)}
          </time>
        </div>
      </Card>
    </Link>
  );
}
```

---

## 7. Content Ingestion Flow

### 7.1 Phase 1: SQL Demo Data

Insert initial demo posts via Supabase SQL Editor:

```sql
-- Insert a demo post
INSERT INTO blog_posts (slug, image_url, image_alt_en, image_alt_he, author_name, status, published_at)
VALUES (
  'why-vpn-matters-2024',
  'https://seakhlgyzkerxabitgoo.supabase.co/storage/v1/object/public/blog-images/vpn-importance.jpg',
  'Person using VPN on laptop for secure browsing',
  'אדם משתמש ב-VPN במחשב נייד לגלישה מאובטחת',
  'Doppler Team',
  'published',
  NOW()
);

-- Get the post ID
-- Assuming it's: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

-- Insert English translation
INSERT INTO blog_post_translations (post_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'en',
  'Why VPN Matters in 2024: Protecting Your Digital Privacy',
  'Discover why using a VPN is more important than ever in today''s connected world, and how Doppler VPN keeps you safe.',
  '## The Growing Need for Privacy\n\nIn an era where...',
  'Why VPN Matters in 2024 | Doppler VPN Blog',
  'Learn why VPN protection is essential in 2024 and how to safeguard your online privacy with Doppler VPN.'
);

-- Insert Hebrew translation
INSERT INTO blog_post_translations (post_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'he',
  'למה VPN חשוב ב-2024: הגנה על הפרטיות הדיגיטלית שלך',
  'גלו למה שימוש ב-VPN חשוב מתמיד בעולם המחובר של היום, ואיך Doppler VPN שומר עליכם.',
  '## הצורך הגובר בפרטיות\n\nבעידן שבו...',
  'למה VPN חשוב ב-2024 | בלוג Doppler VPN',
  'למדו למה הגנת VPN חיונית ב-2024 ואיך לשמור על הפרטיות המקוונת שלכם עם Doppler VPN.'
);
```

### 7.2 Phase 2: Manual Image Upload

1. Navigate to Supabase Dashboard > Storage
2. Select `blog-images` bucket
3. Upload image (recommended: 1200x630 for OG, additional sizes as needed)
4. Copy public URL
5. Update `blog_posts.image_url` with the URL

### 7.3 Phase 3: n8n + AI Automation (Future)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Trigger    │────▶│   AI Agent   │────▶│   Supabase   │
│  (Schedule/  │     │  (Generate   │     │   (Insert)   │
│   Webhook)   │     │   Content)   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Simnetiq    │
                     │  Dashboard   │
                     │  (Review)    │
                     └──────────────┘
```

**n8n Workflow Structure:**
1. **Trigger**: Schedule (daily/weekly) or webhook from Simnetiq
2. **AI Node**: Generate article content + translations via OpenAI/Claude
3. **Supabase Node**: Insert into `blog_posts` + `blog_post_translations`
4. **Notification**: Send to Simnetiq dashboard for review
5. **Approval Webhook**: Update `status` to `published`

**Required Supabase Connection:**
- Use `service_role` key for n8n (bypasses RLS)
- Stored securely in n8n credentials

---

## 8. Scalability & Future-Proofing

### 8.1 Performance Considerations

| Concern | Solution |
|---------|----------|
| Large number of posts | Implement pagination (12 posts per page) |
| Image optimization | Use Next.js Image component with Supabase CDN |
| Build time | Use ISR (Incremental Static Regeneration) with `revalidate: 3600` |
| Database queries | Add proper indexes (already defined in schema) |

### 8.2 Extensibility Points

| Feature | Implementation Approach |
|---------|------------------------|
| Add new language | Add locale to `routing.ts`, create translations, add hreflang |
| Add comments | New `blog_comments` table with moderation workflow |
| Add views/analytics | New `blog_post_views` table, increment on page load |
| Add search | Supabase full-text search on translations or Algolia |
| Add categories | Similar to tags, new table with hierarchy support |
| RSS Feed | Add `/feed.xml` route generating RSS from latest posts |

### 8.3 Content Format Support

The `content` field supports:
- **Markdown** (recommended): Rendered via `react-markdown`
- **HTML**: Rendered via `dangerouslySetInnerHTML` with sanitization
- **MDX** (future): For interactive blog posts

### 8.4 Caching Strategy

```typescript
// Recommended caching in page components
export const revalidate = 3600; // Revalidate every hour

// Or use on-demand revalidation via webhook
// POST /api/revalidate?path=/en/blog/my-post&secret=xxx
```

---

## 9. Self-Check Verification

| Requirement | Status |
|-------------|--------|
| Multilingual indexing (hreflang) | ✅ Implemented in `generateMetadata` |
| RTL support for Hebrew | ✅ Layout + Typography + Components |
| Clean URLs (`/{locale}/blog/{slug}`) | ✅ App Router structure |
| One image per post | ✅ `image_url` field in `blog_posts` |
| Tags with translations | ✅ `blog_tags` + `blog_tag_translations` |
| Internal links | ✅ `blog_internal_links` table |
| No blog editor UI | ✅ SQL + n8n + Simnetiq only |
| Google separate indexing per language | ✅ Canonical + hreflang + sitemap |

---

## 10. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Supabase project with provided credentials
- [ ] Run SQL schema creation scripts
- [ ] Create `blog-images` storage bucket
- [ ] Set up RLS policies
- [ ] Add Supabase client to Next.js (`@supabase/supabase-js` + `@supabase/ssr`)

### Phase 2: Core Components
- [ ] Create `/lib/supabase/client.ts` and `/lib/supabase/server.ts`
- [ ] Build `BlogCard` component
- [ ] Build `BlogIndex` page
- [ ] Build `BlogPost` page
- [ ] Build `HomeBlogSection` component

### Phase 3: SEO & Routing
- [ ] Add blog translations to `messages/en.json` and `messages/he.json`
- [ ] Implement `generateMetadata` for blog pages
- [ ] Update sitemap to include blog posts
- [ ] Add JSON-LD structured data

### Phase 4: RTL Polish
- [ ] Add RTL prose styles
- [ ] Test all blog components in Hebrew
- [ ] Verify image alt text switching

### Phase 5: Content & Testing
- [ ] Insert demo blog posts via SQL
- [ ] Upload demo images to Supabase Storage
- [ ] Test full flow in both languages
- [ ] Verify Google Search Console indexing

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Architecture Specification*
