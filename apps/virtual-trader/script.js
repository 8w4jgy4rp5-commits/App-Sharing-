// Virtual Trader
//
// All portfolio/trade state lives in Supabase (per-user, RLS-protected), not localStorage —
// this app is the deliberate exception to the platform's usual local-only storage rule,
// since positions/cash must survive across devices and be tamper-resistant.
// Order math (fees, avg cost, realized P/L) is intentionally NOT computed here; it all
// happens inside the vt_place_order() Postgres function so the client can't fake a fill.

let currentUser = null;
let selectedSymbol = null;
let pollTimer = null;
let chart = null;
let candleSeries = null;

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function getNyParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
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

// Regular NYSE/NASDAQ session only (9:30-16:00 America/New_York, Mon-Fri).
// Does not account for US market holidays — a known MVP limitation.
function isMarketOpen() {
  const { weekday, hour, minute } = getNyParts(new Date());
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const minutesNow = hour * 60 + minute;
  return minutesNow >= 9 * 60 + 30 && minutesNow < 16 * 60;
}

function updateMarketBanner() {
  const open = isMarketOpen();
  const banner = document.getElementById('marketStatusBanner');
  banner.textContent = open
    ? 'Market is open (regular NYSE/NASDAQ hours).'
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

function updateAuthUI() {
  document.getElementById('authGate').hidden = !!currentUser;
  document.getElementById('app').hidden = !currentUser;
  if (currentUser) {
    loadCashBalance();
    refreshKeyStatus();
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

// ---- Finnhub key (settings tab) ----

function showKeyState(hasKey) {
  document.getElementById('apiKeyReadyNote').hidden = !hasKey;
  document.getElementById('apiKeySetup').hidden = hasKey;
}

async function refreshKeyStatus() {
  const { data: hasKey } = await supabaseClient.rpc('vt_has_finnhub_key');
  const notice = document.getElementById('keyMissingNotice');
  if (notice) notice.hidden = !!hasKey;
  showKeyState(!!hasKey);
}

// upsert()はON CONFLICT DO UPDATE経由になり、SELECTポリシーが無いと(既存行の
// 競合検知ができず)RLS違反になるため使わない。新規insertを試し、既に行がある
// 場合(一意制約違反=23505)だけ普通のupdateに切り替える。
async function saveFinnhubKey(key) {
  const now = new Date().toISOString();

  const { error: insertError } = await supabaseClient.from('vt_finnhub_keys').insert({
    user_id: currentUser.id,
    api_key: key,
    updated_at: now,
  });
  if (!insertError) return null;
  if (insertError.code !== '23505') return insertError;

  const { error: updateError } = await supabaseClient
    .from('vt_finnhub_keys')
    .update({ api_key: key, updated_at: now })
    .eq('user_id', currentUser.id);
  return updateError;
}

// ---- Search ----

async function searchSymbols(query) {
  const { data, error } = await supabaseClient.functions.invoke('vt-finnhub-proxy', {
    body: { action: 'search', query },
  });
  if (error) return { error: error.message };
  return data;
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

function ensureChart() {
  if (chart) return;
  chart = LightweightCharts.createChart(document.getElementById('chartContainer'), {
    autoSize: true,
    layout: { background: { color: '#ffffff' }, textColor: '#1f2430' },
    timeScale: { timeVisible: true, secondsVisible: false },
    grid: { vertLines: { color: '#eef0f3' }, horzLines: { color: '#eef0f3' } },
  });
  candleSeries = chart.addCandlestickSeries();
}

// Finnhubの日足履歴が使えればそれを使い(数ヶ月分をまとめて表示できる)、
// 使えないキーの場合だけ自分たちで集めた分足ティックから組み立てる。
async function loadCandles(symbol) {
  const { data, error } = await supabaseClient.functions.invoke('vt-finnhub-proxy', {
    body: { action: 'candles', symbol },
  });

  if (!error && data && Array.isArray(data.candles) && data.candles.length > 0) {
    return data.candles;
  }

  return loadCandlesFromTicks(symbol);
}

async function loadCandlesFromTicks(symbol) {
  const { data, error } = await supabaseClient
    .from('vt_price_ticks')
    .select('ts, price')
    .eq('symbol', symbol)
    .order('ts', { ascending: true })
    .limit(1000);

  if (error || !data) return [];

  const buckets = new Map();
  data.forEach((tick) => {
    const bucketTime = Math.floor(new Date(tick.ts).getTime() / 60000) * 60;
    const price = Number(tick.price);
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, { time: bucketTime, open: price, high: price, low: price, close: price });
    } else {
      const b = buckets.get(bucketTime);
      b.high = Math.max(b.high, price);
      b.low = Math.min(b.low, price);
      b.close = price;
    }
  });

  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

async function refreshChart(symbol) {
  ensureChart();
  const candles = await loadCandles(symbol);
  document.getElementById('chartEmptyNote').hidden = candles.length > 0;
  candleSeries.setData(candles);
  if (candles.length > 0) chart.timeScale().fitContent();
}

async function refreshQuote() {
  if (!selectedSymbol) return;
  const { data, error } = await supabaseClient.functions.invoke('vt-finnhub-proxy', {
    body: { action: 'quote', symbol: selectedSymbol },
  });
  const priceEl = document.getElementById('symbolPrice');
  if (error || !data || data.error) {
    priceEl.textContent = '--';
    return;
  }
  priceEl.textContent = formatMoney(data.price);
}

async function selectSymbol(symbol, description) {
  selectedSymbol = symbol;
  document.getElementById('symbolPanel').hidden = false;
  document.getElementById('symbolTitle').textContent = description ? symbol + ' — ' + description : symbol;
  document.getElementById('orderMessage').textContent = '';

  await refreshQuote();
  await refreshChart(symbol);

  if (pollTimer) clearInterval(pollTimer);
  let pollCount = 0;
  pollTimer = setInterval(async () => {
    await refreshQuote();
    pollCount++;
    // チャートは値動きが少ないので5分に1回(12秒 x 25回)だけ更新する
    if (pollCount % 25 === 0) {
      await refreshChart(selectedSymbol);
    }
  }, 12000);
}

// ---- Orders ----

function describeOrderError(message) {
  if (!message) return 'Order failed.';
  if (message.includes('market is closed')) return 'The market is currently closed.';
  if (message.includes('insufficient cash')) return 'Not enough cash balance for this order.';
  if (message.includes('insufficient shares')) return "You don't own enough shares to sell that many.";
  if (message.includes('no cached price')) return 'Price not ready yet for this symbol — wait a few seconds and try again.';
  if (message.includes('stale')) return 'Price data is stale — wait for it to refresh and try again.';
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
  const { data, error } = await supabaseClient.rpc('vt_place_order', {
    p_symbol: selectedSymbol,
    p_action: action,
    p_quantity: qty,
  });

  if (error) {
    msg.textContent = describeOrderError(error.message);
    return;
  }

  msg.textContent = (action === 'buy' ? 'Bought ' : 'Sold ') + qty + ' ' + selectedSymbol + ' at $' + formatMoney(data.price) + '.';
  qtyInput.value = '';
  await loadCashBalance();
}

// ---- Portfolio tab ----

async function loadCashBalance() {
  const { data: portfolio } = await supabaseClient.rpc('vt_get_or_create_portfolio');
  if (portfolio) document.getElementById('cashBalance').textContent = formatMoney(portfolio.cash_balance) + ' P';
}

async function loadPortfolioTab() {
  const { data: portfolio } = await supabaseClient.rpc('vt_get_or_create_portfolio');
  document.getElementById('portfolioCash').textContent = portfolio ? formatMoney(portfolio.cash_balance) : '--';

  const { data: positions } = await supabaseClient.from('vt_positions').select('*').order('symbol');
  const symbols = (positions || []).map((p) => p.symbol);

  const priceBySymbol = {};
  if (symbols.length > 0) {
    const { data: prices } = await supabaseClient.from('vt_price_cache').select('symbol, price').in('symbol', symbols);
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
    .from('vt_trades')
    .select('realized_pnl')
    .not('realized_pnl', 'is', null);
  const totalRealized = (realizedTrades || []).reduce((sum, t) => sum + Number(t.realized_pnl), 0);
  document.getElementById('portfolioRealized').textContent = formatMoney(totalRealized);
}

// ---- History tab ----

async function loadHistoryTab() {
  const { data: trades } = await supabaseClient
    .from('vt_trades')
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

  const { error } = await supabaseClient.rpc('vt_reset_portfolio');
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
  if (tab === 'settings') refreshKeyStatus();
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

    const result = await searchSymbols(query);
    if (result.error === 'no_finnhub_key') {
      document.getElementById('keyMissingNotice').hidden = false;
      renderSearchResults([]);
      return;
    }
    document.getElementById('keyMissingNotice').hidden = true;
    renderSearchResults(result.results);
  });

  document.getElementById('buyBtn').addEventListener('click', () => placeOrder('buy'));
  document.getElementById('sellBtn').addEventListener('click', () => placeOrder('sell'));

  document.getElementById('apiKeyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();
    const status = document.getElementById('apiKeyStatus');
    if (!key) {
      status.textContent = 'Enter a key first.';
      return;
    }
    const error = await saveFinnhubKey(key);
    if (error) {
      console.error('vt_finnhub_keys upsert failed', { userId: currentUser && currentUser.id, error });
      status.textContent = 'Failed to save key: ' + error.message + (error.details ? ' (' + error.details + ')' : '');
      return;
    }
    status.textContent = '';
    input.value = '';
    document.getElementById('keyMissingNotice').hidden = true;
    showKeyState(true);
  });

  document.getElementById('changeApiKeyBtn').addEventListener('click', () => {
    document.getElementById('apiKeyStatus').textContent = '';
    showKeyState(false);
  });

  document.getElementById('resetBtn').addEventListener('click', resetPortfolio);
});
