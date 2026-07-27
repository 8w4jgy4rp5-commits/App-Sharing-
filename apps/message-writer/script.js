const API_KEY_STORAGE_KEY = 'message-writer:apiKey:v1';
const LANG_STORAGE_KEY = 'message-writer:outputLanguage:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------
// 注意: ここで扱う「UI表示言語」は、下の SCENES / buildPrompt などが
// 生成する「メッセージの出力言語（日本語/English）」とは別物です。
// 出力言語はユーザーがlangToggleで選ぶ設定のままにし、翻訳対象にしません。

const STRINGS = {
  en: {
    title: 'Work Message Writer',
    subtitle: 'Draft difficult work messages — declines, resignations, apologies — in seconds.',
    apiKeyLabel: 'OpenRouter API key',
    apiKeyHint: 'Stored only in your browser. Get a free key at openrouter.ai — no credit card needed. This app uses a free-tier model, so it never costs anything.',
    save: 'Save',
    changeKey: 'Change key',
    situationTypeLabel: 'Situation type',
    sceneDecline: 'Decline a request',
    sceneResign: 'Resign from a job',
    sceneTransfer: 'Request a transfer',
    sceneApologize: 'Apologize',
    sceneReply: 'Reply to a request',
    sceneOther: 'Other',
    situationDetailsLabel: 'Situation details',
    situationDetailsHint: 'Describe what happened and what you need to say, in your own words.',
    situationPlaceholder: "e.g. A client asked for extra work outside our contract. I need to decline politely, we don't have capacity.",
    outputLanguageLabel: 'Output language',
    generateMessage: 'Generate message',
    generating: 'Generating...',
    generatedMessageLabel: 'Generated message',
    copy: 'Copy',
    copied: 'Copied!',
    moreFormal: 'More formal',
    moreConcise: 'More concise',
    working: 'Working...',
    errChooseScene: 'Please choose a situation type.',
    errDescribeSituation: 'Please describe the situation.',
    errNeedApiKey: 'Please enter your OpenRouter API key above first.',
    errGeneric: 'Something went wrong. Please try again.',
  },
  ja: {
    title: 'ビジネスメッセージ作成',
    subtitle: '断り・退職・謝罪など、伝えにくい業務連絡の文面を数秒で下書きします。',
    apiKeyLabel: 'OpenRouter APIキー',
    apiKeyHint: 'このブラウザにのみ保存されます。openrouter.aiで無料キーを取得できます（クレジットカード不要）。このアプリは無料枠モデルを使うため、費用は一切かかりません。',
    save: '保存',
    changeKey: 'キーを変更',
    situationTypeLabel: '状況の種類',
    sceneDecline: '依頼を断る',
    sceneResign: '仕事を辞める',
    sceneTransfer: '異動を希望する',
    sceneApologize: '謝罪する',
    sceneReply: '依頼に返信する',
    sceneOther: 'その他',
    situationDetailsLabel: '状況の詳細',
    situationDetailsHint: '何があったか、何を伝えたいかを自分の言葉で説明してください。',
    situationPlaceholder: '例: 契約範囲外の追加作業をクライアントから頼まれた。丁寧に断りたいが、対応できる余裕がない。',
    outputLanguageLabel: '出力言語',
    generateMessage: 'メッセージを生成',
    generating: '生成中...',
    generatedMessageLabel: '生成されたメッセージ',
    copy: 'コピー',
    copied: 'コピーしました！',
    moreFormal: 'よりフォーマルに',
    moreConcise: 'より簡潔に',
    working: '処理中...',
    errChooseScene: '状況の種類を選んでください。',
    errDescribeSituation: '状況を説明してください。',
    errNeedApiKey: '先に上のOpenRouter APIキーを入力してください。',
    errGeneric: '問題が発生しました。もう一度お試しください。',
  },
  es: {
    title: 'Redactor de Mensajes Laborales',
    subtitle: 'Redacta en segundos mensajes laborales difíciles: rechazos, renuncias, disculpas.',
    apiKeyLabel: 'Clave API de OpenRouter',
    apiKeyHint: 'Se guarda solo en tu navegador. Obtén una clave gratis en openrouter.ai — sin tarjeta de crédito. Esta app usa un modelo de nivel gratuito, así que nunca tiene costo.',
    save: 'Guardar',
    changeKey: 'Cambiar clave',
    situationTypeLabel: 'Tipo de situación',
    sceneDecline: 'Rechazar una solicitud',
    sceneResign: 'Renunciar a un trabajo',
    sceneTransfer: 'Solicitar un traslado',
    sceneApologize: 'Disculparse',
    sceneReply: 'Responder a una solicitud',
    sceneOther: 'Otro',
    situationDetailsLabel: 'Detalles de la situación',
    situationDetailsHint: 'Describe qué pasó y qué necesitas decir, con tus propias palabras.',
    situationPlaceholder: 'ej. Un cliente pidió trabajo extra fuera del contrato. Necesito rechazarlo con amabilidad, no tenemos capacidad.',
    outputLanguageLabel: 'Idioma de salida',
    generateMessage: 'Generar mensaje',
    generating: 'Generando...',
    generatedMessageLabel: 'Mensaje generado',
    copy: 'Copiar',
    copied: '¡Copiado!',
    moreFormal: 'Más formal',
    moreConcise: 'Más conciso',
    working: 'Procesando...',
    errChooseScene: 'Por favor, elige un tipo de situación.',
    errDescribeSituation: 'Por favor, describe la situación.',
    errNeedApiKey: 'Por favor, introduce primero tu clave API de OpenRouter arriba.',
    errGeneric: 'Algo salió mal. Inténtalo de nuevo.',
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', getLang());
  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}
// Free-tier models on OpenRouter — no cost, no credit card required.
// Listed in priority order; OpenRouter falls back to the next one if the
// first is unavailable. openrouter/free was tried first but sometimes
// randomly picked a non-chat model (rerankers, safety classifiers), so
// these are pinned general-purpose instruct models instead.
// google/gemma-4-26b-a4b-it is listed first because it's the one that
// actually answered in QA testing (20/20 natural JA/EN outputs); the
// other two are untested fallbacks in case it's ever unavailable.
// Free-tier limits: 20 requests/min, 50 requests/day.
const MODEL_FALLBACKS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free'
];
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SCENES = {
  decline: 'The message declines a request or offer politely but firmly.',
  resign: 'The message informs someone of the writer\'s intention to resign from their job.',
  transfer: 'The message requests a department or role transfer, explaining the reason and preferred conditions.',
  apologize: 'The message is a sincere, professional apology.',
  reply: 'The message replies to a request the writer received.',
  other: 'The message covers whatever situation the writer describes below.'
};

