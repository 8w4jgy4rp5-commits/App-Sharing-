// ミニアプリのアイコン。トップページのアプリ一覧で、頭文字の代わりに表示する。
//
// キーは apps/ の下のフォルダ名(スラッグ)。登録URLが
// https://.../App-Sharing-/apps/idea-notebook/ なら 'idea-notebook' を引く。
// ここに無いアプリ(外部URLの投稿など)は、従来どおり頭文字バッジになる。
//
// d = <svg> の中身。24x24のビューボックスに線だけで描く(塗りなし・線幅は
//     CSS側ではなく下の SVG_OPEN で指定)。色は白抜き固定なので指定しない。
// c = タイルの色。style.css の .app-avatar-c0〜c3 に対応。
//     c0 テラコッタ(生活・記録) / c1 緑(お金) / c2 黄(学習・健康) / c3 濃茶(道具)
//     日本版と米国版のように対になるアプリは、同じ絵で色を変えて見分ける。

(function () {
  const SVG_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

  // 同じ絵を使い回すもの(対になっているアプリ用)
  const BUILDING =
    '<path d="M3.5 20.5h17"/><path d="M5.5 20.5V5.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15"/>' +
    '<path d="M13.5 11.5h4a1 1 0 0 1 1 1v8"/><path d="M8 8h3M8 12h3M8 16h3"/>';
  const CARDS =
    '<rect x="3" y="7" width="13.5" height="10.5" rx="2.5"/>' +
    '<path d="M7 7V5.8a2 2 0 0 1 2-2h9.2a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2h-1.7"/>' +
    '<path d="M7.5 12.2h5"/>';
  const CANDLES =
    '<path d="M7.5 4.5v15M16.5 4.5v15"/>' +
    '<rect x="5" y="8" width="5" height="7" rx="1.2"/>' +
    '<rect x="14" y="6" width="5" height="6" rx="1.2"/>';

  const ICONS = {
    'book-show-tracker': { c: 'c0', d: '<path d="M4 5.2c3.4 0 5.8.4 8 1.8v11.6c-2.2-1.4-4.6-1.8-8-1.8V5.2Z"/><path d="M20 5.2c-3.4 0-5.8.4-8 1.8v11.6c2.2-1.4 4.6-1.8 8-1.8V5.2Z"/>' },
    'book-snap': { c: 'c3', d: '<rect x="3.2" y="7.2" width="17.6" height="12.6" rx="3"/><path d="M8.5 7.2 10 4.6h4l1.5 2.6"/><circle cx="12" cy="13.5" r="3.2"/>' },
    'company-watchlist-jp': { c: 'c0', d: BUILDING },
    'company-watchlist-us': { c: 'c1', d: BUILDING },
    'daily-summary': { c: 'c0', d: '<path d="M6 3.5h7.5L18.5 8.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"/><path d="M13.5 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>' },
    'daily-todo': { c: 'c0', d: '<path d="M9 4.5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.8" width="6" height="3.4" rx="1.2"/><path d="m8.8 13 2.2 2.2 4.2-4.4"/>' },
    'daily-wins': { c: 'c2', d: '<path d="M8 4.5h8v4.5a4 4 0 0 1-8 0V4.5Z"/><path d="M8 6H5.5v1.5A3 3 0 0 0 8 10.4M16 6h2.5v1.5a3 3 0 0 1-2.5 2.9"/><path d="M12 13.5V17"/><path d="M8.5 20h7l-.8-2.2a1 1 0 0 0-.95-.8h-3.5a1 1 0 0 0-.95.8L8.5 20Z"/>' },
    'family-schedule': { c: 'c0', d: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M17.2 14.5a5.5 5.5 0 0 1 3.3 5"/>' },
    'fan-activity-tracker': { c: 'c0', d: '<path d="M3.5 8.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1.2a2.3 2.3 0 0 0 0 4.6v1.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-1.2a2.3 2.3 0 0 0 0-4.6V8.5Z"/><path d="M14 7.5v1.8M14 11.1v1.8M14 14.7v1.8"/>' },
    'flashcards-en': { c: 'c2', d: CARDS },
    'flashcards-es': { c: 'c0', d: CARDS },
    'forgetful-tracker': { c: 'c0', d: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.2 5.4 1.8 6H4.7c.6-.6 1.8-2 1.8-6Z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/><path d="M12 4.5V3"/>' },
    'free-trial-tracker': { c: 'c1', d: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M7.5 3.5v3.2c0 1.4 3 3.4 3 5.3s-3 3.9-3 5.3v3.2"/><path d="M16.5 3.5v3.2c0 1.4-3 3.4-3 5.3s3 3.9 3 5.3v3.2"/>' },
    'habit-tracker': { c: 'c2', d: '<path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3"/><path d="m6.4 13.8-.9 3.7 3.7.9"/><path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3"/><path d="m17.6 10.2.9-3.7-3.7-.9"/>' },
    'idea-notebook': { c: 'c0', d: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>' },
    'memory-diary': { c: 'c0', d: '<path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M4 17.5h14"/><path d="M9.5 3.5v6l2-1.4 2 1.4v-6"/>' },
    'message-writer': { c: 'c3', d: '<path d="M20.5 12a7.5 7.5 0 0 1-10.8 6.7L4.5 20.5l1.3-4.6A7.5 7.5 0 1 1 20.5 12Z"/><path d="M9.5 13.5h5M9.5 10h5"/>' },
    'micro-stretch': { c: 'c2', d: '<circle cx="12" cy="4.8" r="2"/><path d="M12 8v6"/><path d="m6.5 9.5 5.5 1.5 5.5-1.5"/><path d="m12 14-3 6M12 14l3 6"/>' },
    'news-feed': { c: 'c3', d: '<path d="M4.5 6.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a2 2 0 0 0 2 2H6a1.5 1.5 0 0 1-1.5-1.5v-11Z"/><path d="M17.5 9.5H19a1 1 0 0 1 1 1v7"/><path d="M7.5 9h6M7.5 12.5h6M7.5 16h4"/>' },
    'pet-health-log': { c: 'c2', d: '<ellipse cx="12" cy="16.8" rx="3.8" ry="3"/><ellipse cx="5.6" cy="11" rx="1.7" ry="2.1"/><ellipse cx="18.4" cy="11" rx="1.7" ry="2.1"/><ellipse cx="9.3" cy="6.4" rx="1.7" ry="2.2"/><ellipse cx="14.7" cy="6.4" rx="1.7" ry="2.2"/>' },
    'place-picks': { c: 'c0', d: '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>' },
    'qr-generator': { c: 'c3', d: '<rect x="3.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.4"/><path d="M14.5 14.5h3v3M20.5 17.5v3h-3"/>' },
    'reading-streak': { c: 'c2', d: '<path d="M12 3s5.5 3.6 5.5 9a5.5 5.5 0 1 1-11 0c0-2.3 1.3-4 2.5-5.2 0 1.6.8 2.7 1.8 2.7 1.3 0 1.6-1.6 1.2-6.5Z"/>' },
    'reference-report-organizer': { c: 'c3', d: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.4l1.8 2.2h7.8a2 2 0 0 1 2 2v8.3a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V7.5Z"/><path d="M8 13.5h8"/>' },
    'restock-planner': { c: 'c0', d: '<path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2V8.2Z"/><path d="m3.5 8.2 8.5 4.2 8.5-4.2M12 12.4V20"/>' },
    'route-notes': { c: 'c0', d: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5"/>' },
    'screen-time-tracker': { c: 'c2', d: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.5"/><path d="M10.5 5.2h3"/><circle cx="12" cy="13" r="3.4"/><path d="M12 11.2V13l1.3.9"/>' },
    'shift-calendar': { c: 'c0', d: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.8h17M8 3.5v3M16 3.5v3"/><path d="M7.8 13.3h.01M12 13.3h.01M16.2 13.3h.01M7.8 17h.01M12 17h.01"/>' },
    'simple-budget': { c: 'c1', d: '<path d="M3.5 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2"/><path d="M3.5 7.5v10a2 2 0 0 0 2 2H19a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 19 9.5H5.5a2 2 0 0 1-2-2Z"/><circle cx="16.2" cy="14" r="1.1"/>' },
    'song-catcher': { c: 'c3', d: '<path d="M9 18V6.2l10-2v11.6"/><ellipse cx="6.6" cy="18" rx="2.6" ry="2.2"/><ellipse cx="16.6" cy="15.8" rx="2.6" ry="2.2"/>' },
    'stock-checker': { c: 'c1', d: '<path d="M3.5 20.5h17"/><path d="m5.5 16 4.5-5 3.5 3 5.5-6.5"/><path d="M15 8h4v4"/>' },
    'travel-planner': { c: 'c0', d: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V5.4a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 15 5.4v2.1"/><path d="M3.5 15.5h17"/>' },
    'unit-converter': { c: 'c3', d: '<path d="M4 8.5h13M14 5.5l3 3-3 3"/><path d="M20 15.5H7M10 12.5l-3 3 3 3"/>' },
    'virtual-trader': { c: 'c1', d: CANDLES },
    'virtual-trader-jp': { c: 'c0', d: CANDLES },
    'what-to-cook': { c: 'c0', d: '<path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3Z"/><path d="M20 11.5h1.2a1.6 1.6 0 0 1 0 3.2H20"/><path d="M4 11.5H2.8a1.6 1.6 0 0 0 0 3.2H4"/><path d="M9 6.5c0-1 1-1.3 1-2.3M13 6.5c0-1 1-1.3 1-2.3"/>' },
  };

  // Company Watchlist は US版へのリネーム前の名前で登録されている行が残っている
  ICONS['company-watchlist'] = ICONS['company-watchlist-us'];

  // 登録URLからフォルダ名を取り出す。
  // 例: 'https://…/App-Sharing-/apps/idea-notebook/' → 'idea-notebook'
  function slugFromUrl(url) {
    if (typeof url !== 'string') return '';
    // 先頭が '/apps/' でも 'apps/'(相対)でも拾えるようにしておく
    const m = url.match(/(?:^|\/)apps\/([A-Za-z0-9._-]+)/);
    return m ? m[1].toLowerCase() : '';
  }

  // 見つからなければ null を返す(呼び出し側は頭文字バッジにフォールバックする)
  window.getAppIcon = function (url) {
    const icon = ICONS[slugFromUrl(url)];
    if (!icon) return null;
    return { colorClass: 'app-avatar-' + icon.c, svg: SVG_OPEN + icon.d + '</svg>' };
  };
})();
