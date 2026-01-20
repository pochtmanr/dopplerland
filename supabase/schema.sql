-- =====================================================
-- DOPPLER VPN BLOG SCHEMA
-- Run this in Supabase SQL Editor to set up the blog
-- =====================================================

-- =====================================================
-- BLOG POSTS (Language-agnostic base record)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT,
  image_alt_en VARCHAR(255),
  image_alt_he VARCHAR(255),
  author_name VARCHAR(100) DEFAULT 'Doppler Team',
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- =====================================================
-- BLOG POST TRANSLATIONS (One row per language)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,

  -- Content
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,

  -- SEO Fields
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  og_title VARCHAR(70),
  og_description VARCHAR(200),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_post_locale UNIQUE (post_id, locale),
  CONSTRAINT valid_locale CHECK (locale IN ('en', 'he'))
);

-- Indexes for fast locale lookups
CREATE INDEX IF NOT EXISTS idx_translations_post_locale ON blog_post_translations(post_id, locale);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON blog_post_translations(locale);

-- =====================================================
-- TAGS (Language-agnostic)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON blog_tags(slug);

-- =====================================================
-- TAG TRANSLATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_tag_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,

  CONSTRAINT unique_tag_locale UNIQUE (tag_id, locale),
  CONSTRAINT valid_locale CHECK (locale IN ('en', 'he'))
);

CREATE INDEX IF NOT EXISTS idx_tag_translations_tag_locale ON blog_tag_translations(tag_id, locale);

-- =====================================================
-- POST-TAG JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON blog_post_tags(tag_id);

-- =====================================================
-- INTERNAL LINKS (For related posts)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  link_order INT DEFAULT 0,

  CONSTRAINT no_self_link CHECK (source_post_id != target_post_id),
  CONSTRAINT unique_link UNIQUE (source_post_id, target_post_id)
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON blog_internal_links(source_post_id);

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
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_translations_updated_at ON blog_post_translations;
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON blog_post_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_internal_links ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public can read translations" ON blog_post_translations;
CREATE POLICY "Public can read translations" ON blog_post_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_translations.post_id
      AND blog_posts.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Public can read tags" ON blog_tags;
CREATE POLICY "Public can read tags" ON blog_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read tag translations" ON blog_tag_translations;
CREATE POLICY "Public can read tag translations" ON blog_tag_translations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read post tags" ON blog_post_tags;
CREATE POLICY "Public can read post tags" ON blog_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Public can read internal links" ON blog_internal_links;
CREATE POLICY "Public can read internal links" ON blog_internal_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_internal_links.source_post_id
      AND blog_posts.status = 'published'
    )
  );

-- Note: Service role key bypasses RLS for n8n/automation writes
