"use client";

import { BlogCard } from "./blog-card";
import { Reveal } from "@/components/ui/reveal";

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
    <section className="mt-16 pt-12 border-t border-overlay/10">
      <h2 className="text-2xl font-semibold text-text-primary mb-8">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, i) => (
          <Reveal key={post.slug} delay={i * 50}>
            <BlogCard
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
          </Reveal>
        ))}
      </div>
    </section>
  );
}
