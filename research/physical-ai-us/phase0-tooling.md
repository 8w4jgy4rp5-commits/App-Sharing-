# Phase 0：ツール疎通確認の結果

実施日：2026-08-30 / 実行環境：Claude Code リモートコンテナ（egress proxy 経由）

## 結論（先に）

**この実行環境には一般的なウェブアクセスが存在しない。** 組織の egress ポリシーにより、
テストした全ドメインが `connect_rejected` / `EGRESS_BLOCKED` で遮断された。
本リサーチが指定する主データソース（SEC EDGAR）は**取得不能**。

## 1. SEC EDGAR

| エンドポイント | 手段 | 結果 |
|---|---|---|
| `https://www.sec.gov/files/company_tickers.json` | curl（UAなし） | ✗ 403 CONNECT rejected（proxy由来。SECの403ではない） |
| 同上 | curl（`User-Agent: Research research@example.com`） | ✗ 同上。UA付与では突破できない |
| `https://data.sec.gov/api/xbrl/companyconcept/...` | curl / WebFetch | ✗ EGRESS_BLOCKED |
| `https://data.sec.gov/api/xbrl/companyfacts/...` | WebFetch | ✗ EGRESS_BLOCKED |
| `https://efts.sec.gov/LATEST/search-index?q=` | curl | ✗ EGRESS_BLOCKED |
| `https://www.sec.gov/cgi-bin/browse-edgar` | WebFetch | ✗ EGRESS_BLOCKED |
| python `urllib`（プロキシ経由） | — | ✗ `Tunnel connection failed: 403 Forbidden` |

→ **ブラウザUA付きcurlでの突破は成立しなかった。** 日本株版で有効だった回避策は、
今回は proxy がドメイン単位で CONNECT を拒否しているため原理的に効かない。

## 2. その他ウェブ取得（全て遮断を確認）

`stockanalysis.com` / `finance.yahoo.com` / `query1.finance.yahoo.com` / `www.macrotrends.net` /
`last10k.com` / `www.stocktitan.net` / `www.wsj.com` / `s2.q4cdn.com`（企業IR CDN）/
`www.prnewswire.com` / `en.wikipedia.org` / `www.anthropic.com` — **すべて EGRESS_BLOCKED**。

→ 遮断は「金融サイトのブロック」ではなく**全ドメイン遮断**。企業IRサイトのPDF直取得も不可。

## 3. PDF処理

`pip install --break-system-packages pymupdf` → **成功**（PyMuPDF 1.28.2 / Python 3.11）。
ライブラリは動くが、**PDFをダウンロードする経路がない**ため実質使えない。
（pypi.org と files.pythonhosted.org のみ noProxy 例外で到達可能）

## 4. 生き残っている唯一の経路：WebSearch

Anthropic 側のサービス経由のため egress proxy を通らず、動作する。
検証結果：2026年8月時点の最新情報を返す。実データも取得できた（下記「実証」参照）。

**制約：**
- 返るのは検索スニペット＋小型モデルによる要約。**一次資料そのものではない。**
- 10-K の Segment Reporting 注記のような**表構造は取得できない**。
- 数値は「その要約モデルがスニペットから読んだもの」であり、**二次情報**。
- 出典URLは返るが、そのURLを WebFetch で開けない（＝原典突合ができない）。

**実証（実際に取得できたもの）:**
- FARO Technologies：2025-07-21 に AMETEK が買収完了、Nasdaq 上場廃止（$44/株、約$920M）
- NV5 Global：2025-08-04 に Acuren と合併完了、Nasdaq 上場廃止（→ NYSE: TIC）
- Chart Industries：2026-07-16 に Baker Hughes が買収完了、上場廃止（$210/株）
- Mistras Group (MG)：時価総額 $564.11M、株価 $15.79、発行済 31,816,681株（2026-08-10時点）
- Team Inc (TISI)：時価総額 $75.66M（→ $300M 下限を下回る）
- Cognex (CGNX)：2025年 営業利益率 16%（2024年 13%）

## 5. データ項目 → 取得元の対応表（現状で可能な範囲）

| データ項目 | 本来の取得元 | 現状で可能な手段 | 検証強度 |
|---|---|---|---|
| 上場状態・M&A・上場廃止 | EDGAR 提出書類日付 | WebSearch | **強**（事象は一次報道で確認可能） |
| 株価・時価総額・発行済株式数 | 2ソース突合 | WebSearch（複数クエリで突合可） | 中 |
| 全社売上・営業利益（GAAP） | 10-K 損益計算書 | WebSearch（決算リリース経由） | 中 |
| **セグメント別売上・営業利益（GAAP）** | **10-K Item 8 Segment注記** | **ほぼ不可** | **弱〜不能** |
| セグメント別 設備投資額 | 10-K Segment注記 | **不可** | 不能 |
| ASU 2023-07 significant segment expenses | FY2024以降 10-K | **不可** | 不能 |
| 全社 R&D費 3期推移 | 損益計算書 | WebSearch（部分的） | 中〜弱 |
| 従業員数 3期推移 | 10-K Item 1 | WebSearch（部分的） | 弱 |
| のれん減損（reporting unit別） | 10-K 注記 | WebSearch（大型減損のみ報道される） | 弱 |
| 受注残 / RPO | 10-K / 決算資料 | WebSearch（開示企業のみ） | 中〜弱 |
| 株式数3期推移・希薄化率 | 10-K表紙 / XBRL | WebSearch（部分的） | 弱 |
| 現金・有利子負債・営業CF | 財務諸表 | WebSearch（部分的） | 中〜弱 |
| 株式報酬費用 ÷ 売上高 | 財務諸表 | **ほぼ不可** | 弱 |
| Form 4 インサイダー取引 | EDGAR | **不可** | 不能 |
| 8-K（買収・売却） | EDGAR | WebSearch（報道されたもののみ） | 中 |

## 6. これが本リサーチに与える影響

§3 Phase 2 は「**セグメント実数による足切り**」であり、本調査の核心と明示されている。
その一次データ（10-K Segment注記の GAAP セグメント営業利益、セグメント別設備投資、
ASU 2023-07 の significant segment expenses）が**構造的に取得できない**。

§4-1「数値を推測で埋めない」を守る限り、現状のツールで作れる Phase 2 は
「**多くのセルが『取得不能』の表**」になる。日本株版の失敗（物語先行）を回避するための
足切り装置が機能しないまま Phase 3 以降に進むと、**日本株版と同じ失敗を再現する**危険が高い。

したがって Phase 1 完了時点で一度判断を仰ぐ。
