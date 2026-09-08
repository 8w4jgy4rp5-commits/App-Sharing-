/* Statement Reader — a short course on reading the three financial statements.
   All figures belong to Cobble Cafe, an invented company, and are internally
   consistent: assets = liabilities + equity, and the cash flow statement ends
   at the closing cash on the balance sheet. */

/* ---------------------------------------------------------------- content */

const CHAPTERS = [
  {
    id: 'ch1',
    no: '01',
    title: 'What the three statements answer',
    sub: 'Why one report is not enough',
    blocks: [
      { type: 'p', text: 'Cobble Cafe sells coffee on a corner. Once a year it has to write down how the year went. That write-up is three separate statements, and each one answers a different question.' },
      {
        type: 'cards',
        items: [
          { k: 'Balance sheet', v: 'Is it safe?' },
          { k: 'Income statement', v: 'Is it earning?' },
          { k: 'Cash flow statement', v: 'Is cash coming in?' }
        ]
      },
      { type: 'h', text: 'Why three and not one' },
      { type: 'p', text: 'A balance sheet is a photo taken on one day: what the cafe owns and owes at that moment. The income statement is a film of the whole year: what came in, what went out, what was left. The cash flow statement follows the money only — the actual coins and bank transfers.' },
      { type: 'note', text: 'A cafe can report a profit and still run out of money. Profit counts a catering invoice on the day it is sent; cash counts it only when the customer pays. That gap is the reason the third statement exists.' },
      { type: 'h', text: 'The company you will use' },
      { type: 'p', text: 'Every chapter uses Cobble Cafe, so the numbers you meet in Chapter 2 are the ones you use again in Chapter 6. Here is its whole year in three lines. You are not meant to understand them yet.' },
      {
        type: 'figures',
        cap: 'Cobble Cafe · the year in three numbers',
        rows: [
          { label: 'Revenue for the year', value: '420,000' },
          { label: 'Profit after tax', value: '18,000' },
          { label: 'Cash in the bank at year end', value: '46,000' }
        ]
      },
      { type: 'p', text: 'Three numbers, three different meanings. The next three chapters take one statement each.' }
    ],
    quiz: [
      {
        q: 'Which statement tells you whether the cafe could pay its bills if sales stopped tomorrow?',
        options: ['The balance sheet', 'The income statement', 'The cash flow statement'],
        answer: 0,
        why: 'The balance sheet lists what the cafe owns and owes on one day, so it is the one that shows staying power.'
      },
      {
        q: 'A cafe reports a profit for the year, but its bank balance went down. Is that possible?',
        options: ['No, profit and cash always move together', 'Yes, and it is common', 'Only if the bookkeeper made a mistake'],
        answer: 1,
        why: 'Profit counts sales that have not been paid for yet, and ignores things like loan repayments that take real money out.'
      },
      {
        q: 'The income statement covers…',
        options: ['One single day', 'A period of time, usually a year', 'The next three years'],
        answer: 1,
        why: 'It adds up everything that happened between two dates. Only the balance sheet is a single-day snapshot.'
      }
    ]
  },

  {
    id: 'ch2',
    no: '02',
    title: 'The balance sheet',
    sub: 'What it owns, what it owes, what is left',
    blocks: [
      { type: 'p', text: 'A balance sheet is a photo taken on one day — here, 31 December. It has three parts, and the first two always add up to the third.' },
      {
        type: 'list',
        items: [
          'Assets — everything the cafe owns: the cash, the beans, the espresso machine.',
          'Liabilities — everything it owes: unpaid supplier bills, the bank loan.',
          'Equity — what would be left for the owner once every debt was paid.'
        ]
      },
      { type: 'bs', cap: 'Cobble Cafe · 31 December' },
      { type: 'note', text: 'The two sides are always the same height. Every dollar of stuff the cafe owns was paid for either by a lender or by the owner — there is no third source.' },
      { type: 'h', text: 'The same picture, line by line' },
      {
        type: 'figures',
        cap: 'Cobble Cafe · balance sheet',
        rows: [
          { label: 'Cash', value: '46,000', indent: true },
          { label: 'Inventory (beans, milk, cups)', value: '12,000', indent: true },
          { label: 'Receivables (catering invoices unpaid)', value: '8,000', indent: true },
          { label: 'Current assets', value: '66,000' },
          { label: 'Equipment and fittings', value: '94,000', indent: true },
          { label: 'Lease deposit', value: '20,000', indent: true },
          { label: 'Non-current assets', value: '114,000' },
          { label: 'Total assets', value: '180,000', total: true },
          { label: 'Accounts payable', value: '22,000', indent: true },
          { label: 'Loan due within a year', value: '15,000', indent: true },
          { label: 'Current liabilities', value: '37,000' },
          { label: 'Long-term loan', value: '63,000' },
          { label: 'Total liabilities', value: '100,000' },
          { label: 'Owner capital', value: '50,000', indent: true },
          { label: 'Retained earnings', value: '30,000', indent: true },
          { label: 'Total equity', value: '80,000' },
          { label: 'Liabilities + equity', value: '180,000', total: true }
        ]
      },
      { type: 'h', text: 'Current and non-current' },
      { type: 'p', text: 'Both sides are split by time. Current means within a year — cash, stock, the bills due next month. Non-current is longer — the espresso machine, the lease deposit, the part of the loan not due yet. That split is what lets you ask "can it pay next year’s bills with what it already has?"' },
      { type: 'h', text: 'What to look at first' },
      { type: 'p', text: 'The share of the total that is equity. For Cobble Cafe that is 80,000 out of 180,000, or 44%. The higher it is, the more of the shop the owner really owns, and the less damage a bad year can do. You will meet this as the equity ratio in Chapter 5.' }
    ],
    quiz: [
      {
        q: 'Cobble Cafe has assets of 180,000 and liabilities of 100,000. What is its equity?',
        options: ['280,000', '80,000', '100,000'],
        answer: 1,
        why: 'Assets minus liabilities is equity: 180,000 − 100,000 = 80,000.'
      },
      {
        q: 'Liabilities of 100,000 means…',
        options: ['The cafe owns 100,000 in equipment', 'Lenders and suppliers funded 100,000 of what it owns', 'The cafe earned 100,000 last year'],
        answer: 1,
        why: 'The right side of a balance sheet is not stuff — it is where the money for the stuff came from.'
      },
      {
        q: 'Which of these is a current asset?',
        options: ['The espresso machine', 'The cash in the till', 'The long-term loan'],
        answer: 1,
        why: 'Current means it turns into cash within a year. The machine is used for years, and the loan is not an asset at all — it is owed.'
      },
      {
        q: 'The two sides of a balance sheet…',
        options: ['Always add up to the same total', 'Are equal only in a profitable year', 'Are equal only for large companies'],
        answer: 0,
        why: 'It is not a test the company passes. It balances by construction — that is where the name comes from.'
      }
    ]
  },

  {
    id: 'ch3',
    no: '03',
    title: 'The income statement',
    sub: 'How 420,000 of sales became 18,000 of profit',
    blocks: [
      { type: 'p', text: 'The income statement is the film of the year. It starts with everything the cafe sold and takes costs away in a fixed order, so you can see where the money went on the way down.' },
      {
        type: 'bars',
        cap: 'Cobble Cafe · what survives each step',
        rows: [
          { label: 'Revenue', value: '420,000', pct: 100 },
          { label: 'Gross profit', value: '273,000', pct: 65 },
          { label: 'Operating profit', value: '30,000', pct: 7.1, accent: true },
          { label: 'Net profit', value: '18,000', pct: 4.3, accent: true }
        ]
      },
      { type: 'h', text: 'The same steps, line by line' },
      {
        type: 'figures',
        cap: 'Cobble Cafe · income statement',
        rows: [
          { label: 'Revenue', value: '420,000' },
          { label: 'Cost of sales (beans, milk, cups)', value: '−147,000', indent: true },
          { label: 'Gross profit', value: '273,000' },
          { label: 'Wages', value: '−132,000', indent: true },
          { label: 'Rent', value: '−72,000', indent: true },
          { label: 'Utilities', value: '−18,000', indent: true },
          { label: 'Other operating costs', value: '−21,000', indent: true },
          { label: 'Operating profit', value: '30,000' },
          { label: 'Interest on the loan', value: '−4,000', indent: true },
          { label: 'Tax', value: '−8,000', indent: true },
          { label: 'Net profit', value: '18,000', total: true }
        ]
      },
      { type: 'h', text: 'The two profits worth knowing' },
      { type: 'p', text: 'Gross profit is what is left after the cost of the thing sold — here, 273,000, or 65% of revenue. Operating profit is what is left after the cost of having a shop at all: wages, rent, electricity. That is 30,000, or 7.1%.' },
      { type: 'note', text: 'Operating profit is the one to watch. It is what the cafe’s own business earns, before the bank and the tax office take their share. Two shops with the same net profit can be very different businesses underneath.' },
      { type: 'h', text: 'Cost of sales, or operating expense?' },
      { type: 'p', text: 'Cost of sales is what goes into the cup. Operating expenses are the cost of the shop around it. The split matters: a cafe can have a fat 65% gross margin and still lose money, because rent and wages eat almost all of it. That is exactly what nearly happens here.' }
    ],
    quiz: [
      {
        q: 'Revenue is 420,000 and cost of sales is 147,000. What is gross profit?',
        options: ['567,000', '273,000', '147,000'],
        answer: 1,
        why: '420,000 − 147,000 = 273,000. Gross profit is the first subtraction, before rent and wages.'
      },
      {
        q: 'Which profit shows how the cafe’s own business is doing, before lenders and tax?',
        options: ['Gross profit', 'Operating profit', 'Net profit'],
        answer: 1,
        why: 'Interest and tax come after operating profit, so operating profit is the clean view of the shop itself.'
      },
      {
        q: 'Operating profit of 30,000 on revenue of 420,000 is an operating margin of about…',
        options: ['7%', '30%', '65%'],
        answer: 0,
        why: '30,000 ÷ 420,000 = 7.1%. The 65% figure is the gross margin, before rent and wages.'
      },
      {
        q: 'Rent and wages appear…',
        options: ['In cost of sales', 'In operating expenses', 'Only on the balance sheet'],
        answer: 1,
        why: 'Cost of sales is what goes into the cup. Rent and wages are the cost of running the shop, so they sit below gross profit.'
      }
    ]
  },

  {
    id: 'ch4',
    no: '04',
    title: 'The cash flow statement',
    sub: 'Why profit and money are not the same',
    blocks: [
      { type: 'p', text: 'Profit is worked out with rules. Cash is counted. This statement starts from the profit and works back to the change in the bank balance, in three groups.' },
      {
        type: 'cf',
        cap: 'Cobble Cafe · where cash moved',
        max: 34000,
        rows: [
          { label: 'Operating — the shop itself', value: 34000, text: '+34,000' },
          { label: 'Investing — a new espresso machine', value: -22000, text: '−22,000' },
          { label: 'Financing — loan repaid', value: -9000, text: '−9,000' }
        ]
      },
      {
        type: 'figures',
        cap: 'Cobble Cafe · cash flow statement',
        rows: [
          { label: 'Net profit', value: '18,000', indent: true },
          { label: 'Depreciation added back', value: '+14,000', indent: true },
          { label: 'More stock held', value: '−3,000', indent: true },
          { label: 'Supplier bills unpaid at year end', value: '+5,000', indent: true },
          { label: 'Cash from operating', value: '34,000' },
          { label: 'Cash used in investing', value: '−22,000' },
          { label: 'Cash used in financing', value: '−9,000' },
          { label: 'Change in cash', value: '+3,000' },
          { label: 'Cash at the start of the year', value: '43,000', indent: true },
          { label: 'Cash at the end of the year', value: '46,000', total: true }
        ]
      },
      { type: 'note', text: 'Operating cash flow (34,000) is bigger than profit (18,000). Most of the gap is depreciation: the espresso machine is written down by 14,000 a year as a cost, but no money leaves the till when that happens, so it is added back.' },
      { type: 'h', text: 'Reading the three signs' },
      {
        type: 'list',
        items: [
          'Operating positive — the shop brings money in by trading. Over time this one has to be positive.',
          'Investing negative — it is buying equipment. For a business that intends to keep going, that is normal and often a good sign.',
          'Financing negative — it is paying loans back rather than taking on more.'
        ]
      },
      { type: 'h', text: 'The pattern that should worry you' },
      { type: 'p', text: 'Operating negative and financing positive, year after year: a business paying its day-to-day bills with borrowed money. One bad year does not prove much — a run of them does.' }
    ],
    quiz: [
      {
        q: 'Operating cash flow was 34,000 but profit was only 18,000. What mostly explains the gap?',
        options: ['The cafe borrowed 16,000', 'Depreciation was charged as a cost, but no money left the till', 'The owner put more money in'],
        answer: 1,
        why: 'Depreciation spreads the cost of the machine over its life. It lowers profit without moving cash, so the cash statement adds it back.'
      },
      {
        q: 'Buying an espresso machine for 22,000 appears under…',
        options: ['Operating', 'Investing', 'Financing'],
        answer: 1,
        why: 'Investing is money spent on things the business will use for years.'
      },
      {
        q: 'Repaying part of the bank loan appears under…',
        options: ['Investing', 'Financing', 'Operating'],
        answer: 1,
        why: 'Financing is money moving between the company and the people who funded it — lenders and owners.'
      },
      {
        q: 'A cafe with negative operating cash flow several years running is…',
        options: ['Fine, as long as it reports a profit', 'Showing a warning sign', 'Doing what every growing business does'],
        answer: 1,
        why: 'If trading does not produce cash, the money to keep the doors open has to come from lenders or the owner — and that cannot go on forever.'
      }
    ]
  },

  {
    id: 'ch5',
    no: '05',
    title: 'Six ratios that do most of the work',
    sub: 'Two numbers you have already seen, divided',
    blocks: [
      { type: 'p', text: 'A ratio is not new information. It is two figures from the statements you have just read, divided, so that companies of different sizes can be compared. Six of them cover most of a first read.' },
      {
        type: 'formulas',
        cap: 'Cobble Cafe · the six',
        items: [
          { name: 'Equity ratio', expr: 'Equity 80,000 ÷ Total assets 180,000', value: '44%', note: 'How much of the shop the owner funded. Above about 40% is comfortable for a small business; under 20% leaves little room for a bad year.' },
          { name: 'Current ratio', expr: 'Current assets 66,000 ÷ Current liabilities 37,000', value: '178%', note: 'Whether next year’s bills are covered by what the cafe already has. Over 100% means yes.' },
          { name: 'Gross margin', expr: 'Gross profit 273,000 ÷ Revenue 420,000', value: '65%', note: 'What is left after the cost of the thing sold. Ordinary for a cafe; remarkable for a supermarket.' },
          { name: 'Operating margin', expr: 'Operating profit 30,000 ÷ Revenue 420,000', value: '7.1%', note: 'What is left after running the shop. This is the number that says how much room for error the business has.' },
          { name: 'ROE — return on equity', expr: 'Net profit 18,000 ÷ Equity 80,000', value: '23%', note: 'What the owner’s own money earned last year.' },
          { name: 'ROA — return on assets', expr: 'Net profit 18,000 ÷ Total assets 180,000', value: '10%', note: 'What everything the cafe uses earned, no matter who paid for it. ROE above ROA means borrowing is lifting the owner’s return — which also lifts the risk.' }
        ]
      },
      { type: 'note', text: 'A ratio on its own means very little. Compare it with the same company last year, or with another shop of the same kind. "Good" is always relative to something.' },
      { type: 'h', text: 'If you only remember three' },
      {
        type: 'list',
        items: [
          'Operating margin — how much room for error the business has.',
          'Equity ratio — how much of it is really the owner’s.',
          'Operating cash flow against profit — whether the profit is turning into money.'
        ]
      }
    ],
    quiz: [
      {
        q: 'An equity ratio of 44% means…',
        options: ['44% of what the cafe owns was funded by the owner rather than by debt', 'The cafe made a 44% profit', '44% of its sales were in cash'],
        answer: 0,
        why: 'It is equity divided by total assets — the owner’s share of everything the business uses.'
      },
      {
        q: 'A current ratio of 178% means…',
        options: ['Sales grew 78% this year', 'Short-term assets are about 1.8 times the short-term bills', 'The cafe owes 78% more than it owns'],
        answer: 1,
        why: '66,000 of current assets against 37,000 of current liabilities. Above 100% means next year’s bills are already covered.'
      },
      {
        q: 'Gross margin is 65% but operating margin is 7.1%. Where did the difference go?',
        options: ['To tax', 'To interest on the loan', 'To wages, rent and the other costs of running the shop'],
        answer: 2,
        why: 'Wages, rent, utilities and other operating costs come to 243,000. Tax and interest are taken off later, below operating profit.'
      },
      {
        q: 'ROE of 23% means…',
        options: ['The owner’s 80,000 produced 18,000 of profit last year', 'Revenue grew by 23%', 'The cafe holds 23% of its assets in cash'],
        answer: 0,
        why: 'Return on equity is net profit divided by equity — what the owner’s stake earned.'
      }
    ]
  },

  {
    id: 'ch6',
    no: '06',
    title: 'Reading Cobble Cafe end to end',
    sub: 'Three questions, in the order that matters',
    blocks: [
      { type: 'p', text: 'You now have every number you need. Read the whole cafe in the order a lender would — safety first, then earnings, then cash.' },
      { type: 'h', text: '1. Is it safe?' },
      { type: 'p', text: 'Equity ratio 44%, current ratio 178%. Nearly half the shop is funded by the owner, and short-term assets cover short-term bills almost twice over. No alarm here.' },
      { type: 'h', text: '2. Is it earning?' },
      { type: 'p', text: 'Gross margin 65% is healthy, but after rent and wages only 7.1% survives as operating profit — 30,000 on 420,000 of sales. A 7% fall in sales, or a rent rise of 30,000, would wipe the profit out entirely. This is the fragile part of the business.' },
      { type: 'h', text: '3. Is cash coming in?' },
      { type: 'p', text: 'Operating cash flow of 34,000 against a profit of 18,000. The cafe turns its profit into real money, and it paid for the new machine out of that cash instead of borrowing more. Good.' },
      {
        type: 'cards',
        items: [
          { k: 'Safe?', v: 'Yes — 44% equity' },
          { k: 'Earning?', v: 'Thinly — 7.1% margin' },
          { k: 'Cash?', v: 'Yes — 34,000 in' }
        ]
      },
      { type: 'h', text: 'The verdict' },
      { type: 'p', text: 'A solid little shop with a thin margin. It is not in danger, but it has no cushion. The question to put to the owner is simple: what happens to that 7.1% when the lease is renewed?' },
      { type: 'note', text: 'Use the same order on any report you open. Three numbers — operating margin, equity ratio, operating cash flow — tell you more in five minutes than an hour spent reading the notes.' },
      { type: 'h', text: 'What this app deliberately left out' },
      { type: 'p', text: 'Real reports add segment breakdowns, accounting policies, one-off items and the notes, which is where the interesting trouble usually hides. What you have learned here is the frame those details hang on.' }
    ],
    quiz: [
      {
        q: 'Which single number would worry you most about Cobble Cafe?',
        options: ['The operating margin of 7.1%', 'The equity ratio of 44%', 'The gross margin of 65%'],
        answer: 0,
        why: '44% equity and a 65% gross margin are both healthy. The thin operating margin is what leaves no room for a bad year.'
      },
      {
        q: 'Operating cash flow (34,000) is larger than net profit (18,000). That is…',
        options: ['A good sign', 'A bad sign', 'Meaningless on its own'],
        answer: 0,
        why: 'It means the reported profit is backed by money actually arriving. The reverse — profit with no cash — is the pattern to be suspicious of.'
      },
      {
        q: 'Next year the cafe borrows 50,000 to open a second shop. What happens to the equity ratio?',
        options: ['It falls', 'It rises', 'It stays the same'],
        answer: 0,
        why: 'Assets and liabilities both rise by 50,000, so the owner’s 80,000 becomes a smaller share of a bigger total: 80,000 ÷ 230,000 = 35%.'
      },
      {
        q: 'You open a company’s report with five minutes to spare. A sensible order is…',
        options: ['Net profit, and nothing else', 'Operating profit and its margin, then the equity ratio, then operating cash flow', 'The share price, then the profit'],
        answer: 1,
        why: 'Earnings, safety and cash — one number each. Net profit alone hides both the debt and whether the money ever arrived.'
      }
    ]
  }
];

