"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BlogCard } from "./blog-card";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { staggerContainerVariants } from "@/lib/animations";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
  tags: { slug: string; name: string }[];
}

interface HomeBlogSectionProps {
  posts: BlogPost[];
  locale: string;
}

export function HomeBlogSection({ posts, locale }: HomeBlogSectionProps) {
  const t = useTranslations("blog");

  if (posts.length === 0) return null;

  return (
    <Section id="blog">
      <SectionHeader
        title={t("latestPosts")}
        subtitle={t("latestPostsSubtitle")}
      />

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
      >
        {posts.slice(0, 3).map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            imageUrl={post.imageUrl}
            imageAlt={post.imageAlt}
            publishedAt={post.publishedAt}
            tags={post.tags}
            locale={locale}
            readMoreText={t("readMore")}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button href="/blog" variant="outline" size="lg">
          {t("viewAllPosts")}
        </Button>
      </motion.div>
    </Section>
  );
}
