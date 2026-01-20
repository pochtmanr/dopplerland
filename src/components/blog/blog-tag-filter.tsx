"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";

interface Tag {
  slug: string;
  name: string;
}

interface BlogTagFilterProps {
  tags: Tag[];
  activeTagSlug: string | null;
  allPostsLabel: string;
  locale: string;
}

export function BlogTagFilter({
  tags,
  activeTagSlug,
  allPostsLabel,
  locale,
}: BlogTagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTagClick = (tagSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tagSlug) {
      params.set("tag", tagSlug);
    } else {
      params.delete("tag");
    }

    const newUrl = params.toString()
      ? `/${locale}${pathname}?${params.toString()}`
      : `/${locale}${pathname}`;

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-10">
      <button
        onClick={() => handleTagClick(null)}
        className={`
          px-4 py-2 rounded-full text-sm font-medium transition-all
          ${
            activeTagSlug === null
              ? "bg-accent-teal text-white"
              : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
          }
        `}
      >
        {allPostsLabel}
      </button>

      {tags.map((tag) => (
        <button
          key={tag.slug}
          onClick={() => handleTagClick(tag.slug)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              activeTagSlug === tag.slug
                ? "bg-accent-teal text-white"
                : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
            }
          `}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
