import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { buildSystemPrompt, PromptContext } from '../prompt/systemPrompt';
import { logUsage } from './stateMachine';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const FALLBACK_RESPONSES: Record<string, Record<string, string>> = {
  ru: {
    default: 'Расскажи подробнее — что именно ты имеешь в виду?',
    probe: 'Можешь привести пример?',
    transition: 'Понял. Идём дальше.',
  },
  en: {
    default: 'Tell me more — what exactly do you mean?',
    probe: 'Can you give an example?',
    transition: 'Got it. Moving on.',
  },
  tr: {
    default: 'Daha fazla anlat — tam olarak ne demek istiyorsun?',
    probe: 'Bir örnek verebilir misin?',
    transition: 'Anladım. Devam edelim.',
  },
};

export async function callLLM(
  ctx: PromptContext,
  userMessage: string,
  sessionId: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const messages: Anthropic.MessageParam[] = [
    ...ctx.recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: systemPrompt,
      messages,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    await logUsage(sessionId, config.anthropic.model, inputTokens, outputTokens);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('');

    return text.trim();
  } catch (err) {
    console.error('LLM error:', err);
    const lang = ctx.language;
    return FALLBACK_RESPONSES[lang]?.default ?? FALLBACK_RESPONSES.en.default;
  }
}

export async function* streamLLM(
  ctx: PromptContext,
  userMessage: string,
  sessionId: string
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const messages: Anthropic.MessageParam[] = [
    ...ctx.recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = await client.messages.stream({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: systemPrompt,
      messages,
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text;
        yield chunk.delta.text;
      }
    }

    const final = await stream.finalMessage();
    await logUsage(
      sessionId,
      config.anthropic.model,
      final.usage.input_tokens,
      final.usage.output_tokens
    );
  } catch (err) {
    console.error('LLM stream error:', err);
    const lang = ctx.language;
    yield FALLBACK_RESPONSES[lang]?.default ?? FALLBACK_RESPONSES.en.default;
  }
}
