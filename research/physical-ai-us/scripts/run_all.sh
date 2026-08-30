#!/usr/bin/env bash
# 4本まとめて実行する。手元のPC（普通にネットにつながる環境）で動かすこと。
set -euo pipefail
cd "$(dirname "$0")"

# SEC は User-Agent に連絡先を要求する。自分の名前とメールに書き換えてから実行する。
export SEC_USER_AGENT="${SEC_USER_AGENT:-Your Name your@email.com}"

if [ "$SEC_USER_AGENT" = "Your Name your@email.com" ]; then
  echo "先に連絡先を設定してください:" >&2
  echo '  export SEC_USER_AGENT="Taro Yamada taro@example.com"' >&2
  exit 1
fi

mkdir -p ../out

echo "[1/4] 上場状態を確認（全95社）..."
python3 01_verify_listings.py ../tickers-universe.txt > ../out/01_listings.csv

echo "[2/4] 全社の GAAP 実数を取得（33社）..."
python3 02_company_financials.py ../tickers.txt > ../out/02_financials.csv

echo "[3/4] セグメント別の実数を取得（33社）... ZIPを数百MB落とすので時間がかかります"
python3 03_segment_data.py ../tickers.txt > ../out/03_segments.csv

echo "[4/4] 10-K のセグメント注記の表を取得（33社）..."
python3 04_segment_note_tables.py ../tickers.txt ../out/segment_notes

echo
echo "完了。結果は research/physical-ai-us/out/ にあります。"
echo "  01_listings.csv   verdict 列が REVIEW の行だけ先に見ること（上場廃止・買収・外国籍）"
echo "  02_financials.csv 全社の3〜4期分"
echo "  03_segments.csv   ★セグメント別の売上・GAAP営業利益・設備投資"
echo "  04 segment_notes/ 10-Kの注記そのもの（03の答え合わせ用）"
