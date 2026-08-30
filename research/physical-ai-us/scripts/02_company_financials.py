"""全社レベルの GAAP 実数を XBRL companyfacts API から取得する。

Phase 2 の「全社」欄（売上・GAAP営業利益・R&D・設備投資・現金・負債・営業CF・
株式報酬・株式数・のれん・のれん減損）を3期分そろえる。
セグメント別は 03_segment_data.py が担当する。

使い方:
    python3 02_company_financials.py ../tickers.txt > ../out/02_financials.csv
"""

import csv
import sys
from datetime import datetime

import sec_common

# 取りたい概念。同義タグは優先順に並べ、最初に見つかったものを使う。
CONCEPTS = {
    "revenue": [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
    ],
    "operating_income_gaap": ["OperatingIncomeLoss"],
    "net_income": ["NetIncomeLoss"],
    "rnd": ["ResearchAndDevelopmentExpense"],
    "sbc": ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense"],
    "capex": [
        "PaymentsToAcquirePropertyPlantAndEquipment",
        "PaymentsToAcquireProductiveAssets",
    ],
    "operating_cf": ["NetCashProvidedByUsedInOperatingActivities"],
    "cash": [
        "CashAndCashEquivalentsAtCarryingValue",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    ],
    "long_term_debt": ["LongTermDebtNoncurrent", "LongTermDebt"],
    "goodwill": ["Goodwill"],
    "goodwill_impairment": ["GoodwillImpairmentLoss", "ImpairmentOfIntangibleAssetsIncludingGoodwill"],
    "diluted_shares": ["WeightedAverageNumberOfDilutedSharesOutstanding"],
}

FIELDNAMES = [
    "ticker", "cik", "name", "fy", "period_end", "concept", "tag", "value", "unit",
]


def annual_values(facts, tags):
    """10-K / FY のみを拾い、fy -> (end, val, tag, unit) を返す。"""
    for tag in tags:
        node = facts.get("us-gaap", {}).get(tag)
        if not node:
            continue
        best = {}
        for unit, entries in node.get("units", {}).items():
            for entry in entries:
                if entry.get("form") != "10-K" or entry.get("fp") != "FY":
                    continue
                fy = entry.get("fy")
                if fy is None:
                    continue
                start, end = entry.get("start"), entry.get("end")
                if start and end:
                    # 通期（およそ350〜380日）のみ。四半期の値を混ぜない。
                    days = (datetime.strptime(end, "%Y-%m-%d")
                            - datetime.strptime(start, "%Y-%m-%d")).days
                    if not 340 <= days <= 400:
                        continue
                # 同じ fy に複数あれば、最後に提出されたものを採用
                previous = best.get(fy)
                if previous is None or entry.get("filed", "") > previous["filed"]:
                    best[fy] = {"end": end, "val": entry.get("val"),
                                "filed": entry.get("filed", ""), "unit": unit}
        if best:
            return tag, best
    return None, {}


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        raise SystemExit(2)

    tickers = sec_common.read_tickers(sys.argv[1])
    ticker_map = sec_common.load_ticker_map()

    writer = csv.DictWriter(sys.stdout, fieldnames=FIELDNAMES)
    writer.writeheader()

    for ticker in tickers:
        entry = ticker_map.get(ticker)
        if entry is None:
            print(f"[warn] {ticker}: SECのティッカー一覧に無い", file=sys.stderr)
            continue
        cik = entry["cik"]
        try:
            data = sec_common.fetch_json(
                f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                cache_name=f"companyfacts_{cik}.json",
            )
        except Exception as error:  # noqa: BLE001
            print(f"[warn] {ticker}: {error}", file=sys.stderr)
            continue

        facts = data.get("facts", {})
        name = data.get("entityName", entry["title"])

        for concept, tags in CONCEPTS.items():
            tag, values = annual_values(facts, tags)
            if not values:
                # 開示なし / タグ違い。行は出さず、後で「取得できず」と分かるようにする。
                continue
            for fy in sorted(values)[-4:]:  # 直近4期
                item = values[fy]
                writer.writerow({
                    "ticker": ticker, "cik": cik, "name": name, "fy": fy,
                    "period_end": item["end"], "concept": concept, "tag": tag,
                    "value": item["val"], "unit": item["unit"],
                })
        sys.stdout.flush()


if __name__ == "__main__":
    main()
