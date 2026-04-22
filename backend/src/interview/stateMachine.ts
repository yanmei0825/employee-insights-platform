import { pool } from '../db/pool';
import { DimensionId, DIMENSION_MAP, getNextDimension, Language } from './dimensions';

export interface SessionState {
  id: string;
  token: string;
  projectId: string;
  language: Language;
  status: string;
  isAnonymous: boolean;
  demographics: Record<string, string> | null;
  currentDimension: DimensionId;
  dimensionTurnCount: Record<DimensionId, number>;
  completedDimensions: DimensionId[];
}

export async function getSessionByToken(token: string): Promise<SessionState | null> {
  const res = await pool.query(
    `SELECT id, token, project_id, language, status, is_anonymous, demographics,
            current_dimension, dimension_turn_count, completed_dimensions
     FROM survey_sessions WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    token: r.token,
    projectId: r.project_id,
    language: r.language,
    status: r.status,
    isAnonymous: r.is_anonymous,
    demographics: r.demographics,
    currentDimension: r.current_dimension,
    dimensionTurnCount: r.dimension_turn_count || {},
    completedDimensions: r.completed_dimensions || [],
  };
}

export async function getRecentMessages(
  sessionId: string,
  limit = 12
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const res = await pool.query(
    `SELECT role, content FROM messages
     WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [sessionId, limit]
  );
  return res.rows.reverse() as Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  dimension: DimensionId,
  tokensUsed = 0
): Promise<void> {
  await pool.query(
    `INSERT INTO messages (session_id, role, content, dimension, tokens_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, role, content, dimension, tokensUsed]
  );
}

export async function incrementDimensionTurn(
  sessionId: string,
  state: SessionState
): Promise<number> {
  const dim = state.currentDimension;
  const current = state.dimensionTurnCount[dim] || 0;
  const next = current + 1;
  const updated = { ...state.dimensionTurnCount, [dim]: next };
  await pool.query(
    `UPDATE survey_sessions SET dimension_turn_count = $1 WHERE id = $2`,
    [JSON.stringify(updated), sessionId]
  );
  return next;
}

export async function advanceDimension(state: SessionState): Promise<DimensionId | null> {
  const next = getNextDimension(state.currentDimension);
  const completed = [...state.completedDimensions, state.currentDimension];

  if (next) {
    await pool.query(
      `UPDATE survey_sessions
       SET current_dimension = $1, completed_dimensions = $2
       WHERE id = $3`,
      [next, completed, state.id]
    );
  } else {
    await pool.query(
      `UPDATE survey_sessions
       SET status = 'completed', completed_dimensions = $1, completed_at = NOW()
       WHERE id = $2`,
      [completed, state.id]
    );
  }
  return next;
}

export function shouldAdvance(state: SessionState, turnInDim: number): boolean {
  const dim = DIMENSION_MAP.get(state.currentDimension)!;
  return turnInDim >= dim.maxTurns;
}

export function canAdvance(state: SessionState, turnInDim: number): boolean {
  const dim = DIMENSION_MAP.get(state.currentDimension)!;
  return turnInDim >= dim.minTurns;
}

export async function logEvent(
  sessionId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await pool.query(
    `INSERT INTO interview_events (session_id, event_type, payload) VALUES ($1, $2, $3)`,
    [sessionId, eventType, JSON.stringify(payload)]
  );
}

export async function logUsage(
  sessionId: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await pool.query(
    `INSERT INTO usage_log (session_id, provider, model, input_tokens, output_tokens)
     VALUES ($1, 'anthropic', $2, $3, $4)`,
    [sessionId, model, inputTokens, outputTokens]
  );
}