let selectedScene = null;
let selectedLang = 'ja';
let lastMessage = '';

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  setupApiKey();
  setupSceneButtons();
  setupLangToggle();
  setupGenerate();
  setupResultActions();
});

// =====================
// API key storage
// =====================

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function setupApiKey() {
  const section = document.getElementById('api-key-section');
  const input = document.getElementById('apiKeyInput');
  const saveBtn = document.getElementById('saveApiKeyBtn');
  const changeBtn = document.getElementById('changeApiKeyBtn');

  function showSetup() {
    input.style.display = '';
    saveBtn.style.display = '';
    changeBtn.style.display = 'none';
    input.value = getApiKey();
  }

  function showReady() {
    input.style.display = 'none';
    saveBtn.style.display = 'none';
    changeBtn.style.display = '';
  }

  saveBtn.addEventListener('click', function () {
    const key = input.value.trim();
    if (!key) return;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    showReady();
  });

  changeBtn.addEventListener('click', showSetup);

  if (getApiKey()) {
    showReady();
  } else {
    showSetup();
  }
}

// =====================
// Scene + language selection
// =====================

function setupSceneButtons() {
  const buttons = document.querySelectorAll('.scene-btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      selectedScene = btn.dataset.scene;
      clearFormError();
    });
  });
}

function setupLangToggle() {
  const buttons = document.querySelectorAll('.lang-btn');
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  selectedLang = saved === 'en' ? 'en' : 'ja';

  buttons.forEach(function (btn) {
    if (btn.dataset.lang === selectedLang) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      selectedLang = btn.dataset.lang;
      localStorage.setItem(LANG_STORAGE_KEY, selectedLang);
    });
  });
}

// =====================
// Form validation
// =====================

function showFormError(message) {
  const el = document.getElementById('formError');
  el.textContent = message;
  el.hidden = false;
}

function clearFormError() {
  const el = document.getElementById('formError');
  el.hidden = true;
}

function validateForm(situation) {
  if (!selectedScene) {
    showFormError(t.errChooseScene);
    return false;
  }
  if (!situation) {
    showFormError(t.errDescribeSituation);
    return false;
  }
  return true;
}

