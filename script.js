// ===========================
// CobbleWorks - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const APPS_STORAGE_KEY = 'miniApps';
const RECENT_APPS_KEY = 'recentAppViews'; // 「最近使ったアプリ」の保存キー（このブラウザだけの記録）
const FAVORITE_APPS_KEY = 'favoriteApps'; // 「お気に入り」の保存キー（このブラウザだけの記録）
const LANG_KEY = 'cobbleworks:lang:v1'; // 言語設定（プロフィールモーダルで選択。auth.jsとも共有）

// -----------------------
// 多言語対応（プラットフォーム全体の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'CobbleWorks',
    subtitle: 'Share a problem. Find a mini app. Or build one.',
    howItWorksNote: 'How it works: someone shares a problem as a Request, someone else builds a free Mini App for it, and anyone can try it.',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    editProfileTitle: 'Edit your profile',

    profileModalTitleOnboarding: 'Choose your handle',
    profileModalIntroOnboarding: 'This is the name shown on your requests and mini apps.',
    profileModalTitleEdit: 'Edit your profile',
    profileModalIntroEdit: 'Update the name and image shown on your requests and mini apps.',
    handleLabel: 'Handle',
    handlePlaceholder: 'e.g. ten_nurse',
    avatarLabel: 'Avatar image',
    avatarOptionalNote: 'Optional — upload a photo (max 2MB)',
    languageLabel: 'Language',
    languageNote: 'Changes the language used across CobbleWorks mini apps.',
    save: 'Save',
    cancel: 'Cancel',
    handleTooShort: 'Handle must be at least 3 characters.',
    handleInvalidChars: 'Only letters, numbers, and underscores are allowed.',
    handleTaken: 'That handle is already taken.',
    genericError: 'Something went wrong. Please try again.',
    avatarInvalidType: 'Please choose an image file.',
    avatarTooLarge: 'Image must be 2MB or smaller.',
    avatarUploadFailed: 'Failed to upload image. Please try again.',
    bioLabel: 'Bio',
    bioNote: 'Optional — a short intro shown on your profile (max 160 characters)',
    bioPlaceholder: 'Tell people a little about yourself',

    searchPlaceholder: 'Search requests and mini apps...',
    searchButton: '🔍 Search requests',
    browseAllLink: 'Browse all requests →',
    requestsDocTitle: 'Requests · CobbleWorks',
    requestsHeading: 'Requests',
    requestsSubtitle: 'Browse what people are struggling with, or add your own.',
    submitRequestHeading: 'Submit a Request',
    signInToPostTitle: 'Sign in to post a request',
    problemLabel: 'Problem',
    problemNote: 'What are you struggling with?',
    problemPlaceholder: 'e.g. I spend too much time switching between apps to track invoices',
    desiredFeaturesNote: 'What would make it better?',
    desiredFeaturesPlaceholder: 'e.g. A simple dashboard to track all invoices in one place',
    submitRequestBtn: 'Submit a request',
    allRequestsHeading: 'All Requests',

    appFormTitleNew: 'Submit a Mini App',
    appFormTitleEdit: 'Edit Mini App',
    signInToSubmitTitle: 'Sign in to submit a mini app',
    signInToSubmitBody: 'Sign in with Google to get started — for free.',
    appNameLabel: 'Mini app name',
    appNameNote: 'What is your app called?',
    appNamePlaceholder: 'e.g. Invoice Tracker',
    appDescriptionLabel: 'Description',
    appDescriptionNote: 'What does it do?',
    appDescriptionPlaceholder: 'e.g. A simple tool to track invoices for freelancers',
    appUrlLabel: 'App URL',
    appUrlNote: 'Where can people find it?',
    targetUsersLabel: 'Target users',
    appTargetUsersNote: 'Who is this app for?',
    appTargetUsersPlaceholder: 'e.g. Freelancers who manage multiple clients',
    appCategoryLabel: 'Category',
    appCategoryNote: 'Which category best fits this app?',
    categoryAll: 'All',
    categoryProductivity: 'Productivity & Habits',
    categoryHealth: 'Health & Wellness',
    categoryFinance: 'Finance & Money',
    categoryLearning: 'Learning',
    categoryTravel: 'Travel & Places',
    categoryLifestyle: 'Life & Hobbies',
    categoryTools: 'Tools & Utilities',
    builtForRequestLabel: 'Built for request',
    builtForRequestNote: 'Which request does this app answer? (optional)',
    requestSearchPlaceholder: 'Search requests...',
    notLinkedOption: '— Not linked to a request —',
    appSubmitNew: 'Submit a mini app',
    appSubmitSave: 'Save changes',

    yourAppsHeading: 'Your Apps',
    yourAppsNote: "Mini apps you're signed in as the owner of. You can also edit or delete your own apps directly from the list below.",
    signInToSeeYourApps: "Sign in to see the mini apps you've submitted.",
    noYourAppsYet: 'Apps you submit will show up here so you can edit or remove them later.',

    profileDocTitle: 'Profile · CobbleWorks',
    profileHeading: 'Profile',
    profileSubtitle: "Your public info and the mini apps you've built.",
    signInToViewProfileTitle: 'Sign in to view your profile',
    signInToViewProfileBody: "Sign in with Google to see your profile and the mini apps you've built.",
    portfolioHeading: 'Portfolio',
    profileBioEmpty: 'No bio yet.',

    recentlyUsedHeading: 'Recently Used',
    recentAppsEmpty: 'Apps you open will show up here.',
    favoriteAppsHeading: 'Favorites',
    favoriteAppsEmpty: 'Tap the star on an app to add it here.',
    addToFavoritesLabel: 'Add to favorites',
    removeFromFavoritesLabel: 'Remove from favorites',
    popularAppsHeading: 'Popular Apps',
    popularAppsEmpty: 'No ratings yet. Rate an app below to help others find popular picks!',

    miniAppsHeading: 'Mini Apps',
    noAppsSearch: 'No results found.',
    noAppsYet: 'No mini apps yet. Build one for a request above!',

    shareDataHeading: 'Share Data',
    shareDataNote: 'Data is stored only in this browser. Export it as a file and send it to a friend — they can import it to see your requests and mini apps. Importing merges with your existing data — nothing is overwritten or deleted.',
    exportDataBtn: '⬇ Export data',
    importDataBtn: '⬆ Import data',

    toastBuiltForSelected: 'Request selected below — fill in the mini app details',
    toastSignInToPost: 'Please sign in to post a request',
    toastFillAllFields: 'Please fill in all fields',
    toastFailedPostRequest: 'Failed to post request',
    toastRequestPosted: 'Request posted!',
    toastSignInToSubmitApp: 'Please sign in to submit a mini app',
    alertInvalidUrl: 'Please enter a valid http:// or https:// URL.',
    toastFailedSaveApp: 'Failed to save mini app',
    toastAppUpdated: 'Mini app updated!',
    toastAppShared: 'Mini app shared!',
    toastFailedDeleteRequest: 'Failed to delete request',
    toastRequestDeleted: 'Request deleted',
    toastSignInToVote: 'Sign in to vote for this request',
    toastSomethingWrong: 'Something went wrong',
    toastFailedDeleteApp: 'Failed to delete mini app',
    toastAppDeleted: 'Mini app deleted',
    toastSignInToRate: 'Sign in to rate this app',
    toastWriteCommentFirst: 'Please write a comment first',
    toastCommentPosted: 'Comment posted!',
    toastDataExported: 'Data exported!',
    toastImportInvalidJson: 'Import failed: not a valid JSON file',
    toastImportBadFormat: 'Import failed: unexpected file format',
    importedCounts: function (reqCount, appCount) { return 'Imported ' + reqCount + ' requests and ' + appCount + ' apps'; },

    desiredFeaturesLabel: 'Desired features',
    sharedBy: function (name, date) { return 'Shared by ' + name + ' · ' + date; },
    postedOn: function (date) { return 'Posted on ' + date; },
    deleteRequestLabel: 'Delete this request',
    confirmDeleteRequest: 'Delete this request? This cannot be undone.',
    wantActive: '⭐ You want this',
    wantInactive: '⭐ I want this too',
    wantActiveTitle: 'Click to remove your vote',
    wantCountOne: '⭐ 1 person wants this',
    wantCountMany: function (n) { return '⭐ ' + n + ' people want this'; },
    buildThis: '🔨 Build this',
    appsBuiltForLabel: 'Apps built for this request',
    maybeAlsoRelevant: '💡 Maybe also relevant',
    currentWorkaroundLabel: 'Current workaround',
    noExactMatches: "No exact matches found. Can't find what you need? Submit a request.",
    noRequestsYet: 'No requests yet. Be the first to submit one!',
    maybeLookingFor: "Maybe you're looking for...",
    prevPage: '← Previous',
    nextPage: 'Next →',
    pageIndicator: function (page, total) { return 'Page ' + page + ' of ' + total; },

    edit: 'Edit',
    deleteAppAriaLabel: function (name) { return 'Delete ' + name; },
    deleteAppTitle: 'Delete this app',
    confirmDeleteApp: function (name) { return 'Delete "' + name + '"? This cannot be undone.'; },

    starsOutOf5: function (avg) { return avg + ' out of 5 stars'; },
    noRatingsYet: 'No ratings yet',
    ratingOne: function (avg) { return avg + ' (1 rating)'; },
    ratingMany: function (avg, count) { return avg + ' (' + count + ' ratings)'; },
    yourRatingLabel: 'Your rating:',
    rateThisAppLabel: 'Rate this app:',
    starsAriaLabel: function (n) { return n + ' stars'; },

    commentsToggle: function (count) { return '💬 Comments (' + count + ')'; },
    noCommentsYet: 'No comments yet. Be the first to leave feedback!',
    anonymous: 'Anonymous',
    commentPlaceholder: 'Share feedback with the creator...',
    commentAriaLabel: 'Comment',
    commentNamePlaceholder: 'Your name (optional)',
    postComment: 'Post comment',
    replyBtn: 'Reply',
    replyPlaceholder: 'Reply as the creator...',
    replyAriaLabel: 'Reply',
    postReply: 'Post reply',
    authorBadge: 'Author',
    toastFailedPostComment: 'Failed to post comment',
  },
  ja: {
    title: 'CobbleWorks',
    subtitle: '困りごとを共有し、ミニアプリを見つけよう。自分で作ってもいい。',
    howItWorksNote: '使い方：誰かが困りごとを「リクエスト」として共有し、別の誰かがそれに応える無料の「ミニアプリ」を作る。誰でも自由に試せます。',
    signInWithGoogle: 'Googleでログイン',
    signOut: 'ログアウト',
    editProfileTitle: 'プロフィールを編集',

    profileModalTitleOnboarding: 'ハンドルネームを決めよう',
    profileModalIntroOnboarding: 'リクエストやミニアプリに表示される名前です。',
    profileModalTitleEdit: 'プロフィールを編集',
    profileModalIntroEdit: 'リクエストやミニアプリに表示される名前と画像を更新します。',
    handleLabel: 'ハンドルネーム',
    handlePlaceholder: '例: taro_nurse',
    avatarLabel: 'アバター画像',
    avatarOptionalNote: '任意 — 画像をアップロード（最大2MB）',
    languageLabel: '言語',
    languageNote: 'CobbleWorksのミニアプリ全体で使う言語を変更します。',
    save: '保存',
    cancel: 'キャンセル',
    handleTooShort: 'ハンドルネームは3文字以上で入力してください。',
    handleInvalidChars: '使えるのは英字・数字・アンダースコアのみです。',
    handleTaken: 'そのハンドルネームは既に使われています。',
    genericError: '問題が発生しました。もう一度お試しください。',
    avatarInvalidType: '画像ファイルを選んでください。',
    avatarTooLarge: '画像は2MB以下にしてください。',
    avatarUploadFailed: '画像のアップロードに失敗しました。もう一度お試しください。',
    bioLabel: '自己紹介',
    bioNote: '任意 — プロフィールに表示される簡単な自己紹介です（最大160文字）',
    bioPlaceholder: '自分について少し教えてください',

    searchPlaceholder: 'リクエストやミニアプリを検索...',
    searchButton: '🔍 リクエストを検索',
    browseAllLink: 'すべてのリクエストを見る →',
    requestsDocTitle: 'リクエスト · CobbleWorks',
    requestsHeading: 'リクエスト',
    requestsSubtitle: '誰かが困っていることを見たり、自分の困りごとを追加したりできます。',
    submitRequestHeading: 'リクエストを投稿',
    signInToPostTitle: 'リクエストを投稿するにはログインしてください',
    problemLabel: '困りごと',
    problemNote: '何に困っていますか？',
    problemPlaceholder: '例：請求書を管理するのに複数のアプリを行き来していて時間がかかる',
    desiredFeaturesNote: 'どうなったら解決しますか？',
    desiredFeaturesPlaceholder: '例：すべての請求書を一箇所で確認できるシンプルなダッシュボード',
    submitRequestBtn: 'リクエストを投稿する',
    allRequestsHeading: 'すべてのリクエスト',

    appFormTitleNew: 'ミニアプリを投稿する',
    appFormTitleEdit: 'ミニアプリを編集する',
    signInToSubmitTitle: 'ミニアプリを投稿するにはログインしてください',
    signInToSubmitBody: 'Googleでログインして始めましょう — 無料です。',
    appNameLabel: 'ミニアプリ名',
    appNameNote: 'アプリの名前は？',
    appNamePlaceholder: '例: 経費トラッカー',
    appDescriptionLabel: '説明',
    appDescriptionNote: 'どんなアプリ？',
    appDescriptionPlaceholder: '例: フリーランス向けの簡単な請求書管理ツール',
    appUrlLabel: 'アプリのURL',
    appUrlNote: 'どこで使えますか？',
    targetUsersLabel: '対象ユーザー',
    appTargetUsersNote: '誰のためのアプリ？',
    appTargetUsersPlaceholder: '例: 複数クライアントを抱えるフリーランス',
    appCategoryLabel: 'カテゴリ',
    appCategoryNote: 'このアプリに一番合うカテゴリは？',
    categoryAll: 'すべて',
    categoryProductivity: '習慣・タスク管理',
    categoryHealth: '健康・ウェルネス',
    categoryFinance: 'お金・投資',
    categoryLearning: '学習',
    categoryTravel: '旅行・お出かけ',
    categoryLifestyle: '暮らし・趣味',
    categoryTools: 'ツール・便利機能',
    builtForRequestLabel: '対応したリクエスト',
    builtForRequestNote: 'どのリクエストに応えるアプリですか？（任意）',
    requestSearchPlaceholder: 'リクエストを検索...',
    notLinkedOption: '— リクエストと紐付けない —',
    appSubmitNew: 'ミニアプリを投稿する',
    appSubmitSave: '変更を保存',

    yourAppsHeading: 'あなたのアプリ',
    yourAppsNote: 'あなたが投稿者として登録しているミニアプリです。下の一覧から直接、編集や削除もできます。',
    signInToSeeYourApps: 'ログインすると、あなたが投稿したミニアプリが表示されます。',
    noYourAppsYet: '投稿したアプリはここに表示され、あとから編集・削除できます。',

    profileDocTitle: 'プロフィール · CobbleWorks',
    profileHeading: 'プロフィール',
    profileSubtitle: '公開されるあなたの情報と、あなたが作ったミニアプリです。',
    signInToViewProfileTitle: 'プロフィールを見るにはログインしてください',
    signInToViewProfileBody: 'Googleでログインすると、あなたのプロフィールと作ったミニアプリが見られます。',
    portfolioHeading: 'ポートフォリオ',
    profileBioEmpty: '自己紹介はまだありません。',

    recentlyUsedHeading: '最近使ったアプリ',
    recentAppsEmpty: '開いたアプリがここに表示されます。',
    favoriteAppsHeading: 'お気に入り',
    favoriteAppsEmpty: 'アプリの星マークをタップすると、ここに表示されます。',
    addToFavoritesLabel: 'お気に入りに追加',
    removeFromFavoritesLabel: 'お気に入りから削除',
    popularAppsHeading: '人気のアプリ',
    popularAppsEmpty: 'まだ評価がありません。下でアプリを評価すると、人気アプリを見つけやすくなります！',

    miniAppsHeading: 'ミニアプリ',
    noAppsSearch: '該当する結果がありません。',
    noAppsYet: 'まだミニアプリがありません。上のリクエストに応えて作ってみましょう！',

    shareDataHeading: 'データを共有',
    shareDataNote: 'データはこのブラウザにのみ保存されています。ファイルとして書き出して友達に送れば、リクエストやミニアプリを見てもらえます。読み込み時は既存データと合体するだけで、上書きや削除はされません。',
    exportDataBtn: '⬇ データを書き出す',
    importDataBtn: '⬆ データを読み込む',

    toastBuiltForSelected: 'リクエストを選択しました — 下でミニアプリの詳細を入力してください',
    toastSignInToPost: 'リクエストを投稿するにはログインしてください',
    toastFillAllFields: 'すべての項目を入力してください',
    toastFailedPostRequest: 'リクエストの投稿に失敗しました',
    toastRequestPosted: 'リクエストを投稿しました！',
    toastSignInToSubmitApp: 'ミニアプリを投稿するにはログインしてください',
    alertInvalidUrl: '有効なhttp://またはhttps://のURLを入力してください。',
    toastFailedSaveApp: 'ミニアプリの保存に失敗しました',
    toastAppUpdated: 'ミニアプリを更新しました！',
    toastAppShared: 'ミニアプリを共有しました！',
    toastFailedDeleteRequest: 'リクエストの削除に失敗しました',
    toastRequestDeleted: 'リクエストを削除しました',
    toastSignInToVote: 'このリクエストに投票するにはログインしてください',
    toastSomethingWrong: '問題が発生しました',
    toastFailedDeleteApp: 'ミニアプリの削除に失敗しました',
    toastAppDeleted: 'ミニアプリを削除しました',
    toastSignInToRate: 'このアプリを評価するにはログインしてください',
    toastWriteCommentFirst: 'コメントを入力してください',
    toastCommentPosted: 'コメントを投稿しました！',
    toastDataExported: 'データを書き出しました！',
    toastImportInvalidJson: '読み込み失敗: 正しいJSONファイルではありません',
    toastImportBadFormat: '読み込み失敗: ファイル形式が想定と異なります',
    importedCounts: function (reqCount, appCount) { return reqCount + '件のリクエストと' + appCount + '件のアプリを読み込みました'; },

    desiredFeaturesLabel: '欲しい機能',
    sharedBy: function (name, date) { return name + 'さんが共有 · ' + date; },
    postedOn: function (date) { return date + 'に投稿'; },
    deleteRequestLabel: 'このリクエストを削除',
    confirmDeleteRequest: 'このリクエストを削除しますか？この操作は取り消せません。',
    wantActive: '⭐ 欲しいと思っています',
    wantInactive: '⭐ 私も欲しい',
    wantActiveTitle: 'クリックして投票を取り消す',
    wantCountOne: '⭐ 1人が欲しいと思っています',
    wantCountMany: function (n) { return '⭐ ' + n + '人が欲しいと思っています'; },
    buildThis: '🔨 これを作る',
    appsBuiltForLabel: 'このリクエストに応えたアプリ',
    maybeAlsoRelevant: '💡 こちらも関連するかも',
    currentWorkaroundLabel: '今の対処法',
    noExactMatches: '完全に一致する結果は見つかりませんでした。見つからない場合はリクエストを投稿してください。',
    noRequestsYet: 'まだリクエストがありません。最初の投稿をしてみましょう！',
    maybeLookingFor: 'もしかしてこちらをお探しですか...',
    prevPage: '← 前へ',
    nextPage: '次へ →',
    pageIndicator: function (page, total) { return page + ' / ' + total + ' ページ'; },

    edit: '編集',
    deleteAppAriaLabel: function (name) { return name + 'を削除'; },
    deleteAppTitle: 'このアプリを削除',
    confirmDeleteApp: function (name) { return '「' + name + '」を削除しますか？この操作は取り消せません。'; },

    starsOutOf5: function (avg) { return '5点満点中' + avg + '点'; },
    noRatingsYet: 'まだ評価がありません',
    ratingOne: function (avg) { return avg + '（評価1件）'; },
    ratingMany: function (avg, count) { return avg + '（評価' + count + '件）'; },
    yourRatingLabel: 'あなたの評価:',
    rateThisAppLabel: 'このアプリを評価:',
    starsAriaLabel: function (n) { return n + 'つ星'; },

    commentsToggle: function (count) { return '💬 コメント（' + count + '件）'; },
    noCommentsYet: 'まだコメントがありません。最初のフィードバックを送ってみましょう！',
    anonymous: '匿名',
    commentPlaceholder: '作者へのフィードバックを入力...',
    commentAriaLabel: 'コメント',
    commentNamePlaceholder: 'お名前（任意）',
    postComment: 'コメントを投稿',
    replyBtn: '返信',
    replyPlaceholder: '作者として返信...',
    replyAriaLabel: '返信',
    postReply: '返信を投稿',
    authorBadge: '作者',
    toastFailedPostComment: 'コメントの投稿に失敗しました',
  },
  es: {
    title: 'CobbleWorks',
    subtitle: 'Comparte un problema. Encuentra una mini app. O crea una.',
    howItWorksNote: 'Cómo funciona: alguien comparte un problema como una Solicitud, otra persona crea una Mini App gratuita para resolverlo, y cualquiera puede probarla.',
    signInWithGoogle: 'Iniciar sesión con Google',
    signOut: 'Cerrar sesión',
    editProfileTitle: 'Editar tu perfil',

    profileModalTitleOnboarding: 'Elige tu nombre de usuario',
    profileModalIntroOnboarding: 'Este es el nombre que aparece en tus solicitudes y mini apps.',
    profileModalTitleEdit: 'Editar tu perfil',
    profileModalIntroEdit: 'Actualiza el nombre y la imagen que aparecen en tus solicitudes y mini apps.',
    handleLabel: 'Nombre de usuario',
    handlePlaceholder: 'ej. ana_enfermera',
    avatarLabel: 'Imagen de avatar',
    avatarOptionalNote: 'Opcional — sube una foto (máx. 2MB)',
    languageLabel: 'Idioma',
    languageNote: 'Cambia el idioma usado en todas las mini apps de CobbleWorks.',
    save: 'Guardar',
    cancel: 'Cancelar',
    handleTooShort: 'El nombre de usuario debe tener al menos 3 caracteres.',
    handleInvalidChars: 'Solo se permiten letras, números y guiones bajos.',
    handleTaken: 'Ese nombre de usuario ya está en uso.',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
    avatarInvalidType: 'Elige un archivo de imagen.',
    avatarTooLarge: 'La imagen debe pesar 2MB o menos.',
    avatarUploadFailed: 'No se pudo subir la imagen. Inténtalo de nuevo.',
    bioLabel: 'Biografía',
    bioNote: 'Opcional — una breve introducción que se muestra en tu perfil (máx. 160 caracteres)',
    bioPlaceholder: 'Cuéntale a la gente un poco sobre ti',

    searchPlaceholder: 'Buscar solicitudes y mini apps...',
    searchButton: '🔍 Buscar solicitudes',
    browseAllLink: 'Ver todas las solicitudes →',
    requestsDocTitle: 'Solicitudes · CobbleWorks',
    requestsHeading: 'Solicitudes',
    requestsSubtitle: 'Explora lo que otras personas necesitan, o comparte lo tuyo.',
    submitRequestHeading: 'Publicar una Solicitud',
    signInToPostTitle: 'Inicia sesión para publicar una solicitud',
    problemLabel: 'Problema',
    problemNote: '¿Con qué tienes dificultades?',
    problemPlaceholder: 'ej. Pierdo mucho tiempo cambiando entre apps para llevar el control de facturas',
    desiredFeaturesNote: '¿Qué lo haría mejor?',
    desiredFeaturesPlaceholder: 'ej. Un panel simple para ver todas las facturas en un solo lugar',
    submitRequestBtn: 'Publicar solicitud',
    allRequestsHeading: 'Todas las Solicitudes',

    appFormTitleNew: 'Publicar una Mini App',
    appFormTitleEdit: 'Editar Mini App',
    signInToSubmitTitle: 'Inicia sesión para publicar una mini app',
    signInToSubmitBody: 'Inicia sesión con Google para empezar — es gratis.',
    appNameLabel: 'Nombre de la mini app',
    appNameNote: '¿Cómo se llama tu app?',
    appNamePlaceholder: 'ej. Control de Facturas',
    appDescriptionLabel: 'Descripción',
    appDescriptionNote: '¿Qué hace?',
    appDescriptionPlaceholder: 'ej. Una herramienta sencilla para llevar facturas de freelancers',
    appUrlLabel: 'URL de la app',
    appUrlNote: '¿Dónde pueden encontrarla?',
    targetUsersLabel: 'Usuarios objetivo',
    appTargetUsersNote: '¿Para quién es esta app?',
    appTargetUsersPlaceholder: 'ej. Freelancers que gestionan varios clientes',
    appCategoryLabel: 'Categoría',
    appCategoryNote: '¿Qué categoría encaja mejor con esta app?',
    categoryAll: 'Todas',
    categoryProductivity: 'Productividad y Hábitos',
    categoryHealth: 'Salud y Bienestar',
    categoryFinance: 'Finanzas y Dinero',
    categoryLearning: 'Aprendizaje',
    categoryTravel: 'Viajes y Lugares',
    categoryLifestyle: 'Vida y Aficiones',
    categoryTools: 'Herramientas y Utilidades',
    builtForRequestLabel: 'Creada para la solicitud',
    builtForRequestNote: '¿Qué solicitud responde esta app? (opcional)',
    requestSearchPlaceholder: 'Buscar solicitudes...',
    notLinkedOption: '— No vinculada a ninguna solicitud —',
    appSubmitNew: 'Publicar una mini app',
    appSubmitSave: 'Guardar cambios',

    yourAppsHeading: 'Tus Apps',
    yourAppsNote: 'Mini apps de las que eres propietario. También puedes editarlas o eliminarlas directamente desde la lista de abajo.',
    signInToSeeYourApps: 'Inicia sesión para ver las mini apps que has publicado.',
    noYourAppsYet: 'Las apps que publiques aparecerán aquí para que puedas editarlas o eliminarlas más adelante.',

    profileDocTitle: 'Perfil · CobbleWorks',
    profileHeading: 'Perfil',
    profileSubtitle: 'Tu información pública y las mini apps que has creado.',
    signInToViewProfileTitle: 'Inicia sesión para ver tu perfil',
    signInToViewProfileBody: 'Inicia sesión con Google para ver tu perfil y las mini apps que has creado.',
    portfolioHeading: 'Portafolio',
    profileBioEmpty: 'Todavía no hay biografía.',

    recentlyUsedHeading: 'Usadas recientemente',
    recentAppsEmpty: 'Las apps que abras aparecerán aquí.',
    favoriteAppsHeading: 'Favoritas',
    favoriteAppsEmpty: 'Toca la estrella de una app para añadirla aquí.',
    addToFavoritesLabel: 'Añadir a favoritas',
    removeFromFavoritesLabel: 'Quitar de favoritas',
    popularAppsHeading: 'Apps populares',
    popularAppsEmpty: 'Aún no hay valoraciones. ¡Valora una app para ayudar a otros a encontrar las más populares!',

    miniAppsHeading: 'Mini Apps',
    noAppsSearch: 'No se encontraron resultados.',
    noAppsYet: 'Aún no hay mini apps. ¡Crea una para alguna solicitud de arriba!',

    shareDataHeading: 'Compartir datos',
    shareDataNote: 'Los datos se guardan solo en este navegador. Expórtalos como archivo y envíalos a un amigo — podrá importarlos para ver tus solicitudes y mini apps. Importar combina los datos con los existentes — no se sobrescribe ni elimina nada.',
    exportDataBtn: '⬇ Exportar datos',
    importDataBtn: '⬆ Importar datos',

    toastBuiltForSelected: 'Solicitud seleccionada abajo — completa los detalles de la mini app',
    toastSignInToPost: 'Inicia sesión para publicar una solicitud',
    toastFillAllFields: 'Completa todos los campos',
    toastFailedPostRequest: 'No se pudo publicar la solicitud',
    toastRequestPosted: '¡Solicitud publicada!',
    toastSignInToSubmitApp: 'Inicia sesión para publicar una mini app',
    alertInvalidUrl: 'Introduce una URL válida que empiece por http:// o https://.',
    toastFailedSaveApp: 'No se pudo guardar la mini app',
    toastAppUpdated: '¡Mini app actualizada!',
    toastAppShared: '¡Mini app compartida!',
    toastFailedDeleteRequest: 'No se pudo eliminar la solicitud',
    toastRequestDeleted: 'Solicitud eliminada',
    toastSignInToVote: 'Inicia sesión para votar por esta solicitud',
    toastSomethingWrong: 'Algo salió mal',
    toastFailedDeleteApp: 'No se pudo eliminar la mini app',
    toastAppDeleted: 'Mini app eliminada',
    toastSignInToRate: 'Inicia sesión para valorar esta app',
    toastWriteCommentFirst: 'Escribe un comentario primero',
    toastCommentPosted: '¡Comentario publicado!',
    toastDataExported: '¡Datos exportados!',
    toastImportInvalidJson: 'Error al importar: el archivo no es un JSON válido',
    toastImportBadFormat: 'Error al importar: formato de archivo inesperado',
    importedCounts: function (reqCount, appCount) { return 'Se importaron ' + reqCount + ' solicitudes y ' + appCount + ' apps'; },

    desiredFeaturesLabel: 'Funciones deseadas',
    sharedBy: function (name, date) { return 'Compartido por ' + name + ' · ' + date; },
    postedOn: function (date) { return 'Publicado el ' + date; },
    deleteRequestLabel: 'Eliminar esta solicitud',
    confirmDeleteRequest: '¿Eliminar esta solicitud? Esta acción no se puede deshacer.',
    wantActive: '⭐ Quieres esto',
    wantInactive: '⭐ Yo también quiero esto',
    wantActiveTitle: 'Haz clic para quitar tu voto',
    wantCountOne: '⭐ A 1 persona le interesa esto',
    wantCountMany: function (n) { return '⭐ A ' + n + ' personas les interesa esto'; },
    buildThis: '🔨 Crear esta app',
    appsBuiltForLabel: 'Apps creadas para esta solicitud',
    maybeAlsoRelevant: '💡 Quizás también te interese',
    currentWorkaroundLabel: 'Solución actual',
    noExactMatches: 'No se encontraron coincidencias exactas. ¿No encuentras lo que buscas? Publica una solicitud.',
    noRequestsYet: '¡Aún no hay solicitudes. Sé el primero en publicar una!',
    maybeLookingFor: 'Quizás buscabas esto...',
    prevPage: '← Anterior',
    nextPage: 'Siguiente →',
    pageIndicator: function (page, total) { return 'Página ' + page + ' de ' + total; },

    edit: 'Editar',
    deleteAppAriaLabel: function (name) { return 'Eliminar ' + name; },
    deleteAppTitle: 'Eliminar esta app',
    confirmDeleteApp: function (name) { return '¿Eliminar "' + name + '"? Esta acción no se puede deshacer.'; },

    starsOutOf5: function (avg) { return avg + ' de 5 estrellas'; },
    noRatingsYet: 'Aún no hay valoraciones',
    ratingOne: function (avg) { return avg + ' (1 valoración)'; },
    ratingMany: function (avg, count) { return avg + ' (' + count + ' valoraciones)'; },
    yourRatingLabel: 'Tu valoración:',
    rateThisAppLabel: 'Valora esta app:',
    starsAriaLabel: function (n) { return n + ' estrellas'; },

    commentsToggle: function (count) { return '💬 Comentarios (' + count + ')'; },
    noCommentsYet: '¡Aún no hay comentarios. Sé el primero en dejar tu opinión!',
    anonymous: 'Anónimo',
    commentPlaceholder: 'Comparte tu opinión con el creador...',
    commentAriaLabel: 'Comentario',
    commentNamePlaceholder: 'Tu nombre (opcional)',
    postComment: 'Publicar comentario',
    replyBtn: 'Responder',
    replyPlaceholder: 'Responde como el creador...',
    replyAriaLabel: 'Responder',
    postReply: 'Publicar respuesta',
    authorBadge: 'Autor',
    toastFailedPostComment: 'Error al publicar el comentario',
  },
  zh: {
    title: 'CobbleWorks',
    subtitle: '分享一个问题，找到一个迷你应用。或者自己动手做一个。',
    howItWorksNote: '使用方法：有人将问题分享为"需求"，另一个人为它免费开发一个"迷你应用"，任何人都可以体验。',
    signInWithGoogle: '使用 Google 登录',
    signOut: '退出登录',
    editProfileTitle: '编辑个人资料',

    profileModalTitleOnboarding: '设置你的昵称',
    profileModalIntroOnboarding: '这是显示在你的需求和迷你应用上的名字。',
    profileModalTitleEdit: '编辑个人资料',
    profileModalIntroEdit: '更新显示在你的需求和迷你应用上的名字和头像。',
    handleLabel: '昵称',
    handlePlaceholder: '例如：xiao_hu_shi',
    avatarLabel: '头像图片',
    avatarOptionalNote: '可选 — 上传一张照片（最大 2MB）',
    languageLabel: '语言',
    languageNote: '更改 CobbleWorks 所有迷你应用使用的语言。',
    save: '保存',
    cancel: '取消',
    handleTooShort: '昵称至少需要 3 个字符。',
    handleInvalidChars: '只能使用字母、数字和下划线。',
    handleTaken: '该昵称已被使用。',
    genericError: '出了点问题，请重试。',
    avatarInvalidType: '请选择一个图片文件。',
    avatarTooLarge: '图片大小需为 2MB 以内。',
    avatarUploadFailed: '图片上传失败，请重试。',
    bioLabel: '简介',
    bioNote: '可选 — 显示在你个人主页上的简短介绍（最多160字）',
    bioPlaceholder: '简单介绍一下自己',

    searchPlaceholder: '搜索需求和迷你应用…',
    searchButton: '🔍 搜索需求',
    browseAllLink: '浏览所有需求 →',
    requestsDocTitle: '需求 · CobbleWorks',
    requestsHeading: '需求',
    requestsSubtitle: '看看大家都遇到了什么困扰，或者添加你自己的。',
    submitRequestHeading: '发布一个需求',
    signInToPostTitle: '登录后即可发布需求',
    problemLabel: '问题',
    problemNote: '你遇到了什么困扰？',
    problemPlaceholder: '例如：我要在多个应用间切换来管理发票，浪费了太多时间',
    desiredFeaturesNote: '怎样能让它变得更好？',
    desiredFeaturesPlaceholder: '例如：一个可以在同一处查看所有发票的简单仪表盘',
    submitRequestBtn: '发布需求',
    allRequestsHeading: '所有需求',

    appFormTitleNew: '发布一个迷你应用',
    appFormTitleEdit: '编辑迷你应用',
    signInToSubmitTitle: '登录后即可发布迷你应用',
    signInToSubmitBody: '使用 Google 登录即可开始 — 完全免费。',
    appNameLabel: '迷你应用名称',
    appNameNote: '你的应用叫什么名字？',
    appNamePlaceholder: '例如：发票追踪器',
    appDescriptionLabel: '描述',
    appDescriptionNote: '它能做什么？',
    appDescriptionPlaceholder: '例如：一个供自由职业者追踪发票的简单工具',
    appUrlLabel: '应用链接',
    appUrlNote: '大家可以在哪里找到它？',
    targetUsersLabel: '目标用户',
    appTargetUsersNote: '这个应用是给谁用的？',
    appTargetUsersPlaceholder: '例如：需要管理多个客户的自由职业者',
    appCategoryLabel: '分类',
    appCategoryNote: '这个应用最适合哪个分类？',
    categoryAll: '全部',
    categoryProductivity: '效率与习惯',
    categoryHealth: '健康与养生',
    categoryFinance: '财务与理财',
    categoryLearning: '学习',
    categoryTravel: '旅行与出行',
    categoryLifestyle: '生活与兴趣',
    categoryTools: '工具与实用功能',
    builtForRequestLabel: '对应的需求',
    builtForRequestNote: '这个应用回应的是哪个需求？（可选）',
    requestSearchPlaceholder: '搜索需求…',
    notLinkedOption: '— 不关联任何需求 —',
    appSubmitNew: '发布迷你应用',
    appSubmitSave: '保存修改',

    yourAppsHeading: '你的应用',
    yourAppsNote: '你以拥有者身份登录的迷你应用。你也可以在下面的列表中直接编辑或删除自己的应用。',
    signInToSeeYourApps: '登录后即可查看你发布过的迷你应用。',
    noYourAppsYet: '你发布的应用会显示在这里，方便之后编辑或删除。',

    profileDocTitle: '个人主页 · CobbleWorks',
    profileHeading: '个人主页',
    profileSubtitle: '你的公开信息，以及你发布的迷你应用。',
    signInToViewProfileTitle: '登录后即可查看你的个人主页',
    signInToViewProfileBody: '使用 Google 登录即可查看你的个人主页和已发布的迷你应用。',
    portfolioHeading: '作品集',
    profileBioEmpty: '暂无简介。',

    recentlyUsedHeading: '最近使用',
    recentAppsEmpty: '你打开过的应用会显示在这里。',
    favoriteAppsHeading: '收藏',
    favoriteAppsEmpty: '点击应用上的星标即可添加到这里。',
    addToFavoritesLabel: '添加到收藏',
    removeFromFavoritesLabel: '从收藏中移除',
    popularAppsHeading: '热门应用',
    popularAppsEmpty: '还没有评分。给下面的应用打个分，帮助其他人发现热门推荐！',

    miniAppsHeading: '迷你应用',
    noAppsSearch: '未找到相关结果。',
    noAppsYet: '还没有迷你应用。为上面的某个需求开发一个吧！',

    shareDataHeading: '共享数据',
    shareDataNote: '数据仅保存在这个浏览器中。将其导出为文件发给朋友 — 对方导入后即可查看你的需求和迷你应用。导入操作只会与现有数据合并 — 不会覆盖或删除任何内容。',
    exportDataBtn: '⬇ 导出数据',
    importDataBtn: '⬆ 导入数据',

    toastBuiltForSelected: '已在下方选择需求 — 请填写迷你应用的详情',
    toastSignInToPost: '请登录后再发布需求',
    toastFillAllFields: '请填写所有字段',
    toastFailedPostRequest: '发布需求失败',
    toastRequestPosted: '需求已发布！',
    toastSignInToSubmitApp: '请登录后再发布迷你应用',
    alertInvalidUrl: '请输入有效的 http:// 或 https:// 链接。',
    toastFailedSaveApp: '保存迷你应用失败',
    toastAppUpdated: '迷你应用已更新！',
    toastAppShared: '迷你应用已发布！',
    toastFailedDeleteRequest: '删除需求失败',
    toastRequestDeleted: '需求已删除',
    toastSignInToVote: '登录后即可为该需求投票',
    toastSomethingWrong: '出了点问题',
    toastFailedDeleteApp: '删除迷你应用失败',
    toastAppDeleted: '迷你应用已删除',
    toastSignInToRate: '登录后即可给这个应用评分',
    toastWriteCommentFirst: '请先输入评论内容',
    toastCommentPosted: '评论已发布！',
    toastDataExported: '数据已导出！',
    toastImportInvalidJson: '导入失败：不是有效的 JSON 文件',
    toastImportBadFormat: '导入失败：文件格式不符合要求',
    importedCounts: function (reqCount, appCount) { return '已导入 ' + reqCount + ' 条需求和 ' + appCount + ' 个应用'; },

    desiredFeaturesLabel: '期望的功能',
    sharedBy: function (name, date) { return name + ' 分享 · ' + date; },
    postedOn: function (date) { return '发布于 ' + date; },
    deleteRequestLabel: '删除这个需求',
    confirmDeleteRequest: '删除这个需求吗？此操作无法撤销。',
    wantActive: '⭐ 你想要这个',
    wantInactive: '⭐ 我也想要',
    wantActiveTitle: '点击取消你的投票',
    wantCountOne: '⭐ 1 人想要这个',
    wantCountMany: function (n) { return '⭐ ' + n + ' 人想要这个'; },
    buildThis: '🔨 开发这个',
    appsBuiltForLabel: '为该需求开发的应用',
    maybeAlsoRelevant: '💡 或许也相关',
    currentWorkaroundLabel: '目前的应对方法',
    noExactMatches: '未找到完全匹配的结果。没找到你需要的？发布一个需求吧。',
    noRequestsYet: '还没有需求。来做第一个发布的人吧！',
    maybeLookingFor: '你可能在找…',
    prevPage: '← 上一页',
    nextPage: '下一页 →',
    pageIndicator: function (page, total) { return '第 ' + page + ' / ' + total + ' 页'; },

    edit: '编辑',
    deleteAppAriaLabel: function (name) { return '删除 ' + name; },
    deleteAppTitle: '删除这个应用',
    confirmDeleteApp: function (name) { return '删除"' + name + '"吗？此操作无法撤销。'; },

    starsOutOf5: function (avg) { return '5 星中的 ' + avg + ' 星'; },
    noRatingsYet: '还没有评分',
    ratingOne: function (avg) { return avg + ' 分（1 条评分）'; },
    ratingMany: function (avg, count) { return avg + ' 分（' + count + ' 条评分）'; },
    yourRatingLabel: '你的评分：',
    rateThisAppLabel: '给这个应用评分：',
    starsAriaLabel: function (n) { return n + ' 星'; },

    commentsToggle: function (count) { return '💬 评论（' + count + '）'; },
    noCommentsYet: '还没有评论。来做第一个留言的人吧！',
    anonymous: '匿名用户',
    commentPlaceholder: '给创作者留言…',
    commentAriaLabel: '评论',
    commentNamePlaceholder: '你的名字（可选）',
    postComment: '发表评论',
    replyBtn: '回复',
    replyPlaceholder: '以创作者身份回复…',
    replyAriaLabel: '回复',
    postReply: '发表回复',
    authorBadge: '作者',
    toastFailedPostComment: '发表评论失败',
  },
  hi: {
    title: 'CobbleWorks',
    subtitle: 'एक समस्या साझा करें। एक मिनी ऐप खोजें। या खुद एक बनाएं।',
    howItWorksNote: 'यह कैसे काम करता है: कोई एक समस्या को "रिक्वेस्ट" के रूप में साझा करता है, कोई और उसके लिए एक मुफ़्त "मिनी ऐप" बनाता है, और कोई भी उसे आज़मा सकता है।',
    signInWithGoogle: 'Google से साइन इन करें',
    signOut: 'साइन आउट करें',
    editProfileTitle: 'अपनी प्रोफ़ाइल संपादित करें',

    profileModalTitleOnboarding: 'अपना हैंडल चुनें',
    profileModalIntroOnboarding: 'यह वह नाम है जो आपकी रिक्वेस्ट और मिनी ऐप्स पर दिखाया जाता है।',
    profileModalTitleEdit: 'अपनी प्रोफ़ाइल संपादित करें',
    profileModalIntroEdit: 'अपनी रिक्वेस्ट और मिनी ऐप्स पर दिखाए जाने वाले नाम और छवि को अपडेट करें।',
    handleLabel: 'हैंडल',
    handlePlaceholder: 'जैसे: raj_nurse',
    avatarLabel: 'अवतार छवि',
    avatarOptionalNote: 'वैकल्पिक — एक फ़ोटो अपलोड करें (अधिकतम 2MB)',
    languageLabel: 'भाषा',
    languageNote: 'CobbleWorks के सभी मिनी ऐप्स में इस्तेमाल होने वाली भाषा बदलता है।',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    handleTooShort: 'हैंडल कम से कम 3 अक्षरों का होना चाहिए।',
    handleInvalidChars: 'केवल अक्षर, संख्याएँ और अंडरस्कोर की अनुमति है।',
    handleTaken: 'यह हैंडल पहले से इस्तेमाल हो रहा है।',
    genericError: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    avatarInvalidType: 'कृपया एक इमेज फ़ाइल चुनें।',
    avatarTooLarge: 'इमेज 2MB या उससे छोटी होनी चाहिए।',
    avatarUploadFailed: 'इमेज अपलोड नहीं हो पाई। कृपया फिर से कोशिश करें।',
    bioLabel: 'बायो',
    bioNote: 'वैकल्पिक — आपकी प्रोफ़ाइल पर दिखने वाला एक छोटा परिचय (अधिकतम 160 अक्षर)',
    bioPlaceholder: 'अपने बारे में थोड़ा बताएं',

    searchPlaceholder: 'रिक्वेस्ट और मिनी ऐप्स खोजें...',
    searchButton: '🔍 रिक्वेस्ट खोजें',
    browseAllLink: 'सभी रिक्वेस्ट देखें →',
    requestsDocTitle: 'रिक्वेस्ट · CobbleWorks',
    requestsHeading: 'रिक्वेस्ट',
    requestsSubtitle: 'देखें कि लोग किन समस्याओं से जूझ रहे हैं, या अपनी समस्या जोड़ें।',
    submitRequestHeading: 'एक रिक्वेस्ट सबमिट करें',
    signInToPostTitle: 'रिक्वेस्ट पोस्ट करने के लिए साइन इन करें',
    problemLabel: 'समस्या',
    problemNote: 'आप किस चीज़ से जूझ रहे हैं?',
    problemPlaceholder: 'जैसे: चालानों को ट्रैक करने के लिए मुझे कई ऐप्स के बीच बहुत समय बदलना पड़ता है',
    desiredFeaturesNote: 'इसे बेहतर क्या बनाएगा?',
    desiredFeaturesPlaceholder: 'जैसे: सभी चालानों को एक ही जगह ट्रैक करने के लिए एक सरल डैशबोर्ड',
    submitRequestBtn: 'रिक्वेस्ट सबमिट करें',
    allRequestsHeading: 'सभी रिक्वेस्ट',

    appFormTitleNew: 'एक मिनी ऐप सबमिट करें',
    appFormTitleEdit: 'मिनी ऐप संपादित करें',
    signInToSubmitTitle: 'मिनी ऐप सबमिट करने के लिए साइन इन करें',
    signInToSubmitBody: 'शुरू करने के लिए Google से साइन इन करें — मुफ़्त में।',
    appNameLabel: 'मिनी ऐप का नाम',
    appNameNote: 'आपके ऐप का नाम क्या है?',
    appNamePlaceholder: 'जैसे: इनवॉइस ट्रैकर',
    appDescriptionLabel: 'विवरण',
    appDescriptionNote: 'यह क्या करता है?',
    appDescriptionPlaceholder: 'जैसे: फ्रीलांसरों के लिए चालान ट्रैक करने का एक सरल टूल',
    appUrlLabel: 'ऐप URL',
    appUrlNote: 'लोग इसे कहाँ पा सकते हैं?',
    targetUsersLabel: 'लक्षित उपयोगकर्ता',
    appTargetUsersNote: 'यह ऐप किसके लिए है?',
    appTargetUsersPlaceholder: 'जैसे: कई क्लाइंट्स को संभालने वाले फ्रीलांसर',
    appCategoryLabel: 'श्रेणी',
    appCategoryNote: 'इस ऐप के लिए कौन सी श्रेणी सबसे उपयुक्त है?',
    categoryAll: 'सभी',
    categoryProductivity: 'उत्पादकता और आदतें',
    categoryHealth: 'स्वास्थ्य और कल्याण',
    categoryFinance: 'वित्त और पैसा',
    categoryLearning: 'सीखना',
    categoryTravel: 'यात्रा और स्थान',
    categoryLifestyle: 'जीवनशैली और शौक',
    categoryTools: 'टूल्स और उपयोगिताएँ',
    builtForRequestLabel: 'इस रिक्वेस्ट के लिए बनाया गया',
    builtForRequestNote: 'यह ऐप किस रिक्वेस्ट का जवाब देता है? (वैकल्पिक)',
    requestSearchPlaceholder: 'रिक्वेस्ट खोजें...',
    notLinkedOption: '— किसी रिक्वेस्ट से लिंक नहीं —',
    appSubmitNew: 'एक मिनी ऐप सबमिट करें',
    appSubmitSave: 'बदलाव सेव करें',

    yourAppsHeading: 'आपके ऐप्स',
    yourAppsNote: 'वे मिनी ऐप्स जिनके मालिक के रूप में आप साइन इन हैं। आप नीचे दी गई सूची से सीधे अपने ऐप्स संपादित या हटा भी सकते हैं।',
    signInToSeeYourApps: 'आपके द्वारा सबमिट किए गए मिनी ऐप्स देखने के लिए साइन इन करें।',
    noYourAppsYet: 'आपके द्वारा सबमिट किए गए ऐप्स यहाँ दिखेंगे ताकि आप उन्हें बाद में संपादित या हटा सकें।',

    profileDocTitle: 'प्रोफ़ाइल · CobbleWorks',
    profileHeading: 'प्रोफ़ाइल',
    profileSubtitle: 'आपकी सार्वजनिक जानकारी और आपके बनाए मिनी ऐप्स।',
    signInToViewProfileTitle: 'अपनी प्रोफ़ाइल देखने के लिए साइन इन करें',
    signInToViewProfileBody: 'अपनी प्रोफ़ाइल और बनाए गए मिनी ऐप्स देखने के लिए Google से साइन इन करें।',
    portfolioHeading: 'पोर्टफ़ोलियो',
    profileBioEmpty: 'अभी तक कोई बायो नहीं है।',

    recentlyUsedHeading: 'हाल ही में इस्तेमाल किए गए',
    recentAppsEmpty: 'आपके द्वारा खोले गए ऐप्स यहाँ दिखेंगे।',
    favoriteAppsHeading: 'पसंदीदा',
    favoriteAppsEmpty: 'किसी ऐप को यहाँ जोड़ने के लिए स्टार पर टैप करें।',
    addToFavoritesLabel: 'पसंदीदा में जोड़ें',
    removeFromFavoritesLabel: 'पसंदीदा से हटाएं',
    popularAppsHeading: 'लोकप्रिय ऐप्स',
    popularAppsEmpty: 'अभी तक कोई रेटिंग नहीं है। दूसरों को लोकप्रिय ऐप्स ढूंढने में मदद करने के लिए नीचे किसी ऐप को रेट करें!',

    miniAppsHeading: 'मिनी ऐप्स',
    noAppsSearch: 'कोई परिणाम नहीं मिला।',
    noAppsYet: 'अभी तक कोई मिनी ऐप नहीं है। ऊपर किसी रिक्वेस्ट के लिए एक बनाएं!',

    shareDataHeading: 'डेटा साझा करें',
    shareDataNote: 'डेटा केवल इस ब्राउज़र में सेव होता है। इसे फ़ाइल के रूप में एक्सपोर्ट करके किसी दोस्त को भेजें — वे इसे इंपोर्ट करके आपकी रिक्वेस्ट और मिनी ऐप्स देख सकते हैं। इंपोर्ट करने पर मौजूदा डेटा के साथ मर्ज हो जाता है — कुछ भी ओवरराइट या डिलीट नहीं होता।',
    exportDataBtn: '⬇ डेटा एक्सपोर्ट करें',
    importDataBtn: '⬆ डेटा इंपोर्ट करें',

    toastBuiltForSelected: 'नीचे रिक्वेस्ट चुनी गई — मिनी ऐप का विवरण भरें',
    toastSignInToPost: 'रिक्वेस्ट पोस्ट करने के लिए कृपया साइन इन करें',
    toastFillAllFields: 'कृपया सभी फ़ील्ड भरें',
    toastFailedPostRequest: 'रिक्वेस्ट पोस्ट करने में विफल',
    toastRequestPosted: 'रिक्वेस्ट पोस्ट हो गई!',
    toastSignInToSubmitApp: 'मिनी ऐप सबमिट करने के लिए कृपया साइन इन करें',
    alertInvalidUrl: 'कृपया एक मान्य http:// या https:// URL दर्ज करें।',
    toastFailedSaveApp: 'मिनी ऐप सेव करने में विफल',
    toastAppUpdated: 'मिनी ऐप अपडेट हो गया!',
    toastAppShared: 'मिनी ऐप साझा हो गया!',
    toastFailedDeleteRequest: 'रिक्वेस्ट हटाने में विफल',
    toastRequestDeleted: 'रिक्वेस्ट हटा दी गई',
    toastSignInToVote: 'इस रिक्वेस्ट को वोट देने के लिए साइन इन करें',
    toastSomethingWrong: 'कुछ गड़बड़ हो गई',
    toastFailedDeleteApp: 'मिनी ऐप हटाने में विफल',
    toastAppDeleted: 'मिनी ऐप हटा दिया गया',
    toastSignInToRate: 'इस ऐप को रेट करने के लिए साइन इन करें',
    toastWriteCommentFirst: 'कृपया पहले एक टिप्पणी लिखें',
    toastCommentPosted: 'टिप्पणी पोस्ट हो गई!',
    toastDataExported: 'डेटा एक्सपोर्ट हो गया!',
    toastImportInvalidJson: 'इंपोर्ट विफल: मान्य JSON फ़ाइल नहीं है',
    toastImportBadFormat: 'इंपोर्ट विफल: अप्रत्याशित फ़ाइल फ़ॉर्मेट',
    importedCounts: function (reqCount, appCount) { return reqCount + ' रिक्वेस्ट और ' + appCount + ' ऐप्स इंपोर्ट किए गए'; },

    desiredFeaturesLabel: 'चाहे गए फ़ीचर',
    sharedBy: function (name, date) { return name + ' द्वारा साझा · ' + date; },
    postedOn: function (date) { return date + ' को पोस्ट किया गया'; },
    deleteRequestLabel: 'इस रिक्वेस्ट को हटाएं',
    confirmDeleteRequest: 'इस रिक्वेस्ट को हटाएं? इसे वापस नहीं लाया जा सकता।',
    wantActive: '⭐ आप इसे चाहते हैं',
    wantInactive: '⭐ मुझे भी यह चाहिए',
    wantActiveTitle: 'अपना वोट हटाने के लिए क्लिक करें',
    wantCountOne: '⭐ 1 व्यक्ति को यह चाहिए',
    wantCountMany: function (n) { return '⭐ ' + n + ' लोगों को यह चाहिए'; },
    buildThis: '🔨 इसे बनाएं',
    appsBuiltForLabel: 'इस रिक्वेस्ट के लिए बनाए गए ऐप्स',
    maybeAlsoRelevant: '💡 यह भी काम का हो सकता है',
    currentWorkaroundLabel: 'फ़िलहाल का उपाय',
    noExactMatches: 'कोई सटीक मैच नहीं मिला। जो चाहिए वह नहीं मिल रहा? एक रिक्वेस्ट सबमिट करें।',
    noRequestsYet: 'अभी तक कोई रिक्वेस्ट नहीं है। सबसे पहले सबमिट करने वाले बनें!',
    maybeLookingFor: 'शायद आप यह ढूंढ रहे हैं...',
    prevPage: '← पिछला',
    nextPage: 'अगला →',
    pageIndicator: function (page, total) { return 'पेज ' + page + ' / ' + total; },

    edit: 'संपादित करें',
    deleteAppAriaLabel: function (name) { return name + ' हटाएं'; },
    deleteAppTitle: 'इस ऐप को हटाएं',
    confirmDeleteApp: function (name) { return '"' + name + '" को हटाएं? इसे वापस नहीं लाया जा सकता।'; },

    starsOutOf5: function (avg) { return '5 में से ' + avg + ' स्टार'; },
    noRatingsYet: 'अभी तक कोई रेटिंग नहीं है',
    ratingOne: function (avg) { return avg + ' (1 रेटिंग)'; },
    ratingMany: function (avg, count) { return avg + ' (' + count + ' रेटिंग)'; },
    yourRatingLabel: 'आपकी रेटिंग:',
    rateThisAppLabel: 'इस ऐप को रेट करें:',
    starsAriaLabel: function (n) { return n + ' स्टार'; },

    commentsToggle: function (count) { return '💬 टिप्पणियाँ (' + count + ')'; },
    noCommentsYet: 'अभी तक कोई टिप्पणी नहीं है। सबसे पहले फीडबैक देने वाले बनें!',
    anonymous: 'अज्ञात',
    commentPlaceholder: 'क्रिएटर के साथ फीडबैक साझा करें...',
    commentAriaLabel: 'टिप्पणी',
    commentNamePlaceholder: 'आपका नाम (वैकल्पिक)',
    postComment: 'टिप्पणी पोस्ट करें',
    replyBtn: 'जवाब दें',
    replyPlaceholder: 'क्रिएटर के रूप में जवाब दें...',
    replyAriaLabel: 'जवाब',
    postReply: 'जवाब पोस्ट करें',
    authorBadge: 'लेखक',
    toastFailedPostComment: 'टिप्पणी पोस्ट करने में विफल',
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es' || stored === 'zh' || stored === 'hi') ? stored : 'en';
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
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-title');
    if (t[key]) el.title = t[key];
  });
}

