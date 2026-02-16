import { getOpenAI } from "./client";

export async function extractFromUrl(url: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  tokensUsed: number;
}> {
  // Fetch the page content with browser-like headers
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Strip HTML to plain text (basic extraction)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000); // Limit to avoid token overflow

  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional blog writer for Doppler VPN, a privacy and security technology company.

Given the extracted text from a web page, create a comprehensive blog article:
- Write 800-1500 words in clean markdown
- Focus on privacy, security, and VPN relevance
- Use proper headings (## and ###), bullet points, and paragraphs
- Write in an informative, professional tone
- Include a compelling introduction and conclusion
- Mention how a VPN (specifically Doppler VPN) relates to the topic where relevant, but don't be overly promotional
- Do NOT copy text verbatim — rewrite and synthesize the information

Return valid JSON with keys: title, excerpt, content, meta_title, meta_description, og_title, og_description
- title: compelling article title (max 80 chars)
- excerpt: 1-2 sentence summary (max 200 chars)
- content: full article in markdown
- meta_title: SEO-optimized page title (max 70 chars, include primary keyword)
- meta_description: SEO meta description (max 160 chars, compelling with call-to-action)
- og_title: Open Graph title for social sharing (max 70 chars, can differ from meta_title)
- og_description: Open Graph description for social sharing (max 200 chars, engaging preview)`,
      },
      {
        role: "user",
        content: `Source URL: ${url}\n\nExtracted text:\n${textContent}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);

  return {
    title: parsed.title || "Untitled Article",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
    meta_title: parsed.meta_title || "",
    meta_description: parsed.meta_description || "",
    og_title: parsed.og_title || "",
    og_description: parsed.og_description || "",
    tokensUsed: response.usage?.total_tokens || 0,
  };
}