const GLOSSARY = [
  { t: 'Accounts payable', d: 'Bills the company has received but not yet paid. A liability.' },
  { t: 'Accrual', d: 'The rule that a sale is recorded when it is made, not when the money arrives. It is why profit and cash differ.' },
  { t: 'Assets', d: 'Everything the company owns or is owed: cash, stock, equipment, unpaid customer invoices.' },
  { t: 'Balance sheet', d: 'A snapshot on one day of what the company owns, owes, and has left for its owners.' },
  { t: 'Cash flow statement', d: 'The record of money actually moving, split into operating, investing and financing.' },
  { t: 'Cost of sales', d: 'What went into the thing sold — for a cafe, the beans, milk and cups.' },
  { t: 'Current assets', d: 'Assets expected to turn into cash within a year: cash, stock, receivables.' },
  { t: 'Current liabilities', d: 'Debts due within a year: supplier bills, the next twelve months of a loan.' },
  { t: 'Current ratio', d: 'Current assets ÷ current liabilities. Over 100% means short-term bills are covered.' },
  { t: 'Depreciation', d: 'Spreading the cost of equipment over the years it is used. It lowers profit without moving cash.' },
  { t: 'Equity', d: 'Assets minus liabilities — what would be left for the owners once every debt was paid.' },
  { t: 'Equity ratio', d: 'Equity ÷ total assets. How much of the business the owners funded rather than lenders.' },
  { t: 'Financing activities', d: 'Cash moving between the company and those who fund it: loans taken or repaid, money put in by owners.' },
  { t: 'Gross margin', d: 'Gross profit ÷ revenue, as a percentage.' },
  { t: 'Gross profit', d: 'Revenue minus cost of sales. What is left before the cost of running the place.' },
  { t: 'Income statement', d: 'The year’s trading: revenue at the top, costs taken off in order, profit at the bottom. Also called the profit and loss account.' },
  { t: 'Interest', d: 'The cost of borrowed money. Taken off below operating profit.' },
  { t: 'Inventory', d: 'Goods held ready to sell or use. Stock.' },
  { t: 'Investing activities', d: 'Cash spent on, or received from, things the company will use for years — equipment, property.' },
  { t: 'Liabilities', d: 'Everything the company owes: supplier bills, loans, tax due.' },
  { t: 'Net profit', d: 'What is left after every cost, including interest and tax. The bottom line.' },
  { t: 'Operating activities', d: 'Cash generated by ordinary trading — the part of the cash flow statement that matters most.' },
  { t: 'Operating expenses', d: 'The cost of running the business rather than of the goods sold: wages, rent, utilities.' },
  { t: 'Operating margin', d: 'Operating profit ÷ revenue. How much of each sale survives after running costs.' },
  { t: 'Operating profit', d: 'Profit from the business itself, before interest and tax.' },
  { t: 'Receivables', d: 'Money owed to the company by customers who have not paid yet. An asset.' },
  { t: 'Retained earnings', d: 'Past profits kept in the business instead of paid out. Part of equity.' },
  { t: 'Revenue', d: 'The total value of what was sold in the period. The top line.' },
  { t: 'ROA', d: 'Return on assets: net profit ÷ total assets. What everything the company uses earned.' },
  { t: 'ROE', d: 'Return on equity: net profit ÷ equity. What the owners’ own money earned.' }
];