let editingAppId = null; // 編集中のミニアプリのID（新規投稿中はnull）
let selectedCategory = 'all'; // Mini Apps一覧のカテゴリ絞り込み（チップで切り替える）

// カテゴリのスラッグ → 表示ラベル（現在の言語）の対応
const CATEGORY_LABEL_KEYS = {
  productivity: 'categoryProductivity',
  health: 'categoryHealth',
  finance: 'categoryFinance',
  learning: 'categoryLearning',
  travel: 'categoryTravel',
  lifestyle: 'categoryLifestyle',
  tools: 'categoryTools'
};

function categoryLabel(category) {
  const key = CATEGORY_LABEL_KEYS[category];
  return key ? t[key] : '';
}

// Supabaseから読み込んだ一覧をここに保持する（Phase 1：読み取りのみSupabase化）
let cachedRequests = [];
let cachedApps = [];
let cachedWants = []; // { requestId, userId }
let cachedRatings = []; // { appId, userId, stars }
let cachedComments = []; // { id, appId, userId, authorName, text, replyToId, createdAt }

// リクエスト一覧のページ送り用の状態
const REQUESTS_PAGE_SIZE = 30;
let requestsPage = 1;
let lastRequestsQuery = null; // 検索文字列が変わったときだけ1ページ目に戻すために使う

