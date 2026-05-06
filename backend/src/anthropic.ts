import Anthropic from '@anthropic-ai/sdk';
import type { Env } from './env';

const SYSTEM_PROMPT = [
  'You are a concise summarizer of web pages.',
  'Summarize the content in 2-3 sentences.',
  'Respond in the same natural language as the content.',
  'If the content language is unclear, respond in Japanese.',
  'Do not use bullet points or headings. Output only the summary sentences.',
].join(' ');

export async function summarizeText(text: string, env: Env): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });
  const first = message.content[0];
  if (!first || first.type !== 'text') {
    throw new Error('unexpected anthropic response shape');
  }
  return first.text.trim();
}
