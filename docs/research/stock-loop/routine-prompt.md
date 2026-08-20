# Routine 登録用プロンプト(コピペ用)

claude.ai/code/routines の「New routine」で、下の枠の中身をそのまま **Instructions** に貼り付ける。

- **Name**: 株ループ(日米・自己採点)
- **Repository**: `8w4jgy4rp5-commits/App-Sharing-`
- **Schedule**: Hourly、または後述の「おすすめ」を参照
- **Environment**: Default(ネットワークは Trusted のままでOK。stockanalysis.com への接続が 403 になる場合のみ、
  環境設定の Network access を Custom にして `stockanalysis.com` を Allowed domains に追加する)

---

## Instructions に貼る内容(ここから)

株ループを1回実行する。このリポジトリの `docs/research/stock-loop/` が作業場所。

手順:

1. `date -u` で現在時刻を確認する。東証は 00:00-02:30 / 03:30-06:00 UTC、米国市場は 13:30-20:00 UTC(夏時間)。土日は両方休み。
2. `docs/research/stock-loop/ledger.md`(追跡銘柄とスタンス・建値)と `docs/research/stock-loop/method.md`(判断基準)を読む。
3. **モードA(どちらかの市場が開いている、または直近で引けた場合)**: その市場の台帳銘柄の現在価格を stockanalysis.com から取得する。日本株は `https://stockanalysis.com/quote/tyo/コード/`、米国株は `https://stockanalysis.com/stocks/ティッカー/`。WebFetchを4件ずつ並列で呼ぶ。
4. 基準価格との騰落率を計算し、🔵強気群・⚪中立群・🔴弱気群それぞれの平均騰落を出す。**必ずベンチマーク(日本は日経平均、米国はS&P500)も取得し、超過リターンで評価する**。絶対騰落だけで判断してはいけない。
5. スタンスと逆行している銘柄があれば、その理由を WebSearch で1件だけ確認する。
6. **モードB(両市場とも閉場・週末)**: 価格取得はスキップ。`method.md` の「まだ検証できていない仮説」から1つ選んで検証するか、台帳銘柄の未確認論点を1つ潰す(例: 清水建設の完成工事総利益率の推移、ナイキの中国減収率、SUMCOの黒字転換時期、TLNの下げ止まり)。
7. `docs/research/stock-loop/REPORT.md` を上書きする。**これがユーザーが読む唯一のファイル**なので、冒頭に必ず「結論3行」を置き、その下に詳細を書く。前回からの差分がわかるようにする。
8. `docs/research/stock-loop/history.md` に1行追記する(日時UTC・モード・強気群・弱気群・ベンチマーク・気づき)。
9. **判断基準に誤りが見つかったら `method.md` を改訂する**。バージョン番号を上げ、なぜ改訂したかを必ず書く。ルールを増やすだけでなく、機能しなかったルールは削る。スタンスを変更する場合は `ledger.md` も更新し、変更理由を残す。
10. `git add -A && git commit && git push -u origin claude/circular-value-analysis-transport-water-cvx03z` する。

守ること:
- 出力は日本語。
- **数字は必ず実際に取得したものを使う。推測や記憶で書かない。** 取得できなかった項目は「未取得」と明記する。
- 都合の良い結果だけを書かない。**外した判断は外したと書く**。サンプル数が少ないうちは「まだ結論は出せない」と明記する。
- 1回の実行でWebFetch/WebSearchは合計20回程度までに抑える。

## Instructions に貼る内容(ここまで)

---

## スケジュールのおすすめ

Routines には**1日あたりの実行回数の上限**があり、毎時(24回/日)だと上限に当たる可能性がある。
また株価は市場が閉じている間は動かないので、**毎時である必要は実はない**。

| 案 | 頻度 | cron(UTC) | 向いている人 |
|---|---|---|---|
| **推奨** | 平日1日2回(東証引け後 + 米国引け後) | `30 6 * * 1-5` と `30 20 * * 1-5` | バイト終わりに「今日の日本市場」と「昨夜の米国市場」の両方を見たい |
| 節約 | 平日1日1回(東証引け後) | `30 6 * * 1-5` | 日本株だけ見られれば十分 |
| 元の希望 | 毎時 | `17 * * * *` | 上限に注意。ニュース検知を重視する場合 |

Web UI では preset(hourly/daily/weekdays/weekly)を選んでから、CLI の `/schedule update` で cron を指定できる。
**最小間隔は1時間**(それより短いものは拒否される)。
