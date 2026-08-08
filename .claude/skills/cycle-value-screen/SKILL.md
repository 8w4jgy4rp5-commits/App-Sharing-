---
name: cycle-value-screen
description: On-demand Japanese equity value-investing research that combines business-cycle phase, sector cyclicality, valuation screening (PER/PBR/EV-EBITDA), supply-demand/chart signals, and institutional/insider activity to judge whether a sector (or a few named companies in it) is worth accumulating right now. Splits the work into mechanical retrieval — macro indicators, valuation multiples, sector representative lists, technical/supply-demand data, institutional filings, handled directly via WebSearch or lightweight subagents — versus real judgment — business-cycle phase determination, separating "market oversight" from "structural decline" as the reason a stock looks cheap, and the final synthesis, which the main agent always does itself and never delegates. Trigger when the user asks to screen for undervalued Japanese stocks tied to the economic cycle, e.g. "景気循環×バリュー株スクリーニングして", "不況局面で仕込むべき割安セクターを探して", "差別化困難な業種で割安な銘柄を探して", "景気後退局面の割安株スクリーニング". Not for daily single-stock monitoring of an existing watchlist (see invest-check) — this is for sector/cycle-driven screening of new ideas.
---

# Cycle × Value Screening

On-demand research that answers "which sector/companies are cheap for a good
reason right now, given where we are in the business cycle" — never
executes automatically, and never outputs a buy/sell call. This is research
organization, not investment advice; say so in the output.

## Step 1 — Scope the request

- Does the user name specific companies, or only a sector/theme? If no
  company is named, don't force a single-stock pick — list 2-4
  representative players in the sector and treat the sector itself as the
  unit of analysis.
- How deep does the cycle-phase call need to go — just "where are we now",
  or also "is a turn imminent"? The latter needs more evidence before
  committing to a view; say so if it does.

## Step 2 — Parallel retrieval (mechanical, low-stakes)

These don't need heavyweight reasoning — do them directly with WebSearch,
or via subagents in parallel when the volume of names/sectors justifies it
(same tradeoff as invest-check Step 2/3: a couple of searches beats a
subagent for a handful of lookups; use subagents once you're covering
several sectors or many tickers at once).

- **Macro cycle inputs**: latest 景気動向指数(DI/CI), 日銀短観 relevant
  items, and any other headline indicators — facts only, no phase judgment
  yet.
- **Sector candidates**: for the requested theme (or "difficult to
  differentiate" sectors in general — commoditized products/services,
  price-competition-driven, low barriers to entry), list representative
  listed companies.
- **Valuation**: current PER/PBR/EV-EBITDA for the candidates, plus their
  own historical average and sector average where available.
- **Supply/demand & chart**: volume trend, margin balance (信用残), and
  price vs. moving averages.
- **Institutional/insider activity**: large shareholding reports (大量保有
  報告書), buyback announcements, notable insider transactions.

Keep each of these as compact structured notes, not prose — they're
intermediate inputs, not the deliverable.

## Step 3 — Judgment (do this yourself, don't delegate)

This is the part the template calls for a "high-performance model" — in
this environment that just means: do it directly in the main conversation
with full context, not via a subagent that only sees a fragment.

- **Business-cycle phase**: weigh the macro inputs from Step 2 into a
  view (e.g. 拡張後期/後退初期/...). If indicators point different
  directions, say so explicitly rather than forcing a clean answer.
- **Is the sector genuinely commoditized**, or does it have an exception —
  a player with real differentiation the "hard to differentiate" label
  glosses over? Check for that before treating the whole sector as
  interchangeable.
- **Why is it cheap?** For each valuation read, explicitly separate
  "market seems to be overlooking this" from "price is pre-pricing a real
  earnings problem." Don't call something undervalued just because the
  multiple is low.
- **Do supply/demand and fundamentals agree or conflict?** e.g. cheap on
  paper but heavy institutional selling and price below the moving
  average is a conflict worth flagging, not glossing over.
- **What are institutional/insider flows implying** — accumulation,
  distribution, or no clear signal?

State a confidence level for the cycle-phase call and the overall
"worth accumulating" read. If conflicting, prefer explicit uncertainty over
forcing a verdict.

## Step 4 — Output

Reply in Japanese (per this project's convention), structured but concise:

1. 景気循環局面の現状認識（根拠指標と、判定の確信度・矛盾点があればそれも）
2. 対象業種・代表銘柄（ユーザーが個別銘柄を指定していなければ2〜4社を例示）
3. バリュエーション（PER/PBR/EV-EBITDA、過去平均・業種平均との比較、割安の理由が「見落とし」か「構造要因」かの見立て）
4. 需給・チャート（ファンダメンタルズとの整合・矛盾）
5. 機関投資家・インサイダー動向
6. 総合評価（今の局面で仕込む価値があるか、リスク・不確実性込みで）— 投資助言ではなくリサーチ情報の整理であることを明記

Keep it scannable; this is a research briefing, not an exhaustive report,
unless the user asks for more depth on a specific part.

## Notes

- On-demand only — invoke on phrases like "景気循環×バリュー株スクリーニング
  して", "割安セクター探して", "不況で仕込むならどこ".
- Numbers are only as current as search results at the time of asking —
  say so rather than presenting them as live data.
- Never phrase the final read as a buy/sell recommendation or price
  target.
