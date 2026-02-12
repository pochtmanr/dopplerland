import { getOpenAI } from "./client";

export async function rewriteContent(text: string): Promise<{
  content: string;
  tokensUsed: number;
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional blog editor for Doppler VPN, a privacy and security technology company.

Your job:
- Fix all typos, grammar, and punctuation errors
- Improve clarity and readability
- Maintain the original meaning, tone, and technical accuracy
- Keep the content in the same language as provided
- Preserve all markdown formatting
- Do NOT add new information or change the message
- Do NOT add any introductory text or commentary — return ONLY the rewritten content`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
  });

  return {
    content: response.choices[0].message.content || text,
    tokensUsed: response.usage?.total_tokens || 0,
  };
}