/* ------------------------------------------------------------------ state */

let store = null;
let progress = { read: {}, quiz: {}, last: 'ch1' };
let currentChapter = 0;
let quizIndex = 0;
let quizSelected = null;
let quizPhase = 'answering'; // answering | reviewing | finished
let quizScore = 0;
let resetArmed = false;
let resetTimer = null;
let toastTimer = null;

/* Fallback for when app-sync.js fails to load. localStorage only, no sync.
   Writes the same key in the same envelope format, so the next healthy load
   picks it up and uploads it. Copy as-is; don't trim it. */
async function openStore(slug, key, opts) {
  try { if (window.AppSync) return await window.AppSync.store(slug, key, opts); } catch (e) { console.error(e); }
  const o = opts || {}, k = 'appdata:' + slug + ':' + key;
  const read = function (s) { try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; } };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : ((o.legacyKey && read(o.legacyKey)) ?? o.default ?? null);
  return {
    get: function () { return cp(c); },
    set: function (v) {
      c = cp(v);
      try { localStorage.setItem(k, JSON.stringify({ v: 1, av: o.version || 1, t: Date.now(), o: null, d: c })); } catch (e) {}
      return Promise.resolve();
    },
    subscribe: function () { return function () {}; },
    flush: function () { return Promise.resolve(); },
    status: function () { return { online: false, syncing: false, lastSyncedAt: null, error: null }; }
  };
}

