// Family Schedule
//
// All data lives in Supabase (family_groups / family_members / family_items),
// shared by every signed-in member of the same family group — this is not a
// per-user sync like other mini apps, it's real multi-user sharing, so there
// is no localStorage fallback here. Sign-in is required (see #authGate).

const APP_SLUG = 'family-schedule';
const VAPID_PUBLIC_KEY = 'BCTRqMI1R172Kv_jJBw0df5f4jxRjPuKgXFXJ6yH7VeFNTyY5m-7U6TR3tnaag3iidYPWR0sA3W2sdk-SKWw0VE';
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L — avoids visual mix-ups

let currentUser = null;
let currentGroup = null; // { id, name, inviteCode }
let currentNickname = null;
let members = []; // [{ userId, nickname }]
let items = [];
let editingItemId = null;
let realtimeChannel = null;
let pendingJoinGroup = null; // { id, name } — set after a successful code lookup

// ---- Auth ----

async function signIn() {
  const cleanUrl = window.location.origin + window.location.pathname;
  await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cleanUrl } });
}

async function signOut() {
  teardownRealtime();
  await supabaseClient.auth.signOut();
}

function updateAuthUI() {
  document.getElementById('authGate').hidden = !!currentUser;
  document.getElementById('app').hidden = !currentUser;
  if (currentUser) loadFamilyState();
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

// ---- Family state ----

async function loadFamilyState() {
  document.getElementById('loadingIndicator').hidden = false;
  document.getElementById('onboardingView').hidden = true;
  document.getElementById('mainView').hidden = true;

  const { data, error } = await supabaseClient
    .from('family_members')
    .select('group_id, nickname, family_groups(name, invite_code)')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  document.getElementById('loadingIndicator').hidden = true;

  if (error) {
    console.error('loadFamilyState error:', error.message);
    document.getElementById('onboardingView').hidden = false;
    return;
  }

  if (!data || !data.family_groups) {
    switchOnboardingTab('create');
    document.getElementById('onboardingView').hidden = false;
    return;
  }

  currentGroup = { id: data.group_id, name: data.family_groups.name, inviteCode: data.family_groups.invite_code };
  currentNickname = data.nickname;

  document.getElementById('mainView').hidden = false;
  document.getElementById('familyNameDisplay').textContent = currentGroup.name;
  document.getElementById('inviteCodeDisplay').textContent = currentGroup.inviteCode;

  await loadMembers();
  await loadItems();
  setupRealtime();

  if ('Notification' in window && Notification.permission === 'granted') {
    enablePushSync();
  }
  updateNotifyStatus();
}

function genInviteCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < bytes.length; i++) {
    code += INVITE_CODE_CHARS[bytes[i] % INVITE_CODE_CHARS.length];
  }
  return code;
}

async function handleCreateFamily(e) {
  e.preventDefault();
  const name = document.getElementById('createFamilyName').value.trim();
  const nickname = document.getElementById('createNickname').value.trim();
  if (!name || !nickname) return;

  showOnboardingError('');

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = genInviteCode();
    const { data: group, error } = await supabaseClient
      .from('family_groups')
      .insert({ name, invite_code: inviteCode, created_by: currentUser.id })
      .select('id, name, invite_code')
      .single();

    if (error) {
      if (error.code === '23505') continue; // invite_code collision — retry with a new code
      showOnboardingError('Could not create the family. Please try again.');
      console.error('create family error:', error.message);
      return;
    }

    const { error: memberError } = await supabaseClient
      .from('family_members')
      .insert({ group_id: group.id, user_id: currentUser.id, nickname });

    if (memberError) {
      showOnboardingError('Could not create the family. Please try again.');
      console.error('create membership error:', memberError.message);
      return;
    }

    await loadFamilyState();
    return;
  }

  showOnboardingError('Could not generate an invite code. Please try again.');
}

