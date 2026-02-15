// Supabase Edge Function — Telegram Bot Webhook
// Deploy: supabase functions deploy telegram-bot
// Set secrets: supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_ADMIN_USER_ID=... OPENAI_API_KEY=... TELEGRAM_WEBHOOK_SECRET=...
// Register webhook: curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://seakhlgyzkerxabitgoo.supabase.co/functions/v1/telegram-bot&secret_token=<WEBHOOK_SECRET>"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import OpenAI from "https://esm.sh/openai@4.73.0";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const ADMIN_USER_ID = Deno.env.get("TELEGRAM_ADMIN_USER_ID")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Telegram API helpers ---

async function sendMessage(chatId: number, text: string, parseMode = "Markdown") {
  // Telegram limits messages to 4096 chars
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: parseMode,
      }),
    });
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx < maxLen / 2) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx);
  }
  return chunks;
}

// --- Command handlers ---

async function handleRewrite(chatId: number, text: string) {
  await sendMessage(chatId, "Rewriting...");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional blog editor for Doppler VPN. Fix typos, improve clarity, maintain meaning. Output clean markdown. No commentary.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });

  const result = response.choices[0].message.content || text;
  await sendMessage(chatId, result);
}

async function handleExtract(chatId: number, url: string) {
  await sendMessage(chatId, `Extracting from: ${url}`);

  // Fetch page
  let pageText: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DopplerBot/1.0)" },
    });
    const html = await res.text();
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
  } catch {
    await sendMessage(chatId, "Failed to fetch URL.");
    return;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a blog writer for Doppler VPN. Given extracted web text, create a blog article (800-1500 words, markdown). Include VPN relevance. Return JSON: {title, excerpt, content}`,
      },
      { role: "user", content: `URL: ${url}\n\n${pageText}` },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);

  // Create draft post
  const slug = (parsed.title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  const { data: post, error: postError } = await supabase
    .from("blog_posts")
    .insert({ slug, status: "draft", author_name: "Doppler Team" })
    .select("id")
    .single();

  if (postError || !post) {
    await sendMessage(chatId, `DB error: ${postError?.message || "unknown"}`);
    return;
  }

  await supabase.from("blog_post_translations").insert({
    post_id: post.id,
    locale: "en",
    title: parsed.title || "Untitled",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
  });

  const adminUrl = `https://dopplervpn.com/admin-dvpn/posts/${post.id}`;
  await sendMessage(
    chatId,
    `*Draft created!*\n\n*Title:* ${parsed.title}\n\n*Excerpt:* ${parsed.excerpt}\n\n[Edit in Admin](${adminUrl})`
  );
}

async function handleIdea(chatId: number, topic: string) {
  await sendMessage(chatId, `Researching & writing about: ${topic}`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a blog writer for Doppler VPN, a privacy/security company. Given a topic, write a comprehensive blog article (800-1500 words, markdown). Focus on privacy/security/VPN relevance. Return JSON: {title, excerpt, content}`,
      },
      { role: "user", content: topic },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);

  const slug = (parsed.title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  const { data: post, error: postError } = await supabase
    .from("blog_posts")
    .insert({ slug, status: "draft", author_name: "Doppler Team" })
    .select("id")
    .single();

  if (postError || !post) {
    await sendMessage(chatId, `DB error: ${postError?.message || "unknown"}`);
    return;
  }

  await supabase.from("blog_post_translations").insert({
    post_id: post.id,
    locale: "en",
    title: parsed.title || "Untitled",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
  });

  const adminUrl = `https://dopplervpn.com/admin-dvpn/posts/${post.id}`;
  await sendMessage(
    chatId,
    `*Draft created!*\n\n*Title:* ${parsed.title}\n\n*Excerpt:* ${parsed.excerpt}\n\n[Edit in Admin](${adminUrl})`
  );
}

async function handleTranslate(chatId: number, args: string) {
  const parts = args.trim().split(/\s+/);
  if (parts.length < 2) {
    await sendMessage(
      chatId,
      "Usage: /translate <slug> <locale|all>\nExample: /translate my-post he"
    );
    return;
  }

  const [slug, locale] = parts;

  // Find the post
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!post) {
    await sendMessage(chatId, `Post not found: ${slug}`);
    return;
  }

  // Get EN source
  const { data: enTrans } = await supabase
    .from("blog_post_translations")
    .select("title, excerpt, content, image_alt, meta_title, meta_description, og_title, og_description")
    .eq("post_id", post.id)
    .eq("locale", "en")
    .single();

  if (!enTrans) {
    await sendMessage(chatId, "English translation not found for this post.");
    return;
  }

  const targetLocales =
    locale === "all"
      ? [
          "he", "ru", "es", "pt", "fr", "zh", "de", "fa", "ar", "hi",
          "id", "tr", "vi", "th", "ms", "ko", "ja", "tl", "ur", "sw",
        ]
      : [locale];

  await sendMessage(chatId, `Translating to ${targetLocales.length} language(s)...`);

  let completed = 0;
  let failed = 0;

  for (const loc of targetLocales) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Translate this blog post to ${loc}. Keep markdown formatting. Keep tech terms (VPN, DNS, etc.) in English. Return JSON: {title, excerpt, content, image_alt, meta_title, meta_description, og_title, og_description}. Null fields stay null.`,
          },
          { role: "user", content: JSON.stringify(enTrans) },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0].message.content || "{}");

      await supabase.from("blog_post_translations").upsert(
        {
          post_id: post.id,
          locale: loc,
          title: parsed.title || enTrans.title,
          excerpt: parsed.excerpt || enTrans.excerpt,
          content: parsed.content || enTrans.content,
          image_alt: parsed.image_alt ?? enTrans.image_alt,
          meta_title: parsed.meta_title ?? enTrans.meta_title,
          meta_description: parsed.meta_description ?? enTrans.meta_description,
          og_title: parsed.og_title ?? enTrans.og_title,
          og_description: parsed.og_description ?? enTrans.og_description,
        },
        { onConflict: "post_id,locale" }
      );

      completed++;
    } catch {
      failed++;
    }
  }

  await sendMessage(
    chatId,
    `Translation complete: ${completed} done, ${failed} failed.`
  );
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    `*Doppler Blog Bot*\n\n` +
      `/rewrite <text> — Fix typos & polish text\n` +
      `/extract <url> — Generate article from URL\n` +
      `/idea <topic> — AI writes full article\n` +
      `/translate <slug> <locale|all> — Translate a post\n` +
      `/help — Show this message`
  );
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  // Verify webhook secret
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const userId = String(message.from.id);

    // Whitelist check
    if (userId !== ADMIN_USER_ID) {
      await sendMessage(chatId, "Unauthorized. This bot is private.");
      return new Response("OK", { status: 200 });
    }

    const text = message.text.trim();

    if (text.startsWith("/rewrite ")) {
      await handleRewrite(chatId, text.slice(9));
    } else if (text.startsWith("/extract ")) {
      await handleExtract(chatId, text.slice(9).trim());
    } else if (text.startsWith("/idea ")) {
      await handleIdea(chatId, text.slice(6).trim());
    } else if (text.startsWith("/translate ")) {
      await handleTranslate(chatId, text.slice(11));
    } else if (text === "/help" || text === "/start") {
      await handleHelp(chatId);
    } else {
      // Treat any unrecognized text as content to rewrite
      await handleRewrite(chatId, text);
    }
  } catch (err) {
    console.error("Bot error:", err);
  }

  return new Response("OK", { status: 200 });
});
