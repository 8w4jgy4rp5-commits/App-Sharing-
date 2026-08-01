// Virtual Trader — Japan Stocks
//
// All portfolio/trade state lives in Supabase (per-user, RLS-protected), not localStorage —
// this app is the deliberate exception to the platform's usual local-only storage rule,
// since positions/cash must survive across devices and be tamper-resistant.
// Order math (fees, avg cost, realized P/L) is intentionally NOT computed here; it all
// happens inside the vtjp_place_order() Postgres function so the client can't fake a fill.
//
// Unlike the US version (apps/virtual-trader), this app has no per-user API key: the
// vtjp-yahoo-proxy Edge Function calls Yahoo Finance's key-free quote/search endpoints,
// so there is no Settings > API key step here.

let currentUser = null;
let selectedSymbol = null;
let pollTimer = null;
let chartTimer = null;
let chart = null;
let candleSeries = null;

// チャートの初期表示は6ヶ月の日足。銘柄を開いた瞬間から証券会社アプリのような
// 見た目になるようにするため（1日足だと市場が閉じている時間帯はほぼ真横の線になる）。
let selectedTimeframe = '6mo';

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function getTokyoParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday').value;
  const hour = parseInt(parts.find((p) => p.type === 'hour').value, 10) % 24;
  const minute = parseInt(parts.find((p) => p.type === 'minute').value, 10);
  return { weekday, hour, minute };
}

// TSE regular session only: morning 9:00-11:30, afternoon 12:30-15:30
// (Asia/Tokyo, Mon-Fri). Does not account for Japanese market holidays — a known MVP limitation.
function isMarketOpen() {
  const { weekday, hour, minute } = getTokyoParts(new Date());
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const minutesNow = hour * 60 + minute;
  const morning = minutesNow >= 9 * 60 && minutesNow < 11 * 60 + 30;
  const afternoon = minutesNow >= 12 * 60 + 30 && minutesNow < 15 * 60 + 30;
  return morning || afternoon;
}

function updateMarketBanner() {
  const open = isMarketOpen();
  const banner = document.getElementById('marketStatusBanner');
  banner.textContent = open
    ? 'Market is open (regular Tokyo Stock Exchange hours).'
    : 'Market is currently closed — trading is disabled.';
  banner.className = 'market-banner ' + (open ? 'open' : 'closed');

  const buyBtn = document.getElementById('buyBtn');
  const sellBtn = document.getElementById('sellBtn');
  if (buyBtn) buyBtn.disabled = !open;
  if (sellBtn) sellBtn.disabled = !open;
}

// ---- Auth ----

async function signIn() {
  const cleanUrl = window.location.origin + window.location.pathname;
  await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cleanUrl } });
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

// Without this, the quote/chart timers keep firing after sign-out and every tick
// fails against an unauthenticated session.
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (chartTimer) clearInterval(chartTimer);
  pollTimer = null;
  chartTimer = null;
  selectedSymbol = null;
}

function updateAuthUI() {
  document.getElementById('authGate').hidden = !!currentUser;
  document.getElementById('app').hidden = !currentUser;
  if (currentUser) {
    loadCashBalance();
  } else {
    stopPolling();
    document.getElementById('symbolPanel').hidden = true;
  }
}

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session ? session.user : null;
  updateAuthUI();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    updateAuthUI();
  });
}

// ---- Search ----

async function searchSymbols(query) {
  const { data, error } = await supabaseClient.functions.invoke('vtjp-yahoo-proxy', {
    body: { action: 'search', query },
  });
  if (error) return { message: 'Could not reach the price service: ' + error.message };
  if (!data || data.error) return { message: describeProxyError(data && data.error, data && data.detail) };
  return { results: data.results || [] };
}

