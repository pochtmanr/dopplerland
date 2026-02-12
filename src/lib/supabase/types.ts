export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Locale =
  | "en" | "he" | "ru" | "es" | "pt" | "fr" | "zh" | "de"
  | "fa" | "ar" | "hi" | "id" | "tr" | "vi" | "th" | "ms"
  | "ko" | "ja" | "tl" | "ur" | "sw";

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          image_url: string | null;
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
          author_name?: string;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_translations_post_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "blog_post_translations";
            referencedColumns: ["post_id"];
          },
        ];
      };
      blog_post_translations: {
        Row: {
          id: string;
          post_id: string;
          locale: string;
          title: string;
          excerpt: string;
          content: string;
          image_alt: string | null;
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
          locale: string;
          title: string;
          excerpt: string;
          content: string;
          image_alt?: string | null;
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
          locale?: string;
          title?: string;
          excerpt?: string;
          content?: string;
          image_alt?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_translations_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      blog_tag_translations: {
        Row: {
          id: string;
          tag_id: string;
          locale: string;
          name: string;
        };
        Insert: {
          id?: string;
          tag_id: string;
          locale: string;
          name: string;
        };
        Update: {
          id?: string;
          tag_id?: string;
          locale?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_tag_translations_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "blog_tags";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "blog_tags";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "blog_internal_links_source_post_id_fkey";
            columns: ["source_post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_internal_links_target_post_id_fkey";
            columns: ["target_post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          role: "admin" | "editor";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          role?: "admin" | "editor";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          role?: "admin" | "editor";
          created_at?: string;
        };
        Relationships: [];
      };
      translation_jobs: {
        Row: {
          id: string;
          post_id: string;
          locale: string;
          status: "pending" | "processing" | "completed" | "failed";
          model: string | null;
          tokens_used: number | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          locale: string;
          status?: "pending" | "processing" | "completed" | "failed";
          model?: string | null;
          tokens_used?: number | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          locale?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          model?: string | null;
          tokens_used?: number | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "translation_jobs_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
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
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type TranslationJob =
  Database["public"]["Tables"]["translation_jobs"]["Row"];

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