async function handleLookupCode(e) {
  e.preventDefault();
  const code = document.getElementById('inviteCodeInput').value.trim().toUpperCase();
  if (!code) return;

  showOnboardingError('');
  document.getElementById('joinPreview').hidden = true;

  const { data, error } = await supabaseClient.rpc('find_family_group_by_code', { code });

  if (error) {
    showOnboardingError('Something went wrong looking up that code. Please try again.');
    console.error('lookup code error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    showOnboardingError('No family found with that code. Double-check it with your family member.');
    return;
  }

  const group = data[0];
  pendingJoinGroup = { id: group.id, name: group.name };

  document.getElementById('joinPreviewName').textContent = group.name;
  const memberNames = group.member_nicknames || [];
  document.getElementById('joinPreviewMembers').textContent =
    memberNames.length > 0 ? 'Current members: ' + memberNames.join(', ') : 'No members yet.';
  document.getElementById('joinNickname').value = '';
  document.getElementById('lookupCodeForm').hidden = true;
  document.getElementById('joinPreview').hidden = false;
}

async function handleJoinFamily(e) {
  e.preventDefault();
  if (!pendingJoinGroup) return;

  const nickname = document.getElementById('joinNickname').value.trim();
  if (!nickname) return;

  showOnboardingError('');

  const { error } = await supabaseClient
    .from('family_members')
    .insert({ group_id: pendingJoinGroup.id, user_id: currentUser.id, nickname });

  if (error) {
    showOnboardingError('Could not join that family. Please try again.');
    console.error('join family error:', error.message);
    return;
  }

  pendingJoinGroup = null;
  await loadFamilyState();
}

function cancelJoin() {
  pendingJoinGroup = null;
  document.getElementById('joinPreview').hidden = true;
  document.getElementById('lookupCodeForm').hidden = false;
  document.getElementById('inviteCodeInput').value = '';
  showOnboardingError('');
}

function showOnboardingError(message) {
  const el = document.getElementById('onboardingError');
  el.textContent = message;
  el.hidden = !message;
}

function switchOnboardingTab(tab) {
  const isCreate = tab === 'create';
  document.getElementById('createTabBtn').classList.toggle('active', isCreate);
  document.getElementById('joinTabBtn').classList.toggle('active', !isCreate);
  document.getElementById('createFamilyForm').hidden = !isCreate;
  document.getElementById('lookupCodeForm').hidden = isCreate;
  document.getElementById('joinPreview').hidden = true;
  pendingJoinGroup = null;
  showOnboardingError('');
}

async function leaveFamily() {
  if (!currentGroup) return;
  if (!window.confirm('Leave "' + currentGroup.name + '"? You can rejoin later with the invite code.')) return;

  teardownRealtime();

  await supabaseClient.from('family_push_subscriptions').delete().eq('user_id', currentUser.id);
  const { error } = await supabaseClient
    .from('family_members')
    .delete()
    .eq('group_id', currentGroup.id)
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('leave family error:', error.message);
    alert('Could not leave the family. Please try again.');
    return;
  }

  currentGroup = null;
  currentNickname = null;
  members = [];
  items = [];
  document.getElementById('mainView').hidden = true;
  switchOnboardingTab('create');
  document.getElementById('onboardingView').hidden = false;
}

async function copyInviteCode() {
  const btn = document.getElementById('copyInviteBtn');
  try {
    await navigator.clipboard.writeText(currentGroup.inviteCode);
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function () { btn.textContent = original; }, 1500);
  } catch (e) {
    alert('Invite code: ' + currentGroup.inviteCode);
  }
}

// ---- Members ----

async function loadMembers() {
  const { data, error } = await supabaseClient
    .from('family_members')
    .select('user_id, nickname')
    .eq('group_id', currentGroup.id)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('loadMembers error:', error.message);
    return;
  }

  members = (data || []).map((m) => ({ userId: m.user_id, nickname: m.nickname }));

  const select = document.getElementById('itemAssignee');
  const previousValue = select.value;
  select.innerHTML = '';
  const unassigned = document.createElement('option');
  unassigned.value = '';
  unassigned.textContent = 'Unassigned';
  select.appendChild(unassigned);

  members.forEach(function (m) {
    const opt = document.createElement('option');
    opt.value = m.nickname;
    opt.textContent = m.nickname;
    select.appendChild(opt);
  });

  if (Array.from(select.options).some((o) => o.value === previousValue)) {
    select.value = previousValue;
  }
}

// ---- Items ----

