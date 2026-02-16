interface BlogPostJsonLdProps {
  title: string;
  description: string;
  imageUrl: string | null;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
  slug: string;
  locale: string;
}

export function BlogPostJsonLd({
  title,
  description,
  imageUrl,
  authorName,
  publishedAt,
  updatedAt,
  slug,
  locale,
}: BlogPostJsonLdProps) {
  const baseUrl = "https://dopplervpn.org";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: imageUrl || `${baseUrl}/images/iosdopplerlogo.png`,
    datePublished: publishedAt || undefined,
    dateModified: updatedAt,
    author: {
      "@type": "Organization",
      name: authorName || "Doppler Team",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Doppler VPN",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/iosdopplerlogo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${locale}/blog/${slug}`,
    },
    inLanguage: locale === "he" ? "he-IL" : "en-US",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "he" ? "בית" : "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "he" ? "בלוג" : "Blog",
        item: `${baseUrl}/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${baseUrl}/${locale}/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
