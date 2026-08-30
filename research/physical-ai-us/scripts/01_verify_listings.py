"""§4-3 の自動化：上場状態・提出書類種別・決算期を機械的に確認する。

日本株版の失敗（最有力候補2社が既に非公開化済み）と、
米国株版で捕捉した5件（FARO / NV5 / Chart / Great Lakes / Montrose改称）は、
すべてこのスクリプトが自動で検出できる種類のものです。

使い方:
    python3 01_verify_listings.py ../tickers.txt > ../out/01_listings.csv
"""

import csv
import sys
from datetime import date, datetime

import sec_common

# 見つけたら警告するフォーム
DELISTING_FORMS = {"25", "25-NSE", "15-12B", "15-12G"}
MERGER_FORMS = {"SC 14D9", "SC 14D9/A", "DEFM14A", "SC TO-T", "SC TO-C", "S-4"}
FOREIGN_FORMS = {"20-F", "40-F", "6-K"}

FIELDNAMES = [
    "ticker", "cik", "name", "exchange", "fiscal_year_end", "sic_description",
    "latest_filing", "days_since_filing", "latest_10K", "files_10K",
    "foreign_filer", "delisting_signal", "merger_signal", "verdict",
]


def analyse(ticker, ticker_map):
    row = {
        "ticker": ticker,
        "cik": "",
        "name": "",
        "exchange": "",
        "fiscal_year_end": "",
        "sic_description": "",
        "latest_filing": "",
        "days_since_filing": "",
        "latest_10K": "",
        "files_10K": "",
        "foreign_filer": "",
        "delisting_signal": "",
        "merger_signal": "",
        "verdict": "",
    }

    entry = ticker_map.get(ticker)
    if entry is None:
        # ティッカーが SEC の一覧に無い = 上場廃止・改称・そもそも誤り
        row["verdict"] = "REVIEW: SECのティッカー一覧に存在しない（上場廃止/改称/誤記の疑い）"
        return row

    row["cik"] = entry["cik"]
    row["name"] = entry["title"]

    data = sec_common.fetch_json(
        f"https://data.sec.gov/submissions/CIK{entry['cik']}.json",
        cache_name=f"submissions_{entry['cik']}.json",
    )
    row["name"] = data.get("name", row["name"])
    row["fiscal_year_end"] = data.get("fiscalYearEnd", "")
    row["sic_description"] = data.get("sicDescription", "")
    exchanges = (data.get("exchanges") or [])
    row["exchange"] = "|".join(exchanges)

    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    dates = recent.get("filingDate", [])

    if dates:
        row["latest_filing"] = dates[0]
        try:
            delta = date.today() - datetime.strptime(dates[0], "%Y-%m-%d").date()
            row["days_since_filing"] = delta.days
        except ValueError:
            pass

    seen_delisting = sorted({f for f in forms if f in DELISTING_FORMS})
    seen_merger = sorted({f for f in forms if f in MERGER_FORMS})
    seen_foreign = sorted({f for f in forms if f in FOREIGN_FORMS})

    row["delisting_signal"] = "|".join(seen_delisting)
    row["merger_signal"] = "|".join(seen_merger)
    row["foreign_filer"] = "|".join(seen_foreign)
    row["files_10K"] = "yes" if any(f == "10-K" for f in forms) else "no"

    for form, filed in zip(forms, dates):
        if form == "10-K":
            row["latest_10K"] = filed
            break

    problems = []
    if seen_delisting:
        problems.append(f"上場廃止フォーム({row['delisting_signal']})")
    if seen_merger:
        problems.append(f"買収関連フォーム({row['merger_signal']})")
    if seen_foreign and row["files_10K"] == "no":
        problems.append(f"外国籍提出会社({row['foreign_filer']})")
    if row["files_10K"] == "no" and not seen_foreign:
        problems.append("10-K の提出履歴が無い")
    if isinstance(row["days_since_filing"], int) and row["days_since_filing"] > 180:
        problems.append(f"最終提出から{row['days_since_filing']}日")

    row["verdict"] = "REVIEW: " + " / ".join(problems) if problems else "OK"
    return row


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        raise SystemExit(2)

    tickers = sec_common.read_tickers(sys.argv[1])
    ticker_map = sec_common.load_ticker_map()

    writer = csv.DictWriter(sys.stdout, fieldnames=FIELDNAMES)
    writer.writeheader()

    for ticker in tickers:
        try:
            row = analyse(ticker, ticker_map)
        except Exception as error:  # noqa: BLE001 - 1社の失敗で全体を止めない
            row = {"ticker": ticker, "verdict": f"ERROR: {error}"}
            print(f"[warn] {ticker}: {error}", file=sys.stderr)
        writer.writerow(row)
        sys.stdout.flush()


if __name__ == "__main__":
    main()