// Mini Apps一覧のページ送り用の状態
const MINI_APPS_PAGE_SIZE = 20;
let appsPage = 1;
let lastAppsQuery = null; // 検索文字列 or カテゴリが変わったときだけ1ページ目に戻すために使う
let lastAppsCategory = null;

// ユーザー入力の自由記述（problem/desired_features/target_users等）を、選択中の言語の翻訳列があればそちらを、
// なければ英語の原文にフォールバックして返す。アプリ名(name)は対象外（ブランド名として扱う）
function pickLocalized(row, field) {
  const lang = getLang();
  if (lang === 'en') return row[field];
  return row[field + '_' + lang] || row[field];
}

// requests / mini_apps をSupabaseから取得し、cachedRequests / cachedAppsを更新する
async function loadSharedData() {
  const { data: requestRows, error: requestError } = await supabaseClient
    .from('requests')
    .select('*, profiles!requests_owner_id_fkey(handle)')
    .order('created_at', { ascending: true });

  if (requestError) {
    console.error('Failed to load requests from Supabase:', requestError.message);
    cachedRequests = [];
  } else {
    cachedRequests = (requestRows || []).map(function (row) {
      return {
        id: row.id,
        problem: pickLocalized(row, 'problem'),
        desiredFeatures: pickLocalized(row, 'desired_features'),
        targetUsers: pickLocalized(row, 'target_users'),
        currentWorkaround: pickLocalized(row, 'current_workaround'),
        createdAt: new Date(row.created_at).toLocaleDateString('en-US'),
        ownerId: row.owner_id,
        postedBy: row.profiles ? row.profiles.handle : null
      };
    });
  }

  const { data: appRows, error: appError } = await supabaseClient
    .from('mini_apps')
    .select('*, profiles!mini_apps_owner_id_fkey(handle)')
    .order('created_at', { ascending: true });

  if (appError) {
    console.error('Failed to load mini apps from Supabase:', appError.message);
    cachedApps = [];
  } else {
    cachedApps = (appRows || []).map(function (row) {
      return {
        id: row.id,
        name: row.name,
        description: pickLocalized(row, 'description'),
        url: row.url,
        targetUsers: pickLocalized(row, 'target_users'),
        category: row.category || 'lifestyle',
        builtForRequestId: row.built_for_request_id,
        createdAt: new Date(row.created_at).toLocaleDateString('en-US'),
        ownerId: row.owner_id,
        postedBy: row.profiles ? row.profiles.handle : null
      };
    });
  }

  const { data: wantRows, error: wantError } = await supabaseClient
    .from('wants')
    .select('request_id, user_id');

  if (wantError) {
    console.error('Failed to load wants from Supabase:', wantError.message);
    cachedWants = [];
  } else {
    cachedWants = (wantRows || []).map(function (row) {
      return { requestId: row.request_id, userId: row.user_id };
    });
  }

  const { data: ratingRows, error: ratingError } = await supabaseClient
    .from('ratings')
    .select('app_id, user_id, stars');

  if (ratingError) {
    console.error('Failed to load ratings from Supabase:', ratingError.message);
    cachedRatings = [];
  } else {
    cachedRatings = (ratingRows || []).map(function (row) {
      return { appId: row.app_id, userId: row.user_id, stars: row.stars };
    });
  }

  await loadComments();
}

