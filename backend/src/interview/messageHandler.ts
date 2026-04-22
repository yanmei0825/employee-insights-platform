import { runInputGuard } from '../guards/inputGuard';
import {
  getSessionByToken,
  getRecentMessages,
  saveMessage,
  incrementDimensionTurn,
  advanceDimension,
  shouldAdvance,
  logEvent,
  SessionState,
} from './stateMachine';
import { callLLM, streamLLM } from './llmService';
import { PromptContext } from '../prompt/systemPrompt';
import { buildTransitionMessage } from '../prompt/systemPrompt';
import { DimensionId } from './dimensions';

export interface MessageResult {
  reply: string;
  dimensionChanged: boolean;
  newDimension: DimensionId | null;
  interviewComplete: boolean;
  guardTriggered: boolean;
  guardReason?: string;
}

function buildContext(
  state: SessionState,
  turnInDim: number,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): PromptContext {
  return {
    language: state.language,
    currentDimension: state.currentDimension,
    turnInDimension: turnInDim,
    completedDimensions: state.completedDimensions,
    isAnonymous: state.isAnonymous,
    demographics: state.demographics ?? undefined,
    recentHistory: history,
  };
}

export async function handleMessage(
  token: string,
  userInput: string
): Promise<MessageResult> {
  const state = await getSessionByToken(token);
  if (!state) throw new Error('SESSION_NOT_FOUND');
  if (state.status === 'completed') throw new Error('SESSION_COMPLETED');
  if (state.status !== 'active') throw new Error('SESSION_NOT_ACTIVE');

  // ── 1. Input guard (pre-LLM layer) ──────────────────────────────────────────
  const guard = runInputGuard(userInput, state.language);
  if (!guard.ok) {
    await logEvent(state.id, 'guard_triggered', {
      reason: guard.reason,
      input: userInput.slice(0, 100),
    });
    // Save user message and guard reply
    await saveMessage(state.id, 'user', userInput, state.currentDimension);
    await saveMessage(state.id, 'assistant', guard.response, state.currentDimension);

    return {
      reply: guard.response,
      dimensionChanged: false,
      newDimension: null,
      interviewComplete: false,
      guardTriggered: true,
      guardReason: guard.reason,
    };
  }

  // ── 2. Save user message ─────────────────────────────────────────────────────
  await saveMessage(state.id, 'user', userInput, state.currentDimension);
  await logEvent(state.id, 'user_message', { dimension: state.currentDimension });

  // ── 3. Increment turn counter ────────────────────────────────────────────────
  const turnInDim = await incrementDimensionTurn(state.id, state);

  // ── 4. Check if we must advance dimension ────────────────────────────────────
  const mustAdvance = shouldAdvance(state, turnInDim);

  let reply: string;
  let dimensionChanged = false;
  let newDimension: DimensionId | null = null;
  let interviewComplete = false;

  if (mustAdvance) {
    // Transition message first
    const transitionMsg = buildTransitionMessage(state.language);
    const history = await getRecentMessages(state.id);
    const ctx = buildContext(state, turnInDim, history);

    // Get LLM to formulate the transition + opening of next topic
    const nextDim = await advanceDimension(state);
    dimensionChanged = true;
    newDimension = nextDim;

    if (!nextDim) {
      interviewComplete = true;
      reply = getClosingMessage(state.language);
    } else {
      // Ask LLM to open the next dimension naturally
      const updatedState = { ...state, currentDimension: nextDim, completedDimensions: [...state.completedDimensions, state.currentDimension] };
      const nextCtx = buildContext(updatedState, 0, history);
      const llmReply = await callLLM(nextCtx, `[SYSTEM: Transition from ${state.currentDimension} to ${nextDim}. Open the new topic naturally with the opening question.]`, state.id);
      reply = `${transitionMsg} ${llmReply}`;
    }

    await logEvent(state.id, 'dimension_advanced', {
      from: state.currentDimension,
      to: nextDim,
    });
  } else {
    // ── 5. Normal LLM call ─────────────────────────────────────────────────────
    const history = await getRecentMessages(state.id);
    const ctx = buildContext(state, turnInDim, history);
    reply = await callLLM(ctx, userInput, state.id);
  }

  // ── 6. Save assistant reply ──────────────────────────────────────────────────
  const activeDim = newDimension ?? state.currentDimension;
  await saveMessage(state.id, 'assistant', reply, activeDim);

  return { reply, dimensionChanged, newDimension, interviewComplete, guardTriggered: false };
}

export async function* handleMessageStream(
  token: string,
  userInput: string
): AsyncGenerator<string, MessageResult, unknown> {
  const state = await getSessionByToken(token);
  if (!state) throw new Error('SESSION_NOT_FOUND');
  if (state.status === 'completed') throw new Error('SESSION_COMPLETED');
  if (state.status !== 'active') throw new Error('SESSION_NOT_ACTIVE');

  const guard = runInputGuard(userInput, state.language);
  if (!guard.ok) {
    await logEvent(state.id, 'guard_triggered', { reason: guard.reason });
    await saveMessage(state.id, 'user', userInput, state.currentDimension);
    await saveMessage(state.id, 'assistant', guard.response, state.currentDimension);
    yield guard.response;
    return { reply: guard.response, dimensionChanged: false, newDimension: null, interviewComplete: false, guardTriggered: true, guardReason: guard.reason };
  }

  await saveMessage(state.id, 'user', userInput, state.currentDimension);
  const turnInDim = await incrementDimensionTurn(state.id, state);
  const mustAdvance = shouldAdvance(state, turnInDim);

  let fullReply = '';

  if (mustAdvance) {
    const transition = buildTransitionMessage(state.language);
    yield transition + ' ';
    fullReply += transition + ' ';

    const nextDim = await advanceDimension(state);
    if (!nextDim) {
      const closing = getClosingMessage(state.language);
      yield closing;
      fullReply += closing;
      await saveMessage(state.id, 'assistant', fullReply, state.currentDimension);
      return { reply: fullReply, dimensionChanged: true, newDimension: null, interviewComplete: true, guardTriggered: false };
    }

    const history = await getRecentMessages(state.id);
    const updatedState = { ...state, currentDimension: nextDim, completedDimensions: [...state.completedDimensions, state.currentDimension] };
    const ctx = buildContext(updatedState, 0, history);

    for await (const chunk of streamLLM(ctx, `[SYSTEM: Open topic ${nextDim} naturally.]`, state.id)) {
      yield chunk;
      fullReply += chunk;
    }

    await saveMessage(state.id, 'assistant', fullReply, nextDim);
    return { reply: fullReply, dimensionChanged: true, newDimension: nextDim, interviewComplete: false, guardTriggered: false };
  }

  const history = await getRecentMessages(state.id);
  const ctx = buildContext(state, turnInDim, history);

  for await (const chunk of streamLLM(ctx, userInput, state.id)) {
    yield chunk;
    fullReply += chunk;
  }

  await saveMessage(state.id, 'assistant', fullReply, state.currentDimension);
  return { reply: fullReply, dimensionChanged: false, newDimension: null, interviewComplete: false, guardTriggered: false };
}

function getClosingMessage(lang: string): string {
  const msgs: Record<string, string> = {
    ru: 'Спасибо — это всё, что мне было нужно. Интервью завершено.',
    en: 'Thank you — that is everything I needed. The interview is complete.',
    tr: 'Teşekkürler — ihtiyacım olan her şey bu kadardı. Görüşme tamamlandı.',
  };
  return msgs[lang] ?? msgs.en;
}
