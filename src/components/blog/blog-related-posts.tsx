"use client";

import { motion } from "framer-motion";
import { BlogCard } from "./blog-card";
import { staggerContainerVariants } from "@/lib/animations";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
}

interface BlogRelatedPostsProps {
  posts: RelatedPost[];
  locale: string;
  title: string;
  readMoreText: string;
}

export function BlogRelatedPosts({
  posts,
  locale,
  title,
  readMoreText,
}: BlogRelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-white/10">
      <h2 className="text-2xl font-semibold text-text-primary mb-8">{title}</h2>

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            imageUrl={post.imageUrl}
            imageAlt={post.imageAlt}
            publishedAt={post.publishedAt}
            tags={[]}
            locale={locale}
            readMoreText={readMoreText}
          />
        ))}
      </motion.div>
    </section>
  );
}