/* Anything can be in storage — an old shape, a half-written object, null.
   Rebuild a known-good shape rather than trusting what comes back. */
function normalize(raw) {
  const safe = { read: {}, quiz: {}, last: CHAPTERS[0].id };
  if (!raw || typeof raw !== 'object') return safe;
  CHAPTERS.forEach(function (ch) {
    if (raw.read && raw.read[ch.id] === true) safe.read[ch.id] = true;
    const q = raw.quiz && raw.quiz[ch.id];
    if (q && typeof q.score === 'number' && typeof q.total === 'number') {
      safe.quiz[ch.id] = { score: q.score, total: q.total };
    }
  });
  if (typeof raw.last === 'string' && findChapter(raw.last) >= 0) safe.last = raw.last;
  return safe;
}

function findChapter(id) {
  for (let i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === id) return i;
  return -1;
}

function saveProgress() {
  if (!store) return;
  store.set(progress).catch(function (e) {
    console.error('Statement Reader: could not save progress', e);
    showToast('Progress could not be saved in this browser.');
  });
}

/* --------------------------------------------------------------- elements */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.hidden = true; }, 3200);
}

/* ----------------------------------------------------------- block render */

function renderBlock(block) {
  if (block.type === 'p') return el('p', null, block.text);
  if (block.type === 'h') return el('h3', null, block.text);
  if (block.type === 'note') return el('p', 'note', block.text);

  if (block.type === 'list') {
    const ul = el('ul', 'bullets');
    block.items.forEach(function (item) { ul.appendChild(el('li', null, item)); });
    return ul;
  }

  if (block.type === 'cards') {
    const wrap = el('div', 'qcards');
    block.items.forEach(function (item) {
      const card = el('div', 'qcard');
      card.appendChild(el('b', null, item.k));
      card.appendChild(el('span', null, item.v));
      wrap.appendChild(card);
    });
    return wrap;
  }

  if (block.type === 'figures') {
    const card = el('div', 'card');
    if (block.cap) card.appendChild(el('p', 'card-cap', block.cap));
    const table = el('table', 'figures');
    const tbody = el('tbody');
    block.rows.forEach(function (row) {
      const tr = el('tr', (row.total ? 'total' : '') + (row.indent ? ' indent' : ''));
      tr.appendChild(el('th', null, row.label));
      tr.appendChild(el('td', 'num', row.value));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    return card;
  }

  if (block.type === 'bs') return renderBalanceDiagram(block);
  if (block.type === 'bars') return renderBars(block);
  if (block.type === 'cf') return renderCashFlow(block);
  if (block.type === 'formulas') return renderFormulas(block);

  return document.createDocumentFragment();
}

/* Assets on the left, liabilities stacked over equity on the right, drawn to
   scale so the two columns end at the same height. */
function renderBalanceDiagram(block) {
  const HEIGHT = 186;
  const GAP = 3;
  const inner = HEIGHT - GAP;

  const card = el('div', 'card');
  if (block.cap) card.appendChild(el('p', 'card-cap', block.cap));

  const dia = el('div', 'dia');

  const left = el('div', 'side');
  left.appendChild(makeBlock('assets', 'ASSETS', '180,000', HEIGHT));
  dia.appendChild(left);

  const right = el('div', 'side stack');
  right.appendChild(makeBlock('liab', 'LIABILITIES', '100,000', inner * (100 / 180)));
  right.appendChild(makeBlock('equity', 'EQUITY', '80,000', inner * (80 / 180)));
  dia.appendChild(right);

  card.appendChild(dia);
  return card;
}

function makeBlock(kind, label, value, height) {
  const box = el('div', 'blk ' + kind);
  box.style.height = Math.round(height) + 'px';
  box.appendChild(el('b', null, label));
  box.appendChild(el('span', null, value));
  return box;
}

function renderBars(block) {
  const card = el('div', 'card');
  if (block.cap) card.appendChild(el('p', 'card-cap', block.cap));
  const wrap = el('div', 'bars');
  block.rows.forEach(function (row) {
    const line = el('div', 'bar-row' + (row.accent ? ' accent' : ''));
    const head = el('div', 'bar-head');
    head.appendChild(el('b', null, row.label));
    head.appendChild(el('span', null, row.value));
    line.appendChild(head);
    const track = el('div', 'bar-track');
    const fill = el('i');
    fill.style.width = Math.max(row.pct, 1.2) + '%';
    track.appendChild(fill);
    line.appendChild(track);
    wrap.appendChild(line);
  });
  card.appendChild(wrap);
  return card;
}

function renderCashFlow(block) {
  const card = el('div', 'card');
  if (block.cap) card.appendChild(el('p', 'card-cap', block.cap));
  block.rows.forEach(function (row) {
    const line = el('div', 'cf-row');
    const head = el('div', 'cf-head');
    head.appendChild(el('b', null, row.label));
    head.appendChild(el('span', row.value >= 0 ? 'plus' : 'minus', row.text));
    line.appendChild(head);

    const track = el('div', 'cf-track');
    const fill = el('i', row.value >= 0 ? 'plus' : 'minus');
    fill.style.width = (Math.abs(row.value) / block.max) * 50 + '%';
    track.appendChild(fill);
    line.appendChild(track);
    card.appendChild(line);
  });
  return card;
}

function renderFormulas(block) {
  const card = el('div', 'card');
  if (block.cap) card.appendChild(el('p', 'card-cap', block.cap));
  block.items.forEach(function (item) {
    const box = el('div', 'formula');
    box.appendChild(el('b', null, item.name));
    box.appendChild(el('code', null, item.expr));
    box.appendChild(el('p', 'val', item.value));
    box.appendChild(el('em', null, item.note));
    card.appendChild(box);
  });
  return card;
}

/* --------------------------------------------------------------- contents */

function renderContents() {
  const list = document.getElementById('chapterList');
  clear(list);

  CHAPTERS.forEach(function (ch, index) {
    const li = el('li');
    const row = el('button', 'chapter-row');
    row.type = 'button';

    row.appendChild(el('span', 'chapter-no', ch.no));

    const main = el('span', 'chapter-main');
    main.appendChild(el('span', 'chapter-name', ch.title));
    main.appendChild(el('span', 'chapter-sub', ch.sub));
    row.appendChild(main);

    const done = progress.read[ch.id] === true;
    const score = progress.quiz[ch.id];
    let mark = 'READ';
    if (done && score) mark = 'READ ' + score.score + '/' + score.total;
    row.appendChild(el('span', 'chapter-mark' + (done ? '' : ' todo'), done ? mark : '—'));

    row.addEventListener('click', function () { openChapter(index); });
    li.appendChild(row);
    list.appendChild(li);
  });

  const readCount = countRead();
  document.getElementById('contentsEmpty').hidden = readCount > 0;

  const next = nextUnread();
  const button = document.getElementById('continueBtn');
  if (next < 0) {
    button.textContent = 'Read Chapter 1 again';
  } else if (readCount === 0) {
    button.textContent = 'Start Chapter 1';
  } else {
    button.textContent = 'Continue — Chapter ' + CHAPTERS[next].no;
  }
}

function countRead() {
  return CHAPTERS.filter(function (ch) { return progress.read[ch.id] === true; }).length;
}

function nextUnread() {
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (progress.read[CHAPTERS[i].id] !== true) return i;
  }
  return -1;
}

function renderProgressBar() {
  const read = countRead();
  document.getElementById('progressLine').textContent =
    read + ' of ' + CHAPTERS.length + ' chapters read';
  document.getElementById('progressFill').style.width =
    (read / CHAPTERS.length) * 100 + '%';
}

/* ---------------------------------------------------------------- chapter */

function openChapter(index) {
  currentChapter = index;
  const chapter = CHAPTERS[index];

  progress.last = chapter.id;
  saveProgress();

  document.getElementById('chapterEyebrow').textContent = 'CHAPTER ' + chapter.no;
  document.getElementById('chapterTitle').textContent = chapter.title;

  const body = document.getElementById('chapterBody');
  clear(body);
  chapter.blocks.forEach(function (block) { body.appendChild(renderBlock(block)); });

  quizIndex = 0;
  quizScore = 0;
  renderQuestion();

  document.getElementById('prevBtn').disabled = index === 0;
  document.getElementById('nextBtn').disabled = index === CHAPTERS.length - 1;

  switchView('chapter');
  window.scrollTo(0, 0);
}

function renderQuestion() {
  const chapter = CHAPTERS[currentChapter];
  const question = chapter.quiz[quizIndex];

  quizSelected = null;
  quizPhase = 'answering';

  document.getElementById('quizCount').textContent =
    'QUESTION ' + (quizIndex + 1) + ' OF ' + chapter.quiz.length;
  document.getElementById('quizQuestion').textContent = question.q;

  const box = document.getElementById('quizOptions');
  clear(box);
  question.options.forEach(function (text, i) {
    const option = el('button', 'opt', text);
    option.type = 'button';
    option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', function () { selectOption(i); });
    box.appendChild(option);
  });

  const feedback = document.getElementById('quizFeedback');
  feedback.hidden = true;
  feedback.className = 'quiz-feedback';

  const action = document.getElementById('quizActionBtn');
  action.textContent = 'Check answer';
  action.disabled = true;

  document.getElementById('quizResult').hidden = true;
}

function selectOption(index) {
  if (quizPhase !== 'answering') return;
  quizSelected = index;
  const options = document.getElementById('quizOptions').children;
  for (let i = 0; i < options.length; i++) {
    options[i].setAttribute('aria-pressed', i === index ? 'true' : 'false');
  }
  document.getElementById('quizActionBtn').disabled = false;
}

/* One button drives the quiz. Which of the three things it does depends on
   quizPhase, so the listener is attached once and never swapped. */
function onQuizAction() {
  const chapter = CHAPTERS[currentChapter];

  if (quizPhase === 'answering') {
    if (quizSelected === null) return;
    gradeAnswer(chapter.quiz[quizIndex]);
    quizPhase = 'reviewing';
    document.getElementById('quizActionBtn').textContent =
      quizIndex === chapter.quiz.length - 1 ? 'Finish chapter' : 'Next question';
    return;
  }

  if (quizPhase === 'reviewing') {
    if (quizIndex < chapter.quiz.length - 1) {
      quizIndex += 1;
      renderQuestion();
    } else {
      finishChapter();
    }
    return;
  }

  // finished — the button now moves on
  if (currentChapter < CHAPTERS.length - 1) openChapter(currentChapter + 1);
  else { switchView('contents'); window.scrollTo(0, 0); }
}

function gradeAnswer(question) {
  const options = document.getElementById('quizOptions').children;
  for (let i = 0; i < options.length; i++) {
    options[i].disabled = true;
    options[i].setAttribute('aria-pressed', 'false');
    if (i === question.answer) options[i].classList.add('correct');
    else if (i === quizSelected) options[i].classList.add('wrong');
  }

  const right = quizSelected === question.answer;
  if (right) quizScore += 1;

  const feedback = document.getElementById('quizFeedback');
  clear(feedback);
  feedback.className = 'quiz-feedback ' + (right ? 'ok' : 'no');
  feedback.appendChild(el('b', null, right ? 'Correct.' : 'Not quite.'));
  feedback.appendChild(document.createTextNode(question.why));
  feedback.hidden = false;
}

function finishChapter() {
  const chapter = CHAPTERS[currentChapter];

  progress.read[chapter.id] = true;
  progress.quiz[chapter.id] = { score: quizScore, total: chapter.quiz.length };
  saveProgress();
  renderProgressBar();
  renderContents();

  const result = document.getElementById('quizResult');
  result.textContent =
    'CHAPTER MARKED READ \u00b7 ' + quizScore + ' OF ' + chapter.quiz.length + ' CORRECT';
  result.hidden = false;

  quizPhase = 'finished';
  document.getElementById('quizActionBtn').textContent =
    currentChapter < CHAPTERS.length - 1
      ? 'Go to Chapter ' + CHAPTERS[currentChapter + 1].no
      : 'Back to all chapters';
}

/* -------------------------------------------------------------- glossary */

function renderGlossary(term) {
  const query = (term || '').trim().toLowerCase();
  const list = document.getElementById('glossaryList');
  clear(list);

  const matches = GLOSSARY.filter(function (entry) {
    if (!query) return true;
    return entry.t.toLowerCase().indexOf(query) >= 0 || entry.d.toLowerCase().indexOf(query) >= 0;
  });

  matches.forEach(function (entry) {
    const row = el('div');
    row.appendChild(el('dt', null, entry.t));
    row.appendChild(el('dd', null, entry.d));
    list.appendChild(row);
  });

  document.getElementById('glossaryEmpty').hidden = matches.length > 0;
  list.hidden = matches.length === 0;
}

/* ------------------------------------------------------------------ views */

function switchView(name) {
  const views = { contents: 'contentsView', chapter: 'chapterView', glossary: 'glossaryView', help: 'helpView' };
  Object.keys(views).forEach(function (key) {
    document.getElementById(views[key]).hidden = key !== name;
  });

  const tabFor = name === 'chapter' ? 'contents' : name;
  const tabs = document.querySelectorAll('.tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].setAttribute('aria-pressed', tabs[i].dataset.view === tabFor ? 'true' : 'false');
  }
}

function armReset() {
  const button = document.getElementById('resetBtn');
  if (!resetArmed) {
    resetArmed = true;
    button.textContent = 'Press again to clear';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      resetArmed = false;
      button.textContent = 'Clear my progress';
    }, 4000);
    return;
  }

  clearTimeout(resetTimer);
  resetArmed = false;
  button.textContent = 'Clear my progress';

  progress = { read: {}, quiz: {}, last: CHAPTERS[0].id };
  saveProgress();
  renderProgressBar();
  renderContents();
  showToast('Progress cleared.');
}