// アプリへのコメント(および作者からの返信)をSupabaseから読み込み、cachedCommentsを更新する
async function loadComments() {
  const { data: commentRows, error: commentError } = await supabaseClient
    .from('app_comments')
    .select('id, app_id, user_id, author_name, text, reply_to_id, created_at, profiles(handle)')
    .order('created_at', { ascending: true });

  if (commentError) {
    console.error('Failed to load comments from Supabase:', commentError.message);
    return;
  }

  cachedComments = (commentRows || []).map(function (row) {
    return {
      id: row.id,
      appId: row.app_id,
      userId: row.user_id,
      // 名前欄に入力があればそちらを優先(匿名投稿の従来通りの見た目を保つ)、
      // 無ければログイン中ユーザーのハンドル名にフォールバックする(返信は名前欄が無いので常にこちら)。
      authorName: row.author_name || (row.profiles ? row.profiles.handle : null),
      text: row.text,
      replyToId: row.reply_to_id,
      createdAt: new Date(row.created_at).toLocaleDateString('en-US')
    };
  });
}

// ログインユーザーが、この投稿を編集・削除できるか（本人の投稿、または管理者）
function canManage(row) {
  if (!currentUser) return false;
  if (currentProfile && currentProfile.is_admin) return true;
  return String(row.ownerId) === String(currentUser.id);
}

