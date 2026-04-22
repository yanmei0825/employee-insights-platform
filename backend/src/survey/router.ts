import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { config } from '../config';
import { handleMessage, handleMessageStream } from '../interview/messageHandler';
import { getSessionByToken, logEvent } from '../interview/stateMachine';
import { DIMENSION_MAP } from '../interview/dimensions';

export const surveyRouter = Router();

// ── POST /survey/public-session ───────────────────────────────────────────────
surveyRouter.post('/public-session', async (req: Request, res: Response) => {
  const schema = z.object({ projectId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid projectId' });

  const { projectId } = parsed.data;

  const project = await pool.query(
    `SELECT id, has_demographics, languages FROM projects WHERE id = $1`,
    [projectId]
  );
  if (!project.rows[0]) return res.status(404).json({ error: 'Project not found' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + config.session.tokenTtlHours * 3600 * 1000);

  await pool.query(
    `INSERT INTO survey_sessions (token, project_id, is_anonymous, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [token, projectId, !project.rows[0].has_demographics, expiresAt]
  );

  return res.json({
    token,
    hasDemographics: project.rows[0].has_demographics,
    availableLanguages: project.rows[0].languages,
  });
});

// ── GET /survey/:token ────────────────────────────────────────────────────────
surveyRouter.get('/:token', async (req: Request, res: Response) => {
  const state = await getSessionByToken(req.params.token);
  if (!state) return res.status(404).json({ error: 'Session not found or expired' });

  const dim = DIMENSION_MAP.get(state.currentDimension);
  return res.json({
    status: state.status,
    language: state.language,
    currentDimension: state.currentDimension,
    dimensionLabel: dim ? dim.label[state.language] : null,
    completedDimensions: state.completedDimensions,
    progress: Math.round((state.completedDimensions.length / 10) * 100),
  });
});

// ── POST /survey/:token/language ──────────────────────────────────────────────
surveyRouter.post('/:token/language', async (req: Request, res: Response) => {
  const schema = z.object({ language: z.enum(['ru', 'en', 'tr']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Language must be ru, en, or tr' });

  const state = await getSessionByToken(req.params.token);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  if (state.status !== 'pending' && state.status !== 'language_select') {
    return res.status(409).json({ error: 'Language already set and interview started' });
  }

  const { language } = parsed.data;
  const nextStatus = state.isAnonymous ? 'active' : 'demographics';

  await pool.query(
    `UPDATE survey_sessions SET language = $1, status = $2, current_dimension = 'D1' WHERE token = $3`,
    [language, nextStatus, req.params.token]
  );

  await logEvent(state.id, 'language_selected', { language });

  return res.json({ ok: true, nextStep: nextStatus });
});

// ── POST /survey/:token/demographics ─────────────────────────────────────────
surveyRouter.post('/:token/demographics', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    extra: z.record(z.string()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const state = await getSessionByToken(req.params.token);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  if (state.status !== 'demographics') {
    return res.status(409).json({ error: 'Not in demographics step' });
  }

  await pool.query(
    `UPDATE survey_sessions SET demographics = $1, status = 'active' WHERE token = $2`,
    [JSON.stringify(parsed.data), req.params.token]
  );

  await logEvent(state.id, 'demographics_submitted');

  return res.json({ ok: true });
});

// ── POST /survey/:token/message ───────────────────────────────────────────────
surveyRouter.post('/:token/message', async (req: Request, res: Response) => {
  const schema = z.object({ content: z.string().min(1).max(1500) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid message' });

  try {
    const result = await handleMessage(req.params.token, parsed.data.content);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg === 'SESSION_NOT_FOUND') return res.status(404).json({ error: msg });
    if (msg === 'SESSION_COMPLETED') return res.status(410).json({ error: msg });
    if (msg === 'SESSION_NOT_ACTIVE') return res.status(409).json({ error: msg });
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ── POST /survey/:token/message/stream ────────────────────────────────────────
surveyRouter.post('/:token/message/stream', async (req: Request, res: Response) => {
  const schema = z.object({ content: z.string().min(1).max(1500) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid message' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const gen = handleMessageStream(req.params.token, parsed.data.content);
    for await (const chunk of gen) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'error';
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  } finally {
    res.end();
  }
});
