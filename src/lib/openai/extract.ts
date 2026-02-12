import { getOpenAI } from "./client";

export async function extractFromUrl(url: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  tokensUsed: number;
}> {
  // Fetch the page content
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; DopplerBot/1.0; +https://dopplervpn.com)",
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
    model: "gpt-4o-mini",
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

Return valid JSON with keys: title, excerpt, content
- title: compelling article title (max 80 chars)
- excerpt: 1-2 sentence summary (max 200 chars)
- content: full article in markdown`,
      },
      {
        role: "user",
        content: `Source URL: ${url}\n\nExtracted text:\n${textContent}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);

  return {
    title: parsed.title || "Untitled Article",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
    tokensUsed: response.usage?.total_tokens || 0,
  };
}