function renderSearchResults(results) {
  const list = document.getElementById('searchResults');
  clearChildren(list);
  (results || []).forEach((r) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = r.symbol + ' — ' + r.description;
    btn.addEventListener('click', () => selectSymbol(r.symbol, r.description));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ---- Chart + quote polling ----

const tokyoTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// Intraday bars arrive as UNIX seconds, which lightweight-charts labels in UTC —
// a 09:00 JST opening bar would otherwise read 00:00. Daily bars arrive as
// 'YYYY-MM-DD' and become timezone-free BusinessDay objects, which need no shifting.
function formatChartTime(time) {
  if (typeof time === 'number') return tokyoTimeFormatter.format(new Date(time * 1000));
  if (time && typeof time === 'object') return time.month + '/' + time.day;
  return String(time);
}

function ensureChart() {
  if (chart) return;
  chart = LightweightCharts.createChart(document.getElementById('chartContainer'), {
    autoSize: true,
    layout: { background: { color: '#ffffff' }, textColor: '#1f2430' },
    timeScale: {
      timeVisible: false,
      secondsVisible: false,
      tickMarkFormatter: formatChartTime,
    },
    localization: { timeFormatter: formatChartTime },
    grid: { vertLines: { color: '#eef0f3' }, horzLines: { color: '#eef0f3' } },
  });
  // Japanese charting convention: red candles are up days, blue are down days —
  // the opposite of the US version's green/red. Matches what Japanese brokerage
  // apps show, which is what this app is practice for.
  candleSeries = chart.addCandlestickSeries({
    upColor: '#e5484d',
    downColor: '#2f6fd0',
    borderUpColor: '#e5484d',
    borderDownColor: '#2f6fd0',
    wickUpColor: '#e5484d',
    wickDownColor: '#2f6fd0',
  });
}

function describeProxyError(code, detail) {
  if (code === 'no_historical_data') return 'No chart history is available for this symbol yet.';
  if (code === 'invalid_timeframe') return 'That chart range is not supported.';
  if (code === 'missing_symbol') return 'Select a symbol first.';
  if (code === 'missing_query') return 'Enter something to search for.';
  if (code === 'not_a_tokyo_symbol') return 'Only Tokyo Stock Exchange symbols are supported here.';
  if (code === 'japanese_search_unsupported') {
    return 'The price service only accepts English text. Search by 4-digit code instead (e.g. 6758 for Sony).';
  }
  if (code === 'symbol_not_found') return 'That symbol could not be found.';
  if (code === 'yahoo_error') {
    return 'The price service did not return data' + (detail ? ' (' + detail + ').' : '.');
  }
  return 'Price data is unavailable right now.';
}

// Candles come from the vtjp-yahoo-proxy Edge Function, which reads Yahoo Finance's
// key-free chart endpoint. That endpoint returns real multi-month daily OHLC, so unlike
// the US version we don't have to reconstruct bars from our own accumulated ticks —
// a symbol shows full history the first time it is ever opened.
// The proxy answers with HTTP 200 even on upstream failures, putting the reason in
// `error`/`detail`, so a broken chart always explains itself instead of silently blanking.
async function loadCandles(symbol, timeframe) {
  const { data, error } = await supabaseClient.functions.invoke('vtjp-yahoo-proxy', {
    body: { action: 'candles', symbol, timeframe },
  });

  if (error) return { candles: [], message: 'Could not reach the price service: ' + error.message };
  if (!data || data.error) {
    return { candles: [], message: describeProxyError(data && data.error, data && data.detail) };
  }
  return { candles: data.candles || [], daily: !!data.daily };
}

async function refreshChart(symbol) {
  ensureChart();

  const requestedTimeframe = selectedTimeframe;
  const { candles, daily, message } = await loadCandles(symbol, requestedTimeframe);

  // The user can switch symbol or timeframe while this request is in flight —
  // drop stale responses so a slow one can't overwrite a newer chart.
  if (symbol !== selectedSymbol || requestedTimeframe !== selectedTimeframe) return;

  const note = document.getElementById('chartEmptyNote');

  // A failed poll must not erase a chart that is already drawn: the 60s refresh
  // would otherwise blank a good chart on a single upstream hiccup. Show the
  // reason and leave the existing bars in place.
  if (candles.length === 0) {
    note.textContent = message || 'No chart data available.';
    note.hidden = false;
    if (candleSeries.data().length === 0) candleSeries.setData([]);
    return;
  }

  // Intraday bars need a time axis; daily bars are labelled by date only.
  chart.applyOptions({ timeScale: { timeVisible: !daily, secondsVisible: false } });
  candleSeries.setData(candles);
  chart.timeScale().fitContent();
  note.hidden = true;
}

async function refreshQuote() {
  const symbol = selectedSymbol;
  if (!symbol) return;

  const { data, error } = await supabaseClient.functions.invoke('vtjp-yahoo-proxy', {
    body: { action: 'quote', symbol },
  });

  // Same stale-response guard as refreshChart: without it, a slow quote for the
  // previously selected symbol can land after the user switched, showing the wrong
  // price right next to the Buy/Sell buttons.
  if (symbol !== selectedSymbol) return;

  const priceEl = document.getElementById('symbolPrice');
  if (error || !data || data.error) {
    priceEl.textContent = '--';
    return;
  }
  priceEl.textContent = '¥' + formatMoney(data.price);
}

async function selectSymbol(rawSymbol, description) {
  // Normalise once, here: the proxy uppercases before it writes the price cache,
  // so anything else would look up a different key than vtjp_place_order reads.
  const symbol = String(rawSymbol).trim().toUpperCase();
  selectedSymbol = symbol;
  document.getElementById('symbolPanel').hidden = false;
  document.getElementById('symbolTitle').textContent = description ? symbol + ' — ' + description : symbol;
  document.getElementById('orderMessage').textContent = '';

  await refreshQuote();
  await refreshChart(symbol);

  // The headline price refreshes often; the chart much less so. A daily bar only
  // changes once a day, so re-pulling months of history every 12s would be wasted
  // load on the upstream feed.
  if (pollTimer) clearInterval(pollTimer);
  if (chartTimer) clearInterval(chartTimer);
  pollTimer = setInterval(refreshQuote, 12000);
  chartTimer = setInterval(() => {
    if (selectedSymbol) refreshChart(selectedSymbol);
  }, 60000);
}

function selectTimeframe(timeframe) {
  selectedTimeframe = timeframe;
  document.querySelectorAll('.timeframe-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.timeframe === timeframe);
  });
  if (selectedSymbol) refreshChart(selectedSymbol);
}

// ---- Orders ----

function describeOrderError(message) {
  if (!message) return 'Order failed.';
  if (message.includes('market is closed')) return 'The market is currently closed.';
  if (message.includes('insufficient cash')) return 'Not enough cash balance for this order.';
  if (message.includes('insufficient shares')) return "You don't own enough shares to sell that many.";
  if (message.includes('no cached price')) return 'Price not ready yet for this symbol — wait a few seconds and try again.';
  if (message.includes('stale')) return 'Price data is stale — wait for it to refresh and try again.';
  if (message.includes('no recent trades')) {
    return 'No recent trades for this symbol — the Tokyo market may be closed today (e.g. a public holiday).';
  }
  if (message.includes('not authenticated')) return 'Please sign in again.';
  return 'Order failed: ' + message;
}

async function placeOrder(action) {
  const msg = document.getElementById('orderMessage');
  const qtyInput = document.getElementById('orderQuantity');
  const qty = parseInt(qtyInput.value, 10);

  if (!selectedSymbol) {
    msg.textContent = 'Select a symbol first.';
    return;
  }
  if (!qty || qty <= 0) {
    msg.textContent = 'Enter a valid quantity.';
    return;
  }

  msg.textContent = 'Placing order...';
  const { data, error } = await supabaseClient.rpc('vtjp_place_order', {
    p_symbol: selectedSymbol,
    p_action: action,
    p_quantity: qty,
  });

  if (error) {
    msg.textContent = describeOrderError(error.message);
    return;
  }

  msg.textContent = (action === 'buy' ? 'Bought ' : 'Sold ') + qty + ' ' + selectedSymbol + ' at ¥' + formatMoney(data.price) + '.';
  qtyInput.value = '';
  await loadCashBalance();
}

// ---- Portfolio tab ----

async function loadCashBalance() {
  const { data: portfolio } = await supabaseClient.rpc('vtjp_get_or_create_portfolio');
  if (portfolio) document.getElementById('cashBalance').textContent = formatMoney(portfolio.cash_balance) + ' P';
}

async function loadPortfolioTab() {
  const { data: portfolio } = await supabaseClient.rpc('vtjp_get_or_create_portfolio');
  document.getElementById('portfolioCash').textContent = portfolio ? formatMoney(portfolio.cash_balance) : '--';

  const { data: positions } = await supabaseClient.from('vtjp_positions').select('*').order('symbol');
  const symbols = (positions || []).map((p) => p.symbol);

  const priceBySymbol = {};
  if (symbols.length > 0) {
    const { data: prices } = await supabaseClient.from('vtjp_price_cache').select('symbol, price').in('symbol', symbols);
    (prices || []).forEach((p) => { priceBySymbol[p.symbol] = Number(p.price); });
  }

  const tbody = document.getElementById('positionsBody');
  clearChildren(tbody);

  let totalUnrealized = 0;
  (positions || []).forEach((pos) => {
    const current = priceBySymbol[pos.symbol];
    const hasPrice = typeof current === 'number';
    const unrealized = hasPrice ? (current - Number(pos.avg_cost)) * pos.quantity : null;
    if (unrealized != null) totalUnrealized += unrealized;

    const tr = document.createElement('tr');
    [
      pos.symbol,
      String(pos.quantity),
      formatMoney(pos.avg_cost),
      hasPrice ? formatMoney(current) : '--',
      unrealized != null ? formatMoney(unrealized) : '--',
    ].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  document.getElementById('positionsEmpty').hidden = (positions || []).length > 0;
  document.getElementById('portfolioUnrealized').textContent = formatMoney(totalUnrealized);

  const { data: realizedTrades } = await supabaseClient
    .from('vtjp_trades')
    .select('realized_pnl')
    .not('realized_pnl', 'is', null);
  const totalRealized = (realizedTrades || []).reduce((sum, t) => sum + Number(t.realized_pnl), 0);
  document.getElementById('portfolioRealized').textContent = formatMoney(totalRealized);
}

// ---- History tab ----

async function loadHistoryTab() {
  const { data: trades } = await supabaseClient
    .from('vtjp_trades')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(200);

  const tbody = document.getElementById('historyBody');
  clearChildren(tbody);

  (trades || []).forEach((t) => {
    const tr = document.createElement('tr');
    [
      new Date(t.executed_at).toLocaleString(),
      t.symbol,
      t.action,
      String(t.quantity),
      formatMoney(t.price),
      formatMoney(t.fee),
      t.realized_pnl != null ? formatMoney(t.realized_pnl) : '--',
    ].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  document.getElementById('historyEmpty').hidden = (trades || []).length > 0;
}

// ---- Settings tab: reset ----

async function resetPortfolio() {
  const confirmed = confirm(
    'This will erase all positions and trade history and reset your cash balance to 1,000,000 P. Continue?'
  );
  if (!confirmed) return;

  const { error } = await supabaseClient.rpc('vtjp_reset_portfolio');
  if (error) {
    alert('Reset failed: ' + error.message);
    return;
  }
  await loadCashBalance();
  await loadPortfolioTab();
  await loadHistoryTab();
  alert('Portfolio has been reset.');
}

// ---- Tabs ----

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.id !== 'tab-' + tab; });

  if (tab === 'portfolio') loadPortfolioTab();
  if (tab === 'history') loadHistoryTab();
}

// ---- Wiring ----

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  updateMarketBanner();
  setInterval(updateMarketBanner, 30000);

  document.getElementById('signInBtn').addEventListener('click', signIn);
  document.getElementById('signOutBtn').addEventListener('click', signOut);

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const status = document.getElementById('searchStatus');
    status.textContent = 'Searching...';
    const result = await searchSymbols(query);

    // A silent empty list is the hardest kind of failure to debug, so always say
    // which of the three cases happened: error, no matches, or results shown.
    if (result.message) {
      status.textContent = result.message;
      renderSearchResults([]);
      return;
    }
    const results = result.results || [];
    renderSearchResults(results);
    status.textContent = results.length > 0
      ? ''
      : 'No Tokyo listings matched. Searching by 4-digit code (e.g. 7203) is the most reliable.';
  });

  document.querySelectorAll('.timeframe-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectTimeframe(btn.dataset.timeframe));
  });

  document.getElementById('buyBtn').addEventListener('click', () => placeOrder('buy'));
  document.getElementById('sellBtn').addEventListener('click', () => placeOrder('sell'));

  document.getElementById('resetBtn').addEventListener('click', resetPortfolio);
});
