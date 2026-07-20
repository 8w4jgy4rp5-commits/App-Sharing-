const API_KEY_STORAGE_KEY = 'message-writer:apiKey:v1';
const LANG_STORAGE_KEY = 'message-writer:outputLanguage:v1';
// Free-tier models on OpenRouter — no cost, no credit card required.
// Listed in priority order; OpenRouter falls back to the next one if the
// first is unavailable. openrouter/free was tried first but sometimes
// randomly picked a non-chat model (rerankers, safety classifiers), so
// these are pinned general-purpose instruct models instead.
// Free-tier limits: 20 requests/min, 50 requests/day.
const MODEL_FALLBACKS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'openai/gpt-oss-20b:free'
];
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SCENES = {
  decline: 'The message declines a request or offer politely but firmly.',
  resign: 'The message informs someone of the writer\'s intention to resign from their job.',
  apologize: 'The message is a sincere, professional apology.',
  reply: 'The message replies to a request the writer received.',
  other: 'The message covers whatever situation the writer describes below.'
};

let selectedScene = null;
let selectedLang = 'ja';
let lastMessage = '';

document.addEventListener('DOMContentLoaded', function () {
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
    showFormError('Please choose a situation type.');
    return false;
  }
  if (!situation) {
    showFormError('Please describe the situation.');
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
      showFormError('Please enter your OpenRouter API key above first.');
      document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const prompt = buildPrompt(selectedScene, situation, selectedLang);
      const message = await callOpenRouter(apiKey, prompt);
      lastMessage = message;
      resultBox.textContent = message;
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      resultError.textContent = err.message || 'Something went wrong. Please try again.';
      resultError.hidden = false;
      resultSection.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate message';
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
      copyBtn.textContent = 'Copied!';
      setTimeout(function () {
        copyBtn.textContent = original;
      }, 1500);
    });
  });

  async function revise(instruction, triggerBtn) {
    if (!lastMessage) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      resultError.textContent = 'Please enter your OpenRouter API key above first.';
      resultError.hidden = false;
      return;
    }

    const buttons = [copyBtn, moreFormalBtn, moreConciseBtn];
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    const original = triggerBtn.textContent;
    triggerBtn.textContent = 'Working...';
    resultError.hidden = true;

    try {
      const prompt = buildRevisionPrompt(lastMessage, instruction, selectedLang);
      const message = await callOpenRouter(apiKey, prompt);
      lastMessage = message;
      resultBox.textContent = message;
    } catch (err) {
      resultError.textContent = err.message || 'Something went wrong. Please try again.';
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
