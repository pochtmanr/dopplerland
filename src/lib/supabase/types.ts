export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          image_url: string | null;
          image_alt_en: string | null;
          image_alt_he: string | null;
          author_name: string;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          image_url?: string | null;
          image_alt_en?: string | null;
          image_alt_he?: string | null;
          author_name?: string;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          image_url?: string | null;
          image_alt_en?: string | null;
          image_alt_he?: string | null;
          author_name?: string;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_post_translations: {
        Row: {
          id: string;
          post_id: string;
          locale: "en" | "he";
          title: string;
          excerpt: string;
          content: string;
          meta_title: string | null;
          meta_description: string | null;
          og_title: string | null;
          og_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          locale: "en" | "he";
          title: string;
          excerpt: string;
          content: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          locale?: "en" | "he";
          title?: string;
          excerpt?: string;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_tags: {
        Row: {
          id: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          created_at?: string;
        };
      };
      blog_tag_translations: {
        Row: {
          id: string;
          tag_id: string;
          locale: "en" | "he";
          name: string;
        };
        Insert: {
          id?: string;
          tag_id: string;
          locale: "en" | "he";
          name: string;
        };
        Update: {
          id?: string;
          tag_id?: string;
          locale?: "en" | "he";
          name?: string;
        };
      };
      blog_post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
      };
      blog_internal_links: {
        Row: {
          id: string;
          source_post_id: string;
          target_post_id: string;
          link_order: number;
        };
        Insert: {
          id?: string;
          source_post_id: string;
          target_post_id: string;
          link_order?: number;
        };
        Update: {
          id?: string;
          source_post_id?: string;
          target_post_id?: string;
          link_order?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Helper types for blog queries
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type BlogPostTranslation =
  Database["public"]["Tables"]["blog_post_translations"]["Row"];
export type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];
export type BlogTagTranslation =
  Database["public"]["Tables"]["blog_tag_translations"]["Row"];

export type BlogPostWithTranslation = BlogPost & {
  blog_post_translations: BlogPostTranslation[];
  blog_post_tags?: {
    blog_tags: BlogTag & {
      blog_tag_translations: BlogTagTranslation[];
    };
  }[];
};

export type BlogPostWithRelated = BlogPostWithTranslation & {
  blog_internal_links?: {
    target_post_id: string;
    link_order: number;
    blog_posts: BlogPost & {
      blog_post_translations: BlogPostTranslation[];
    };
  }[];
};
