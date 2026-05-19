# Agente Recruiting

Local-first AI Recruiting Agent — job search, tracking, and daily reports.

## Stack
- **Backend**: Node.js + Express + WebSocket (ws) + MySQL + node-cron
- **Frontend**: Vite + React + TailwindCSS
- **LLM**: OpenAI-compatible API (DashScope/Qwen by default, swappable)
- **Scraper**: axios + cheerio

## Project Structure
- `backend/` — Express API + Agent core + MCP layer + Scheduler + Scrapers
- `frontend/` — React chat UI (ChatGPT-style)

## Ports
- Backend API: 3020
- Frontend dev: 5173

## Setup
Copy `backend/.env.example` to `backend/.env` and fill in values, then:
```
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Architecture
- **Agent Core** (`backend/src/agent/core.js`): main loop — intent detection → tool routing → response
- **MCP Layer** (`backend/src/mcp/`): context building, tool routing, memory injection, schema validation
- **Tools** (`backend/src/agent/tools/`): search_jobs, add_job_portal, save_job, generate_daily_report, update_preferences
- **Scrapers** (`backend/src/scrapers/`): generic engine + per-portal configs
- **Scheduler** (`backend/src/scheduler/`): daily 09:00 job search + report generation
