// ===========================
// CobbleWorks - 認証（Supabase Auth / Google login）
// ===========================

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB

let currentUser = null; // ログイン中のSupabaseユーザー（未ログインならnull）
let currentProfile = null; // ログイン中ユーザーのprofiles行
let profileModalMode = 'onboarding'; // 'onboarding'（初回・キャンセル不可） or 'edit'（後からの編集）
let selectedAvatarFile = null; // モーダルで新しく選ばれたアバター画像（未選択ならnull）

async function signInWithGoogle() {
  // 現在のページURLをそのまま使うと、前回ログイン時に付いたトークン付きの
  // #ハッシュまで一緒に持ち込んでしまい、ログインのたびにURLが壊れていくため、
  // クエリ・ハッシュを除いた「素のページURL」だけをredirectToに使う。
  const cleanUrl = window.location.origin + window.location.pathname;
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: cleanUrl }
  });
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

// ログイン中ユーザーのprofiles行を取得し、currentProfileに入れる
async function fetchCurrentProfile() {
  if (!currentUser) {
    currentProfile = null;
    return;
  }

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error) {
    console.error('Failed to load profile:', error.message);
    currentProfile = null;
  } else {
    currentProfile = data;
  }
}

// ヘッダーのログインボタン／ユーザーメニューの表示を切り替える
function renderAuthUI() {
  const signInBtn = document.getElementById('signInBtn');
  const userMenu = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  const userHandle = document.getElementById('userHandle');
  if (!signInBtn || !userMenu) return; // このページに認証UIが無ければ何もしない

  if (currentUser) {
    signInBtn.hidden = true;
    userMenu.hidden = false;
    userAvatar.src = (currentProfile && currentProfile.avatar_url) || '';
    userAvatar.hidden = !(currentProfile && currentProfile.avatar_url);
    userHandle.textContent = currentProfile ? currentProfile.handle : '';
  } else {
    signInBtn.hidden = false;
    userMenu.hidden = true;
  }
}

// mode: 'onboarding'（初回、キャンセル不可） or 'edit'（後からの編集、キャンセル可）
function showProfileModal(mode) {
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  profileModalMode = mode;
  selectedAvatarFile = null;

  const title = document.getElementById('profileModalTitle');
  const intro = document.getElementById('profileModalIntro');
  const cancelBtn = document.getElementById('cancelProfileBtn');
  const handleInput = document.getElementById('handleInput');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const handleError = document.getElementById('handleError');
  const avatarError = document.getElementById('avatarError');

  if (mode === 'edit') {
    title.textContent = 'Edit your profile';
    intro.textContent = 'Update the name and image shown on your requests and mini apps.';
    cancelBtn.hidden = false;
  } else {
    title.textContent = 'Choose your handle';
    intro.textContent = 'This is the name shown on your requests and mini apps.';
    cancelBtn.hidden = true;
  }

  handleInput.value = (currentProfile && !currentProfile.handle.startsWith('user_')) ? currentProfile.handle : '';
  avatarFileInput.value = '';
  if (currentProfile && currentProfile.avatar_url) {
    avatarPreview.src = currentProfile.avatar_url;
    avatarPreview.hidden = false;
  } else {
    avatarPreview.hidden = true;
  }
  handleError.hidden = true;
  avatarError.hidden = true;

  modal.hidden = false;
  handleInput.focus();
}

function hideProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.hidden = true;
}

// handle_setがfalseのまま（=まだ自分のhandleを決めていない）なら強制的にオンボーディングを出す
function maybeShowOnboarding() {
  if (currentUser && currentProfile && currentProfile.handle_set === false) {
    showProfileModal('onboarding');
  } else {
    hideProfileModal();
  }
}

// 選んだファイルをSupabase Storageにアップロードし、公開URLを返す
async function uploadAvatar(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = currentUser.id + '/avatar-' + Date.now() + '.' + ext;

  const { error: uploadError } = await supabaseClient.storage
    .from('avatars')
    .upload(path, file, { upsert: false });

  if (uploadError) {
    return { error: uploadError };
  }

  const { data } = supabaseClient.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl };
}

async function saveProfile(handle, avatarUrl) {
  const { error } = await supabaseClient
    .from('profiles')
    .update({ handle: handle, avatar_url: avatarUrl || null, handle_set: true })
    .eq('id', currentUser.id);
  return error;
}

// ログイン状態を取得してUIに反映し、以後の変化も監視する
async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session ? session.user : null;
  await fetchCurrentProfile();
  renderAuthUI();
  maybeShowOnboarding();
  if (typeof updateAuthDependentUI === 'function') updateAuthDependentUI();

  supabaseClient.auth.onAuthStateChange(async function (event, session) {
    currentUser = session ? session.user : null;
    await fetchCurrentProfile();
    renderAuthUI();
    maybeShowOnboarding();
    if (typeof updateAuthDependentUI === 'function') updateAuthDependentUI();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // ヘッダーのボタンと、各フォームのサインイン案内ボタンをまとめて扱う
  document.querySelectorAll('.signin-trigger').forEach(function (btn) {
    btn.addEventListener('click', signInWithGoogle);
  });

  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) signOutBtn.addEventListener('click', signOut);

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) editProfileBtn.addEventListener('click', function () {
    showProfileModal('edit');
  });

  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', hideProfileModal);

  const avatarFileInput = document.getElementById('avatarFileInput');
  if (avatarFileInput) avatarFileInput.addEventListener('change', function () {
    const avatarError = document.getElementById('avatarError');
    const avatarPreview = document.getElementById('avatarPreview');
    const file = this.files[0];
    avatarError.hidden = true;

    if (!file) {
      selectedAvatarFile = null;
      return;
    }
    if (!file.type.startsWith('image/')) {
      avatarError.textContent = 'Please choose an image file.';
      avatarError.hidden = false;
      this.value = '';
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      avatarError.textContent = 'Image must be 2MB or smaller.';
      avatarError.hidden = false;
      this.value = '';
      return;
    }

    selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = function () {
      avatarPreview.src = reader.result;
      avatarPreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  const saveHandleBtn = document.getElementById('saveHandleBtn');
  if (saveHandleBtn) saveHandleBtn.addEventListener('click', async function () {
    const handleInput = document.getElementById('handleInput');
    const handleError = document.getElementById('handleError');
    const avatarError = document.getElementById('avatarError');
    const handle = handleInput.value.trim();

    handleError.hidden = true;
    avatarError.hidden = true;

    if (handle.length < 3) {
      handleError.textContent = 'Handle must be at least 3 characters.';
      handleError.hidden = false;
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      handleError.textContent = 'Only letters, numbers, and underscores are allowed.';
      handleError.hidden = false;
      return;
    }

    // 新しく画像を選んでいればアップロードし、そのURLを使う。選んでいなければ今のavatar_urlのままにする
    let avatarUrl = currentProfile ? currentProfile.avatar_url : null;
    if (selectedAvatarFile) {
      saveHandleBtn.disabled = true;
      const result = await uploadAvatar(selectedAvatarFile);
      saveHandleBtn.disabled = false;
      if (result.error) {
        avatarError.textContent = 'Failed to upload image. Please try again.';
        avatarError.hidden = false;
        return;
      }
      avatarUrl = result.url;
    }

    const error = await saveProfile(handle, avatarUrl);
    if (error) {
      handleError.textContent = error.code === '23505'
        ? 'That handle is already taken.'
        : 'Something went wrong. Please try again.';
      handleError.hidden = false;
      return;
    }

    await fetchCurrentProfile();
    renderAuthUI();
    hideProfileModal();
  });

  initAuth();
});
