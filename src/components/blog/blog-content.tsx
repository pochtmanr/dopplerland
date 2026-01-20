"use client";

import ReactMarkdown from "react-markdown";
import { isRtlLocale } from "@/i18n/routing";

interface BlogContentProps {
  content: string;
  locale: string;
}

export function BlogContent({ content, locale }: BlogContentProps) {
  const isRtl = isRtlLocale(locale);

  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className={`
        prose prose-invert max-w-none
        prose-headings:font-semibold prose-headings:text-text-primary prose-headings:tracking-tight
        prose-h2:text-[2.25rem] prose-h2:mt-20 prose-h2:mb-6 prose-h2:pt-4
        prose-h3:text-[1.75rem] prose-h3:mt-14 prose-h3:mb-4 prose-h3:pt-2
        prose-h4:text-[1.375rem] prose-h4:mt-10 prose-h4:mb-3
        prose-p:text-text-secondary prose-p:text-[1.25rem] prose-p:leading-[1.9] prose-p:mb-6
        prose-a:text-accent-teal prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-accent-teal/50 hover:prose-a:decoration-accent-teal prose-a:transition-colors
        prose-strong:text-text-primary prose-strong:font-semibold
        prose-ul:text-text-secondary prose-ul:my-8 prose-ol:text-text-secondary prose-ol:my-8
        prose-li:text-[1.25rem] prose-li:leading-[1.9] prose-li:mb-4 prose-li:marker:text-accent-teal
        prose-blockquote:border-l-4 prose-blockquote:border-accent-teal prose-blockquote:bg-white/5 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-e-xl prose-blockquote:not-italic prose-blockquote:text-text-secondary prose-blockquote:text-[1.25rem] prose-blockquote:my-12
        prose-code:text-accent-teal-light prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-lg prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-bg-secondary prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:my-12
        prose-img:rounded-2xl prose-img:my-14
        prose-hr:border-white/20 prose-hr:my-16
        ${isRtl ? "text-right" : "text-left"}
      `}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
