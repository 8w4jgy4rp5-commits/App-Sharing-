// Book Snap
//
// All data (books, tags, pages, page photos) lives in Supabase, not localStorage —
// like Virtual Trader, this is a deliberate exception to the platform's usual
// local-only rule, since camera photos don't fit in localStorage and should
// survive across devices. There is no AI transcription: the "note" on each page
// is written by the user themselves right after snapping the photo, and stays
// freely editable from the page detail screen.

const BUCKET = 'book-snap-pages';
const SIGNED_URL_TTL = 3600;
const MAX_DIM = 1600;

let currentUser = null;
let navStack = [{ view: 'tags' }];

let selectedTags = []; // [{id,name}] currently chosen on the book form
let tagPickerAllTags = [];
let tagEditMode = 'create'; // 'create' | 'rename'
let tagEditId = null;

let currentBookIdForPages = null;
let currentBookTitleForPages = '';

let currentCaptureBookId = null;
let cameraStream = null;
let capturedBlob = null;
let capturePreviewObjectUrl = null;

let currentDetailPageId = null;

// ---- element refs ----

const authGateEl = document.getElementById('authGate');
const appEl = document.getElementById('app');
const screenTitleEl = document.getElementById('screenTitle');
const backBtn = document.getElementById('backBtn');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const tagListEl = document.getElementById('tagList');
const tagsEmptyEl = document.getElementById('tagsEmpty');

const bookListEl = document.getElementById('bookList');
const tagBooksEmptyEl = document.getElementById('tagBooksEmpty');
const addBookEmptyBtn = document.getElementById('addBookEmptyBtn');

const bookForm = document.getElementById('bookForm');
const bookTitleInput = document.getElementById('bookTitleInput');
const bookAuthorInput = document.getElementById('bookAuthorInput');
const selectedTagChipsEl = document.getElementById('selectedTagChips');
const openTagPickerBtn = document.getElementById('openTagPickerBtn');
const bookFormError = document.getElementById('bookFormError');

const pagesBookTitleEl = document.getElementById('pagesBookTitle');
const pagesBookAuthorEl = document.getElementById('pagesBookAuthor');
const deleteBookBtn = document.getElementById('deleteBookBtn');
const pageListEl = document.getElementById('pageList');
const pagesEmptyEl = document.getElementById('pagesEmpty');

const cameraVideoEl = document.getElementById('cameraVideo');
const capturePreviewImg = document.getElementById('capturePreviewImg');
const cameraErrorEl = document.getElementById('cameraError');
const cameraFallbackLabel = document.getElementById('cameraFallbackLabel');
const cameraFallbackInput = document.getElementById('cameraFallbackInput');
const captureCanvas = document.getElementById('captureCanvas');
const captureNoteWrap = document.getElementById('captureNoteWrap');
const pageNoteInput = document.getElementById('pageNoteInput');
const captureBar = document.getElementById('captureBar');
const captureReviewBar = document.getElementById('captureReviewBar');
const shutterBtn = document.getElementById('shutterBtn');
const retakeBtn = document.getElementById('retakeBtn');
const savePageBtn = document.getElementById('savePageBtn');

const pageDetailImg = document.getElementById('pageDetailImg');
const pageDetailNote = document.getElementById('pageDetailNote');
const savePageNoteBtn = document.getElementById('savePageNoteBtn');
const pageDetailSaved = document.getElementById('pageDetailSaved');

const helpBtn = document.getElementById('helpBtn');
const helpSheet = document.getElementById('helpSheet');
const closeHelpSheetBtn = document.getElementById('closeHelpSheetBtn');

const fabAddTag = document.getElementById('fabAddTag');
const fabAddBook = document.getElementById('fabAddBook');
const fabCapture = document.getElementById('fabCapture');

const tagPickerSheet = document.getElementById('tagPickerSheet');
const tagPickerChips = document.getElementById('tagPickerChips');
const tagPickerEmpty = document.getElementById('tagPickerEmpty');
const newTagNameInput = document.getElementById('newTagNameInput');
const addNewTagBtn = document.getElementById('addNewTagBtn');
const tagPickerError = document.getElementById('tagPickerError');
const closeTagPickerBtn = document.getElementById('closeTagPickerBtn');

