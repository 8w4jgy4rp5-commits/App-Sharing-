"""独立した2つ目のソース：10-K に描画されたセグメント注記の表そのものを取る。

03 は XBRL の数値（機械可読）、04 は 10-K の表（人が読む形）。
§4-4 の「2ソース突合」を、同じ企業の同じ数字について実行できる。

仕組み: 各10-Kには FilingSummary.xml があり、注記ごとに R##.htm が対応する。
        ShortName に "Segment" を含む R ファイルの表を CSV に落とす。

使い方:
    python3 04_segment_note_tables.py ../tickers.txt ../out/segment_notes
"""

import csv
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

import sec_common


class TableExtractor(HTMLParser):
    """R##.htm の <table> をセルの二次元配列に変換する。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self._table = None
        self._row = None
        self._cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag == "table" and self._table is not None:
            if self._table:
                self.tables.append(self._table)
            self._table = None
        elif tag == "tr" and self._row is not None:
            if any(cell.strip() for cell in self._row):
                self._table.append(self._row)
            self._row = None
        elif tag in ("td", "th") and self._cell is not None:
            text = re.sub(r"\s+", " ", "".join(self._cell)).strip()
            self._row.append(text)
            self._cell = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def latest_10k_accession(cik):
    data = sec_common.fetch_json(
        f"https://data.sec.gov/submissions/CIK{cik}.json",
        cache_name=f"submissions_{cik}.json",
    )
    recent = data.get("filings", {}).get("recent", {})
    for form, accession, filed in zip(recent.get("form", []),
                                      recent.get("accessionNumber", []),
                                      recent.get("filingDate", [])):
        if form == "10-K":
            return accession.replace("-", ""), filed
    return None, None


def segment_reports(cik, accession_nodash):
    base = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession_nodash}"
    summary = sec_common.fetch(
        f"{base}/FilingSummary.xml",
        cache_name=f"filingsummary_{cik}_{accession_nodash}.xml",
    )
    reports = []
    for block in re.findall(r"<Report[\s>].*?</Report>", summary, flags=re.S):
        name = re.search(r"<ShortName>(.*?)</ShortName>", block, flags=re.S)
        html_file = re.search(r"<HtmlFileName>(.*?)</HtmlFileName>", block, flags=re.S)
        if not name or not html_file:
            continue
        short_name = name.group(1).strip()
        if "segment" in short_name.lower():
            reports.append((short_name, f"{base}/{html_file.group(1).strip()}"))
    return reports


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)

    tickers = sec_common.read_tickers(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    ticker_map = sec_common.load_ticker_map()

    for ticker in tickers:
        entry = ticker_map.get(ticker)
        if entry is None:
            print(f"[warn] {ticker}: SECのティッカー一覧に無い", file=sys.stderr)
            continue
        cik = entry["cik"]
        try:
            accession, filed = latest_10k_accession(cik)
            if accession is None:
                print(f"[warn] {ticker}: 10-K が見つからない", file=sys.stderr)
                continue
            reports = segment_reports(cik, accession)
            if not reports:
                print(f"[warn] {ticker}: Segment を含む注記が見つからない", file=sys.stderr)
                continue

            for order, (short_name, url) in enumerate(reports, start=1):
                html = sec_common.fetch(url, cache_name=f"R_{cik}_{accession}_{order}.htm")
                parser = TableExtractor()
                parser.feed(html)
                if not parser.tables:
                    continue
                safe = re.sub(r"[^A-Za-z0-9]+", "_", short_name)[:60]
                path = out_dir / f"{ticker}_{filed}_{order:02d}_{safe}.csv"
                with path.open("w", newline="", encoding="utf-8") as handle:
                    writer = csv.writer(handle)
                    for table in parser.tables:
                        writer.writerows(table)
                        writer.writerow([])
                print(f"[ok] {ticker}: {short_name} -> {path.name}", file=sys.stderr)
        except Exception as error:  # noqa: BLE001
            print(f"[warn] {ticker}: {error}", file=sys.stderr)


if __name__ == "__main__":
    main()
