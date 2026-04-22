import OpenAI from 'openai';
import { config } from '../config';
import { buildSystemPrompt, PromptContext } from '../prompt/systemPrompt';
import { logUsage } from './stateMachine';

const client = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
  defaultHeaders: {
    'HTTP-Referer': 'https://interview-platform.local',
    'X-Title': 'Interview Platform',
  },
});

const FALLBACK: Record<string, string> = {
  ru: 'Расскажи подробнее — что именно ты имеешь в виду?',
  en: 'Tell me more — what exactly do you mean?',
  tr: 'Daha fazla anlat — tam olarak ne demek istiyorsun?',
};

export async function callLLM(
  ctx: PromptContext,
  userMessage: string,
  sessionId: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...ctx.recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await client.chat.completions.create({
      model: config.llm.model,
      max_tokens: config.llm.maxTokens,
      messages,
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    await logUsage(sessionId, config.llm.model, inputTokens, outputTokens);

    return response.choices[0]?.message?.content?.trim() ?? FALLBACK[ctx.language];
  } catch (err) {
    console.error('LLM error:', err);
    return FALLBACK[ctx.language] ?? FALLBACK.en;
  }
}

export async function* streamLLM(
  ctx: PromptContext,
  userMessage: string,
  sessionId: string
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...ctx.recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: config.llm.model,
      max_tokens: config.llm.maxTokens,
      messages,
      stream: true,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) yield text;
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    if (inputTokens > 0) {
      await logUsage(sessionId, config.llm.model, inputTokens, outputTokens);
    }
  } catch (err) {
    console.error('LLM stream error:', err);
    yield FALLBACK[ctx.language] ?? FALLBACK.en;
  }
}
