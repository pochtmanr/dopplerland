"use client";

import { useState } from "react";
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

const MAX_VISIBLE_TAGS = 6;

export function BlogTagFilter({
  tags,
  activeTagSlug,
  allPostsLabel,
  locale,
}: BlogTagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

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

  // If the active tag is beyond the visible limit, always show it
  const activeTagIndex = tags.findIndex((t) => t.slug === activeTagSlug);
  const needsTruncation = tags.length > MAX_VISIBLE_TAGS;
  const visibleTags = expanded
    ? tags
    : tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = tags.length - MAX_VISIBLE_TAGS;

  // If active tag is hidden, swap it into the visible set
  if (!expanded && needsTruncation && activeTagIndex >= MAX_VISIBLE_TAGS) {
    visibleTags[MAX_VISIBLE_TAGS - 1] = tags[activeTagIndex];
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-10">
      <button
        onClick={() => handleTagClick(null)}
        className={`
          px-4 py-2 rounded-full text-sm font-medium transition-all
          ${
            activeTagSlug === null
              ? "bg-accent-teal text-white"
              : "bg-overlay/5 text-text-muted hover:bg-overlay/10 hover:text-text-primary"
          }
        `}
      >
        {allPostsLabel}
      </button>

      {visibleTags.map((tag) => (
        <button
          key={tag.slug}
          onClick={() => handleTagClick(tag.slug)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              activeTagSlug === tag.slug
                ? "bg-accent-teal text-white"
                : "bg-overlay/5 text-text-muted hover:bg-overlay/10 hover:text-text-primary"
            }
          `}
        >
          {tag.name}
        </button>
      ))}

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-overlay/5 text-text-muted hover:bg-overlay/10 hover:text-text-primary"
        >
          {expanded ? "−" : `+${hiddenCount}`}
        </button>
      )}
    </div>
  );
}
