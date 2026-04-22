# Interview Platform

Structured anonymous workplace interview platform. Companies create projects, employees complete interviews across 10 dimensions (D1–D10). Results feed into analytics and reports.

**Stack:** React · TypeScript · Node.js · Express · PostgreSQL · Claude (Anthropic)

---

## Project Structure

```
interview-platform/
├── backend/          # Express API + interview engine
├── frontend/         # React chat UI
└── .gitignore
```

---

## Quick Start

### 1. PostgreSQL via Docker

```bash
docker run -d --name pg-interview \
  -e "POSTGRES_PASSWORD=postgres" \
  -e "POSTGRES_DB=interview_platform" \
  -e "POSTGRES_USER=postgres" \
  -p 5432:5432 postgres:16
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `DB_HOST` | Postgres host | `localhost` |
| `DB_PORT` | Postgres port | `5432` |
| `DB_NAME` | Database name | `interview_platform` |
| `DB_USER` | Postgres user | `postgres` |
| `DB_PASSWORD` | Postgres password | — |
| `ANTHROPIC_API_KEY` | Claude API key | — |
| `ANTHROPIC_MODEL` | Model name | `claude-3-5-sonnet-20241022` |
| `ANTHROPIC_MAX_TOKENS` | Max tokens per reply | `1024` |
| `SESSION_TTL_HOURS` | Session expiry | `48` |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/survey/public-session` | Create a new session by projectId |
| `GET` | `/survey/:token` | Get session state + progress |
| `POST` | `/survey/:token/language` | Set language (ru / en / tr) |
| `POST` | `/survey/:token/demographics` | Submit demographics (if enabled) |
| `POST` | `/survey/:token/message` | Send message, get reply |
| `POST` | `/survey/:token/message/stream` | Send message, get SSE stream |

---

## Interview Dimensions (D1–D10)

| # | EN | RU | TR |
|---|---|---|---|
| D1 | Meaning & Pride | Смысл и гордость | Anlam ve Gurur |
| D2 | Workload | Нагрузка | İş Yükü |
| D3 | Recognition | Признание | Takdir |
| D4 | Management | Руководство | Yönetim |
| D5 | Colleagues | Коллеги | Meslektaşlar |
| D6 | Growth | Рост | Gelişim |
| D7 | Balance | Баланс | Denge |
| D8 | Voice | Голос | Ses |
| D9 | Obstacles | Препятствия | Engeller |
| D10 | Overall | Общее | Genel |

---

## Guard Layer (pre-LLM)

All user input passes through guards before reaching Claude:

- Language lock — chosen once, enforced throughout
- Emoji-only input — asks for words
- Garbage / symbol spam — soft redirect
- Manipulation attempts — ignored, interview continues
- Too long input (>1200 chars) — asks to shorten
- Refusal signals — skips topic gracefully

---

## Languages

`ru` · `en` · `tr` — selected before the interview starts, cannot be changed mid-session.
