-- =====================================================
-- PHASE 1 MIGRATION: Admin Panel Foundation
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE ADMINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TODO: Replace with your actual Google email
INSERT INTO admins (email, role) VALUES ('YOUR_EMAIL@gmail.com', 'admin');

-- =====================================================
-- 2. ADD image_alt TO TRANSLATIONS TABLE
-- =====================================================
ALTER TABLE blog_post_translations ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- Migrate existing data from blog_posts into translations
UPDATE blog_post_translations
SET image_alt = bp.image_alt_en
FROM blog_posts bp
WHERE blog_post_translations.post_id = bp.id
  AND blog_post_translations.locale = 'en'
  AND bp.image_alt_en IS NOT NULL;

UPDATE blog_post_translations
SET image_alt = bp.image_alt_he
FROM blog_posts bp
WHERE blog_post_translations.post_id = bp.id
  AND blog_post_translations.locale = 'he'
  AND bp.image_alt_he IS NOT NULL;

-- Drop old columns from blog_posts
ALTER TABLE blog_posts DROP COLUMN IF EXISTS image_alt_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS image_alt_he;

-- =====================================================
-- 3. REMOVE LOCALE ENUM CONSTRAINTS
--    Allow any locale string (21 languages)
-- =====================================================
ALTER TABLE blog_post_translations DROP CONSTRAINT IF EXISTS valid_locale;
ALTER TABLE blog_tag_translations DROP CONSTRAINT IF EXISTS valid_locale;

-- =====================================================
-- 4. CREATE TRANSLATION_JOBS TABLE (audit log)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_translation_jobs_post ON translation_jobs(post_id);

-- =====================================================
-- 5. RLS FOR ADMINS TABLE
-- =====================================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admins can read the admin list
DROP POLICY IF EXISTS "Admins can read admin list" ON admins;
CREATE POLICY "Admins can read admin list" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
    )
  );

-- Only role='admin' can manage other admins
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
CREATE POLICY "Super admins can manage admins" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'admin'
    )
  );

-- =====================================================
-- 6. ADMIN WRITE POLICIES ON EXISTING TABLES
--    (Public read policies already exist from schema.sql)
-- =====================================================

-- blog_posts: admins can insert, update, delete
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- blog_post_translations: admins can manage
DROP POLICY IF EXISTS "Admins can manage translations" ON blog_post_translations;
CREATE POLICY "Admins can manage translations" ON blog_post_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- blog_tags: admins can manage
DROP POLICY IF EXISTS "Admins can manage tags" ON blog_tags;
CREATE POLICY "Admins can manage tags" ON blog_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- blog_tag_translations: admins can manage
DROP POLICY IF EXISTS "Admins can manage tag translations" ON blog_tag_translations;
CREATE POLICY "Admins can manage tag translations" ON blog_tag_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- blog_post_tags: admins can manage
DROP POLICY IF EXISTS "Admins can manage post tags" ON blog_post_tags;
CREATE POLICY "Admins can manage post tags" ON blog_post_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- blog_internal_links: admins can manage
DROP POLICY IF EXISTS "Admins can manage internal links" ON blog_internal_links;
CREATE POLICY "Admins can manage internal links" ON blog_internal_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- translation_jobs: admins can manage
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage translation jobs" ON translation_jobs;
CREATE POLICY "Admins can manage translation jobs" ON translation_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. IMPORTANT: After first Google login, run this to
--    link your auth.users ID to the admins table:
-- =====================================================
-- SELECT id, email FROM auth.users;
-- UPDATE admins SET user_id = 'YOUR-AUTH-USER-UUID' WHERE email = 'YOUR_EMAIL@gmail.com';