// =====================
// Prompt building + API call
// =====================

function languageInstruction(lang) {
  return lang === 'en'
    ? 'Write the message in natural, professional English.'
    : 'Write the message in natural, polite Japanese suitable for business use.';
}

function buildPrompt(scene, situation, lang) {
  const sceneDesc = SCENES[scene] || SCENES.other;
  return [
    'You are helping someone write a difficult work message.',
    'Situation: ' + sceneDesc,
    'Details from the writer: ' + situation,
    languageInstruction(lang),
    'Only use facts given above. Do not invent people, relationships, or details that were not mentioned (for example, do not bring up the recipient\'s family).',
    'Keep it short: a brief opening, the core message stated once, and a brief closing. Do not repeat the same apology or phrase more than once.',
    'Reply with only the message text itself, no explanations, no quotation marks, no extra commentary.'
  ].join('\n');
}

function buildRevisionPrompt(previousMessage, instruction, lang) {
  return [
    'Revise the following work message. ' + instruction,
    'Keep the same meaning and situation.',
    languageInstruction(lang),
    'Reply with only the revised message text, no explanations, no quotation marks.',
    '',
    'Message:',
    previousMessage
  ].join('\n');
}

async function callOpenRouter(apiKey, prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      models: MODEL_FALLBACKS,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errData = await response.json();
      detail = errData && errData.error && errData.error.message;
    } catch {
      // response body wasn't JSON; fall back to the plain status message below
    }
    throw new Error(detail || 'OpenRouter request failed (status ' + response.status + ')');
  }

  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }
  return content.trim();
}

// =====================
// Generate button
// =====================

function setupGenerate() {
  const btn = document.getElementById('generateBtn');
  const situationInput = document.getElementById('situationInput');
  const resultSection = document.getElementById('resultSection');
  const resultBox = document.getElementById('resultBox');
  const resultError = document.getElementById('resultError');

  btn.addEventListener('click', async function () {
    const situation = situationInput.value.trim();
    clearFormError();
    resultError.hidden = true;

    if (!validateForm(situation)) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      showFormError(t.errNeedApiKey);
      document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    btn.disabled = true;
    btn.textContent = t.generating;

    try {
      const prompt = buildPrompt(selectedScene, situation, selectedLang);
      const message = await callOpenRouter(apiKey, prompt);
      lastMessage = message;
      resultBox.textContent = message;
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      resultError.textContent = err.message || t.errGeneric;
      resultError.hidden = false;
      resultSection.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = t.generateMessage;
    }
  });
}

// =====================
// Result actions: copy + tone adjustment
// =====================

function setupResultActions() {
  const copyBtn = document.getElementById('copyBtn');
  const moreFormalBtn = document.getElementById('moreFormalBtn');
  const moreConciseBtn = document.getElementById('moreConciseBtn');
  const resultBox = document.getElementById('resultBox');
  const resultError = document.getElementById('resultError');

  copyBtn.addEventListener('click', function () {
    if (!lastMessage) return;
    navigator.clipboard.writeText(lastMessage).then(function () {
      const original = copyBtn.textContent;
      copyBtn.textContent = t.copied;
      setTimeout(function () {
        copyBtn.textContent = original;
      }, 1500);
    });
  });

  async function revise(instruction, triggerBtn) {
    if (!lastMessage) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      resultError.textContent = t.errNeedApiKey;
      resultError.hidden = false;
      return;
    }

    const buttons = [copyBtn, moreFormalBtn, moreConciseBtn];
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    const original = triggerBtn.textContent;
    triggerBtn.textContent = t.working;
    resultError.hidden = true;

    try {
      const prompt = buildRevisionPrompt(lastMessage, instruction, selectedLang);
      const message = await callOpenRouter(apiKey, prompt);
      lastMessage = message;
      resultBox.textContent = message;
    } catch (err) {
      resultError.textContent = err.message || t.errGeneric;
      resultError.hidden = false;
    } finally {
      buttons.forEach(function (b) {
        b.disabled = false;
      });
      triggerBtn.textContent = original;
    }
  }

  moreFormalBtn.addEventListener('click', function () {
    revise('Make it more formal.', moreFormalBtn);
  });

  moreConciseBtn.addEventListener('click', function () {
    revise('Make it more concise.', moreConciseBtn);
  });
}