const tagRenameSheet = document.getElementById('tagRenameSheet');
const tagRenameTitle = document.getElementById('tagRenameTitle');
const renameTagInput = document.getElementById('renameTagInput');
const renameTagError = document.getElementById('renameTagError');
const cancelRenameTagBtn = document.getElementById('cancelRenameTagBtn');
const saveRenameTagBtn = document.getElementById('saveRenameTagBtn');

// ---- navigation ----

function render() {
  const top = navStack[navStack.length - 1];
  showView(top.view, top.params || {});
}

function navTo(view, params) {
  navStack.push({ view, params: params || {} });
  render();
}

function navReplaceTop(view, params) {
  navStack[navStack.length - 1] = { view, params: params || {} };
  render();
}

function navBack() {
  if (navStack.length <= 1) return;
  const top = navStack.pop();
  cleanupView(top.view);
  render();
}

function cleanupView(view) {
  if (view === 'capture') {
    stopCamera();
    if (capturePreviewObjectUrl) {
      URL.revokeObjectURL(capturePreviewObjectUrl);
      capturePreviewObjectUrl = null;
    }
    capturedBlob = null;
  }
}

function showView(view, params) {
  document.querySelectorAll('.view').forEach((el) => {
    el.hidden = el.id !== 'view-' + view;
  });
  backBtn.hidden = navStack.length <= 1;
  fabAddTag.hidden = true;
  fabAddBook.hidden = true;
  fabCapture.hidden = true;
  captureBar.hidden = true;
  captureReviewBar.hidden = true;

  if (view === 'tags') {
    screenTitleEl.textContent = 'Tags';
    fabAddTag.hidden = false;
    loadTags();
  } else if (view === 'tagBooks') {
    screenTitleEl.textContent = params.tagName;
    fabAddBook.hidden = false;
    loadBooksForTag(params.tagId);
  } else if (view === 'bookForm') {
    screenTitleEl.textContent = 'New Book';
    resetBookForm(params);
  } else if (view === 'pages') {
    screenTitleEl.textContent = params.bookTitle;
    fabCapture.hidden = false;
    currentBookIdForPages = params.bookId;
    currentBookTitleForPages = params.bookTitle;
    pagesBookTitleEl.textContent = params.bookTitle;
    pagesBookAuthorEl.textContent = params.bookAuthor || '';
    loadPages(params.bookId);
  } else if (view === 'capture') {
    screenTitleEl.textContent = 'Capture page';
    currentCaptureBookId = params.bookId;
    captureBar.hidden = false;
    resetCaptureUI();
    startCamera();
  } else if (view === 'pageDetail') {
    screenTitleEl.textContent = 'Page';
    loadPageDetail(params.pageId);
  }
}

// ---- auth ----

async function signIn() {
  const cleanUrl = window.location.origin + window.location.pathname;
  await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cleanUrl } });
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

