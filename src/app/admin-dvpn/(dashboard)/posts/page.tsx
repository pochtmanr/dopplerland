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
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }

  return (data as unknown as PostRow[]) || [];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TemplateBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-text-muted">—</span>;

  const styles: Record<string, string> = {
    "quick-take": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    analysis: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    meme: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    roundup: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
      }`}
    >
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-green-500/10 text-green-400 border-green-500/20",
    draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.draft
      }`}
    >
      {status}
    </span>
  );
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Blog Posts</h1>
          <p className="text-text-muted text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin-dvpn/posts/new"
          className="inline-flex items-center gap-2 bg-accent-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-teal-light transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Post
        </Link>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-overlay/10 rounded-xl overflow-hidden">
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
                    <span className="text-sm text-text-muted">
                      {translationCount}/21
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatDate(post.published_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin-dvpn/posts/${post.id}`}
                        className="text-sm text-accent-teal hover:text-accent-teal-light transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin-dvpn/posts/${post.id}/translations`}
                        className="text-sm text-text-muted hover:text-text-primary transition-colors"
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
  );
}
