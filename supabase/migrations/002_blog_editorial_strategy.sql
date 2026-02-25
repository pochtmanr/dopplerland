-- =====================================================
-- BLOG EDITORIAL STRATEGY — New tracking columns
-- Safe, idempotent, non-destructive
-- =====================================================

-- Add template_type column (quick-take, analysis, meme, roundup)
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) DEFAULT 'quick-take';

-- Add check constraint separately (IF NOT EXISTS not supported for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_template_type'
  ) THEN
    ALTER TABLE blog_posts
      ADD CONSTRAINT valid_template_type
      CHECK (template_type IN ('quick-take', 'analysis', 'meme', 'roundup'));
  END IF;
END $$;

-- Add source_combo column (tracks which source combination produced this post)
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS source_combo TEXT;

-- Add topic_category column (tracks which of the 9 categories)
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS topic_category VARCHAR(50);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_template_type ON blog_posts(template_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_topic_category ON blog_posts(topic_category);
