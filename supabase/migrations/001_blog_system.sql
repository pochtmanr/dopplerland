-- =====================================================
-- DOPPLER BLOG SYSTEM — Consolidated Migration
-- Safe, idempotent, non-destructive to existing VPN data
-- =====================================================
-- Run in: Supabase SQL Editor (or supabase db push)
-- Rollback: supabase/migrations/001_blog_system_rollback.sql
-- =====================================================

BEGIN;

-- =====================================================
-- PRE-FLIGHT: Verify no table name conflicts
-- (This will silently succeed if tables don't exist yet,
--  or safely skip creation via IF NOT EXISTS)
-- =====================================================

-- =====================================================
-- 1. TABLES
-- =====================================================

-- 1a. Blog Posts (language-agnostic base record)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT,
  author_name VARCHAR(100) DEFAULT 'Doppler Team',
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- 1b. Blog Post Translations (one row per language per post)
CREATE TABLE IF NOT EXISTS blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,

  -- Content
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_alt TEXT,

  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  og_title VARCHAR(70),
  og_description VARCHAR(200),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_post_locale UNIQUE (post_id, locale)
  -- No locale enum constraint — supports all 21 languages
);

-- 1c. Tags (language-agnostic)
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Tag Translations
CREATE TABLE IF NOT EXISTS blog_tag_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,

  CONSTRAINT unique_tag_locale UNIQUE (tag_id, locale)
  -- No locale enum constraint — supports all 21 languages
);

-- 1e. Post-Tag Junction
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, tag_id)
);

-- 1f. Internal Links (related posts)
CREATE TABLE IF NOT EXISTS blog_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  link_order INT DEFAULT 0,

  CONSTRAINT no_self_link CHECK (source_post_id != target_post_id),
  CONSTRAINT unique_link UNIQUE (source_post_id, target_post_id)
);

-- 1g. Admins (links to auth.users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1h. Translation Jobs (AI audit log)
CREATE TABLE IF NOT EXISTS translation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  model TEXT,
  tokens_used INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

CREATE INDEX IF NOT EXISTS idx_translations_post_locale ON blog_post_translations(post_id, locale);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON blog_post_translations(locale);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_tag_translations_tag_locale ON blog_tag_translations(tag_id, locale);

CREATE INDEX IF NOT EXISTS idx_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON blog_post_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON blog_internal_links(source_post_id);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_post ON translation_jobs(post_id);

-- =====================================================
-- 3. TRIGGER FUNCTION (updated_at auto-update)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply to blog_post_translations
DROP TRIGGER IF EXISTS update_translations_updated_at ON blog_post_translations;
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON blog_post_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. SECURITY DEFINER FUNCTIONS (bypass RLS safely)
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES — Public Read Access
-- =====================================================

-- blog_posts: anyone can read published posts
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- blog_post_translations: anyone can read translations of published posts
DROP POLICY IF EXISTS "Public can read translations" ON blog_post_translations;
CREATE POLICY "Public can read translations" ON blog_post_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_translations.post_id
      AND blog_posts.status = 'published'
    )
  );

-- blog_tags: anyone can read
DROP POLICY IF EXISTS "Public can read tags" ON blog_tags;
CREATE POLICY "Public can read tags" ON blog_tags
  FOR SELECT USING (true);

-- blog_tag_translations: anyone can read
DROP POLICY IF EXISTS "Public can read tag translations" ON blog_tag_translations;
CREATE POLICY "Public can read tag translations" ON blog_tag_translations
  FOR SELECT USING (true);

-- blog_post_tags: anyone can read for published posts
DROP POLICY IF EXISTS "Public can read post tags" ON blog_post_tags;
CREATE POLICY "Public can read post tags" ON blog_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.status = 'published'
    )
  );

-- blog_internal_links: anyone can read for published posts
DROP POLICY IF EXISTS "Public can read internal links" ON blog_internal_links;
CREATE POLICY "Public can read internal links" ON blog_internal_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_internal_links.source_post_id
      AND blog_posts.status = 'published'
    )
  );

-- =====================================================
-- 7. RLS POLICIES — Admin Write Access
-- =====================================================

-- admins table
DROP POLICY IF EXISTS "Admins can read admin list" ON admins;
CREATE POLICY "Admins can read admin list" ON admins
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
CREATE POLICY "Super admins can manage admins" ON admins
  FOR ALL USING (is_super_admin());

-- blog_posts
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL USING (is_admin());

-- blog_post_translations
DROP POLICY IF EXISTS "Admins can manage translations" ON blog_post_translations;
CREATE POLICY "Admins can manage translations" ON blog_post_translations
  FOR ALL USING (is_admin());

-- blog_tags
DROP POLICY IF EXISTS "Admins can manage tags" ON blog_tags;
CREATE POLICY "Admins can manage tags" ON blog_tags
  FOR ALL USING (is_admin());

-- blog_tag_translations
DROP POLICY IF EXISTS "Admins can manage tag translations" ON blog_tag_translations;
CREATE POLICY "Admins can manage tag translations" ON blog_tag_translations
  FOR ALL USING (is_admin());

-- blog_post_tags
DROP POLICY IF EXISTS "Admins can manage post tags" ON blog_post_tags;
CREATE POLICY "Admins can manage post tags" ON blog_post_tags
  FOR ALL USING (is_admin());

-- blog_internal_links
DROP POLICY IF EXISTS "Admins can manage internal links" ON blog_internal_links;
CREATE POLICY "Admins can manage internal links" ON blog_internal_links
  FOR ALL USING (is_admin());

-- translation_jobs
DROP POLICY IF EXISTS "Admins can manage translation jobs" ON translation_jobs;
CREATE POLICY "Admins can manage translation jobs" ON translation_jobs
  FOR ALL USING (is_admin());

-- =====================================================
-- 8. SEED ADMIN USER
-- =====================================================

INSERT INTO admins (email, role)
VALUES ('pochtmanrca@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 9. STORAGE BUCKET FOR BLOG IMAGES
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read blog images (public bucket)
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Storage policy: admins can upload blog images
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
CREATE POLICY "Admins can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND is_admin()
  );

-- Storage policy: admins can update/replace blog images
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
CREATE POLICY "Admins can update blog images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blog-images'
    AND is_admin()
  );

-- Storage policy: admins can delete blog images
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
CREATE POLICY "Admins can delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND is_admin()
  );

COMMIT;

-- =====================================================
-- POST-MIGRATION MANUAL STEP:
-- After your first Google OAuth login, link your auth
-- user to the admins table:
--
--   SELECT id, email FROM auth.users WHERE email = 'pochtmanrca@gmail.com';
--   UPDATE admins SET user_id = '<UUID-FROM-ABOVE>' WHERE email = 'pochtmanrca@gmail.com';
--
-- =====================================================