async function loadItems() {
  const { data, error } = await supabaseClient
    .from('family_items')
    .select('*')
    .eq('group_id', currentGroup.id)
    .order('item_date', { ascending: true, nullsFirst: false })
    .order('item_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('loadItems error:', error.message);
    return;
  }

  items = data || [];
  renderItemList();
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderItemList() {
  const list = document.getElementById('itemList');
  const emptyState = document.getElementById('itemsEmptyState');
  list.textContent = '';

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  items.forEach(function (item) {
    list.appendChild(buildItemCard(item));
  });
}

function buildItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card' + (item.item_type === 'todo' ? ' item-card--todo' : '') + (item.done ? ' item-card--done' : '');

  const top = document.createElement('div');
  top.className = 'item-top';

  const main = document.createElement('div');

  const badge = document.createElement('span');
  badge.className = 'item-badge' + (item.item_type === 'todo' ? ' item-badge--todo' : '');
  badge.textContent = item.item_type === 'todo' ? 'To-do' : 'Schedule';
  main.appendChild(badge);

  const title = document.createElement('p');
  title.className = 'item-title';
  title.textContent = item.title;
  main.appendChild(title);

  const metaParts = [];
  if (item.item_date) metaParts.push(formatDateDisplay(item.item_date));
  if (item.item_time) metaParts.push(item.item_time);
  if (item.assignee_nickname) metaParts.push('Assigned to ' + item.assignee_nickname);
  if (metaParts.length > 0) {
    const meta = document.createElement('p');
    meta.className = 'item-meta';
    meta.textContent = metaParts.join(' · ');
    main.appendChild(meta);
  }

  if (item.memo) {
    const memo = document.createElement('p');
    memo.className = 'item-memo';
    memo.textContent = item.memo;
    main.appendChild(memo);
  }

  top.appendChild(main);

  if (item.item_type === 'todo') {
    const toggle = document.createElement('label');
    toggle.className = 'item-done-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.done;
    checkbox.addEventListener('change', function () {
      toggleItemDone(item.id, checkbox.checked);
    });
    toggle.appendChild(checkbox);
    toggle.appendChild(document.createTextNode('Done'));
    top.appendChild(toggle);
  }

  card.appendChild(top);

  const footer = document.createElement('div');
  footer.className = 'item-footer';

  const addedBy = document.createElement('span');
  addedBy.className = 'item-added-by';
  addedBy.textContent = 'Added by ' + item.created_by_nickname;
  footer.appendChild(addedBy);

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'item-icon-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function () { startEditItem(item); });
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'item-icon-btn item-icon-btn--danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function () { deleteItem(item.id, item.title); });
  actions.appendChild(deleteBtn);

  footer.appendChild(actions);
  card.appendChild(footer);

  return card;
}

