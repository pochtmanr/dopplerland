-- =====================================================
-- ROLLBACK: Remove all blog system objects
-- Safe: Only drops blog-specific objects, never VPN data
-- =====================================================

BEGIN;

-- 1. Drop storage policies (before bucket)
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- 2. Delete storage bucket (and all files in it)
DELETE FROM storage.objects WHERE bucket_id = 'blog-images';
DELETE FROM storage.buckets WHERE id = 'blog-images';

-- 3. Drop RLS policies
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Public can read translations" ON blog_post_translations;
DROP POLICY IF EXISTS "Public can read tags" ON blog_tags;
DROP POLICY IF EXISTS "Public can read tag translations" ON blog_tag_translations;
DROP POLICY IF EXISTS "Public can read post tags" ON blog_post_tags;
DROP POLICY IF EXISTS "Public can read internal links" ON blog_internal_links;
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can manage translations" ON blog_post_translations;
DROP POLICY IF EXISTS "Admins can manage tags" ON blog_tags;
DROP POLICY IF EXISTS "Admins can manage tag translations" ON blog_tag_translations;
DROP POLICY IF EXISTS "Admins can manage post tags" ON blog_post_tags;
DROP POLICY IF EXISTS "Admins can manage internal links" ON blog_internal_links;
DROP POLICY IF EXISTS "Admins can manage translation jobs" ON translation_jobs;
DROP POLICY IF EXISTS "Admins can read admin list" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;

-- 4. Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS blog_internal_links CASCADE;
DROP TABLE IF EXISTS blog_post_tags CASCADE;
DROP TABLE IF EXISTS blog_tag_translations CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_post_translations CASCADE;
DROP TABLE IF EXISTS translation_jobs CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 5. Drop functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS update_updated_at();

COMMIT;
