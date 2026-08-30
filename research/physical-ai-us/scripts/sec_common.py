"""SEC EDGAR への共通アクセス層。

SEC は User-Agent ヘッダに連絡先を要求する（付けないと 403）。
レート制限は 10 リクエスト/秒。ここでは安全側に倒して 7 req/s に抑える。

環境変数 SEC_USER_AGENT で連絡先を上書きできる。
  例: export SEC_USER_AGENT="Taro Yamada taro@example.com"
"""

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

USER_AGENT = os.environ.get("SEC_USER_AGENT", "PhysicalAI Research research@example.com")

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"

_MIN_INTERVAL = 1.0 / 7.0  # 7 req/s
_last_request_at = 0.0


def _throttle():
    global _last_request_at
    wait = _MIN_INTERVAL - (time.monotonic() - _last_request_at)
    if wait > 0:
        time.sleep(wait)
    _last_request_at = time.monotonic()


def fetch(url, *, binary=False, cache_name=None, max_retries=4):
    """SEC から取得する。cache_name を渡すとローカルにキャッシュして再取得しない。"""
    cache_path = None
    if cache_name:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = CACHE_DIR / cache_name
        if cache_path.exists():
            return cache_path.read_bytes() if binary else cache_path.read_text("utf-8")

    last_error = None
    for attempt in range(max_retries):
        _throttle()
        request = urllib.request.Request(url, headers={
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "gzip",
        })
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
                if response.headers.get("Content-Encoding") == "gzip":
                    import gzip
                    raw = gzip.decompress(raw)
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code == 404:
                raise
            time.sleep(2 ** attempt)
            continue
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            time.sleep(2 ** attempt)
            continue

        if cache_path:
            cache_path.write_bytes(raw)
        return raw if binary else raw.decode("utf-8", errors="replace")

    raise RuntimeError(f"取得に失敗しました: {url} ({last_error})")


def fetch_json(url, *, cache_name=None):
    return json.loads(fetch(url, cache_name=cache_name))


def load_ticker_map():
    """ティッカー -> {cik(10桁ゼロ埋め), title} の辞書を返す。"""
    data = fetch_json(
        "https://www.sec.gov/files/company_tickers.json",
        cache_name="company_tickers.json",
    )
    mapping = {}
    for entry in data.values():
        mapping[entry["ticker"].upper()] = {
            "cik": str(entry["cik_str"]).zfill(10),
            "title": entry["title"],
        }
    return mapping


def read_tickers(path):
    """1行1ティッカーのテキストファイルを読む。# 以降はコメント。"""
    tickers = []
    for line in Path(path).read_text("utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            tickers.append(line.upper())
    return tickers
