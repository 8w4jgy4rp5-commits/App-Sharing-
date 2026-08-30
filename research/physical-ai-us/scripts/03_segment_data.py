"""★本命★ セグメント別の実数を SEC の Financial Statement Data Sets から取る。

companyfacts API は「連結の値」しか返さず、セグメント軸（dimension）を落とす。
セグメント別を機械的に取るには DERA の四半期データセットを使う。
num.txt に segments 列があり、そこに軸=メンバーが入っている。

取れるもの:
  - セグメント別 売上
  - セグメント別 GAAP 営業利益   ← Phase 2 の核心
  - セグメント別 設備投資          ← Phase 3 の核心
  - セグメント別 資産・減価償却
  - ASU 2023-07 の significant segment expenses（企業が出していれば）

注意: ZIPは1本 50〜80MB。既定の直近5四半期で 300〜400MB 程度。
      cache/ に保存するので2回目以降は再取得しない。

使い方:
    python3 03_segment_data.py ../tickers.txt > ../out/03_segments.csv
    python3 03_segment_data.py ../tickers.txt 2024q1 2024q2 ... > ...
"""

import csv
import io
import sys
import zipfile
from datetime import date

import sec_common

BASE = "https://www.sec.gov/files/dera/data/financial-statement-data-sets"

TAGS_OF_INTEREST = {
    # 売上
    "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
    "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet",
    # 利益（GAAP）
    "OperatingIncomeLoss", "ProfitLoss", "NetIncomeLoss",
    # 資本配分（Phase 3）
    "PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets",
    "ResearchAndDevelopmentExpense",
    "DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet",
    # 規模
    "Assets", "Goodwill", "GoodwillImpairmentLoss",
}

FIELDNAMES = [
    "ticker", "cik", "name", "form", "fy", "fp", "period",
    "tag", "ddate", "qtrs", "uom", "segments", "value", "dataset",
]


def recent_quarters(count=5):
    """直近 count 四半期のデータセット名（例 2026q1）を新しい順に返す。"""
    today = date.today()
    year, quarter = today.year, (today.month - 1) // 3 + 1
    names = []
    for _ in range(count):
        quarter -= 1
        if quarter == 0:
            quarter, year = 4, year - 1
        names.append(f"{year}q{quarter}")
    return names


def read_table(zf, member):
    """タブ区切りテキストを1行ずつ dict で流す（メモリに全部載せない）。"""
    with zf.open(member) as raw:
        stream = io.TextIOWrapper(raw, encoding="utf-8", errors="replace", newline="")
        header = stream.readline().rstrip("\r\n").split("\t")
        index = {name: position for position, name in enumerate(header)}
        for line in stream:
            fields = line.rstrip("\r\n").split("\t")
            if len(fields) != len(header):
                continue
            yield index, fields


def process_dataset(name, cik_to_ticker, writer):
    try:
        blob = sec_common.fetch(f"{BASE}/{name}.zip", binary=True, cache_name=f"{name}.zip")
    except Exception as error:  # noqa: BLE001
        print(f"[warn] {name}.zip を取得できず: {error}", file=sys.stderr)
        return 0

    zf = zipfile.ZipFile(io.BytesIO(blob))

    # 1) sub.txt: 対象CIKの 10-K だけを拾う
    submissions = {}
    for index, fields in read_table(zf, "sub.txt"):
        cik = fields[index["cik"]].zfill(10)
        if cik not in cik_to_ticker:
            continue
        if fields[index["form"]] not in ("10-K", "10-K/A"):
            continue
        submissions[fields[index["adsh"]]] = {
            "cik": cik,
            "name": fields[index["name"]],
            "form": fields[index["form"]],
            "fy": fields[index["fy"]],
            "fp": fields[index["fp"]],
            "period": fields[index["period"]],
        }

    if not submissions:
        print(f"[info] {name}: 対象企業の10-Kなし", file=sys.stderr)
        return 0

    # 2) num.txt: セグメント軸つきの数値だけを書き出す
    written = 0
    for index, fields in read_table(zf, "num.txt"):
        adsh = fields[index["adsh"]]
        submission = submissions.get(adsh)
        if submission is None:
            continue
        tag = fields[index["tag"]]
        if tag not in TAGS_OF_INTEREST:
            continue
        segments = fields[index["segments"]] if "segments" in index else ""
        if not segments:
            continue  # 連結値は 02_company_financials.py が担当
        writer.writerow({
            "ticker": cik_to_ticker[submission["cik"]],
            "cik": submission["cik"],
            "name": submission["name"],
            "form": submission["form"],
            "fy": submission["fy"],
            "fp": submission["fp"],
            "period": submission["period"],
            "tag": tag,
            "ddate": fields[index["ddate"]],
            "qtrs": fields[index["qtrs"]],
            "uom": fields[index["uom"]],
            "segments": segments,
            "value": fields[index["value"]],
            "dataset": name,
        })
        written += 1

    print(f"[info] {name}: {len(submissions)}件の10-Kから {written}行", file=sys.stderr)
    return written


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(2)

    tickers = sec_common.read_tickers(sys.argv[1])
    datasets = sys.argv[2:] or recent_quarters(5)

    ticker_map = sec_common.load_ticker_map()
    cik_to_ticker = {}
    for ticker in tickers:
        entry = ticker_map.get(ticker)
        if entry is None:
            print(f"[warn] {ticker}: SECのティッカー一覧に無い", file=sys.stderr)
            continue
        cik_to_ticker[entry["cik"]] = ticker

    writer = csv.DictWriter(sys.stdout, fieldnames=FIELDNAMES)
    writer.writeheader()

    total = 0
    for name in datasets:
        total += process_dataset(name, cik_to_ticker, writer)
        sys.stdout.flush()

    print(f"[done] 合計 {total} 行", file=sys.stderr)


if __name__ == "__main__":
    main()
