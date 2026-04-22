import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'interview_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  llm: {
    apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    model: process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024'),
    baseURL: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
  },
  session: {
    tokenTtlHours: parseInt(process.env.SESSION_TTL_HOURS || '48'),
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 30,
  },
};