function updateAuthUI() {
  authGateEl.hidden = !!currentUser;
  appEl.hidden = !currentUser;
  if (currentUser) {
    navStack = [{ view: 'tags' }];
    render();
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

// ---- tags screen ----

async function loadTags() {
  tagListEl.innerHTML = '';
  const { data: tags, error } = await supabaseClient
    .from('book_snap_tags')
    .select('id, name')
    .eq('user_id', currentUser.id)
    .order('name');

  if (error) {
    console.error(error);
    return;
  }

  const { data: links } = await supabaseClient
    .from('book_snap_book_tags')
    .select('tag_id')
    .eq('user_id', currentUser.id);

  const counts = {};
  (links || []).forEach((l) => {
    counts[l.tag_id] = (counts[l.tag_id] || 0) + 1;
  });

  tagsEmptyEl.hidden = (tags || []).length > 0;

  (tags || []).forEach((tag) => {
    const li = document.createElement('li');

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'card-open-btn';
    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = '\u{1F3F7}️ ' + tag.name;
    const sub = document.createElement('span');
    sub.className = 'card-sub';
    const n = counts[tag.id] || 0;
    sub.textContent = n === 1 ? '1 book' : n + ' books';
    openBtn.appendChild(title);
    openBtn.appendChild(sub);
    openBtn.addEventListener('click', () => navTo('tagBooks', { tagId: tag.id, tagName: tag.name }));

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.className = 'icon-btn';
    renameBtn.setAttribute('aria-label', 'Rename tag');
    renameBtn.textContent = '✎';
    renameBtn.addEventListener('click', () => openTagEditSheet('rename', tag));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn delete-icon';
    deleteBtn.setAttribute('aria-label', 'Delete tag');
    deleteBtn.textContent = '\u{1F5D1}';
    deleteBtn.addEventListener('click', () => deleteTag(tag));

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(openBtn);
    li.appendChild(actions);
    tagListEl.appendChild(li);
  });
}

async function deleteTag(tag) {
  const ok = confirm(
    'Delete tag "' + tag.name + '"? Books that lose their last tag will no longer be reachable from Tags.'
  );
  if (!ok) return;

  const { error } = await supabaseClient.from('book_snap_tags').delete().eq('id', tag.id);
  if (error) {
    console.error(error);
    alert('Could not delete this tag.');
    return;
  }
  loadTags();
}

function openTagEditSheet(mode, tag) {
  tagEditMode = mode;
  tagEditId = tag ? tag.id : null;
  tagRenameTitle.textContent = mode === 'create' ? 'New tag' : 'Rename tag';
  renameTagInput.value = tag ? tag.name : '';
  renameTagError.hidden = true;
  tagRenameSheet.hidden = false;
  renameTagInput.focus();
}

async function saveTagEdit() {
  const name = renameTagInput.value.trim();
  renameTagError.hidden = true;
  if (!name) {
    renameTagError.textContent = 'Tag name is required.';
    renameTagError.hidden = false;
    return;
  }

  let error;
  if (tagEditMode === 'create') {
    ({ error } = await supabaseClient.from('book_snap_tags').insert({ user_id: currentUser.id, name }));
  } else {
    ({ error } = await supabaseClient.from('book_snap_tags').update({ name }).eq('id', tagEditId));
  }

  if (error) {
    renameTagError.textContent = error.code === '23505' ? 'That tag already exists.' : 'Something went wrong.';
    renameTagError.hidden = false;
    return;
  }

  tagRenameSheet.hidden = true;
  loadTags();
}

// ---- tag books screen ----

async function loadBooksForTag(tagId) {
  bookListEl.innerHTML = '';

  const { data: links, error: linkErr } = await supabaseClient
    .from('book_snap_book_tags')
    .select('book_id')
    .eq('tag_id', tagId)
    .eq('user_id', currentUser.id);

  if (linkErr) {
    console.error(linkErr);
    return;
  }

  const bookIds = (links || []).map((l) => l.book_id);
  tagBooksEmptyEl.hidden = bookIds.length > 0;
  if (bookIds.length === 0) return;

  const { data: books, error } = await supabaseClient
    .from('book_snap_books')
    .select('id, title, author')
    .in('id', bookIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  (books || []).forEach((book) => {
    const li = document.createElement('li');
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'card-open-btn';
    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = '\u{1F4D6} ' + book.title;
    const sub = document.createElement('span');
    sub.className = 'card-sub';
    sub.textContent = book.author || 'Unknown author';
    openBtn.appendChild(title);
    openBtn.appendChild(sub);
    openBtn.addEventListener('click', () =>
      navTo('pages', { bookId: book.id, bookTitle: book.title, bookAuthor: book.author })
    );
    li.appendChild(openBtn);
    bookListEl.appendChild(li);
  });
}

// ---- book form ----

function resetBookForm(params) {
  bookTitleInput.value = '';
  bookAuthorInput.value = '';
  bookFormError.hidden = true;
  selectedTags = params && params.tagId ? [{ id: params.tagId, name: params.tagName }] : [];
  renderSelectedTagChips();
}

function renderSelectedTagChips() {
  selectedTagChipsEl.innerHTML = '';
  if (selectedTags.length === 0) {
    const span = document.createElement('span');
    span.className = 'muted';
    span.textContent = 'No tags selected yet.';
    selectedTagChipsEl.appendChild(span);
    return;
  }
  selectedTags.forEach((t) => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = t.name;
    selectedTagChipsEl.appendChild(span);
  });
}

async function openTagPicker() {
  tagPickerError.hidden = true;
  newTagNameInput.value = '';
  const { data: tags, error } = await supabaseClient
    .from('book_snap_tags')
    .select('id, name')
    .eq('user_id', currentUser.id)
    .order('name');

  if (error) {
    console.error(error);
    tagPickerAllTags = [];
  } else {
    tagPickerAllTags = tags || [];
  }
  renderTagPickerChips();
  tagPickerSheet.hidden = false;
}

function renderTagPickerChips() {
  tagPickerChips.innerHTML = '';
  tagPickerEmpty.hidden = tagPickerAllTags.length > 0;
  tagPickerAllTags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    btn.className = 'chip chip-toggle' + (isSelected ? ' selected' : '');
    btn.textContent = tag.name;
    btn.addEventListener('click', () => {
      const idx = selectedTags.findIndex((t) => t.id === tag.id);
      if (idx >= 0) {
        selectedTags.splice(idx, 1);
      } else {
        selectedTags.push({ id: tag.id, name: tag.name });
      }
      renderTagPickerChips();
      renderSelectedTagChips();
    });
    tagPickerChips.appendChild(btn);
  });
}