// ログイン状態に応じて、投稿フォームの表示/非表示・一覧の再描画をまとめて行う
function updateAuthDependentUI() {
  const requestForm = document.getElementById('requestForm');
  const requestSignInPrompt = document.getElementById('requestSignInPrompt');
  if (requestForm && requestSignInPrompt) {
    requestForm.hidden = !currentUser;
    requestSignInPrompt.hidden = !!currentUser;
  }

  const appForm = document.getElementById('appForm');
  const appSignInPrompt = document.getElementById('appSignInPrompt');
  if (appForm && appSignInPrompt) {
    appForm.hidden = !currentUser;
    appSignInPrompt.hidden = !!currentUser;
  }

  const searchField = document.getElementById('searchInput');
  const query = searchField ? searchField.value.trim() : '';
  renderRequests(query);
  renderApps(query);
  renderYourApps();
  renderProfilePage();
}

// ===========================
// あいまい検索（"Maybe you're looking for..."）
// ===========================

// 意味が近い言葉のグループ。ここに配列を足せば同義語を追加できる。
const SYNONYM_GROUPS = [
  ['shift', 'schedule', 'roster'],
  ['log', 'track', 'record', 'note'],
  ['reminder', 'remind', 'notify', 'notification', 'alert'],
  ['money', 'budget', 'expense', 'expenses', 'spending', 'cost'],
  ['sleep', 'rest', 'nap', 'break'],
  ['medication', 'medicine', 'prescription', 'drug', 'dosage'],
  ['patient', 'care'],
  ['training', 'study', 'learning', 'education', 'course'],
  ['coworker', 'colleague', 'staff', 'team'],
  ['deadline', 'due'],
  ['checklist', 'list', 'todo'],
  ['health', 'wellness', 'wellbeing'],
  ['stress', 'anxiety', 'mental'],
  ['overtime', 'hours', 'pay', 'salary', 'income'],
  ['swap', 'exchange', 'change'],
  ['parking', 'car'],
  ['transfer', 'move', 'relocation'],
  ['incident', 'report'],
  ['feelings', 'emotion', 'mood'],
];

// 単語 → 同義語グループ番号 の対応表（毎回配列を全探索しなくて済むようにする）
const SYNONYM_LOOKUP = {};
SYNONYM_GROUPS.forEach(function (group, index) {
  group.forEach(function (word) {
    SYNONYM_LOOKUP[word] = index;
  });
});

// レーベンシュタイン距離：2つの単語の違い（入れ替え・追加・削除が何回必要か）を数える
function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix.push([i]);
  }
  for (let j = 0; j < cols; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置き換え
          matrix[i][j - 1] + 1, // 追加
          matrix[i - 1][j] + 1 // 削除
        );
      }
    }
  }
  return matrix[rows - 1][cols - 1];
}

// 2つの単語が「関連している」と言えるかどうかを判定する
function wordsAreRelated(wordA, wordB) {
  if (wordA === wordB) return true;

  // 片方がもう片方を含む場合（例: shift / shifts、schedule / scheduling）
  if (wordA.length >= 4 && wordB.length >= 4 && (wordA.includes(wordB) || wordB.includes(wordA))) {
    return true;
  }

  // 同義語リストで同じグループに入っている場合
  if (SYNONYM_LOOKUP[wordA] !== undefined && SYNONYM_LOOKUP[wordA] === SYNONYM_LOOKUP[wordB]) {
    return true;
  }

  // スペルがかなり近い場合（短い単語ほど厳しく判定する）
  const maxDistance = wordA.length <= 4 || wordB.length <= 4 ? 1 : 2;
  return levenshteinDistance(wordA, wordB) <= maxDistance;
}

// テキストを検索用の単語配列に分解する（2文字以下のノイズ単語は除く）
function toSearchWords(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(function (word) { return word.length >= 3; });
}

// クエリの単語のうち、リクエストの単語と関連するものがいくつあるかをスコアにする
function fuzzyMatchScore(request, queryWords) {
  const requestWords = toSearchWords(
    [request.problem, request.desiredFeatures, request.targetUsers, request.currentWorkaround].join(' ')
  );

  let matchedCount = 0;
  queryWords.forEach(function (qWord) {
    const hasMatch = requestWords.some(function (rWord) { return wordsAreRelated(qWord, rWord); });
    if (hasMatch) matchedCount++;
  });

  return matchedCount;
}

// 完全一致で0件だったときに、関連度が高い順にリクエストを提案する（最大5件）
function findFuzzySuggestions(query) {
  const queryWords = toSearchWords(query);
  if (queryWords.length === 0) return [];

  return getRequests()
    .map(function (request) { return { request: request, score: fuzzyMatchScore(request, queryWords) }; })
    .filter(function (entry) { return entry.score > 0; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 5)
    .map(function (entry) { return entry.request; });
}

// アプリのサジェストでは、タイポ許容（レーベンシュタイン距離）までは使わない。
// 6文字同士だと距離2まで許容されてしまい、例えば"travel"と"trader"のような
// 無関係な単語まで一致扱いになってしまうため（wordsAreRelatedより厳しい判定）。
function appWordMatches(qWord, aWord) {
  if (qWord === aWord) return true;
  if (qWord.length >= 4 && aWord.length >= 4 && (qWord.includes(aWord) || aWord.includes(qWord))) return true;
  if (SYNONYM_LOOKUP[qWord] !== undefined && SYNONYM_LOOKUP[qWord] === SYNONYM_LOOKUP[aWord]) return true;
  return false;
}

// 入力ワードとミニアプリの関連度を数える（名前・説明・対象ユーザー・カテゴリ名を対象にする）
function fuzzyMatchScoreApp(app, queryWords) {
  const appWords = toSearchWords(
    [app.name, app.description, app.targetUsers, categoryLabel(app.category)].join(' ')
  );

  let matchedCount = 0;
  queryWords.forEach(function (qWord) {
    const hasMatch = appWords.some(function (aWord) { return appWordMatches(qWord, aWord); });
    if (hasMatch) matchedCount++;
  });

  return matchedCount;
}

// 検索欄に入力するたびに、関連度が高い順にミニアプリを最大5件だけ提案する（Googleのサジェストのようなもの）
function findAppSuggestions(query) {
  const queryWords = toSearchWords(query);
  if (queryWords.length === 0) return [];

  return getApps()
    .map(function (app) { return { app: app, score: fuzzyMatchScoreApp(app, queryWords) }; })
    .filter(function (entry) { return entry.score > 0; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 5)
    .map(function (entry) { return entry.app; });
}

function hideAppSuggestions() {
  const box = document.getElementById('appSuggestions');
  if (box) box.hidden = true;
}

function renderAppSuggestions(query) {
  const box = document.getElementById('appSuggestions');
  if (!box) return; // このページに検索欄が無ければ何もしない

  const trimmed = (query || '').trim();
  if (!trimmed) {
    box.hidden = true;
    return;
  }

  const suggestions = findAppSuggestions(trimmed);
  box.innerHTML = '';

  if (suggestions.length === 0) {
    box.hidden = true;
    return;
  }

  suggestions.forEach(function (app) {
    const item = document.createElement('a');
    item.className = 'app-suggestion-item';
    if (isSafeUrl(app.url)) {
      item.href = app.url;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    }
    item.addEventListener('click', function () {
      recordAppView(app.id);
      renderRecentApps();
      hideAppSuggestions();
    });

    const name = document.createElement('span');
    name.className = 'app-suggestion-name';
    name.textContent = app.name;

    const category = document.createElement('span');
    category.className = 'app-suggestion-category';
    category.textContent = categoryLabel(app.category);

    const desc = document.createElement('span');
    desc.className = 'app-suggestion-desc';
    desc.textContent = app.description;

    item.appendChild(name);
    item.appendChild(category);
    item.appendChild(desc);
    box.appendChild(item);
  });

  box.hidden = false;
}

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', async function () {
  applyStaticTranslations();

  // トップページの検索欄から遷移してきた場合、URLのqパラメータを検索欄に反映する
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const searchField = document.getElementById('searchInput');
  if (searchField && initialQuery) {
    searchField.value = initialQuery;
  }

  // 一覧を描画する前に、Supabaseからrequests/mini_appsを読み込んでおく
  await loadSharedData();

  renderRequests(initialQuery);
  populateRequestDropdown();
  renderApps(initialQuery);
  renderYourApps();
  renderRecentApps();
  renderFavoriteApps();
  renderPopularApps();
  updateAuthDependentUI(); // ログイン状態に応じてフォームの出し分け・一覧を再度反映する

  const cancelAppEditBtn = document.getElementById('cancelAppEditBtn');
  if (cancelAppEditBtn) cancelAppEditBtn.addEventListener('click', cancelEditApp);

  // 「Build this」で別ページから遷移してきた場合、そのリクエストを選択状態にする
  const builtForId = urlParams.get('builtFor');
  const builtForSelect = document.getElementById('builtForRequest');
  if (builtForId && builtForSelect) {
    builtForSelect.value = builtForId;
    const appFormSection = document.getElementById('app-form-section');
    if (appFormSection) appFormSection.scrollIntoView({ behavior: 'smooth' });
    const appNameInput = document.getElementById('appName');
    if (appNameInput) appNameInput.focus({ preventScroll: true });
    showToast(t.toastBuiltForSelected);
  }

  // 名前欄は毎回空欄にしておく（同じ端末を複数人で使うため、前回の名前は自動入力しない）
  // 覚えている名前はrenderYourApps()の「自分のアプリ」判定にのみ使う

  // 検索欄への入力をリアルタイムで監視する（そのページに無い一覧は関数側で何もしない）
  if (searchField) {
    searchField.addEventListener('input', function () {
      const query = this.value.trim();
      renderRequests(query);
      renderApps(query);
      renderAppSuggestions(query);
    });
    searchField.addEventListener('focus', function () {
      renderAppSuggestions(this.value.trim());
    });
    searchField.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideAppSuggestions();
    });
    renderAppSuggestions(initialQuery);
  }

  // 検索欄の外をクリックしたら、サジェストの候補は閉じる
  document.addEventListener('click', function (e) {
    const form = document.getElementById('searchForm');
    if (form && !form.contains(e.target)) hideAppSuggestions();
  });

  // カテゴリチップ：押したカテゴリだけMini Apps一覧に表示する
  const categoryFilters = document.getElementById('categoryFilters');
  if (categoryFilters) {
    categoryFilters.addEventListener('click', function (e) {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      selectedCategory = chip.dataset.category;
      categoryFilters.querySelectorAll('.category-chip').forEach(function (btn) {
        btn.classList.toggle('category-chip--active', btn === chip);
      });
      renderApps(searchField ? searchField.value.trim() : '');
    });
  }

  // タイポ自動修正を、自由入力の欄に付ける
  ['problem', 'desiredFeatures', 'appName', 'appDescription', 'appTargetUsers'].forEach(function (id) {
    enableAutoCorrect(document.getElementById(id));
  });

  // エクスポート／インポート（トップページのみ）
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', function () {
      importFile.click();
    });
    importFile.addEventListener('change', function () {
      if (this.files.length > 0) {
        importData(this.files[0]);
        this.value = ''; // 同じファイルをもう一度選べるようにリセット
      }
    });
  }
});

// =====================
// リクエスト関連
// =====================

// requestFormはリクエストページにしか無いので、存在するときだけ登録する
const requestFormEl = document.getElementById('requestForm');
if (requestFormEl) requestFormEl.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!currentUser) {
    showToast(t.toastSignInToPost);
    return;
  }

  const problem = document.getElementById('problem').value.trim();
  const desiredFeatures = document.getElementById('desiredFeatures').value.trim();

  // 空白だけの入力はrequired属性をすり抜けるので、trim後にチェックする
  if (!problem || !desiredFeatures) {
    showToast(t.toastFillAllFields);
    return;
  }

  const error = await saveRequest({ problem: problem, desiredFeatures: desiredFeatures });
  if (error) {
    console.error('Failed to save request:', error.message);
    showToast(t.toastFailedPostRequest);
    return;
  }

  await loadSharedData();
  renderRequests();
  populateRequestDropdown();
  this.reset();
  showToast(t.toastRequestPosted);
});

async function saveRequest(request) {
  const { error } = await supabaseClient.from('requests').insert({
    problem: request.problem,
    desired_features: request.desiredFeatures,
    owner_id: currentUser.id
  });
  return error;
}

function getRequests() {
  // コピーを返す。参照をそのまま返すと、呼び出し側の一時的な操作が
  // Supabaseから読み込んだキャッシュ自体を書き換えてしまうため。
  return cachedRequests.slice();
}

// リクエストを削除する（本人の投稿か管理者でなければ、RLSがサーバー側で拒否する）
// 紐づくwantsはDB側の外部キー（on delete cascade）で自動的に一緒に消える
async function deleteRequest(id) {
  const { error } = await supabaseClient.from('requests').delete().eq('id', id);
  return error;
}

