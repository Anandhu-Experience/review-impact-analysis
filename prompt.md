# Prompt used to build this

## Main prompt

Build a hackathon scoring backend for Experience.com's AI Hackathon on August 26, 2026.

What it does: Reads all branches from a GitHub repo, fetches README.md + prompt.md + ai-chat-export.json from each branch, scores each submission using the Anthropic API, and serves a live leaderboard at localhost:3000. The frontend HTML file already exists — build the backend only.

Tech stack: Python 3 + FastAPI, Anthropic SDK, HTTPX for GitHub API calls, Uvicorn, python-dotenv.

Environment (.env): GITHUB_TOKEN, ANTHROPIC_API_KEY, GITHUB_OWNER, GITHUB_REPO, EXCLUDE_BRANCHES, PORT=3000

API endpoints:
- GET / — serve hackathon_scorer.html
- GET /api/branches — return branch list excluding EXCLUDE_BRANCHES
- GET /api/score/{branch_name} — fetch files + commits, score with Claude claude-sonnet-4-6, return JSON
- GET /api/scores — return all cached scores

Scoring criteria (100 pts):
- llm_craft max 30 (cap at 5 if no ai-chat-export.json)
- roi_impact max 25
- product_knowledge max 20
- working_demo max 15
- complexity max 10

Cache scores in memory. Handle missing files gracefully. CORS open. Log progress per branch.

## How to use it
Step 1: pip install -r requirements.txt
Step 2: cp .env.template .env — fill in GITHUB_TOKEN and ANTHROPIC_API_KEY
Step 3: python main.py
Step 4: Open localhost:3000 — click Start scanning

## Tool
Claude Code

## What it produces
A live web leaderboard at localhost:3000 that auto-scores every branch in the hackathon GitHub repo and displays results in real time with drill-down AI reasoning per submission. Exports to CSV and HTML report.
