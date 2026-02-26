import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PostRow {
  id: string;
  slug: string;
  status: string;
  template_type: string | null;
  published_at: string | null;
  updated_at: string;
  author_name: string;
  blog_post_translations: {
    locale: string;
    title: string;
  }[];
}

async function getPosts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      slug,
      status,
      template_type,
      published_at,
      updated_at,
      author_name,
      blog_post_translations (
        locale,
        title
      )
    `
    )
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }

  return (data as unknown as PostRow[]) || [];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "\u2014";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(dateString: string | null): string {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

const templateIcons: Record<string, { bg: string; color: string; label: string }> = {
  "quick-take": { bg: "bg-blue-500/10", color: "text-blue-400", label: "Quick Take" },
  analysis: { bg: "bg-purple-500/10", color: "text-purple-400", label: "Analysis" },
  meme: { bg: "bg-yellow-500/10", color: "text-yellow-400", label: "Meme" },
  roundup: { bg: "bg-green-500/10", color: "text-green-400", label: "Roundup" },
};

function TemplateBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-text-muted">\u2014</span>;
  const t = templateIcons[type];
  if (!t) return <span className="text-xs text-text-muted">{type}</span>;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.bg} ${t.color}`}>
      {t.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    published: { bg: "bg-green-500/10", color: "text-green-400" },
    draft: { bg: "bg-yellow-500/10", color: "text-yellow-400" },
    archived: { bg: "bg-gray-500/10", color: "text-gray-400" },
  };
  const s = styles[status] || styles.draft;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-green-400" : status === "draft" ? "bg-yellow-400" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function getPostIcon(type: string | null) {
  const t = type ? templateIcons[type] : null;
  return {
    bg: t?.bg || "bg-accent-teal/10",
    color: t?.color || "text-accent-teal",
  };
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Blog Posts</h1>
          <p className="text-text-muted text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
            {publishedCount > 0 && <span className="text-green-400 ml-1">({publishedCount} published)</span>}
            {draftCount > 0 && <span className="text-yellow-400 ml-1">({draftCount} draft{draftCount !== 1 ? "s" : ""})</span>}
          </p>
        </div>
        <Link
          href="/admin-dvpn/posts/new"
          className="inline-flex items-center gap-2 bg-accent-teal text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-accent-teal-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Post</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Total</p>
            <p className="text-lg font-semibold text-text-primary leading-tight">{posts.length}</p>
          </div>
        </div>
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Published</p>
            <p className="text-lg font-semibold text-green-400 leading-tight">{publishedCount}</p>
          </div>
        </div>
        <div className="bg-bg-secondary border border-overlay/10 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Drafts</p>
            <p className="text-lg font-semibold text-yellow-400 leading-tight">{draftCount}</p>
          </div>
        </div>
      </div>

      {/* Table - desktop */}
      <div className="hidden md:block bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-overlay/10">
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Template
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Languages
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Published
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-overlay/5">
              {posts.map((post) => {
                const enTitle =
                  post.blog_post_translations.find((t) => t.locale === "en")
                    ?.title ||
                  post.blog_post_translations[0]?.title ||
                  post.slug;
                const translationCount = post.blog_post_translations.length;

                return (
                  <tr
                    key={post.id}
                    className="hover:bg-overlay/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {enTitle}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          /{post.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4">
                      <TemplateBadge type={post.template_type} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        <span className="text-sm text-text-muted">
                          {translationCount}/21
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(post.published_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(post.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin-dvpn/posts/${post.id}`}
                          className="px-2.5 py-1 text-xs text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin-dvpn/posts/${post.id}/translations`}
                          className="px-2.5 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/10 rounded-lg transition-colors"
                        >
                          Translate
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-text-muted"
                  >
                    No posts yet.{" "}
                    <Link
                      href="/admin-dvpn/posts/new"
                      className="text-accent-teal hover:underline"
                    >
                      Create your first post
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - mobile */}
      <div className="md:hidden space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No posts yet.{" "}
            <Link
              href="/admin-dvpn/posts/new"
              className="text-accent-teal hover:underline"
            >
              Create your first post
            </Link>
          </div>
        ) : (
          posts.map((post) => {
            const enTitle =
              post.blog_post_translations.find((t) => t.locale === "en")
                ?.title ||
              post.blog_post_translations[0]?.title ||
              post.slug;
            const translationCount = post.blog_post_translations.length;
            const icon = getPostIcon(post.template_type);

            return (
              <div
                key={post.id}
                className="bg-bg-secondary border border-overlay/10 rounded-lg p-3 hover:bg-overlay/5 active:scale-[0.98] transition-all"
              >
                {/* Row 1: icon + title + status */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${icon.bg} flex items-center justify-center ${icon.color} shrink-0`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate min-w-0 flex-1">{enTitle}</p>
                  <StatusBadge status={post.status} />
                </div>

                {/* Row 2: meta + actions */}
                <div className="flex items-center justify-between mt-2 ml-[42px]">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {post.template_type && <TemplateBadge type={post.template_type} />}
                    <span>{translationCount}/21</span>
                    <span>
                      {post.published_at
                        ? formatRelative(post.published_at)
                        : formatRelative(post.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin-dvpn/posts/${post.id}`}
                      className="px-2 py-1 text-xs text-accent-teal hover:bg-accent-teal/10 rounded-md transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin-dvpn/posts/${post.id}/translations`}
                      className="px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-overlay/10 rounded-md transition-colors"
                    >
                      Translate
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