// http/https以外のURL（javascript: など）をリンクとして使わないためのチェック
function isSafeUrl(url) {
  // URLが無い・文字列でないデータはリンクにしない
  if (typeof url !== 'string' || url === '') return false;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// リクエストとミニアプリの文章から、共通する単語（4文字以上）を探す
function tokenize(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(function (word) {
    return word.length >= 4;
  });
}

// 正式に紐づいていないが、内容が近そうなミニアプリを探す
function getRelatedApps(request, linkedApps) {
  // 古い投稿にしか無い項目は空文字として扱う
  const requestWords = new Set(tokenize([
    request.problem || '',
    request.desiredFeatures || '',
    request.targetUsers || '',
    request.currentWorkaround || ''
  ].join(' ')));

  const linkedIds = linkedApps.map(function (app) { return String(app.id); });

  return getApps().filter(function (app) {
    if (linkedIds.indexOf(String(app.id)) !== -1) return false;

    const appWords = tokenize([app.name, app.description, app.targetUsers].join(' '));
    const matched = new Set();
    appWords.forEach(function (word) {
      if (requestWords.has(word)) matched.add(word);
    });
    return matched.size >= 2;
  });
}

function renderRequests(query) {
  query = query || '';
  let requests = getRequests();
  const list = document.getElementById('requestsList');
  if (!list) return; // このページにリクエスト一覧が無ければ何もしない

  // 検索文字列が変わったときだけ1ページ目に戻す（削除や「欲しい」ボタンでの再描画では現在のページを保つ）
  if (query !== lastRequestsQuery) {
    requestsPage = 1;
    lastRequestsQuery = query;
  }

  list.innerHTML = '';
  updateTopPageIndicator(1); // 描画し直すたびに一旦隠し、複数ページある場合だけ下で表示する

  if (query) {
    const q = query.toLowerCase();
    // 古い投稿にはtargetUsers等が残っているので、無い項目は空文字として扱う
    requests = requests.filter(function (r) {
      return (
        (r.problem || '').toLowerCase().includes(q) ||
        (r.desiredFeatures || '').toLowerCase().includes(q) ||
        (r.targetUsers || '').toLowerCase().includes(q) ||
        (r.currentWorkaround || '').toLowerCase().includes(q)
      );
    });
  }

  if (requests.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = query
      ? t.noExactMatches
      : t.noRequestsYet;
    list.appendChild(empty);

    // 完全一致が0件のときは、関連しそうなリクエストを提案する
    if (query) {
      const suggestions = findFuzzySuggestions(query);
      if (suggestions.length > 0) {
        const heading = document.createElement('h3');
        heading.className = 'suggestions-heading';
        heading.textContent = t.maybeLookingFor;
        list.appendChild(heading);

        suggestions.forEach(function (request) {
          list.appendChild(createCard(request));
        });
      }
    }
    return;
  }

  const sorted = [...requests].reverse();
  const totalPages = Math.max(1, Math.ceil(sorted.length / REQUESTS_PAGE_SIZE));
  // 削除などでページ数が減った場合、範囲外にならないよう調整する
  if (requestsPage > totalPages) requestsPage = totalPages;

  const start = (requestsPage - 1) * REQUESTS_PAGE_SIZE;
  const pageItems = sorted.slice(start, start + REQUESTS_PAGE_SIZE);
  pageItems.forEach(function (request) {
    list.appendChild(createCard(request));
  });

  if (totalPages > 1) {
    list.appendChild(createPaginationControls(query, totalPages));
    updateTopPageIndicator(totalPages);
  }
}

// 「All Requests」の見出しの下に、現在のページを表示する（一番上に戻ったときも今何ページか分かるように）
function updateTopPageIndicator(totalPages) {
  const section = document.getElementById('requests-list-section');
  const list = document.getElementById('requestsList');
  if (!section || !list) return;

  let indicator = document.getElementById('requestsTopPageIndicator');
  if (totalPages <= 1) {
    if (indicator) indicator.hidden = true;
    return;
  }

  if (!indicator) {
    indicator = document.createElement('p');
    indicator.id = 'requestsTopPageIndicator';
    indicator.className = 'pagination-indicator pagination-indicator--top';
    section.insertBefore(indicator, list);
  }
  indicator.hidden = false;
  indicator.textContent = t.pageIndicator(requestsPage, totalPages);
}

// リクエスト一覧の下に表示する「前へ / ページ X of Y / 次へ」の操作
function createPaginationControls(query, totalPages) {
  const wrap = document.createElement('div');
  wrap.className = 'pagination-controls';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'map-btn map-btn--secondary';
  prevBtn.textContent = t.prevPage;
  prevBtn.disabled = requestsPage <= 1;
  prevBtn.addEventListener('click', function () {
    requestsPage -= 1;
    renderRequests(query);
    scrollRequestsListToTop();
  });

  const indicator = document.createElement('span');
  indicator.className = 'pagination-indicator';
  indicator.textContent = t.pageIndicator(requestsPage, totalPages);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'map-btn map-btn--secondary';
  nextBtn.textContent = t.nextPage;
  nextBtn.disabled = requestsPage >= totalPages;
  nextBtn.addEventListener('click', function () {
    requestsPage += 1;
    renderRequests(query);
    scrollRequestsListToTop();
  });

  wrap.appendChild(prevBtn);
  wrap.appendChild(indicator);
  wrap.appendChild(nextBtn);
  return wrap;
}

// ページ切り替え後、「All Requests」の見出しまで画面を戻す
function scrollRequestsListToTop() {
  const heading = document.querySelector('#requests-list-section h2');
  if (heading) heading.scrollIntoView({ block: 'start' });
}

function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  // カードのタイトル（困りごとをそのまま見出しにする）
  const title = document.createElement('p');
  title.className = 'card-title';
  title.textContent = request.problem;

  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'card-label';
  featuresLabel.textContent = t.desiredFeaturesLabel;

  const featuresText = document.createElement('p');
  featuresText.className = 'card-text';
  featuresText.textContent = request.desiredFeatures;

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = request.postedBy
    ? t.sharedBy(request.postedBy, request.createdAt)
    : t.postedOn(request.createdAt);

  // 削除ボタン（右上に表示）。本人の投稿か管理者の場合だけ表示する
  if (canManage(request)) {
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.setAttribute('aria-label', t.deleteRequestLabel);
    deleteBtn.title = t.deleteRequestLabel;
    deleteBtn.addEventListener('click', async function () {
      if (confirm(t.confirmDeleteRequest)) {
        const error = await deleteRequest(request.id);
        if (error) {
          console.error('Failed to delete request:', error.message);
          showToast(t.toastFailedDeleteRequest);
          return;
        }
        await loadSharedData();
        const searchField = document.getElementById('searchInput');
        renderRequests(searchField ? searchField.value.trim() : '');
        populateRequestDropdown();
        showToast(t.toastRequestDeleted);
      }
    });
    card.appendChild(deleteBtn);
  }

  // I want this too ボタンエリア
  const wantArea = document.createElement('div');
  wantArea.className = 'card-want-area';

  const alreadyWanted = hasWanted(request.id);
  const wantBtn = document.createElement('button');
  wantBtn.type = 'button';
  wantBtn.className = 'want-btn';
  if (alreadyWanted) wantBtn.classList.add('want-btn--active');
  wantBtn.textContent = alreadyWanted ? t.wantActive : t.wantInactive;
  wantBtn.title = alreadyWanted ? t.wantActiveTitle : '';
  wantBtn.addEventListener('click', async function () {
    if (!currentUser) {
      showToast(t.toastSignInToVote);
      return;
    }
    const error = await toggleWant(request.id);
    if (error) {
      console.error('Failed to update want:', error.message);
      showToast(t.toastSomethingWrong);
      return;
    }
    await loadSharedData();
    const searchField = document.getElementById('searchInput');
    renderRequests(searchField ? searchField.value.trim() : '');
  });

  const wantCount = document.createElement('p');
  wantCount.className = 'want-count';
  const count = getWantedCount(request.id);
  if (count === 1) {
    wantCount.textContent = t.wantCountOne;
  } else if (count > 1) {
    wantCount.textContent = t.wantCountMany(count);
  }

  // Build this ボタン：トップページのミニアプリ投稿フォームへ移動し、このリクエストを自動選択する
  const buildBtn = document.createElement('button');
  buildBtn.type = 'button';
  buildBtn.className = 'build-btn';
  buildBtn.textContent = t.buildThis;
  buildBtn.addEventListener('click', function () {
    window.location.href = 'index.html?builtFor=' + encodeURIComponent(request.id);
  });

  wantArea.appendChild(wantBtn);
  wantArea.appendChild(buildBtn);
  wantArea.appendChild(wantCount);

  // Apps built for this request
  const linkedApps = getApps().filter(function (app) {
    return String(app.builtForRequestId) === String(request.id);
  });

  const appsArea = document.createElement('div');
  appsArea.className = 'card-linked-apps';

  if (linkedApps.length > 0) {
    const appsLabel = document.createElement('p');
    appsLabel.className = 'card-label';
    appsLabel.textContent = t.appsBuiltForLabel;
    appsArea.appendChild(appsLabel);

    linkedApps.forEach(function (app) {
      if (!isSafeUrl(app.url)) return;
      const appLink = document.createElement('a');
      appLink.href = app.url;
      appLink.target = '_blank';
      appLink.rel = 'noopener noreferrer';
      appLink.className = 'linked-app-link';
      appLink.textContent = app.name + ' ↗';
      appLink.addEventListener('click', function () {
        recordAppView(app.id);
        renderRecentApps();
      });
      appsArea.appendChild(appLink);
    });
  }

  // Maybe also relevant（正式リンクされていないが内容が近いミニアプリの提案）
  const relatedApps = getRelatedApps(request, linkedApps);
  const relatedArea = document.createElement('div');
  relatedArea.className = 'card-related-apps';

  if (relatedApps.length > 0) {
    const bubble = document.createElement('div');
    bubble.className = 'related-bubble';

    const bubbleLabel = document.createElement('p');
    bubbleLabel.className = 'related-bubble-label';
    bubbleLabel.textContent = t.maybeAlsoRelevant;
    bubble.appendChild(bubbleLabel);

    relatedApps.forEach(function (app) {
      if (!isSafeUrl(app.url)) return;
      const relatedLink = document.createElement('a');
      relatedLink.href = app.url;
      relatedLink.target = '_blank';
      relatedLink.rel = 'noopener noreferrer';
      relatedLink.className = 'related-app-link';
      relatedLink.textContent = app.name + ' ↗';
      bubble.appendChild(relatedLink);
    });

    relatedArea.appendChild(bubble);
  }

  card.appendChild(title);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);

  // 昔の投稿にだけ残っている項目は、ある場合だけ表示する
  if (request.targetUsers) {
    const usersLabel = document.createElement('p');
    usersLabel.className = 'card-label';
    usersLabel.textContent = t.targetUsersLabel;

    const usersText = document.createElement('p');
    usersText.className = 'card-text';
    usersText.textContent = request.targetUsers;

    card.appendChild(usersLabel);
    card.appendChild(usersText);
  }

  if (request.currentWorkaround) {
    const workaroundLabel = document.createElement('p');
    workaroundLabel.className = 'card-label';
    workaroundLabel.textContent = t.currentWorkaroundLabel;

    const workaroundText = document.createElement('p');
    workaroundText.className = 'card-text';
    workaroundText.textContent = request.currentWorkaround;

    card.appendChild(workaroundLabel);
    card.appendChild(workaroundText);
  }

  card.appendChild(date);
  card.appendChild(wantArea);
  card.appendChild(appsArea);
  card.appendChild(relatedArea);

  return card;
}

function getWantedCount(requestId) {
  return cachedWants.filter(function (w) { return String(w.requestId) === String(requestId); }).length;
}

// ログイン中のユーザーが、このリクエストに既に「欲しい」を付けているか
function hasWanted(requestId) {
  if (!currentUser) return false;
  return cachedWants.some(function (w) {
    return String(w.requestId) === String(requestId) && String(w.userId) === String(currentUser.id);
  });
}

// 「I want this too」を付ける／既に付けていれば外す（1人1票）
async function toggleWant(requestId) {
  if (hasWanted(requestId)) {
    const { error } = await supabaseClient
      .from('wants')
      .delete()
      .eq('request_id', requestId)
      .eq('user_id', currentUser.id);
    return error;
  }

  const { error } = await supabaseClient
    .from('wants')
    .insert({ request_id: requestId, user_id: currentUser.id });
  return error;
}

// =====================
// ミニアプリ関連
// =====================

function populateRequestDropdown() {
  const select = document.getElementById('builtForRequest');
  if (!select) return; // このページにミニアプリ投稿フォームが無ければ何もしない
  const searchInput = document.getElementById('requestSearch');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const previous = select.value; // 再構築で選択が消えないように覚えておく

  // 検索欄に文字があれば、problemに含まれるものだけに絞り込む
  const requests = getRequests().filter(function (request) {
    if (!query) return true;
    const problem = typeof request.problem === 'string' ? request.problem.toLowerCase() : '';
    return problem.indexOf(query) !== -1;
  });

  select.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = t.notLinkedOption;
  select.appendChild(emptyOption);

  requests.forEach(function (request) {
    const option = document.createElement('option');
    option.value = request.id;
    // インポートしたデータにproblemが無い場合に備えて文字列かどうか確認する
    const problem = typeof request.problem === 'string' ? request.problem : '';
    const preview = problem.length > 60
      ? problem.slice(0, 60) + '...'
      : problem;
    option.textContent = preview;
    select.appendChild(option);
  });

  // 以前選んでいたリクエストがまだ残っていれば選択を戻す
  const stillExists = Array.prototype.some.call(select.options, function (o) {
    return o.value === previous;
  });
  if (stillExists) {
    select.value = previous;
  }
}

// 検索欄に入力するたびにリストを絞り込む（requestSearchが無いページでは何もしない）
const requestSearchEl = document.getElementById('requestSearch');
if (requestSearchEl) requestSearchEl.addEventListener('input', function () {
  populateRequestDropdown();
});

// appFormはトップページにしか無いので、存在するときだけ登録する
const appFormEl = document.getElementById('appForm');
if (appFormEl) appFormEl.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!currentUser) {
    showToast(t.toastSignInToSubmitApp);
    return;
  }

  const appUrl = document.getElementById('appUrl').value;
  if (!isSafeUrl(appUrl)) {
    alert(t.alertInvalidUrl);
    return;
  }

  const name = document.getElementById('appName').value.trim();
  const description = document.getElementById('appDescription').value.trim();
  const targetUsers = document.getElementById('appTargetUsers').value.trim();
  const category = document.getElementById('appCategory').value;

  // 空白だけの入力はrequired属性をすり抜けるので、trim後にチェックする
  if (!name || !description || !targetUsers || !category) {
    showToast(t.toastFillAllFields);
    return;
  }

  const fields = {
    name: name,
    description: description,
    url: appUrl,
    targetUsers: targetUsers,
    category: category,
    builtForRequestId: document.getElementById('builtForRequest').value || null
  };

  const wasEditing = !!editingAppId;
  const error = wasEditing
    ? await updateApp(editingAppId, fields)
    : await saveApp(fields);

  if (error) {
    console.error('Failed to save mini app:', error.message);
    showToast(t.toastFailedSaveApp);
    return;
  }

  cancelEditApp(); // 編集モードを終了し、フォームを新規投稿用にリセットする
  await loadSharedData();
  renderApps();
  renderYourApps();
  populateRequestDropdown();
  showToast(wasEditing ? t.toastAppUpdated : t.toastAppShared);
});

async function saveApp(fields) {
  const { error } = await supabaseClient.from('mini_apps').insert({
    name: fields.name,
    description: fields.description,
    url: fields.url,
    target_users: fields.targetUsers,
    category: fields.category,
    built_for_request_id: fields.builtForRequestId,
    owner_id: currentUser.id
  });
  return error;
}

// 既存のミニアプリを部分更新する（本人の投稿か管理者でなければ、RLSがサーバー側で拒否する）
async function updateApp(id, fields) {
  const { error } = await supabaseClient.from('mini_apps').update({
    name: fields.name,
    description: fields.description,
    url: fields.url,
    target_users: fields.targetUsers,
    category: fields.category,
    built_for_request_id: fields.builtForRequestId
  }).eq('id', id);
  return error;
}

// ミニアプリを削除する（本人の投稿か管理者でなければ、RLSがサーバー側で拒否する）
async function deleteApp(id) {
  const { error } = await supabaseClient.from('mini_apps').delete().eq('id', id);
  return error;
}

// フォームに既存のアプリの内容を読み込み、編集モードにする
function editApp(app) {
  editingAppId = app.id;

  document.getElementById('appName').value = app.name || '';
  document.getElementById('appDescription').value = app.description || '';
  document.getElementById('appUrl').value = app.url || '';
  document.getElementById('appTargetUsers').value = app.targetUsers || '';
  document.getElementById('appCategory').value = app.category || 'lifestyle';
  document.getElementById('builtForRequest').value = app.builtForRequestId || '';

  document.getElementById('appFormTitle').textContent = t.appFormTitleEdit;
  document.getElementById('appSubmitBtn').textContent = t.appSubmitSave;
  document.getElementById('cancelAppEditBtn').hidden = false;

  document.getElementById('app-form-section').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('appName').focus();
}

// 編集モードを終了し、投稿フォームを新規投稿用に戻す
function cancelEditApp() {
  editingAppId = null;
  document.getElementById('appForm').reset();
  document.getElementById('appFormTitle').textContent = t.appFormTitleNew;
  document.getElementById('appSubmitBtn').textContent = t.appSubmitNew;
  document.getElementById('cancelAppEditBtn').hidden = true;
}

function getApps() {
  // コピーを返す理由はgetRequests()と同じ（キャッシュを誤って書き換えないため）
  return cachedApps.slice();
}

