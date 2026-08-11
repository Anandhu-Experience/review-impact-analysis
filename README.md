# AI Hackathon Scorer — Live Leaderboard & Automated Scoring

## Files in this branch
- README.md (this file)
- prompt.md
- ai-chat-export.json ← required
- demo/ (screenshots)
- src/ (main.py, hackathon_scorer.html, requirements.txt)

**Name + Role:** Geetha Chandrasekar — SVP Engineering, Experience.com

**Problem I solved:** Experience.com is running a company-wide AI hackathon on August 26 2026 with 45 engineers across Dev, QA, ETL, DevOps, and PM. Manual judging of 45 submissions across 5 weighted criteria would take a panel of judges 4+ hours, introduce scoring inconsistency, and produce results too late for the same-day champion announcement. We needed automated, consistent, real-time scoring tied directly to our investor-facing AI transformation criteria.

**What I built:** A FastAPI backend + browser frontend that connects to the Experience.com hackathon GitHub repo, reads every submission branch automatically, fetches README.md + prompt.md + ai-chat-export.json from each, and scores each submission using Claude claude-sonnet-4-6 against five criteria that directly map to what our investor Javier Rojas is evaluating on September 9: LLM craft (30pts), ROI/impact (25pts), XMP product knowledge (20pts), working demo (15pts), and complexity (10pts). Results appear on a live leaderboard in real time as each branch is scored. Includes drill-down AI reasoning per criterion, champion signal detection, CSV export, and HTML report for the investor review.

**Tool used:** Claude Code — zero hand-written code

**Time without AI:** 2–3 engineering days minimum for a comparable tool — API integrations, frontend, scoring logic, caching, error handling, CORS, real-time updates

**Time with AI today:** 4 hours, zero coding — Claude Code built main.py, wired the frontend, handled all edge cases, and verified end-to-end against a live GitHub repo

**Will I use next week?** YES — running this live on August 26 for the Experience.com company hackathon. The HTML report output will be shared directly with Javier Rojas as investor evidence of cross-functional AI adoption.

**Impact quantified:**
- Eliminates 4+ hours of manual judging panel time across 45 submissions
- Removes scoring inconsistency — same Claude model, same prompt, same criteria for every submission
- Results delivered in real time vs end of day — champions announced same session
- Scoring criteria tied directly to September 9 investor review: zero-coding mandate, AI adoption evidence, XMP product impact
- Tool itself is investor evidence: an SVP built a production-grade judging system in 4 hours with zero coding
