# 手元のPCで続きをやるための引き継ぎ

このリサーチはクラウド上のClaude Codeで始めましたが、その環境は
**外部ネットワークが全面遮断**されていて SEC EDGAR に到達できませんでした（詳細は `phase0-tooling.md`）。
手元のターミナル版 Claude Code は普通にネットにつながるので、そちらで続きを実行します。

---

## 手順（3ステップ）

### ステップ1：このブランチを手元に持ってくる

```bash
git clone https://github.com/8w4jgy4rp5-commits/App-Sharing-.git
cd App-Sharing-
git checkout claude/physical-ai-closed-loop-research-fn4xkn
```

すでにクローン済みなら:

```bash
git checkout claude/physical-ai-closed-loop-research-fn4xkn
git pull
```

### ステップ2：SEC に名乗る連絡先を設定する

SEC は「誰がアクセスしているか」をヘッダに書くよう求めていて、書かないと 403 で弾かれます。
名前とメールアドレスを設定してください（実在のもので構いません）。

```bash
export SEC_USER_AGENT="Taro Yamada taro@example.com"
```

### ステップ3：実行する

```bash
cd research/physical-ai-us/scripts
./run_all.sh
```

**追加インストールは不要です。** Python 3.9 以上があれば標準ライブラリだけで動きます。

所要時間の目安：ステップ3のうち `03` が一番時間がかかります（SECの一括データを
300〜400MB ダウンロードするため、回線によって5〜20分）。
2回目以降は `cache/` に保存されたものを使うので速くなります。

---

## 何が出てくるか

| ファイル | 中身 | 何に使うか |
|---|---|---|
| `out/01_listings.csv` | 全95社の上場状態・決算期・提出書類種別 | **§4-3 の自動化。** `verdict` 列が `REVIEW` の行だけ先に見る |
| `out/02_financials.csv` | 全社の売上・GAAP営業利益・R&D・設備投資・現金・負債・営業CF・株式報酬・株式数（3〜4期） | Phase 2 の「全社」欄、希薄化率、株式報酬÷売上 |
| `out/03_segments.csv` | **セグメント別の売上・GAAP営業利益・設備投資・R&D** | **Phase 2 の核心と Phase 3 の核心** |
| `out/segment_notes/*.csv` | 10-K のセグメント注記の表そのもの | 03 の答え合わせ（§4-4 の2ソース突合） |

### まず見るべきもの

**`out/01_listings.csv` の `verdict` 列。** ここに以下が自動で出ます:

- `上場廃止フォーム(25-NSE)` — Form 25 は上場廃止の届出。**FARO も Great Lakes もこれで一発で分かります**
- `買収関連フォーム(SC 14D9|DEFM14A)` — 買収提案・合併委任状
- `外国籍提出会社(20-F)` — 10-K ではなく 20-F を出している ＝ §2 の除外対象
- `SECのティッカー一覧に存在しない` — 上場廃止か改称。**Montrose→Onterris の改称もこれで分かります**
- `最終提出から◯日` — 180日以上なら要確認

日本株版では「最有力候補2社が既に非公開化済み」という失敗が起きました。
このCSVの `verdict` 列を最初に見るだけで、その種類の失敗はゼロにできます。

---

## クラウド側ですでに終わっている作業

| ファイル | 内容 | 状態 |
|---|---|---|
| `phase0-tooling.md` | ツール疎通確認の結果 | 完了（ただしSEC不可という結果） |
| `phase1-universe.md` | 候補ユニバース 95社 | 完了 |
| `phase1b-closed-loop-screen.md` | 構造スクリーン（95社→33社） | 完了 |
| `phase2-pilot.md` | WebSearchのみでの取得率の実測 | 完了 |
| `phase2-data.md` | 23社分のセグメント実数（検索経由の二次情報） | **要・再検証** |
| `phase2-screen-table.md` | A〜E の足切り表 | **要・再検証** |

**`phase2-data.md` と `phase2-screen-table.md` の数値は、すべて検索エンジンの要約を
経由した二次情報です。**一次資料を開いて確認したものは一つもありません。
上のスクリプトを回したら、この2ファイルは**上書きし直してください**。