function renderApps(query) {
  query = query || '';
  let apps = getApps();
  const list = document.getElementById('appsList');
  if (!list) return; // このページにミニアプリ一覧が無ければ何もしない

  // 検索文字列 or カテゴリが変わったときだけ1ページ目に戻す（お気に入り登録などの再描画では現在のページを保つ）
  if (query !== lastAppsQuery || selectedCategory !== lastAppsCategory) {
    appsPage = 1;
    lastAppsQuery = query;
    lastAppsCategory = selectedCategory;
  }

  list.innerHTML = '';

  if (selectedCategory !== 'all') {
    apps = apps.filter(function (app) { return app.category === selectedCategory; });
  }

  if (query) {
    const q = query.toLowerCase();
    // インポートしたデータに項目が欠けていても落ちないように空文字として扱う
    apps = apps.filter(function (app) {
      return (
        (app.name || '').toLowerCase().includes(q) ||
        (app.description || '').toLowerCase().includes(q) ||
        (app.targetUsers || '').toLowerCase().includes(q)
      );
    });
  }

  if (apps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = (query || selectedCategory !== 'all')
      ? t.noAppsSearch
      : t.noAppsYet;
    list.appendChild(empty);
    return;
  }

  const sorted = [...apps].reverse();
  const totalPages = Math.max(1, Math.ceil(sorted.length / MINI_APPS_PAGE_SIZE));
  if (appsPage > totalPages) appsPage = totalPages;

  const start = (appsPage - 1) * MINI_APPS_PAGE_SIZE;
  const pageItems = sorted.slice(start, start + MINI_APPS_PAGE_SIZE);
  pageItems.forEach(function (app) {
    list.appendChild(createAppCard(app));
  });

  if (totalPages > 1) {
    list.appendChild(createAppsPaginationControls(query, totalPages));
  }
}

// Mini Apps一覧の下に表示する「前へ / ページ X of Y / 次へ」の操作
function createAppsPaginationControls(query, totalPages) {
  const wrap = document.createElement('div');
  wrap.className = 'pagination-controls';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'map-btn map-btn--secondary';
  prevBtn.textContent = t.prevPage;
  prevBtn.disabled = appsPage <= 1;
  prevBtn.addEventListener('click', function () {
    appsPage -= 1;
    renderApps(query);
    scrollAppsListToTop();
  });

  const indicator = document.createElement('span');
  indicator.className = 'pagination-indicator';
  indicator.textContent = t.pageIndicator(appsPage, totalPages);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'map-btn map-btn--secondary';
  nextBtn.textContent = t.nextPage;
  nextBtn.disabled = appsPage >= totalPages;
  nextBtn.addEventListener('click', function () {
    appsPage += 1;
    renderApps(query);
    scrollAppsListToTop();
  });

  wrap.appendChild(prevBtn);
  wrap.appendChild(indicator);
  wrap.appendChild(nextBtn);
  return wrap;
}

// ページ切り替え後、「Mini Apps」の見出しまで画面を戻す
function scrollAppsListToTop() {
  const heading = document.querySelector('#apps-list-section h2');
  if (heading) heading.scrollIntoView({ block: 'start' });
}

// 「Your Apps」：ログイン中のアカウントが投稿したアプリだけを表示する
function renderYourApps() {
  const list = document.getElementById('yourAppsList');
  if (!list) return;

  list.innerHTML = '';

  if (!currentUser) {
    const prompt = document.createElement('p');
    prompt.textContent = t.signInToSeeYourApps;
    list.appendChild(prompt);
    return;
  }

  const yourApps = getApps().filter(function (app) {
    return String(app.ownerId) === String(currentUser.id);
  });

  if (yourApps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = t.noYourAppsYet;
    list.appendChild(empty);
    return;
  }

  [...yourApps].reverse().forEach(function (app) {
    list.appendChild(createAppCard(app));
  });
}

// プロフィールページ（profile.html）：アバター・ハンドル・自己紹介を表示する（Portfolio部分はrenderYourApps()が担当）
function renderProfilePage() {
  const card = document.getElementById('profileCard');
  const signedOutPrompt = document.getElementById('profileSignedOutPrompt');
  const portfolioSection = document.getElementById('your-apps-section');
  if (!card && !signedOutPrompt) return; // このページにプロフィールカードが無ければ何もしない

  if (!currentUser) {
    if (card) card.hidden = true;
    if (portfolioSection) portfolioSection.hidden = true;
    if (signedOutPrompt) signedOutPrompt.hidden = false;
    return;
  }
  if (signedOutPrompt) signedOutPrompt.hidden = true;
  if (card) card.hidden = false;
  if (portfolioSection) portfolioSection.hidden = false;

  const avatarWrap = document.getElementById('profileAvatarWrap');
  if (avatarWrap) {
    avatarWrap.innerHTML = '';
    if (currentProfile && currentProfile.avatar_url) {
      const img = document.createElement('img');
      img.className = 'profile-avatar-lg';
      img.alt = '';
      img.src = currentProfile.avatar_url;
      avatarWrap.appendChild(img);
    } else {
      const fallback = createAppAvatar(currentProfile ? currentProfile.handle : '', false);
      fallback.classList.add('profile-avatar-lg', 'profile-avatar-lg--fallback');
      avatarWrap.appendChild(fallback);
    }
  }

  const handleEl = document.getElementById('profileHandleLarge');
  if (handleEl) handleEl.textContent = currentProfile ? currentProfile.handle : '';

  const bioEl = document.getElementById('profileBioText');
  if (bioEl) {
    const bioText = (currentProfile && currentProfile.bio) || '';
    bioEl.textContent = bioText || t.profileBioEmpty;
    bioEl.classList.toggle('profile-bio-empty', !bioText);
  }
}

// アプリ名から見分けやすい頭文字バッジを作る（色は名前から決まる固定色）
const APP_AVATAR_COLORS = ['app-avatar-c0', 'app-avatar-c1', 'app-avatar-c2', 'app-avatar-c3'];

function createAppAvatar(name, small) {
  const avatar = document.createElement('div');
  avatar.className = 'app-avatar' + (small ? ' app-avatar--sm' : '');
  avatar.setAttribute('aria-hidden', 'true'); // 名前はリンク側で読み上げられるため重複させない

  const safeName = typeof name === 'string' ? name.trim() : '';
  avatar.textContent = safeName ? safeName.charAt(0).toUpperCase() : '?';

  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash + safeName.charCodeAt(i)) % APP_AVATAR_COLORS.length;
  }
  avatar.classList.add(APP_AVATAR_COLORS[hash]);

  return avatar;
}

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';

  // アプリ名（外部リンク）
  const nameLink = document.createElement('a');
  if (isSafeUrl(app.url)) {
    nameLink.href = app.url;
    nameLink.target = '_blank';
    nameLink.rel = 'noopener noreferrer';
  }
  nameLink.className = 'app-name';
  nameLink.textContent = app.name + ' ↗';
  nameLink.addEventListener('click', function () {
    recordAppView(app.id);
    renderRecentApps();
  });

  // 頭文字バッジ＋アプリ名を横並びにする（右端にお気に入りの星）
  const nameRow = document.createElement('div');
  nameRow.className = 'app-card-header';
  nameRow.appendChild(createAppAvatar(app.name));
  nameRow.appendChild(nameLink);
  nameRow.appendChild(createFavoriteStarButton(app.id));

  // カテゴリバッジ
  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'map-chip map-chip--success app-category-badge';
  categoryBadge.textContent = categoryLabel(app.category);

  // 説明
  const description = document.createElement('p');
  description.className = 'card-text app-description';
  description.textContent = app.description;

  // Target users
  const usersLabel = document.createElement('p');
  usersLabel.className = 'card-label';
  usersLabel.textContent = t.targetUsersLabel;

  const usersText = document.createElement('p');
  usersText.className = 'card-text';
  usersText.textContent = app.targetUsers;

  card.appendChild(nameRow);
  if (categoryBadge.textContent) card.appendChild(categoryBadge);
  card.appendChild(description);
  card.appendChild(usersLabel);
  card.appendChild(usersText);

  // Built for request
  if (app.builtForRequestId) {
    const linked = getRequests().find(function (r) {
      return String(r.id) === String(app.builtForRequestId);
    });

    if (linked) {
      const requestLabel = document.createElement('p');
      requestLabel.className = 'card-label';
      requestLabel.textContent = t.builtForRequestLabel;

      const requestText = document.createElement('p');
      requestText.className = 'card-text app-request-text';
      requestText.textContent = linked.problem;

      card.appendChild(requestLabel);
      card.appendChild(requestText);
    }
  }

  // 投稿日（投稿者名があれば一緒に表示する）
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = app.postedBy
    ? t.sharedBy(app.postedBy, app.createdAt)
    : t.postedOn(app.createdAt);

  // 星評価エリア
  const ratingArea = createStarRating(app.id);

  // コメントエリア（作者へのフィードバック）
  const commentsArea = createCommentsSection(app);

  card.appendChild(date);
  card.appendChild(ratingArea);
  card.appendChild(commentsArea);

  // 本人の投稿か管理者の場合だけ、編集・削除ボタンを付ける
  if (canManage(app)) {
    const actions = document.createElement('div');
    actions.className = 'card-edit-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'map-btn map-btn--secondary';
    editBtn.textContent = t.edit;
    editBtn.addEventListener('click', function () { editApp(app); });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.setAttribute('aria-label', t.deleteAppAriaLabel(app.name));
    deleteBtn.title = t.deleteAppTitle;
    deleteBtn.addEventListener('click', async function () {
      if (confirm(t.confirmDeleteApp(app.name))) {
        const error = await deleteApp(app.id);
        if (error) {
          console.error('Failed to delete mini app:', error.message);
          showToast(t.toastFailedDeleteApp);
          return;
        }
        if (editingAppId === app.id) cancelEditApp();
        await loadSharedData();
        renderApps();
        renderYourApps();
        renderRecentApps();
        renderFavoriteApps();
        renderPopularApps();
        showToast(t.toastAppDeleted);
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
  }

  return card;
}

// =====================
// 星評価関連
// =====================

// 特定アプリの評価（星の数の配列）を取得する
function getRatings(appId) {
  return cachedRatings
    .filter(function (r) { return String(r.appId) === String(appId); })
    .map(function (r) { return r.stars; });
}

// ログイン中のユーザーが、このアプリに付けた評価（無ければnull）
function getMyRating(appId) {
  if (!currentUser) return null;
  const found = cachedRatings.find(function (r) {
    return String(r.appId) === String(appId) && String(r.userId) === String(currentUser.id);
  });
  return found ? found.stars : null;
}

// 評価を保存する（既に評価済みなら上書き。1人1アプリにつき1件）
async function addRating(appId, stars) {
  const { error } = await supabaseClient
    .from('ratings')
    .upsert({ app_id: appId, user_id: currentUser.id, stars: stars }, { onConflict: 'app_id,user_id' });
  return error;
}

// 星評価UIを組み立てる関数
function createStarRating(appId) {
  const area = document.createElement('div');
  area.className = 'star-rating-area';

  const ratings = getRatings(appId);
  const count = ratings.length;
  const average = count > 0
    ? ratings.reduce(function (sum, r) { return sum + r; }, 0) / count
    : 0;

  // --- 平均点の表示行 ---
  const averageRow = document.createElement('div');
  averageRow.className = 'star-average-row';

  // 平均に応じて星を部分的に塗りつぶす（四捨五入せず、段階的に表示する）
  const percent = count > 0 ? Math.max(0, Math.min(100, (average / 5) * 100)) : 0;

  const averageStars = document.createElement('span');
  averageStars.className = 'average-stars';
  averageStars.setAttribute('role', 'img');
  averageStars.setAttribute('aria-label', t.starsOutOf5(average.toFixed(1)));

  const starsBack = document.createElement('span');
  starsBack.className = 'stars-back';
  starsBack.setAttribute('aria-hidden', 'true');
  starsBack.textContent = '★★★★★';

  const starsFront = document.createElement('span');
  starsFront.className = 'stars-front';
  starsFront.setAttribute('aria-hidden', 'true');
  starsFront.style.width = percent + '%';
  starsFront.textContent = '★★★★★';

  averageStars.appendChild(starsBack);
  averageStars.appendChild(starsFront);

  const ratingInfo = document.createElement('span');
  ratingInfo.className = 'rating-info';
  if (count === 0) {
    ratingInfo.textContent = t.noRatingsYet;
  } else if (count === 1) {
    ratingInfo.textContent = t.ratingOne(average.toFixed(1));
  } else {
    ratingInfo.textContent = t.ratingMany(average.toFixed(1), count);
  }

  averageRow.appendChild(averageStars);
  averageRow.appendChild(ratingInfo);

  // --- クリックして評価する行 ---
  const rateRow = document.createElement('div');
  rateRow.className = 'star-rate-row';

  const myRating = getMyRating(appId);

  const rateLabel = document.createElement('span');
  rateLabel.className = 'rate-label';
  rateLabel.textContent = myRating ? t.yourRatingLabel : t.rateThisAppLabel;

  const clickableStars = document.createElement('span');
  clickableStars.className = 'clickable-stars';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'star-btn';
    star.textContent = myRating && i <= myRating ? '★' : '☆';
    star.setAttribute('aria-label', t.starsAriaLabel(i));

    // ホバー・フォーカス時：カーソル（キーボード操作）の位置まで星を光らせる
    const previewStars = (function (rating) {
      return function () {
        const btns = clickableStars.querySelectorAll('.star-btn');
        btns.forEach(function (btn, idx) {
          btn.textContent = idx < rating ? '★' : '☆';
        });
      };
    })(i);
    star.addEventListener('mouseenter', previewStars);
    star.addEventListener('focus', previewStars); // キーボード（Tab移動）でも同じ動きにする

    // ホバー・フォーカスが外れたら、自分の評価（無ければ空）に戻す
    const resetStars = function () {
      clickableStars.querySelectorAll('.star-btn').forEach(function (btn, idx) {
        btn.textContent = myRating && idx < myRating ? '★' : '☆';
      });
    };
    star.addEventListener('mouseleave', resetStars);
    star.addEventListener('blur', resetStars);

    // クリックで評価を保存して再描画する
    star.addEventListener('click', (function (rating) {
      return async function () {
        if (!currentUser) {
          showToast(t.toastSignInToRate);
          return;
        }
        const error = await addRating(appId, rating);
        if (error) {
          console.error('Failed to save rating:', error.message);
          showToast(t.toastSomethingWrong);
          return;
        }
        await loadSharedData();
        renderApps();
        renderYourApps();
        renderFavoriteApps();
        renderPopularApps();
      };
    })(i));

    clickableStars.appendChild(star);
  }

  rateRow.appendChild(rateLabel);
  rateRow.appendChild(clickableStars);

  area.appendChild(averageRow);
  area.appendChild(rateRow);

  return area;
}

// =====================
// コメント関連（作者へのフィードバック）
// =====================

// 特定アプリのトップレベルコメント一覧を取得する(返信は含まない、投稿順)
function getTopLevelComments(appId) {
  return cachedComments.filter(function (c) {
    return String(c.appId) === String(appId) && !c.replyToId;
  });
}

// 特定コメントへの返信一覧を取得する(現状は作者からの返信が最大1件つく想定)
function getReplies(commentId) {
  return cachedComments.filter(function (c) {
    return String(c.replyToId) === String(commentId);
  });
}

// 見出しボタンに出す件数(返信も含めた合計)
function getCommentCount(appId) {
  return cachedComments.filter(function (c) { return String(c.appId) === String(appId); }).length;
}

// 通常コメントを投稿する(ログイン不要・匿名OK)
async function postComment(appId, text, authorName) {
  const { error } = await supabaseClient.from('app_comments').insert({
    app_id: appId,
    user_id: currentUser ? currentUser.id : null,
    author_name: authorName || null,
    text: text
  });
  return error;
}

// 作者としての返信を投稿する(このアプリの持ち主としてログイン中の時だけ呼ばれる。RLS側でも同条件を強制)
async function postReply(appId, parentCommentId, text) {
  const { error } = await supabaseClient.from('app_comments').insert({
    app_id: appId,
    user_id: currentUser.id,
    reply_to_id: parentCommentId,
    text: text
  });
  return error;
}

// コメント欄（折りたたみ式）を組み立てる関数
function createCommentsSection(app) {
  const appId = app.id;
  const wrapper = document.createElement('div');
  wrapper.className = 'comments-area';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'comments-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'comments-panel';
  panel.hidden = true;

  const list = document.createElement('div');
  list.className = 'comments-list';

  // コメント数を見出しボタンに反映する
  function updateToggleLabel() {
    toggleBtn.textContent = t.commentsToggle(getCommentCount(appId));
  }

  // 1件のコメントに対する、作者用の返信フォームを組み立てる
  function createReplyForm(comment) {
    const replyForm = document.createElement('form');
    replyForm.className = 'comment-reply-form';
    replyForm.hidden = true;

    const replyInput = document.createElement('textarea');
    replyInput.placeholder = t.replyPlaceholder;
    replyInput.maxLength = 500;
    replyInput.setAttribute('aria-label', t.replyAriaLabel);

    const replySubmit = document.createElement('button');
    replySubmit.type = 'submit';
    replySubmit.className = 'map-btn map-btn--secondary';
    replySubmit.textContent = t.postReply;

    replyForm.appendChild(replyInput);
    replyForm.appendChild(replySubmit);

    replyForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const text = replyInput.value.trim();
      if (!text) {
        showToast(t.toastWriteCommentFirst);
        return;
      }

      const error = await postReply(appId, comment.id, text);
      if (error) {
        console.error('Failed to post reply:', error.message);
        showToast(t.toastFailedPostComment);
        return;
      }

      await loadComments();
      renderList();
      showToast(t.toastCommentPosted);
    });

    return replyForm;
  }

  // コメント一覧を再描画する
  function renderList() {
    list.innerHTML = '';
    const comments = getTopLevelComments(appId);

    if (comments.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'comments-empty';
      empty.textContent = t.noCommentsYet;
      list.appendChild(empty);
      return;
    }

    comments.forEach(function (comment) {
      const item = document.createElement('div');
      item.className = 'comment-item';

      const text = document.createElement('p');
      text.className = 'comment-text';
      text.textContent = comment.text;

      const meta = document.createElement('p');
      meta.className = 'comment-meta';
      meta.textContent = (comment.authorName ? comment.authorName : t.anonymous) + ' · ' + comment.createdAt;

      item.appendChild(text);
      item.appendChild(meta);

      // 作者からの返信があれば、バッジ付きでネスト表示する
      const replies = getReplies(comment.id);
      replies.forEach(function (reply) {
        const replyItem = document.createElement('div');
        replyItem.className = 'comment-reply';

        const replyBadge = document.createElement('span');
        replyBadge.className = 'comment-reply-badge';
        replyBadge.textContent = t.authorBadge;

        const replyText = document.createElement('p');
        replyText.className = 'comment-text';
        replyText.textContent = reply.text;

        const replyMeta = document.createElement('p');
        replyMeta.className = 'comment-meta';
        replyMeta.textContent = (reply.authorName ? reply.authorName : t.anonymous) + ' · ' + reply.createdAt;

        replyItem.appendChild(replyBadge);
        replyItem.appendChild(replyText);
        replyItem.appendChild(replyMeta);
        item.appendChild(replyItem);
      });

      // このアプリの持ち主としてログイン中、かつまだ返信していなければ「Reply」ボタンを出す
      if (canManage(app) && replies.length === 0) {
        const replyForm = createReplyForm(comment);

        const replyBtn = document.createElement('button');
        replyBtn.type = 'button';
        replyBtn.className = 'comment-reply-btn';
        replyBtn.textContent = t.replyBtn;
        replyBtn.addEventListener('click', function () {
          replyForm.hidden = !replyForm.hidden;
        });

        item.appendChild(replyBtn);
        item.appendChild(replyForm);
      }

      list.appendChild(item);
    });
  }

  // コメント投稿フォーム
  const form = document.createElement('form');
  form.className = 'comment-form';

  const textInput = document.createElement('textarea');
  textInput.placeholder = t.commentPlaceholder;
  textInput.maxLength = 500;
  textInput.setAttribute('aria-label', t.commentAriaLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = t.commentNamePlaceholder;
  nameInput.maxLength = 30;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'map-btn map-btn--secondary';
  submitBtn.textContent = t.postComment;

  form.appendChild(textInput);
  form.appendChild(nameInput);
  form.appendChild(submitBtn);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) {
      showToast(t.toastWriteCommentFirst);
      return;
    }

    const error = await postComment(appId, text, nameInput.value.trim());
    if (error) {
      console.error('Failed to post comment:', error.message);
      showToast(t.toastFailedPostComment);
      return;
    }

    form.reset();
    await loadComments();
    renderList();
    updateToggleLabel();
    showToast(t.toastCommentPosted);
  });

  toggleBtn.addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    toggleBtn.setAttribute('aria-expanded', String(!panel.hidden));
  });

  panel.appendChild(list);
  panel.appendChild(form);

  renderList();
  updateToggleLabel();

  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(panel);

  return wrapper;
}

