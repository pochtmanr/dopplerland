-- =====================================================
-- FIX: Infinite RLS recursion on admins table
-- Run this in Supabase SQL Editor
-- =====================================================
-- Problem: The admins table RLS policy queries the admins
-- table itself, causing infinite recursion. All other
-- tables' admin policies also query admins, triggering
-- the same loop → 500 error on ALL queries.
-- =====================================================

-- 1. Create a SECURITY DEFINER function that bypasses RLS
--    to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to check if user is a super admin (role = 'admin')
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Fix admins table policies (the source of recursion)
DROP POLICY IF EXISTS "Admins can read admin list" ON admins;
CREATE POLICY "Admins can read admin list" ON admins
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
CREATE POLICY "Super admins can manage admins" ON admins
  FOR ALL USING (is_super_admin());

-- 3. Fix all other tables to use the function instead of subquery
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage translations" ON blog_post_translations;
CREATE POLICY "Admins can manage translations" ON blog_post_translations
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage tags" ON blog_tags;
CREATE POLICY "Admins can manage tags" ON blog_tags
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage tag translations" ON blog_tag_translations;
CREATE POLICY "Admins can manage tag translations" ON blog_tag_translations
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage post tags" ON blog_post_tags;
CREATE POLICY "Admins can manage post tags" ON blog_post_tags
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage internal links" ON blog_internal_links;
CREATE POLICY "Admins can manage internal links" ON blog_internal_links
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage translation jobs" ON translation_jobs;
CREATE POLICY "Admins can manage translation jobs" ON translation_jobs
  FOR ALL USING (is_admin());
