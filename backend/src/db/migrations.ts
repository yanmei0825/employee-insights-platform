import { pool } from './pool';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        has_demographics BOOLEAN DEFAULT FALSE,
        languages TEXT[] DEFAULT ARRAY['ru'],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS survey_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token TEXT UNIQUE NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        language TEXT CHECK (language IN ('ru','en','tr')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending','language_select','demographics','active','completed','abandoned')),
        is_anonymous BOOLEAN DEFAULT TRUE,
        demographics JSONB,
        current_dimension TEXT DEFAULT 'D1',
        dimension_turn_count JSONB DEFAULT '{}',
        completed_dimensions TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES survey_sessions(id) ON DELETE CASCADE,
        role TEXT CHECK (role IN ('user','assistant')),
        content TEXT NOT NULL,
        dimension TEXT,
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS interview_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES survey_sessions(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES survey_sessions(id) ON DELETE CASCADE,
        provider TEXT DEFAULT 'anthropic',
        model TEXT,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token ON survey_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_session ON interview_events(session_id);
    `);
    console.log('Migrations applied');
  } finally {
    client.release();
  }
}