async function addNewTagFromPicker() {
  const name = newTagNameInput.value.trim();
  tagPickerError.hidden = true;
  if (!name) {
    tagPickerError.textContent = 'Enter a tag name.';
    tagPickerError.hidden = false;
    return;
  }

  const { data, error } = await supabaseClient
    .from('book_snap_tags')
    .insert({ user_id: currentUser.id, name })
    .select('id, name')
    .single();

  if (error) {
    tagPickerError.textContent = error.code === '23505' ? 'That tag already exists.' : 'Something went wrong.';
    tagPickerError.hidden = false;
    return;
  }

  tagPickerAllTags.push(data);
  selectedTags.push(data);
  newTagNameInput.value = '';
  renderTagPickerChips();
  renderSelectedTagChips();
}

async function handleBookFormSubmit(e) {
  e.preventDefault();
  const title = bookTitleInput.value.trim();
  bookFormError.hidden = true;

  if (!title) {
    bookFormError.textContent = 'Title is required.';
    bookFormError.hidden = false;
    bookTitleInput.focus();
    return;
  }
  if (selectedTags.length === 0) {
    bookFormError.textContent = 'Select at least one tag.';
    bookFormError.hidden = false;
    return;
  }

  const submitBtn = bookForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const { data: book, error } = await supabaseClient
      .from('book_snap_books')
      .insert({ user_id: currentUser.id, title, author: bookAuthorInput.value.trim() })
      .select('id, title, author')
      .single();
    if (error) throw error;

    const rows = selectedTags.map((t) => ({ book_id: book.id, tag_id: t.id, user_id: currentUser.id }));
    const { error: btErr } = await supabaseClient.from('book_snap_book_tags').insert(rows);
    if (btErr) throw btErr;

    navReplaceTop('pages', { bookId: book.id, bookTitle: book.title, bookAuthor: book.author });
  } catch (err) {
    console.error(err);
    bookFormError.textContent = 'Could not save the book. Please try again.';
    bookFormError.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
}

// ---- pages screen ----

async function loadPages(bookId) {
  pageListEl.innerHTML = '';
  const { data: pages, error } = await supabaseClient
    .from('book_snap_pages')
    .select('id, image_path, page_order')
    .eq('book_id', bookId)
    .eq('user_id', currentUser.id)
    .order('page_order');

  if (error) {
    console.error(error);
    return;
  }

  pagesEmptyEl.hidden = (pages || []).length > 0;
  if (!pages || pages.length === 0) return;

  const paths = pages.map((p) => p.image_path);
  const { data: signedList } = await supabaseClient.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);

  pages.forEach((p, i) => {
    const signed = signedList && signedList[i] ? signedList[i].signedUrl : '';
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-card';
    const img = document.createElement('img');
    img.src = signed;
    img.alt = 'Page ' + (i + 1);
    const label = document.createElement('span');
    label.className = 'page-index';
    label.textContent = 'Page ' + (i + 1);
    btn.appendChild(img);
    btn.appendChild(label);
    btn.addEventListener('click', () => navTo('pageDetail', { pageId: p.id }));
    li.appendChild(btn);
    pageListEl.appendChild(li);
  });
}

async function handleDeleteBook() {
  const ok = confirm('Delete "' + currentBookTitleForPages + '" and all its pages? This cannot be undone.');
  if (!ok) return;

  deleteBookBtn.disabled = true;
  try {
    const { data: pages } = await supabaseClient
      .from('book_snap_pages')
      .select('image_path')
      .eq('book_id', currentBookIdForPages)
      .eq('user_id', currentUser.id);

    const { error } = await supabaseClient.from('book_snap_books').delete().eq('id', currentBookIdForPages);
    if (error) throw error;

    if (pages && pages.length) {
      await supabaseClient.storage.from(BUCKET).remove(pages.map((p) => p.image_path));
    }
    navBack();
  } catch (err) {
    console.error(err);
    alert('Could not delete this book.');
  } finally {
    deleteBookBtn.disabled = false;
  }
}

