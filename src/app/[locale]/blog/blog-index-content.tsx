"use client";

import { BlogCard, BlogTagFilter } from "@/components/blog";
import { Reveal } from "@/components/ui/reveal";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
  tags: { slug: string; name: string }[];
}

interface Tag {
  slug: string;
  name: string;
}

interface BlogIndexContentProps {
  posts: BlogPost[];
  tags: Tag[];
  activeTagSlug: string | null;
  locale: string;
  translations: {
    allPosts: string;
    readMore: string;
    noPosts: string;
    noPostsDescription: string;
  };
}

export function BlogIndexContent({
  posts,
  tags,
  activeTagSlug,
  locale,
  translations,
}: BlogIndexContentProps) {
  return (
    <>
      {tags.length > 0 && (
        <BlogTagFilter
          tags={tags}
          activeTagSlug={activeTagSlug}
          allPostsLabel={translations.allPosts}
          locale={locale}
        />
      )}

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 30}>
              <BlogCard
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                imageUrl={post.imageUrl}
                imageAlt={post.imageAlt}
                publishedAt={post.publishedAt}
                tags={post.tags}
                locale={locale}
                readMoreText={translations.readMore}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-text-primary mb-2">{translations.noPosts}</p>
          <p className="text-text-muted">{translations.noPostsDescription}</p>
        </div>
      )}
    </>
  );
}