/* ------------------------------------------------------------------- boot */

document.addEventListener('DOMContentLoaded', async function () {
  store = await openStore('statement-reader', 'progress', {
    default: { read: {}, quiz: {}, last: CHAPTERS[0].id }
  });
  progress = normalize(store.get());

  store.subscribe(function () {
    progress = normalize(store.get());
    renderProgressBar();
    renderContents();
  });

  renderProgressBar();
  renderContents();
  renderGlossary('');

  const tabs = document.querySelectorAll('.tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { switchView(this.dataset.view); });
  }

  document.getElementById('continueBtn').addEventListener('click', function () {
    const next = nextUnread();
    openChapter(next < 0 ? 0 : next);
  });

  document.getElementById('quizActionBtn').addEventListener('click', onQuizAction);

  document.getElementById('prevBtn').addEventListener('click', function () {
    if (currentChapter > 0) openChapter(currentChapter - 1);
  });

  document.getElementById('nextBtn').addEventListener('click', function () {
    if (currentChapter < CHAPTERS.length - 1) openChapter(currentChapter + 1);
  });

  document.getElementById('backToContentsBtn').addEventListener('click', function () {
    switchView('contents');
    window.scrollTo(0, 0);
  });

  document.getElementById('glossarySearch').addEventListener('input', function () {
    renderGlossary(this.value);
  });

  document.getElementById('resetBtn').addEventListener('click', armReset);

  switchView('contents');
});