// ---- capture screen ----

function resetCaptureUI() {
  capturedBlob = null;
  if (capturePreviewObjectUrl) {
    URL.revokeObjectURL(capturePreviewObjectUrl);
    capturePreviewObjectUrl = null;
  }
  capturePreviewImg.hidden = true;
  capturePreviewImg.src = '';
  captureNoteWrap.hidden = true;
  pageNoteInput.value = '';
  captureReviewBar.hidden = true;
  savePageBtn.disabled = true;
  savePageBtn.textContent = 'Save page';
  cameraErrorEl.hidden = true;
  cameraFallbackLabel.hidden = true;
  cameraVideoEl.hidden = false;
  cameraFallbackInput.value = '';
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    cameraVideoEl.srcObject = cameraStream;
    cameraVideoEl.hidden = false;
    cameraErrorEl.hidden = true;
    cameraFallbackLabel.hidden = true;
    captureBar.hidden = false;
  } catch (err) {
    console.error(err);
    cameraStream = null;
    cameraVideoEl.hidden = true;
    cameraErrorEl.textContent = 'Could not access the camera. You can still take a photo below.';
    cameraErrorEl.hidden = false;
    cameraFallbackLabel.hidden = false;
    captureBar.hidden = true;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
}

function drawToCanvasAndExport(sourceEl, srcW, srcH) {
  let targetW = srcW;
  let targetH = srcH;
  if (Math.max(srcW, srcH) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(srcW, srcH);
    targetW = Math.round(srcW * scale);
    targetH = Math.round(srcH * scale);
  }
  captureCanvas.width = targetW;
  captureCanvas.height = targetH;
  const ctx = captureCanvas.getContext('2d');
  ctx.drawImage(sourceEl, 0, 0, targetW, targetH);
  return new Promise((resolve) => captureCanvas.toBlob(resolve, 'image/jpeg', 0.85));
}

function showCapturePreview(blob) {
  capturedBlob = blob;
  if (capturePreviewObjectUrl) URL.revokeObjectURL(capturePreviewObjectUrl);
  capturePreviewObjectUrl = URL.createObjectURL(blob);
  capturePreviewImg.src = capturePreviewObjectUrl;
  capturePreviewImg.hidden = false;
  cameraVideoEl.hidden = true;
  cameraFallbackLabel.hidden = true;
  cameraErrorEl.hidden = true;
  captureBar.hidden = true;
  captureReviewBar.hidden = false;
  savePageBtn.disabled = false;
  captureNoteWrap.hidden = false;
  pageNoteInput.value = '';
}

async function handleShutterClick() {
  if (!cameraVideoEl.videoWidth) return;
  const blob = await drawToCanvasAndExport(cameraVideoEl, cameraVideoEl.videoWidth, cameraVideoEl.videoHeight);
  showCapturePreview(blob);
}