async function toggleItemDone(id, done) {
  const { error } = await supabaseClient.from('family_items').update({ done, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.error('toggleItemDone error:', error.message);
    return;
  }
  await loadItems();
}

async function deleteItem(id, title) {
  if (!window.confirm('Delete "' + title + '"? This can\'t be undone.')) return;
  const { error } = await supabaseClient.from('family_items').delete().eq('id', id);
  if (error) {
    console.error('deleteItem error:', error.message);
    return;
  }
  await loadItems();
}

function startEditItem(item) {
  editingItemId = item.id;

  document.querySelector('input[name="itemType"][value="' + item.item_type + '"]').checked = true;
  toggleTimeFieldVisibility();
  document.getElementById('itemTitle').value = item.title;
  document.getElementById('itemDate').value = item.item_date || '';
  document.getElementById('itemTime').value = item.item_time || '';
  document.getElementById('itemAssignee').value = item.assignee_nickname || '';
  document.getElementById('itemMemo').value = item.memo || '';

  document.getElementById('itemFormSubmitBtn').textContent = 'Save changes';
  document.getElementById('cancelEditBtn').hidden = false;
  document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEditItem() {
  editingItemId = null;
  document.getElementById('itemForm').reset();
  toggleTimeFieldVisibility();
  document.getElementById('itemFormSubmitBtn').textContent = 'Add';
  document.getElementById('cancelEditBtn').hidden = true;
}

async function handleItemFormSubmit(e) {
  e.preventDefault();

  const itemType = document.querySelector('input[name="itemType"]:checked').value;
  const title = document.getElementById('itemTitle').value.trim();
  const itemDate = document.getElementById('itemDate').value || null;
  const itemTime = itemType === 'event' ? (document.getElementById('itemTime').value || null) : null;
  const assignee = document.getElementById('itemAssignee').value || null;
  const memo = document.getElementById('itemMemo').value.trim() || null;

  if (!title) return;

  if (editingItemId) {
    const { error } = await supabaseClient
      .from('family_items')
      .update({
        item_type: itemType,
        title,
        item_date: itemDate,
        item_time: itemTime,
        assignee_nickname: assignee,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingItemId);

    if (error) {
      console.error('update item error:', error.message);
      alert('Could not save changes. Please try again.');
      return;
    }
  } else {
    const { error } = await supabaseClient.from('family_items').insert({
      group_id: currentGroup.id,
      item_type: itemType,
      title,
      item_date: itemDate,
      item_time: itemTime,
      assignee_nickname: assignee,
      memo,
      created_by: currentUser.id,
      created_by_nickname: currentNickname,
    });

    if (error) {
      console.error('add item error:', error.message);
      alert('Could not add that. Please try again.');
      return;
    }
  }

  cancelEditItem();
  await loadItems();
}

function toggleTimeFieldVisibility() {
  const itemType = document.querySelector('input[name="itemType"]:checked').value;
  document.getElementById('itemTimeGroup').hidden = itemType === 'todo';
  if (itemType === 'todo') document.getElementById('itemTime').value = '';
}

// ---- Realtime (so open screens update live when another member makes a change) ----

function setupRealtime() {
  teardownRealtime();
  realtimeChannel = supabaseClient
    .channel('family_items_' + currentGroup.id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'family_items', filter: 'group_id=eq.' + currentGroup.id },
      function () { loadItems(); }
    )
    .subscribe();
}

function teardownRealtime() {
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

// ---- Push notifications ----

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(function () {
    // Installability is a nice-to-have; ignore failures (e.g. non-https local file access)
  });

  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}

function setupNotifyUI() {
  const btn = document.getElementById('enableNotifyBtn');
  btn.addEventListener('click', function () {
    Notification.requestPermission().then(function (permission) {
      updateNotifyStatus();
      if (permission === 'granted') enablePushSync();
    });
  });
}

function updateNotifyStatus() {
  const status = document.getElementById('notifyStatus');
  const btn = document.getElementById('enableNotifyBtn');
  if (!status || !btn) return;

  if (!('Notification' in window)) {
    status.textContent = 'Push notifications are not supported on this browser.';
    status.className = 'notify-status notify-status--alert';
    btn.disabled = true;
    return;
  }

  if (Notification.permission === 'granted') {
    status.textContent = 'Notifications are on — you\'ll be notified when family adds something new.';
    status.className = 'notify-status notify-status--ok';
    btn.textContent = 'Notifications enabled';
    btn.disabled = true;
  } else if (Notification.permission === 'denied') {
    status.textContent = 'Notifications are blocked in your browser settings.';
    status.className = 'notify-status notify-status--alert';
    btn.textContent = 'Enable notifications';
    btn.disabled = false;
  } else {
    status.textContent = 'Turn on notifications to hear about new family schedules and to-dos.';
    status.className = 'notify-status';
    btn.textContent = 'Enable notifications';
    btn.disabled = false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function enablePushSync() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !currentGroup) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await supabaseClient.from('family_push_subscriptions').upsert({
      user_id: currentUser.id,
      group_id: currentGroup.id,
      subscription: subscription.toJSON(),
      updated_at: new Date().toISOString(),
    });

    updateNotifyStatus();
  } catch (e) {
    console.error('push subscription failed:', e);
  }
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', function () {
  registerServiceWorker();

  document.getElementById('signInBtn').addEventListener('click', signIn);
  document.getElementById('signOutBtn').addEventListener('click', signOut);

  document.getElementById('createTabBtn').addEventListener('click', function () { switchOnboardingTab('create'); });
  document.getElementById('joinTabBtn').addEventListener('click', function () { switchOnboardingTab('join'); });
  document.getElementById('createFamilyForm').addEventListener('submit', handleCreateFamily);
  document.getElementById('lookupCodeForm').addEventListener('submit', handleLookupCode);
  document.getElementById('joinFamilyForm').addEventListener('submit', handleJoinFamily);
  document.getElementById('cancelJoinBtn').addEventListener('click', cancelJoin);

  document.getElementById('leaveFamilyBtn').addEventListener('click', leaveFamily);
  document.getElementById('copyInviteBtn').addEventListener('click', copyInviteCode);
  document.getElementById('refreshBtn').addEventListener('click', loadItems);

  document.querySelectorAll('input[name="itemType"]').forEach(function (radio) {
    radio.addEventListener('change', toggleTimeFieldVisibility);
  });
  document.getElementById('itemForm').addEventListener('submit', handleItemFormSubmit);
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEditItem);

  setupNotifyUI();
  initAuth();
});
