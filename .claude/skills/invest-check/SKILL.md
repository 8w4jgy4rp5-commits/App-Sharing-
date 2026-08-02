---
name: invest-check
description: On-demand investor morning check — fetches current USD/JPY, NASDAQ, S&P 500, Dow, and CNN Fear & Greed Index levels via web search, reads the user's stock watchlist from their Company Watchlist mini app export (company-watchlist-backup*.json in Downloads), and for each publicly-traded company on it researches recent developments and compares it against 1-2 competitors to give a forward-looking outlook (private/pre-IPO companies are skipped by default — ask for those individually by name when wanted). Trigger when the user asks to run their morning market check, invest check, indicator check, or wants an analysis/comparison of the companies on their watchlist. Also trigger on phrases like "invest-check", "朝チェック", "指標チェック", "銘柄比較", "ウォッチリストの分析".
---

# Invest Check

On-demand personal-investing check: macro market indicators plus a competitive
outlook analysis of every company on the user's Company Watchlist — whether or
not it's publicly traded. Nothing here runs automatically; it only executes
when the user asks for it.

## Step 1 — Find the latest watchlist export

Companies are tracked in the "Company Watchlist" mini app
(`apps/company-watchlist`), which stores data in the browser's localStorage.
That's not readable from here directly, so the user bridges it by clicking the
app's "Export" button, which downloads a JSON backup to their Downloads
folder.

- Look in the Windows Downloads folder (`%USERPROFILE%\Downloads`) for files
  matching `company-watchlist-backup*.json` (the browser appends ` (1)`,
  ` (2)`, etc. instead of overwriting on repeat exports).
- Use whichever file has the newest `exportedAt` timestamp inside it (don't
  rely on filename alone).
- If no matching file exists, tell the user to open the Company Watchlist app
  and click Export, then ask again.
- If the newest `exportedAt` is more than ~7 days old, mention the data may be
  stale and suggest re-exporting for a fresher read — but proceed with what's
  available unless the user wants to wait.

## Step 2 — Macro indicators

Do this step directly with the WebSearch tool in the main conversation —
**don't spawn a subagent for it.** It's only 4-5 small factual lookups; a
subagent's fixed overhead (bootstrapping, re-reading tool schemas, writing up
a report) costs more than it saves here. Save subagents for Step 3, where the
per-company research volume actually justifies them.

Web search for the current level and daily change of:
- USD/JPY exchange rate
- NASDAQ (Composite or 100)
- S&P 500
- Dow Jones Industrial Average
- CNN Fear & Greed Index (current score 0-100 and its label, e.g. "Greed",
  "Extreme Fear" — this gauges overall market sentiment, distinct from the
  price levels above)

A couple of well-chosen searches (e.g. one for the three US indices together,
one for USD/JPY, one for the Fear & Greed Index) usually cover all five —
no need for a separate search per indicator.

## Step 3 — Per-company analysis

Only analyze companies that have a real ticker (not blank, not a placeholder
like `"NON-IPO"`). Skip private/pre-IPO companies entirely — no section for
them in the output. They rarely have meaningful day-to-day news, so
researching them on every run wasn't earning its token cost; the user can ask
for a one-off analysis of a specific private company by name whenever they
actually want one (as with the Sila request earlier), instead of it running
by default every check.

For every remaining (publicly traded) company in the export:

- **Price**: look up current price and recent performance (roughly 1-day and
  1-month change).
- **Competitor comparison**: identify 1-2 relevant competitors or peers in the
  same space and research their recent trajectory, so the company can be
  placed in context rather than assessed in isolation.
- **Use the user's own context**: fold in that company's `notes`, `industry`,
  and `status` (watching / top-choice / follow-up) — these capture what the
  user personally already thinks, so the analysis should build on it rather
  than restate generic facts they didn't ask about.
- **Forward-looking take**: a short read on what's changed recently, how it
  stacks up against the peers just researched, and what's worth watching next.
  This is informational synthesis, not financial advice — never phrase it as
  a buy/sell recommendation or price target.

For a large watchlist, research companies in parallel (e.g. via subagents) to
keep the wait reasonable — this is meant to be a quick glance, not a
research report that takes many minutes to load.

## Step 4 — Output

Reply directly in the chat as structured Markdown — no file or artifact needed
unless the user asks for one:

1. A short macro summary (the five indicators, one line each)
2. One subsection per publicly-traded company: name, ticker, price/change,
   competitor comparison, outlook note

Keep it scannable — this is a morning glance, not a document to read end to
end. Write it in Japanese to match how the user works in this project.

## Notes

- On-demand only — invoke by asking things like "invest-check", "朝の指標
  チェックして", "ウォッチリストの銘柄比較して".
- Research quality is only as current as the web search results at the time
  of asking; always state that figures are approximate/as-of-search-time
  rather than presenting them as guaranteed-live data.