async function handleCameraFallbackChange() {
  const file = cameraFallbackInput.files[0];
  if (!file) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const blob = await drawToCanvasAndExport(img, img.naturalWidth, img.naturalHeight);
    showCapturePreview(blob);
  } catch (err) {
    console.error(err);
    cameraErrorEl.textContent = 'Could not read that photo. Please try again.';
    cameraErrorEl.hidden = false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function handleRetake() {
  capturedBlob = null;
  if (capturePreviewObjectUrl) {
    URL.revokeObjectURL(capturePreviewObjectUrl);
    capturePreviewObjectUrl = null;
  }
  capturePreviewImg.hidden = true;
  capturePreviewImg.src = '';
  captureNoteWrap.hidden = true;
  captureReviewBar.hidden = true;
  savePageBtn.disabled = true;

  if (cameraStream) {
    cameraVideoEl.hidden = false;
    captureBar.hidden = false;
  } else {
    cameraFallbackLabel.hidden = false;
    cameraFallbackInput.value = '';
  }
}

async function getNextPageOrder(bookId) {
  const { data } = await supabaseClient
    .from('book_snap_pages')
    .select('page_order')
    .eq('book_id', bookId)
    .order('page_order', { ascending: false })
    .limit(1);
  return data && data.length ? data[0].page_order + 1 : 1;
}

async function handleSavePage() {
  if (!capturedBlob) return;
  savePageBtn.disabled = true;
  savePageBtn.textContent = 'Saving...';
  cameraErrorEl.hidden = true;

  try {
    const pageId = crypto.randomUUID();
    const bookId = currentCaptureBookId;
    const path = currentUser.id + '/' + bookId + '/' + pageId + '.jpg';

    const { error: upErr } = await supabaseClient.storage
      .from(BUCKET)
      .upload(path, capturedBlob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;

    const nextOrder = await getNextPageOrder(bookId);
    const { error: insErr } = await supabaseClient.from('book_snap_pages').insert({
      id: pageId,
      user_id: currentUser.id,
      book_id: bookId,
      image_path: path,
      note: pageNoteInput.value.trim(),
      page_order: nextOrder,
    });
    if (insErr) throw insErr;

    navBack();
  } catch (err) {
    console.error(err);
    cameraErrorEl.textContent = 'Could not save this page. Please try again.';
    cameraErrorEl.hidden = false;
  } finally {
    savePageBtn.disabled = false;
    savePageBtn.textContent = 'Save page';
  }
}

// ---- page detail screen ----

async function loadPageDetail(pageId) {
  currentDetailPageId = pageId;
  pageDetailSaved.hidden = true;
  pageDetailImg.src = '';
  pageDetailNote.value = '';

  const { data: page, error } = await supabaseClient
    .from('book_snap_pages')
    .select('image_path, note')
    .eq('id', pageId)
    .eq('user_id', currentUser.id)
    .single();

  if (error || !page) {
    console.error(error);
    return;
  }

  pageDetailNote.value = page.note || '';
  const { data: signed } = await supabaseClient.storage.from(BUCKET).createSignedUrl(page.image_path, SIGNED_URL_TTL);
  if (signed) pageDetailImg.src = signed.signedUrl;
}

async function handleSavePageNote() {
  pageDetailSaved.hidden = true;
  const { error } = await supabaseClient
    .from('book_snap_pages')
    .update({ note: pageDetailNote.value.trim() })
    .eq('id', currentDetailPageId);

  if (error) {
    console.error(error);
    alert('Could not save this note.');
    return;
  }
  pageDetailSaved.hidden = false;
  setTimeout(() => {
    pageDetailSaved.hidden = true;
  }, 2000);
}

// ---- wiring ----

document.addEventListener('DOMContentLoaded', () => {
  signInBtn.addEventListener('click', signIn);
  signOutBtn.addEventListener('click', signOut);
  backBtn.addEventListener('click', navBack);

  helpBtn.addEventListener('click', () => {
    helpSheet.hidden = false;
  });
  closeHelpSheetBtn.addEventListener('click', () => {
    helpSheet.hidden = true;
  });

  fabAddTag.addEventListener('click', () => openTagEditSheet('create', null));
  cancelRenameTagBtn.addEventListener('click', () => {
    tagRenameSheet.hidden = true;
  });
  saveRenameTagBtn.addEventListener('click', saveTagEdit);

  const openAddBookForm = () => {
    const top = navStack[navStack.length - 1];
    navTo('bookForm', { tagId: top.params.tagId, tagName: top.params.tagName });
  };
  fabAddBook.addEventListener('click', openAddBookForm);
  addBookEmptyBtn.addEventListener('click', openAddBookForm);
  bookForm.addEventListener('submit', handleBookFormSubmit);
  openTagPickerBtn.addEventListener('click', openTagPicker);
  addNewTagBtn.addEventListener('click', addNewTagFromPicker);
  closeTagPickerBtn.addEventListener('click', () => {
    tagPickerSheet.hidden = true;
  });

  deleteBookBtn.addEventListener('click', handleDeleteBook);
  fabCapture.addEventListener('click', () => navTo('capture', { bookId: currentBookIdForPages }));

  shutterBtn.addEventListener('click', handleShutterClick);
  cameraFallbackInput.addEventListener('change', handleCameraFallbackChange);
  retakeBtn.addEventListener('click', handleRetake);
  savePageBtn.addEventListener('click', handleSavePage);

  savePageNoteBtn.addEventListener('click', handleSavePageNote);

  initAuth();
});
