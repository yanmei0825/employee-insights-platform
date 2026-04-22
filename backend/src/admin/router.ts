import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { config } from '../config';

export const adminRouter = Router();

// ── Companies ─────────────────────────────────────────────────────────────────

adminRouter.get('/companies', async (_req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.name, c.created_at,
            COUNT(DISTINCT p.id) AS project_count
     FROM companies c
     LEFT JOIN projects p ON p.company_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`
  );
  res.json(result.rows);
});

adminRouter.post('/companies', async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1).max(200) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid name' });

  const result = await pool.query(
    `INSERT INTO companies (name) VALUES ($1) RETURNING *`,
    [parsed.data.name]
  );
  return res.status(201).json(result.rows[0]);
});

adminRouter.delete('/companies/:id', async (req: Request, res: Response) => {
  await pool.query(`DELETE FROM companies WHERE id = $1`, [req.params.id]);
  return res.json({ ok: true });
});

// ── Projects ──────────────────────────────────────────────────────────────────

adminRouter.get('/companies/:companyId/projects', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.description, p.has_demographics, p.languages, p.created_at,
            COUNT(DISTINCT s.id) AS session_count,
            COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_count
     FROM projects p
     LEFT JOIN survey_sessions s ON s.project_id = p.id
     WHERE p.company_id = $1
     GROUP BY p.id ORDER BY p.created_at DESC`,
    [req.params.companyId]
  );
  return res.json(result.rows);
});

adminRouter.post('/companies/:companyId/projects', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    hasDemographics: z.boolean().default(false),
    languages: z.array(z.enum(['ru', 'en', 'tr'])).min(1).default(['ru', 'en', 'tr']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, description, hasDemographics, languages } = parsed.data;
  const result = await pool.query(
    `INSERT INTO projects (company_id, name, description, has_demographics, languages)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.companyId, name, description ?? null, hasDemographics, languages]
  );
  return res.status(201).json(result.rows[0]);
});

adminRouter.put('/projects/:id', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    hasDemographics: z.boolean().optional(),
    languages: z.array(z.enum(['ru', 'en', 'tr'])).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, description, hasDemographics, languages } = parsed.data;
  const result = await pool.query(
    `UPDATE projects SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       has_demographics = COALESCE($3, has_demographics),
       languages = COALESCE($4, languages)
     WHERE id = $5 RETURNING *`,
    [name ?? null, description ?? null, hasDemographics ?? null, languages ?? null, req.params.id]
  );
  return res.json(result.rows[0]);
});

adminRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  await pool.query(`DELETE FROM projects WHERE id = $1`, [req.params.id]);
  return res.json({ ok: true });
});

// ── Generate survey link ──────────────────────────────────────────────────────

adminRouter.post('/projects/:id/generate-link', async (req: Request, res: Response) => {
  const project = await pool.query(`SELECT * FROM projects WHERE id = $1`, [req.params.id]);
  if (!project.rows[0]) return res.status(404).json({ error: 'Project not found' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + config.session.tokenTtlHours * 3600 * 1000);

  await pool.query(
    `INSERT INTO survey_sessions (token, project_id, is_anonymous, status, expires_at)
     VALUES ($1, $2, $3, 'pending', $4)`,
    [token, req.params.id, !project.rows[0].has_demographics, expiresAt]
  );

  const baseUrl = req.headers.origin || `http://localhost:5173`;
  return res.json({
    token,
    url: `${baseUrl}/survey/${token}`,
    expiresAt,
  });
});

// ── Sessions / analytics ──────────────────────────────────────────────────────

adminRouter.get('/projects/:id/sessions', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, token, language, status, is_anonymous, demographics,
            current_dimension, completed_dimensions, created_at, completed_at
     FROM survey_sessions WHERE project_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  return res.json(result.rows);
});

adminRouter.get('/projects/:id/analytics', async (req: Request, res: Response) => {
  const sessions = await pool.query(
    `SELECT id, completed_dimensions, status FROM survey_sessions WHERE project_id = $1`,
    [req.params.id]
  );

  const total = sessions.rows.length;
  const completed = sessions.rows.filter((s: { status: string }) => s.status === 'completed').length;

  // Coverage per dimension
  const dimCoverage: Record<string, number> = {};
  for (const s of sessions.rows) {
    for (const d of (s.completed_dimensions || [])) {
      dimCoverage[d] = (dimCoverage[d] || 0) + 1;
    }
  }

  return res.json({
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    dimensionCoverage: dimCoverage,
  });
});