---

## 再開したら Claude に投げる指示（コピペ用）

```
research/physical-ai-us/ の続きをやります。
まず HANDOFF.md と phase0-tooling.md を読んでください。

scripts/run_all.sh を実行して out/ にデータを出したうえで、

1. out/01_listings.csv の verdict 列を見て、§4-3 の上場状態チェックをやり直す。
   REVIEW の企業は除外理由を明記して落とす。
2. out/03_segments.csv と out/segment_notes/ を突き合わせて（§4-4 の2ソース突合）、
   phase2-data.md と phase2-screen-table.md を一次資料ベースで作り直す。
   検索経由の数値は全部捨ててよい。
3. そのうえで Phase 3（資本配分の方向）へ進む。
   セグメント別設備投資の3期推移と、ASU 2023-07 の significant segment expenses が
   03_segments.csv から取れるはずなので、それを主指標にする。

§4 の「絶対に守ること」7項目、特に §4-1（推測で埋めない）と
§4-2（セグメント利益は必ずGAAP）を守ってください。
```

---

## クラウド版で確定していること（手元でも引き継いでよい）

一次資料が要らない事実確認は済んでいます。

**上場廃止・改称（すべて一次報道で確認済み）**

| 企業 | 事象 |
|---|---|
| FARO Technologies (FARO) | 2025-07-21 AMETEK が買収完了、Nasdaq上場廃止（$44/株・約$920M） |
| NV5 Global (NVEE) | 2025-08-04 Acuren と合併、上場廃止 → **Acuren はさらに TIC Solutions, Inc. に改称** |
| Chart Industries (GTLS) | 2026-07-16 Baker Hughes が買収完了、上場廃止（$210/株） |
| Great Lakes Dredge (GLDD) | 2026-04-01 Saltchuk が買収完了、NASDAQ上場廃止（$17.00/株） |
| Montrose Environmental | 2026-04-17 社名変更 → **Onterris**、2026-05-04 ティッカー **MEG → ONT** |
| Team, Inc. (TISI) | 時価総額 $75.66M で §2 の $300M 下限を下回る |

**構造スクリーンの結論（製品ラインから判定、物語ではない）**

95社のうち「観測手段と作用手段を同じ会社が持っている」のは33社。
Cognex・Ouster・Planet Labs・Impinj などは観測のみ、IES・Sterling などは作用のみで、
どちらも「もう片方を持つ企業の下請け」になる位置。詳細は `phase1b-closed-loop-screen.md`。

**要検証だが有望な観察（数値の裏取りが必要）**

- 日本株版のパターン（物語の乗る事業が赤字か低収益）が **Valmont / Xylem / Moog /
  Wabtec / Rockwell / Hyster-Yale** で再現している疑い
- 逆に **Itron / Onterris** は「観測データの上に載る運用サービスがハードより儲かっている」
  という、日本株版では見つからなかった型の疑い

**この2つの観察を、一次資料で確認することが手元での最優先タスクです。**

---

## スクリプトの中身（何をしているか）

| ファイル | 役割 |
|---|---|
| `scripts/sec_common.py` | SECへのアクセス共通部。User-Agent付与、7req/秒への制限、リトライ、`cache/` へのキャッシュ |
| `scripts/01_verify_listings.py` | submissions API から上場状態・提出フォーム・決算期を判定 |
| `scripts/02_company_financials.py` | companyfacts API から全社のGAAP実数。四半期値と10-Qを除外し、訂正版があればそちらを採用 |
| `scripts/03_segment_data.py` | **DERA の Financial Statement Data Sets からセグメント別の数値。** companyfacts API はセグメント軸を落とすので、こちらでないと取れない |
| `scripts/04_segment_note_tables.py` | 10-K の `FilingSummary.xml` から Segment 注記の `R##.htm` を見つけ、表をCSV化 |

各スクリプトのロジックはクラウド側で（ネットワーク無しの疑似データを使って）
単体検証済みです。ただし**実際のSECへの通信は一度も試せていません**ので、
最初の実行でエラーが出る可能性はあります。その場合はエラーメッセージごと Claude に渡してください。
