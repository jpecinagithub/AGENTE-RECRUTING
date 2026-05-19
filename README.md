# Recruiting Agent

Local-first AI recruiting agent — finds, ranks, and tracks job listings based on your preferences.

## Features

- 💬 Chat interface (ChatGPT-style) to configure preferences and search jobs
- 🔍 Automated job scraping from configurable portals
- 🧠 Persistent memory of preferences and feedback
- 📊 Daily 09:00 job report
- ⚡ Tool system: search, save, rate, add portals
- 🌐 Add custom job portals with CSS selectors

## Setup

### 1. Database

```sql
mysql -u root -p < backend/src/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and LLM API key
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_NAME` | Database name | recruiting_agent |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | |
| `LLM_BASE_URL` | LLM API base URL | DashScope |
| `LLM_API_KEY` | LLM API key | (required for real LLM) |
| `LLM_MODEL` | Model name | qwen-plus-2025-09-11 |
| `JWT_SECRET` | JWT signing secret | (change in prod) |
| `PORT` | Backend port | 3020 |

## LLM Providers

Works with any OpenAI-compatible API:

```env
# DashScope (Qwen)
LLM_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus-2025-09-11

# Nvidia NIM
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=meta/llama-3.3-70b-instruct

# OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

If `LLM_API_KEY` is not set, the agent runs in **mock mode** with preset responses.

## Architecture

```
backend/src/
├── agent/
│   ├── core.js          # Main agent loop
│   ├── prompts.js       # System prompt builder
│   └── tools/           # 5 agent tools
├── mcp/
│   ├── context-builder.js   # Message history + memory injection
│   ├── tool-router.js       # Tool dispatch
│   ├── memory-manager.js    # User context loading/saving
│   └── schemas.js           # Tool JSON schemas
├── scrapers/
│   └── engine.js        # Generic cheerio scraper
├── scheduler/
│   └── daily-report.js  # node-cron daily job at 09:00
├── db/
│   ├── connection.js    # MySQL pool
│   ├── models.js        # All DB queries
│   └── schema.sql       # Full schema
├── api/routes/          # Express routes
├── llm/client.js        # OpenAI-compatible LLM client
└── index.js             # Server entry point
```
