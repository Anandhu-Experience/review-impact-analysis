# AI Hackathon Scorer — Live Leaderboard & Automated Scoring

## Files in this branch
- README.md (this file)
- prompt.md
- ai-chat-export.json ← required
- demo/ (screenshots)
- src/ (main.py, hackathon_scorer.html, requirements.txt)

**Name + Role:** Geetha Chandrasekar — SVP Engineering
**Problem I solved:** Running a company-wide hackathon with 45 engineers across 5 disciplines — needed a way to scan every GitHub branch automatically, score each submission using AI against weighted criteria, and display a live leaderboard during the review session. Manual judging would take hours and introduce bias.
**What I built:** A FastAPI backend + browser frontend that reads every branch in the hackathon repo, fetches README.md + prompt.md + ai-chat-export.json from each, scores submissions using Claude claude-sonnet-4-6 across 5 weighted criteria (LLM craft 30pts, ROI/impact 25pts, Product knowledge 20pts, Working demo 15pts, Complexity 10pts), and displays a live auto-updating leaderboard. Export to CSV and HTML report included.
**Tool used:** Claude Code
**Time without AI:** 2–3 days for a developer to build a comparable tool
**Time with AI today:** 4 hours zero coding
**Will I use next week?** YES — running this live on August 26 for the Experience.com company hackathon