// =====================
// サイドバー（最近使ったアプリ／人気のアプリ）
// =====================

// 最近開いたアプリの記録を全部取得する（新しい順）
function getRecentAppViews() {
  try {
    const data = localStorage.getItem(RECENT_APPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// アプリを開いたことを記録する（同じアプリは最新の1件だけ残す）
function recordAppView(id) {
  let views = getRecentAppViews().filter(function (v) {
    return String(v.id) !== String(id);
  });
  views.unshift({ id: id, viewedAt: Date.now() });
  views = views.slice(0, 10); // 直近10件だけ覚えておけば十分
  localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(views));
}

// お気に入りに登録されているアプリIDの一覧を取得する（新しく登録した順）
function getFavoriteAppIds() {
  try {
    const data = localStorage.getItem(FAVORITE_APPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function isFavoriteApp(id) {
  return getFavoriteAppIds().some(function (favId) { return String(favId) === String(id); });
}

// お気に入りの登録・解除を切り替える
function toggleFavoriteApp(id) {
  const ids = getFavoriteAppIds();
  const already = ids.some(function (favId) { return String(favId) === String(id); });
  const next = already
    ? ids.filter(function (favId) { return String(favId) !== String(id); })
    : [String(id)].concat(ids);
  localStorage.setItem(FAVORITE_APPS_KEY, JSON.stringify(next));
  return !already; // 切り替え後の登録状態を返す
}

// アプリカードの右上に置く、お気に入り登録用の星ボタンを組み立てる
function createFavoriteStarButton(appId) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'favorite-star-btn';

  function applyState(isFavorite) {
    btn.textContent = isFavorite ? '★' : '☆';
    btn.classList.toggle('favorite-star-btn--active', isFavorite);
    btn.setAttribute('aria-label', isFavorite ? t.removeFromFavoritesLabel : t.addToFavoritesLabel);
    btn.setAttribute('aria-pressed', String(isFavorite));
  }

  applyState(isFavoriteApp(appId));

  btn.addEventListener('click', function () {
    const isFavorite = toggleFavoriteApp(appId);
    applyState(isFavorite);
    renderFavoriteApps();
  });

  return btn;
}

// 「Favorites」欄を描画する
function renderFavoriteApps() {
  const list = document.getElementById('favoriteAppsList');
  if (!list) return; // このページにサイドバーが無ければ何もしない

  list.innerHTML = '';

  const apps = getApps();
  const favoriteApps = getFavoriteAppIds()
    .map(function (id) {
      return apps.find(function (app) { return String(app.id) === String(id); });
    })
    .filter(Boolean); // 削除済みのアプリは除く

  if (favoriteApps.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sidebar-empty';
    empty.textContent = t.favoriteAppsEmpty;
    list.appendChild(empty);
    return;
  }

  favoriteApps.forEach(function (app) {
    list.appendChild(createSidebarAppLink(app));
  });
}

// サイドバーの1行（アプリ名リンク＋任意のメタ情報）を組み立てる
function createSidebarAppLink(app, average, count) {
  const row = document.createElement('div');
  row.className = 'sidebar-app-row';

  const left = document.createElement('div');
  left.className = 'sidebar-app-left';

  const link = document.createElement('a');
  if (isSafeUrl(app.url)) {
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.className = 'sidebar-app-link';
  link.textContent = app.name + ' ↗';
  link.addEventListener('click', function () {
    recordAppView(app.id);
    renderRecentApps();
  });

  left.appendChild(createAppAvatar(app.name, true));
  left.appendChild(link);
  row.appendChild(left);

  if (typeof average === 'number' && count) {
    const meta = document.createElement('span');
    meta.className = 'sidebar-app-meta';
    meta.textContent = '★ ' + average.toFixed(1) + ' (' + count + ')';
    row.appendChild(meta);
  }

  return row;
}

// 「Recently Used」欄を描画する
function renderRecentApps() {
  const list = document.getElementById('recentAppsList');
  if (!list) return; // このページにサイドバーが無ければ何もしない

  list.innerHTML = '';

  const apps = getApps();
  const recentApps = getRecentAppViews()
    .map(function (view) {
      return apps.find(function (app) { return String(app.id) === String(view.id); });
    })
    .filter(Boolean) // 削除済みのアプリは除く
    .slice(0, 5);

  if (recentApps.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sidebar-empty';
    empty.textContent = t.recentAppsEmpty;
    list.appendChild(empty);
    return;
  }

  recentApps.forEach(function (app) {
    list.appendChild(createSidebarAppLink(app));
  });
}

// 「Popular Apps」欄を描画する（★評価の件数が多い順、同数なら平均点が高い順）
function renderPopularApps() {
  const list = document.getElementById('popularAppsList');
  if (!list) return; // このページにサイドバーが無ければ何もしない

  list.innerHTML = '';

  const popularApps = getApps()
    .map(function (app) {
      const ratings = getRatings(app.id);
      const count = ratings.length;
      const average = count > 0
        ? ratings.reduce(function (sum, r) { return sum + r; }, 0) / count
        : 0;
      return { app: app, count: count, average: average };
    })
    .filter(function (entry) { return entry.count > 0; })
    .sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return b.average - a.average;
    })
    .slice(0, 5);

  if (popularApps.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sidebar-empty';
    empty.textContent = t.popularAppsEmpty;
    list.appendChild(empty);
    return;
  }

  popularApps.forEach(function (entry) {
    list.appendChild(createSidebarAppLink(entry.app, entry.average, entry.count));
  });
}

// =====================
// データ共有（エクスポート／インポート）
// =====================

// 全データをJSONファイルとしてダウンロードする
function exportData() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    requests: getRequests(),
    miniApps: getApps()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mini-app-platform-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t.toastDataExported);
}

// JSONファイルを読み込んで既存データと合体する
function importData(file) {
  const reader = new FileReader();

  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      showToast(t.toastImportInvalidJson);
      return;
    }

    if (!data || !Array.isArray(data.requests) || !Array.isArray(data.miniApps)) {
      showToast(t.toastImportBadFormat);
      return;
    }

    // リクエスト：既に同じIDがあるものはスキップして追加する
    const requests = getRequests();
    const existingRequestIds = requests.map(function (r) { return String(r.id); });
    let addedRequests = 0;
    data.requests.forEach(function (r) {
      if (r && r.id != null && existingRequestIds.indexOf(String(r.id)) === -1) {
        requests.push(r);
        addedRequests++;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

    // ミニアプリ：同様にIDの重複を避けて追加する
    const apps = getApps();
    const existingAppIds = apps.map(function (a) { return String(a.id); });
    let addedApps = 0;
    data.miniApps.forEach(function (a) {
      if (a && a.id != null && existingAppIds.indexOf(String(a.id)) === -1) {
        apps.push(a);
        addedApps++;
      }
    });
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));

    renderRequests();
    renderApps();
    renderYourApps();
    renderFavoriteApps();
    renderPopularApps();
    populateRequestDropdown();
    showToast(t.importedCounts(addedRequests, addedApps));
  };

  reader.readAsText(file);
}

// =====================
// タイポ自動修正
// =====================

// よくあるタイポ → 正しいスペルの一覧（キーは小文字で管理する）
const TYPO_DICTIONARY = {
  teh: 'the',
  adn: 'and',
  taht: 'that',
  wiht: 'with',
  jsut: 'just',
  thier: 'their',
  recieve: 'receive',
  recieved: 'received',
  seperate: 'separate',
  seperately: 'separately',
  definately: 'definitely',
  occured: 'occurred',
  occurence: 'occurrence',
  untill: 'until',
  becuase: 'because',
  wich: 'which',
  whcih: 'which',
  shoud: 'should',
  woudl: 'would',
  coud: 'could',
  cant: "can't",
  dont: "don't",
  doesnt: "doesn't",
  wont: "won't",
  alot: 'a lot',
  aswell: 'as well',
  noone: 'no one',
  accross: 'across',
  appartment: 'apartment',
  arguement: 'argument',
  begining: 'beginning',
  beleive: 'believe',
  calender: 'calendar',
  enviroment: 'environment',
  goverment: 'government',
  independant: 'independent',
  knowlege: 'knowledge',
  maintainance: 'maintenance',
  neccessary: 'necessary',
  priviledge: 'privilege',
  reccomend: 'recommend',
  succesful: 'successful',
  tommorow: 'tomorrow',
  usualy: 'usually'
};

// 元の単語の大文字・小文字パターンを、修正後の単語にも合わせる
function matchCase(original, correction) {
  if (original === original.toUpperCase()) {
    return correction.toUpperCase();
  }
  if (original.charAt(0) === original.charAt(0).toUpperCase()) {
    return correction.charAt(0).toUpperCase() + correction.slice(1);
  }
  return correction;
}

// 入力欄に「単語を打ち終えた瞬間、タイポなら自動で直す」機能を付ける
function enableAutoCorrect(field) {
  if (!field) return;

  field.addEventListener('input', function () {
    const cursor = field.selectionStart;
    const value = field.value;

    // カーソルの直前が「単語の区切り」（空白や句読点）でなければ、まだ単語の途中
    const lastChar = value.charAt(cursor - 1);
    if (!/[\s.,!?;:]/.test(lastChar)) return;

    // 区切り文字の直前にある単語の範囲を探す
    let start = cursor - 1;
    while (start > 0 && /[A-Za-z']/.test(value.charAt(start - 1))) {
      start--;
    }
    const word = value.slice(start, cursor - 1);
    if (!word) return;

    const correction = TYPO_DICTIONARY[word.toLowerCase()];
    if (!correction) return;

    const fixed = matchCase(word, correction);
    if (fixed === word) return;

    field.value = value.slice(0, start) + fixed + value.slice(cursor - 1);

    // 置き換えた分だけカーソル位置もずらして、続けて入力できるようにする
    const newCursor = start + fixed.length + 1;
    field.setSelectionRange(newCursor, newCursor);
  });
}

// =====================
// トースト通知
// =====================

let toastTimer = null;

// 画面下に短いメッセージを表示する
function showToast(message) {
  // 前のトーストが残っていたら消す
  const old = document.querySelector('.toast');
  if (old) old.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = 'map-toast toast';
  toast.setAttribute('role', 'status'); // スクリーンリーダーにも読み上げられる
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimer = setTimeout(function () {
    toast.remove();
  }, 2500);
}
