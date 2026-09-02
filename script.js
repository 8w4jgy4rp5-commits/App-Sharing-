// ===========================
// CobbleWorks - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const APPS_STORAGE_KEY = 'miniApps';
const RECENT_APPS_KEY = 'recentAppViews'; // 「最近使ったアプリ」の保存キー（このブラウザだけの記録）
const FAVORITE_APPS_KEY = 'favoriteApps'; // 「お気に入り」の保存キー（このブラウザだけの記録）
const LANG_KEY = 'cobbleworks:lang:v1'; // 言語設定（プロフィールモーダルで選択。auth.jsとも共有）
// サイドバー用のアプリ一覧の控え。Supabaseの読み込みを待たずに
// 「最近使ったアプリ」「お気に入り」を先に描くためだけに使う（表示用のキャッシュ）
const SIDEBAR_APPS_CACHE_KEY = 'cobbleworks:sidebarAppsCache:v1';

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

    searchPlaceholder: 'Search mini apps...',
    searchButton: '🔍 Search apps',
    aiSearchButton: 'Ask AI to find it',
    aiSearchTitle: 'Not sure what to search for?',
    aiSearchHint: 'Not sure what to type? Just describe what you want to do, in any language.',
    aiSearching: 'Reading through the mini apps…',
    aiResultsTitle: 'AI picks',
    aiMaybeThis: 'Maybe this one?',
    aiMaybeThisToo: 'Maybe this too?',
    aiNoResults: 'No mini app covers that yet.',
    aiPostRequest: 'Post it as a request →',
    aiErrorEmpty: 'Type what you want to do first.',
    aiErrorLimitAnon: "You've used today's free AI searches. Sign in to get more.",
    aiErrorLimitUser: "You've used today's AI searches. Please try again tomorrow.",
    aiErrorGlobal: 'AI search has hit its daily limit. Please try again tomorrow.',
    aiErrorGeneric: 'AI search did not work. Please try again.',
    aiClearResults: 'Close',
    navHome: 'Home',
    navRequests: 'Requests',
    navApps: 'Mini Apps',
    navYou: 'You',
    howItWorksBtn: 'See how it works',
    guideSearchMock: 'split bills',
    guideStepLabel1: 'Step 1 of 3',
    guideStepLabel2: 'Step 2 of 3',
    guideStepLabel3: 'Step 3 of 3',
    guideStep1Title: 'Post a problem, or search',
    guideStep1Body: 'Say what you\'re struggling with in plain words. Or search first — a mini app for it may already exist.',
    guideStep2Title: 'Someone builds a mini app',
    guideStep2Body: 'A maker picks up the request and builds a small, free tool for it. You can try it the moment it lands.',
    guideStep3Title: 'Try it, then ♡ to keep it',
    guideStep3Body: 'Open the mini app and use it. If it helps, tap ♡ — it stays in your Favorites, ready whenever you need it.',
    guideBack: 'Back',
    guideNext: 'Next',
    guideStart: 'Start looking',
    guideClose: 'Close',
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
    profileBioEmptyOther: 'No bio yet.',
    profileSubtitleOther: function (handle) { return 'Public info and the mini apps ' + handle + ' has built.'; },
    portfolioNoteOther: function (handle) { return 'Mini apps ' + handle + ' has shared on CobbleWorks.'; },
    noAppsFromThisPerson: 'No mini apps shared yet.',
    viewProfileOf: function (handle) { return 'View the profile of ' + handle; },
    profileNotFoundTitle: 'Profile not found',
    profileNotFoundBody: 'Nobody is using this handle. They may have changed it since the link was made.',
    browseMiniApps: 'Browse mini apps',

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
    seedSharedBy: function (date) { return 'CobbleWorks sample · ' + date; },
    seedBadge: 'Sample',
    officialBadge: 'Official',
    postedOn: function (date) { return 'Posted on ' + date; },
    builtBy: function (name) { return 'Built by ' + name; },
    externalAppNote: 'Opens on an external site',
    submitGuideTitle: 'Any URL works',
    submitGuideBody: "Built something with AI? You don't have to host it here — paste the link from Vercel, Netlify, GitHub Pages, or wherever your app already lives.",
    submitGuideRule1: 'Free to use, and no ads',
    submitGuideRule2: 'Works on a phone screen',
    submitGuideRule3: 'Does one small thing well',
    submitGuideRule4: 'The link stays up, so people can come back to it',
    deleteRequestLabel: 'Delete this request',
    confirmDeleteRequest: 'Delete this request? This cannot be undone.',
    translateBtn: '🌐 Translate',
    readMore: 'Read more',
    readLess: 'Show less',
    wantActive: '⭐ You want this',
    wantInactive: '⭐ I want this too',
    wantActiveTitle: 'Click to remove your vote',
    wantCountOne: '⭐ 1 person wants this',
    wantCountMany: function (n) { return '⭐ ' + n + ' people want this'; },
    sortNew: 'New',
    sortTrending: 'Trending',
    sortViral: 'Viral',
    sortPopular: 'Popular',
    likeActive: '❤️ Liked',
    likeInactive: '🤍 Like',
    likeCountOne: '❤️ 1 like',
    likeCountMany: function (n) { return '❤️ ' + n + ' likes'; },
    badgeBronze: 'Bronze',
    badgeSilver: 'Silver',
    badgeGold: 'Gold',
    buildThis: '🔨 Build this',
    copyAiPrompt: '✨ Copy AI prompt',
    toastPromptCopied: 'Prompt copied — paste it into Claude, Cursor, or any AI tool.',
    toastCopyFailed: 'Could not copy. Your browser blocked it.',
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
    ideasToggle: function (count) { return '💡 Ideas (' + count + ')'; },
    noIdeasYet: 'No ideas yet. Be the first to suggest a feature.',
    ideaPlaceholder: 'What if it also... ?',
    ideaAriaLabel: 'Idea for this request',
    postIdea: 'Post idea',
    signInToPostIdea: 'Sign in to suggest an idea',
    deleteIdeaLabel: 'Delete idea',
    confirmDeleteIdea: 'Delete this idea?',
    ideasModalTitle: 'Ideas for this request',
    ideasModalBody: 'Suggest a feature before anyone starts building.',
    ideasModalClose: 'Back to swiping',
    toastWriteIdeaFirst: 'Please write an idea first',
    toastIdeaPosted: 'Idea posted!',
    toastFailedPostIdea: 'Failed to post idea',
    toastIdeaDeleted: 'Idea deleted',
    toastFailedDeleteIdea: 'Failed to delete idea',
    navMatching: 'Matching',
    matchingDocTitle: 'Matching · CobbleWorks',
    matchingHeading: 'Matching',
    matchingSubtitle: 'One request per card. Not now, or making now.',
    matchingSignInTitle: 'Sign in to claim a request',
    matchingNotNow: 'Not now',
    matchingMakingNow: 'Making now',
    matchingUndo: 'Undo the last card',
    matchingHint: 'Drag the card sideways, or use the ← → keys.',
    matchingSearchingTitle: 'Looking for requests…',
    matchingSearchingBody: 'Picking out the ones nobody has built yet.',
    matchingLeft: function (n) { return n === 1 ? '1 card left' : n + ' cards left'; },
    matchingAlreadyBuilt: '✓ already built',
    matchingEmptyTitle: "That's the whole pile.",
    matchingEmptyBody: "You've been through every open request. Put the skipped ones back, or go post one of your own.",
    matchingReset: 'Deal them again',
    matchingGoRequests: 'Go to Requests',
    makingNowOne: '🔨 1 making now',
    makingNowMany: function (n) { return '🔨 ' + n + ' making now'; },
    claimTitle: "You're on it",
    claimBody: 'This request now shows "making now" to everyone. Here is the quickest way to finish it.',
    claimCopyPrompt: 'Copy the AI build prompt',
    claimSubmitLink: 'Submit the finished app →',
    claimKeepGoing: 'Keep swiping',
    toastSignInToClaim: 'Sign in to say you are making this',
    toastClaimUndone: 'Taken back — you are no longer marked as making it',
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

    searchPlaceholder: 'ミニアプリを検索...',
    searchButton: '🔍 アプリを検索',
    aiSearchButton: 'AIに探してもらう',
    aiSearchTitle: '何で検索すればいいか分からないとき',
    aiSearchHint: '検索ワードが思いつかないときは、やりたいことをそのまま書いてください。どの言語でもOKです。',
    aiSearching: 'ミニアプリを読んでいます…',
    aiResultsTitle: 'AIが選んだアプリ',
    aiMaybeThis: 'これかも？',
    aiMaybeThisToo: 'こちらも？',
    aiNoResults: '今のところ、それに合うミニアプリはありません。',
    aiPostRequest: 'リクエストとして投稿する →',
    aiErrorEmpty: '先にやりたいことを入力してください。',
    aiErrorLimitAnon: '今日の無料AI検索を使い切りました。ログインするともっと使えます。',
    aiErrorLimitUser: '今日のAI検索を使い切りました。また明日お試しください。',
    aiErrorGlobal: 'AI検索が本日の上限に達しました。また明日お試しください。',
    aiErrorGeneric: 'AI検索に失敗しました。もう一度お試しください。',
    aiClearResults: '閉じる',
    navHome: 'ホーム',
    navRequests: 'リクエスト',
    navApps: 'ミニアプリ',
    navYou: 'マイページ',
    howItWorksBtn: '使い方はこちら',
    guideSearchMock: '割り勘',
    guideStepLabel1: 'ステップ 1 / 3',
    guideStepLabel2: 'ステップ 2 / 3',
    guideStepLabel3: 'ステップ 3 / 3',
    guideStep1Title: '困りごとを投稿、または検索',
    guideStep1Body: '困っていることを普通の言葉で書くだけ。先に検索すれば、すでに誰かが作ったミニアプリが見つかるかもしれません。',
    guideStep2Title: '誰かがミニアプリを作る',
    guideStep2Body: 'リクエストを見た人が、それを解決する小さな無料ツールを作ります。公開されたらすぐに使えます。',
    guideStep3Title: '使ってみて、♡で保存',
    guideStep3Body: 'ミニアプリを開いて使ってみましょう。役に立ったら♡を押すと、お気に入りに入っていつでも呼び出せます。',
    guideBack: '戻る',
    guideNext: '次へ',
    guideStart: '使ってみる',
    guideClose: '閉じる',
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
    profileBioEmptyOther: '自己紹介はまだありません。',
    profileSubtitleOther: function (handle) { return handle + 'さんの公開情報と、作ったミニアプリです。'; },
    portfolioNoteOther: function (handle) { return handle + 'さんがCobbleWorksで公開しているミニアプリです。'; },
    noAppsFromThisPerson: '公開しているミニアプリはまだありません。',
    viewProfileOf: function (handle) { return handle + 'さんのプロフィールを見る'; },
    profileNotFoundTitle: 'プロフィールが見つかりません',
    profileNotFoundBody: 'このハンドルを使っている人はいません。リンクが作られたあとに変更されたのかもしれません。',
    browseMiniApps: 'ミニアプリを見る',

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
    seedSharedBy: function (date) { return 'CobbleWorks サンプル · ' + date; },
    seedBadge: 'サンプル',
    officialBadge: '運営',
    postedOn: function (date) { return date + 'に投稿'; },
    builtBy: function (name) { return name + 'さんが制作'; },
    externalAppNote: '外部サイトで開きます',
    submitGuideTitle: 'URLさえあれば出せます',
    submitGuideBody: 'AIで作ったアプリ、ここに置き直す必要はありません。Vercel・Netlify・GitHub Pagesなど、今あるURLをそのまま貼ってください。',
    submitGuideRule1: '無料で使えて、広告が無いこと',
    submitGuideRule2: 'スマホの画面で使えること',
    submitGuideRule3: '小さなことを、ひとつうまくやること',
    submitGuideRule4: 'あとから来た人も使えるように、リンクが生きていること',
    deleteRequestLabel: 'このリクエストを削除',
    confirmDeleteRequest: 'このリクエストを削除しますか？この操作は取り消せません。',
    translateBtn: '🌐 翻訳',
    readMore: '続きを読む',
    readLess: '閉じる',
    wantActive: '⭐ 欲しいと思っています',
    wantInactive: '⭐ 私も欲しい',
    wantActiveTitle: 'クリックして投票を取り消す',
    wantCountOne: '⭐ 1人が欲しいと思っています',
    wantCountMany: function (n) { return '⭐ ' + n + '人が欲しいと思っています'; },
    sortNew: '新着',
    sortTrending: 'トレンド',
    sortViral: 'バイラル',
    sortPopular: '人気',
    likeActive: '❤️ いいね済み',
    likeInactive: '🤍 いいね',
    likeCountOne: '❤️ 1件のいいね',
    likeCountMany: function (n) { return '❤️ ' + n + '件のいいね'; },
    badgeBronze: '銅バッジ',
    badgeSilver: '銀バッジ',
    badgeGold: '金バッジ',
    buildThis: '🔨 これを作る',
    copyAiPrompt: '✨ AI用の仕様書をコピー',
    toastPromptCopied: 'コピーしました。Claude・Cursorなど、お使いのAIツールに貼り付けてください。',
    toastCopyFailed: 'コピーできませんでした。ブラウザに拒否されたようです。',
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
    ideasToggle: function (count) { return '💡 アイデア（' + count + '件）'; },
    noIdeasYet: 'まだアイデアがありません。最初の提案をしてみましょう。',
    ideaPlaceholder: 'こういう機能はどう？',
    ideaAriaLabel: 'このリクエストへのアイデア',
    postIdea: 'アイデアを送る',
    signInToPostIdea: 'アイデアを送るにはログインが必要です',
    deleteIdeaLabel: 'アイデアを削除',
    confirmDeleteIdea: 'このアイデアを削除しますか？',
    ideasModalTitle: 'このリクエストへのアイデア',
    ideasModalBody: '誰かが作り始める前に、あったらいい機能を提案しましょう。',
    ideasModalClose: 'スワイプに戻る',
    toastWriteIdeaFirst: 'アイデアを入力してください',
    toastIdeaPosted: 'アイデアを送りました！',
    toastFailedPostIdea: 'アイデアの投稿に失敗しました',
    toastIdeaDeleted: 'アイデアを削除しました',
    toastFailedDeleteIdea: 'アイデアの削除に失敗しました',
    navMatching: 'マッチング',
    matchingDocTitle: 'マッチング · CobbleWorks',
    matchingHeading: 'マッチング',
    matchingSubtitle: 'カード1枚に1つのリクエスト。見送るか、作るかを選ぶだけ。',
    matchingSignInTitle: 'ログインすると「作る」と宣言できます',
    matchingNotNow: '今はいい',
    matchingMakingNow: '作ってる',
    matchingUndo: '1枚戻す',
    matchingHint: 'カードを横にドラッグ、または ← → キーで操作できます。',
    matchingSearchingTitle: 'リクエストを探しています…',
    matchingSearchingBody: 'まだ誰も作っていないものを選んでいます。',
    matchingLeft: function (n) { return 'あと' + n + '枚'; },
    matchingAlreadyBuilt: '✓ 作成済み',
    matchingEmptyTitle: '山札はここまで。',
    matchingEmptyBody: '今あるリクエストは全部見ました。見送ったものを戻すか、自分でリクエストを投稿してみましょう。',
    matchingReset: 'もう一度配る',
    matchingGoRequests: 'リクエスト一覧へ',
    makingNowOne: '🔨 1人が制作中',
    makingNowMany: function (n) { return '🔨 ' + n + '人が制作中'; },
    claimTitle: 'よろしくお願いします！',
    claimBody: 'このリクエストに「制作中」と表示されました。仕上げるいちばん早い道はこちらです。',
    claimCopyPrompt: 'AI用の指示文をコピー',
    claimSubmitLink: '完成したアプリを登録する →',
    claimKeepGoing: '次のカードへ',
    toastSignInToClaim: '「作る」と宣言するにはログインが必要です',
    toastClaimUndone: '取り消しました。制作中の表示も外れます',
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

    searchPlaceholder: 'Buscar mini apps...',
    searchButton: '🔍 Buscar apps',
    aiSearchButton: 'Pide a la IA que lo busque',
    aiSearchTitle: '¿No sabes qué buscar?',
    aiSearchHint: '¿No sabes qué escribir? Describe lo que quieres hacer, en cualquier idioma.',
    aiSearching: 'Revisando las mini apps…',
    aiResultsTitle: 'Elecciones de la IA',
    aiMaybeThis: '¿Quizá esta?',
    aiMaybeThisToo: '¿O esta?',
    aiNoResults: 'Todavía no hay una mini app para eso.',
    aiPostRequest: 'Publicarlo como solicitud →',
    aiErrorEmpty: 'Primero escribe lo que quieres hacer.',
    aiErrorLimitAnon: 'Has usado las búsquedas con IA gratuitas de hoy. Inicia sesión para tener más.',
    aiErrorLimitUser: 'Has usado las búsquedas con IA de hoy. Inténtalo mañana.',
    aiErrorGlobal: 'La búsqueda con IA alcanzó su límite diario. Inténtalo mañana.',
    aiErrorGeneric: 'La búsqueda con IA no funcionó. Inténtalo de nuevo.',
    aiClearResults: 'Cerrar',
    navHome: 'Inicio',
    navRequests: 'Solicitudes',
    navApps: 'Mini apps',
    navYou: 'Tú',
    howItWorksBtn: 'Ver cómo funciona',
    guideSearchMock: 'cuentas compartidas',
    guideStepLabel1: 'Paso 1 de 3',
    guideStepLabel2: 'Paso 2 de 3',
    guideStepLabel3: 'Paso 3 de 3',
    guideStep1Title: 'Publica un problema o busca',
    guideStep1Body: 'Cuenta lo que te cuesta con palabras normales. O busca primero: puede que ya exista una mini app para eso.',
    guideStep2Title: 'Alguien crea una mini app',
    guideStep2Body: 'Alguien toma la solicitud y crea una herramienta pequeña y gratuita. Podrás probarla en cuanto se publique.',
    guideStep3Title: 'Pruébala y guárdala con ♡',
    guideStep3Body: 'Abre la mini app y úsala. Si te sirve, toca ♡ y quedará en tus favoritos, lista cuando la necesites.',
    guideBack: 'Atrás',
    guideNext: 'Siguiente',
    guideStart: 'Empezar',
    guideClose: 'Cerrar',
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
    profileBioEmptyOther: 'Todavía no hay biografía.',
    profileSubtitleOther: function (handle) { return 'Información pública y las mini apps que ha creado ' + handle + '.'; },
    portfolioNoteOther: function (handle) { return 'Mini apps que ' + handle + ' ha compartido en CobbleWorks.'; },
    noAppsFromThisPerson: 'Todavía no ha compartido ninguna mini app.',
    viewProfileOf: function (handle) { return 'Ver el perfil de ' + handle; },
    profileNotFoundTitle: 'Perfil no encontrado',
    profileNotFoundBody: 'Nadie usa este identificador. Puede que lo haya cambiado después de crear el enlace.',
    browseMiniApps: 'Ver mini apps',

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
    seedSharedBy: function (date) { return 'Ejemplo de CobbleWorks · ' + date; },
    seedBadge: 'Ejemplo',
    officialBadge: 'Oficial',
    postedOn: function (date) { return 'Publicado el ' + date; },
    builtBy: function (name) { return 'Creado por ' + name; },
    externalAppNote: 'Se abre en un sitio externo',
    submitGuideTitle: 'Cualquier URL sirve',
    submitGuideBody: '¿Creaste algo con IA? No hace falta alojarlo aquí: pega el enlace de Vercel, Netlify, GitHub Pages o de donde ya viva tu app.',
    submitGuideRule1: 'Gratis y sin anuncios',
    submitGuideRule2: 'Funciona en la pantalla del móvil',
    submitGuideRule3: 'Hace bien una sola cosa pequeña',
    submitGuideRule4: 'El enlace sigue activo, para que puedan volver',
    deleteRequestLabel: 'Eliminar esta solicitud',
    confirmDeleteRequest: '¿Eliminar esta solicitud? Esta acción no se puede deshacer.',
    translateBtn: '🌐 Traducir',
    readMore: 'Leer más',
    readLess: 'Ver menos',
    wantActive: '⭐ Quieres esto',
    wantInactive: '⭐ Yo también quiero esto',
    wantActiveTitle: 'Haz clic para quitar tu voto',
    wantCountOne: '⭐ A 1 persona le interesa esto',
    wantCountMany: function (n) { return '⭐ A ' + n + ' personas les interesa esto'; },
    sortNew: 'Nuevo',
    sortTrending: 'Tendencia',
    sortViral: 'Viral',
    sortPopular: 'Popular',
    likeActive: '❤️ Te gusta',
    likeInactive: '🤍 Me gusta',
    likeCountOne: '❤️ A 1 persona le gusta',
    likeCountMany: function (n) { return '❤️ A ' + n + ' personas les gusta'; },
    badgeBronze: 'Bronce',
    badgeSilver: 'Plata',
    badgeGold: 'Oro',
    buildThis: '🔨 Crear esta app',
    copyAiPrompt: '✨ Copiar prompt para IA',
    toastPromptCopied: 'Prompt copiado: pégalo en Claude, Cursor o la herramienta de IA que uses.',
    toastCopyFailed: 'No se pudo copiar. Tu navegador lo bloqueó.',
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
    ideasToggle: function (count) { return '💡 Ideas (' + count + ')'; },
    noIdeasYet: 'Aún no hay ideas. Sé el primero en proponer una función.',
    ideaPlaceholder: '¿Y si además...?',
    ideaAriaLabel: 'Idea para esta solicitud',
    postIdea: 'Enviar idea',
    signInToPostIdea: 'Inicia sesión para proponer una idea',
    deleteIdeaLabel: 'Eliminar idea',
    confirmDeleteIdea: '¿Eliminar esta idea?',
    ideasModalTitle: 'Ideas para esta solicitud',
    ideasModalBody: 'Propón una función antes de que alguien empiece a construirla.',
    ideasModalClose: 'Volver a deslizar',
    toastWriteIdeaFirst: 'Escribe una idea primero',
    toastIdeaPosted: '¡Idea enviada!',
    toastFailedPostIdea: 'No se pudo enviar la idea',
    toastIdeaDeleted: 'Idea eliminada',
    toastFailedDeleteIdea: 'No se pudo eliminar la idea',
    navMatching: 'Emparejar',
    matchingDocTitle: 'Emparejar · CobbleWorks',
    matchingHeading: 'Emparejar',
    matchingSubtitle: 'Una solicitud por tarjeta. Ahora no, o la estoy haciendo.',
    matchingSignInTitle: 'Inicia sesión para tomar una solicitud',
    matchingNotNow: 'Ahora no',
    matchingMakingNow: 'La estoy haciendo',
    matchingUndo: 'Deshacer la última tarjeta',
    matchingHint: 'Arrastra la tarjeta a los lados o usa las teclas ← →.',
    matchingSearchingTitle: 'Buscando solicitudes…',
    matchingSearchingBody: 'Eligiendo las que nadie ha construido todavía.',
    matchingLeft: function (n) { return n === 1 ? 'Queda 1 tarjeta' : 'Quedan ' + n + ' tarjetas'; },
    matchingAlreadyBuilt: '✓ ya construida',
    matchingEmptyTitle: 'Eso es todo el montón.',
    matchingEmptyBody: 'Has visto todas las solicitudes abiertas. Devuelve las que dejaste pasar o publica la tuya.',
    matchingReset: 'Repartir de nuevo',
    matchingGoRequests: 'Ir a Solicitudes',
    makingNowOne: '🔨 1 persona la está haciendo',
    makingNowMany: function (n) { return '🔨 ' + n + ' personas la están haciendo'; },
    claimTitle: 'Manos a la obra',
    claimBody: 'Ahora esta solicitud muestra "la están haciendo" a todo el mundo. Esta es la vía más rápida para terminarla.',
    claimCopyPrompt: 'Copiar el prompt para la IA',
    claimSubmitLink: 'Publicar la app terminada →',
    claimKeepGoing: 'Seguir viendo',
    toastSignInToClaim: 'Inicia sesión para decir que la estás haciendo',
    toastClaimUndone: 'Deshecho: ya no apareces como que la estás haciendo',
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

    searchPlaceholder: '搜索迷你应用…',
    searchButton: '🔍 搜索应用',
    aiSearchButton: '让 AI 帮你找',
    aiSearchTitle: '不知道该搜什么？',
    aiSearchHint: '不知道输入什么？直接描述你想做的事，任何语言都可以。',
    aiSearching: '正在浏览迷你应用…',
    aiResultsTitle: 'AI 推荐',
    aiMaybeThis: '可能是这个？',
    aiMaybeThisToo: '这个也许也行？',
    aiNoResults: '目前还没有适合的迷你应用。',
    aiPostRequest: '发布为需求 →',
    aiErrorEmpty: '请先输入你想做的事。',
    aiErrorLimitAnon: '今天的免费 AI 搜索次数已用完。登录后可以使用更多。',
    aiErrorLimitUser: '今天的 AI 搜索次数已用完，请明天再试。',
    aiErrorGlobal: 'AI 搜索已达今日上限，请明天再试。',
    aiErrorGeneric: 'AI 搜索失败，请重试。',
    aiClearResults: '关闭',
    navHome: '首页',
    navRequests: '需求',
    navApps: '迷你应用',
    navYou: '我的',
    howItWorksBtn: '查看使用方法',
    guideSearchMock: 'AA 记账',
    guideStepLabel1: '第 1 步 / 共 3 步',
    guideStepLabel2: '第 2 步 / 共 3 步',
    guideStepLabel3: '第 3 步 / 共 3 步',
    guideStep1Title: '发布问题，或先搜索',
    guideStep1Body: '用平常的话写下你的困扰。也可以先搜索，也许已经有人做好了相应的迷你应用。',
    guideStep2Title: '有人做出迷你应用',
    guideStep2Body: '有人看到需求后，会做一个免费的小工具。发布之后你马上就能使用。',
    guideStep3Title: '试用后用 ♡ 收藏',
    guideStep3Body: '打开迷你应用试试看。觉得好用就点 ♡，它会留在收藏里，随时都能打开。',
    guideBack: '上一步',
    guideNext: '下一步',
    guideStart: '开始使用',
    guideClose: '关闭',
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
    profileBioEmptyOther: '暂无简介。',
    profileSubtitleOther: function (handle) { return handle + ' 的公开信息，以及发布的迷你应用。'; },
    portfolioNoteOther: function (handle) { return handle + ' 在 CobbleWorks 上发布的迷你应用。'; },
    noAppsFromThisPerson: '还没有发布任何迷你应用。',
    viewProfileOf: function (handle) { return '查看 ' + handle + ' 的个人主页'; },
    profileNotFoundTitle: '找不到该个人主页',
    profileNotFoundBody: '没有人在使用这个用户名。可能在生成链接之后被改掉了。',
    browseMiniApps: '浏览迷你应用',

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
    seedSharedBy: function (date) { return 'CobbleWorks 示例 · ' + date; },
    seedBadge: '示例',
    officialBadge: '官方',
    postedOn: function (date) { return '发布于 ' + date; },
    builtBy: function (name) { return name + ' 制作'; },
    externalAppNote: '将在外部网站打开',
    submitGuideTitle: '任何网址都可以',
    submitGuideBody: '用 AI 做好了应用？不必重新部署到这里——直接粘贴 Vercel、Netlify、GitHub Pages 等现有的链接即可。',
    submitGuideRule1: '免费使用，没有广告',
    submitGuideRule2: '在手机屏幕上也能用',
    submitGuideRule3: '把一件小事做好',
    submitGuideRule4: '链接保持有效，让人以后还能再用',
    deleteRequestLabel: '删除这个需求',
    confirmDeleteRequest: '删除这个需求吗？此操作无法撤销。',
    translateBtn: '🌐 翻译',
    readMore: '展开全文',
    readLess: '收起',
    wantActive: '⭐ 你想要这个',
    wantInactive: '⭐ 我也想要',
    wantActiveTitle: '点击取消你的投票',
    wantCountOne: '⭐ 1 人想要这个',
    wantCountMany: function (n) { return '⭐ ' + n + ' 人想要这个'; },
    sortNew: '最新',
    sortTrending: '热门趋势',
    sortViral: '爆款',
    sortPopular: '人气',
    likeActive: '❤️ 已点赞',
    likeInactive: '🤍 点赞',
    likeCountOne: '❤️ 1 人点赞',
    likeCountMany: function (n) { return '❤️ ' + n + ' 人点赞'; },
    badgeBronze: '铜牌',
    badgeSilver: '银牌',
    badgeGold: '金牌',
    buildThis: '🔨 开发这个',
    copyAiPrompt: '✨ 复制 AI 提示词',
    toastPromptCopied: '已复制。粘贴到 Claude、Cursor 或你使用的 AI 工具里即可。',
    toastCopyFailed: '复制失败，浏览器阻止了这个操作。',
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
    ideasToggle: function (count) { return '💡 点子（' + count + '）'; },
    noIdeasYet: '还没有点子。来提出第一个功能建议吧。',
    ideaPlaceholder: '要是还能……？',
    ideaAriaLabel: '对这条需求的点子',
    postIdea: '发送点子',
    signInToPostIdea: '登录后才能提出点子',
    deleteIdeaLabel: '删除点子',
    confirmDeleteIdea: '要删除这个点子吗？',
    ideasModalTitle: '对这条需求的点子',
    ideasModalBody: '在有人开始动手之前，先提出你想要的功能。',
    ideasModalClose: '返回滑动',
    toastWriteIdeaFirst: '请先输入点子',
    toastIdeaPosted: '点子已发送！',
    toastFailedPostIdea: '点子发送失败',
    toastIdeaDeleted: '已删除点子',
    toastFailedDeleteIdea: '点子删除失败',
    navMatching: '配对',
    matchingDocTitle: '配对 · CobbleWorks',
    matchingHeading: '配对',
    matchingSubtitle: '一张卡片一个需求。暂时跳过，或者现在就做。',
    matchingSignInTitle: '登录后即可认领需求',
    matchingNotNow: '暂时不做',
    matchingMakingNow: '我来做',
    matchingUndo: '撤销上一张',
    matchingHint: '左右拖动卡片，也可以用 ← → 键。',
    matchingSearchingTitle: '正在寻找需求…',
    matchingSearchingBody: '正在挑出还没有人做过的那些。',
    matchingLeft: function (n) { return '还剩 ' + n + ' 张'; },
    matchingAlreadyBuilt: '✓ 已有应用',
    matchingEmptyTitle: '这一叠看完了。',
    matchingEmptyBody: '所有待做的需求都看过了。把跳过的放回来，或者自己发一个需求。',
    matchingReset: '重新发牌',
    matchingGoRequests: '前往需求列表',
    makingNowOne: '🔨 1 人正在做',
    makingNowMany: function (n) { return '🔨 ' + n + ' 人正在做'; },
    claimTitle: '交给你了',
    claimBody: '这个需求现在会向所有人显示"正在制作"。下面是最快的完成方式。',
    claimCopyPrompt: '复制给 AI 的提示词',
    claimSubmitLink: '提交做好的应用 →',
    claimKeepGoing: '继续看下一张',
    toastSignInToClaim: '登录后才能表示你正在做',
    toastClaimUndone: '已撤销，不再显示你正在做',
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

    searchPlaceholder: 'मिनी ऐप्स खोजें...',
    searchButton: '🔍 ऐप्स खोजें',
    aiSearchButton: 'AI से ढूंढवाएँ',
    aiSearchTitle: 'क्या खोजें, समझ नहीं आ रहा?',
    aiSearchHint: 'क्या लिखें समझ नहीं आ रहा? आप जो करना चाहते हैं वह किसी भी भाषा में लिखें।',
    aiSearching: 'मिनी ऐप्स देखे जा रहे हैं…',
    aiResultsTitle: 'AI की पसंद',
    aiMaybeThis: 'शायद यह?',
    aiMaybeThisToo: 'यह भी?',
    aiNoResults: 'अभी इसके लिए कोई मिनी ऐप नहीं है।',
    aiPostRequest: 'इसे रिक्वेस्ट के रूप में भेजें →',
    aiErrorEmpty: 'पहले लिखें कि आप क्या करना चाहते हैं।',
    aiErrorLimitAnon: 'आज की मुफ़्त AI खोजें खत्म हो गईं। और पाने के लिए साइन इन करें।',
    aiErrorLimitUser: 'आज की AI खोजें खत्म हो गईं। कल फिर कोशिश करें।',
    aiErrorGlobal: 'AI खोज आज की सीमा तक पहुँच गई। कल फिर कोशिश करें।',
    aiErrorGeneric: 'AI खोज नहीं चली। फिर से कोशिश करें।',
    aiClearResults: 'बंद करें',
    navHome: 'होम',
    navRequests: 'रिक्वेस्ट',
    navApps: 'मिनी ऐप्स',
    navYou: 'आप',
    howItWorksBtn: 'इस्तेमाल कैसे करें',
    guideSearchMock: 'बिल बाँटना',
    guideStepLabel1: 'चरण 1 / 3',
    guideStepLabel2: 'चरण 2 / 3',
    guideStepLabel3: 'चरण 3 / 3',
    guideStep1Title: 'समस्या पोस्ट करें, या खोजें',
    guideStep1Body: 'अपनी परेशानी आसान शब्दों में लिखें। या पहले खोजें — शायद उसके लिए मिनी ऐप पहले से मौजूद हो।',
    guideStep2Title: 'कोई मिनी ऐप बनाता है',
    guideStep2Body: 'कोई रिक्वेस्ट उठाकर उसके लिए एक छोटा, मुफ़्त टूल बनाता है। पब्लिश होते ही आप उसे आज़मा सकते हैं।',
    guideStep3Title: 'आज़माएँ, फिर ♡ से सहेजें',
    guideStep3Body: 'मिनी ऐप खोलें और इस्तेमाल करें। काम आए तो ♡ दबाएँ — यह आपके पसंदीदा में रहेगा, जब चाहें खोल लें।',
    guideBack: 'पीछे',
    guideNext: 'आगे',
    guideStart: 'शुरू करें',
    guideClose: 'बंद करें',
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
    profileBioEmptyOther: 'अभी तक कोई बायो नहीं है।',
    profileSubtitleOther: function (handle) { return handle + ' की सार्वजनिक जानकारी और बनाए गए मिनी ऐप्स।'; },
    portfolioNoteOther: function (handle) { return handle + ' ने CobbleWorks पर जो मिनी ऐप्स साझा किए हैं।'; },
    noAppsFromThisPerson: 'अभी तक कोई मिनी ऐप साझा नहीं किया गया है।',
    viewProfileOf: function (handle) { return handle + ' की प्रोफ़ाइल देखें'; },
    profileNotFoundTitle: 'प्रोफ़ाइल नहीं मिली',
    profileNotFoundBody: 'इस हैंडल का कोई उपयोग नहीं कर रहा। हो सकता है लिंक बनने के बाद इसे बदल दिया गया हो।',
    browseMiniApps: 'मिनी ऐप्स देखें',

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
    seedSharedBy: function (date) { return 'CobbleWorks नमूना · ' + date; },
    seedBadge: 'नमूना',
    officialBadge: 'आधिकारिक',
    postedOn: function (date) { return date + ' को पोस्ट किया गया'; },
    builtBy: function (name) { return name + ' द्वारा बनाया गया'; },
    externalAppNote: 'बाहरी साइट पर खुलेगा',
    submitGuideTitle: 'कोई भी URL चलेगा',
    submitGuideBody: 'AI से कुछ बनाया है? उसे यहाँ दोबारा होस्ट करने की ज़रूरत नहीं — Vercel, Netlify, GitHub Pages या जहाँ भी आपकी ऐप पहले से है, वहाँ का लिंक चिपका दें।',
    submitGuideRule1: 'मुफ़्त हो, और कोई विज्ञापन न हो',
    submitGuideRule2: 'फ़ोन की स्क्रीन पर काम करे',
    submitGuideRule3: 'एक छोटा काम अच्छे से करे',
    submitGuideRule4: 'लिंक चालू रहे, ताकि लोग दोबारा आ सकें',
    deleteRequestLabel: 'इस रिक्वेस्ट को हटाएं',
    confirmDeleteRequest: 'इस रिक्वेस्ट को हटाएं? इसे वापस नहीं लाया जा सकता।',
    translateBtn: '🌐 अनुवाद करें',
    readMore: 'और पढ़ें',
    readLess: 'कम दिखाएं',
    wantActive: '⭐ आप इसे चाहते हैं',
    wantInactive: '⭐ मुझे भी यह चाहिए',
    wantActiveTitle: 'अपना वोट हटाने के लिए क्लिक करें',
    wantCountOne: '⭐ 1 व्यक्ति को यह चाहिए',
    wantCountMany: function (n) { return '⭐ ' + n + ' लोगों को यह चाहिए'; },
    sortNew: 'नया',
    sortTrending: 'ट्रेंडिंग',
    sortViral: 'वायरल',
    sortPopular: 'लोकप्रिय',
    likeActive: '❤️ पसंद किया',
    likeInactive: '🤍 पसंद करें',
    likeCountOne: '❤️ 1 लाइक',
    likeCountMany: function (n) { return '❤️ ' + n + ' लाइक्स'; },
    badgeBronze: 'कांस्य बैज',
    badgeSilver: 'रजत बैज',
    badgeGold: 'स्वर्ण बैज',
    buildThis: '🔨 इसे बनाएं',
    copyAiPrompt: '✨ AI प्रॉम्प्ट कॉपी करें',
    toastPromptCopied: 'कॉपी हो गया — इसे Claude, Cursor या अपने किसी भी AI टूल में पेस्ट करें।',
    toastCopyFailed: 'कॉपी नहीं हो सका। आपके ब्राउज़र ने इसे रोक दिया।',
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
    ideasToggle: function (count) { return '💡 सुझाव (' + count + ')'; },
    noIdeasYet: 'अभी तक कोई सुझाव नहीं है। पहला फ़ीचर सुझाने वाले बनें।',
    ideaPlaceholder: 'क्या हो अगर यह...?',
    ideaAriaLabel: 'इस अनुरोध के लिए सुझाव',
    postIdea: 'सुझाव भेजें',
    signInToPostIdea: 'सुझाव देने के लिए साइन इन करें',
    deleteIdeaLabel: 'सुझाव हटाएँ',
    confirmDeleteIdea: 'क्या यह सुझाव हटाना है?',
    ideasModalTitle: 'इस अनुरोध के लिए सुझाव',
    ideasModalBody: 'कोई बनाना शुरू करे, उससे पहले फ़ीचर सुझाएँ।',
    ideasModalClose: 'स्वाइप पर वापस',
    toastWriteIdeaFirst: 'पहले सुझाव लिखें',
    toastIdeaPosted: 'सुझाव भेजा गया!',
    toastFailedPostIdea: 'सुझाव भेजने में विफल',
    toastIdeaDeleted: 'सुझाव हटा दिया गया',
    toastFailedDeleteIdea: 'सुझाव हटाने में विफल',
    navMatching: 'मैचिंग',
    matchingDocTitle: 'मैचिंग · CobbleWorks',
    matchingHeading: 'मैचिंग',
    matchingSubtitle: 'एक कार्ड, एक रिक्वेस्ट। अभी नहीं, या अभी बना रहे हैं।',
    matchingSignInTitle: 'रिक्वेस्ट लेने के लिए साइन इन करें',
    matchingNotNow: 'अभी नहीं',
    matchingMakingNow: 'अभी बना रहे हैं',
    matchingUndo: 'पिछला कार्ड वापस लाएँ',
    matchingHint: 'कार्ड को दाएँ-बाएँ खींचें, या ← → कुंजियाँ इस्तेमाल करें।',
    matchingSearchingTitle: 'रिक्वेस्ट ढूंढी जा रही हैं…',
    matchingSearchingBody: 'वे छांटी जा रही हैं जिन्हें अभी तक किसी ने नहीं बनाया।',
    matchingLeft: function (n) { return n === 1 ? '1 कार्ड बाकी' : n + ' कार्ड बाकी'; },
    matchingAlreadyBuilt: '✓ पहले से बना है',
    matchingEmptyTitle: 'बस, यही पूरा ढेर था।',
    matchingEmptyBody: 'आपने हर खुली रिक्वेस्ट देख ली। छोड़ी हुई वापस लाएँ, या अपनी एक रिक्वेस्ट पोस्ट करें।',
    matchingReset: 'फिर से बाँटें',
    matchingGoRequests: 'रिक्वेस्ट पर जाएँ',
    makingNowOne: '🔨 1 व्यक्ति बना रहा है',
    makingNowMany: function (n) { return '🔨 ' + n + ' लोग बना रहे हैं'; },
    claimTitle: 'यह अब आपका है',
    claimBody: 'इस रिक्वेस्ट पर अब सबको "बना रहे हैं" दिखेगा। इसे पूरा करने का सबसे तेज़ तरीका यह है।',
    claimCopyPrompt: 'AI के लिए प्रॉम्प्ट कॉपी करें',
    claimSubmitLink: 'बनी हुई ऐप जमा करें →',
    claimKeepGoing: 'आगे देखते रहें',
    toastSignInToClaim: 'यह बताने के लिए साइन इन करें कि आप इसे बना रहे हैं',
    toastClaimUndone: 'वापस लिया — अब आप बनाने वालों में नहीं दिखेंगे',
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
let selectedSort = 'new'; // Mini Apps一覧の並び順: new / trending / viral / popular

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
let cachedLikes = []; // { appId, userId, createdAt }
let cachedComments = []; // { id, appId, userId, authorName, text, replyToId, createdAt }
let cachedClaims = []; // { requestId, userId } … Matchingで「今作っている」と宣言した人
let cachedRequestComments = []; // { id, requestId, userId, authorName, text, createdAt } … リクエストへのアイデア

// リクエスト一覧のページ送り用の状態
const REQUESTS_PAGE_SIZE = 30;
let requestsPage = 1;
let lastRequestsQuery = null; // 検索文字列が変わったときだけ1ページ目に戻すために使う

// Mini Apps一覧のページ送り用の状態
const MINI_APPS_PAGE_SIZE = 20;
let appsPage = 1;
let lastAppsQuery = null; // 検索文字列 or カテゴリが変わったときだけ1ページ目に戻すために使う
let lastAppsCategory = null;
let lastAppsSort = null;

// ユーザー入力の自由記述（problem/desired_features/target_users等）を、選択中の言語の翻訳列があればそちらを、
// なければ英語の原文にフォールバックして返す。アプリ名(name)は対象外（ブランド名として扱う）
function pickLocalized(row, field) {
  const lang = getLang();
  if (lang === 'en') return row[field];
  return row[field + '_' + lang] || row[field];
}

// requests / mini_apps をSupabaseから取得し、cachedRequests / cachedAppsを更新する
async function loadSharedData() {
  // 6種類の読み込みを同時に投げる。
  // 1つずつawaitで順番待ちすると通信時間が足し算になり、合計2秒以上かかっていた。
  const [
    { data: requestRows, error: requestError },
    { data: appRows, error: appError },
    { data: wantRows, error: wantError },
    { data: ratingRows, error: ratingError },
    { data: likeRows, error: likeError },
    { data: claimRows, error: claimError }
  ] = await Promise.all([
    supabaseClient
      .from('requests')
      .select('*, profiles!requests_owner_id_fkey(handle)')
      .order('created_at', { ascending: true }),
    supabaseClient
      .from('mini_apps')
      .select('*, profiles!mini_apps_owner_id_fkey(handle, avatar_url)')
      .order('created_at', { ascending: true }),
    supabaseClient
      .from('wants')
      .select('request_id, user_id'),
    supabaseClient
      .from('ratings')
      .select('app_id, user_id, stars'),
    supabaseClient
      .from('likes')
      .select('app_id, user_id, created_at'),
    supabaseClient
      .from('request_claims')
      .select('request_id, user_id'),
    loadComments(), // コメントも同時に読む（結果はcachedCommentsに入るので戻り値は使わない）
    loadRequestComments() // リクエストへのアイデアも同じく（結果はcachedRequestCommentsに入る）
  ]);

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
        createdAtRaw: row.created_at, // 並び替え用。表示にはcreatedAtを使う
        ownerId: row.owner_id,
        postedBy: row.profiles ? row.profiles.handle : null,
        isSeed: row.is_seed === true
      };
    });
  }

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
        postedBy: row.profiles ? row.profiles.handle : null,
        postedByAvatar: row.profiles ? row.profiles.avatar_url : null
      };
    });
  }

  if (wantError) {
    console.error('Failed to load wants from Supabase:', wantError.message);
    cachedWants = [];
  } else {
    cachedWants = (wantRows || []).map(function (row) {
      return { requestId: row.request_id, userId: row.user_id };
    });
  }

  if (ratingError) {
    console.error('Failed to load ratings from Supabase:', ratingError.message);
    cachedRatings = [];
  } else {
    cachedRatings = (ratingRows || []).map(function (row) {
      return { appId: row.app_id, userId: row.user_id, stars: row.stars };
    });
  }

  if (likeError) {
    console.error('Failed to load likes from Supabase:', likeError.message);
    cachedLikes = [];
  } else {
    cachedLikes = (likeRows || []).map(function (row) {
      return { appId: row.app_id, userId: row.user_id, createdAt: row.created_at };
    });
  }

  // request_claimsは0031のマイグレーションで追加される。未実行でもページが壊れないよう、
  // エラーのときは「宣言ゼロ」として扱うだけにする。
  if (claimError) {
    console.error('Failed to load request claims from Supabase:', claimError.message);
    cachedClaims = [];
  } else {
    cachedClaims = (claimRows || []).map(function (row) {
      return { requestId: row.request_id, userId: row.user_id };
    });
  }

  saveSidebarAppCache(); // 次回リロード時にサイドバーを即描画するための控え
}

const COMMENT_COLUMNS = 'id, app_id, user_id, author_name, text, reply_to_id, created_at, profiles(handle)';

// アプリへのコメント(および作者からの返信)をSupabaseから読み込み、cachedCommentsを更新する
async function loadComments() {
  // is_official列は0030のマイグレーションで追加される。
  // マイグレーション未実行の状態でこの列を指定するとクエリ自体がエラーになり、
  // コメント欄が丸ごと見えなくなる。列が無いときだけ列なしで再取得する。
  let { data: commentRows, error: commentError } = await supabaseClient
    .from('app_comments')
    .select(COMMENT_COLUMNS + ', is_official')
    .order('created_at', { ascending: true });

  // 42703 = undefined_column。通信エラー等では再取得しない
  const columnMissing = commentError
    && (commentError.code === '42703' || (commentError.message || '').includes('is_official'));

  if (columnMissing) {
    const retry = await supabaseClient
      .from('app_comments')
      .select(COMMENT_COLUMNS)
      .order('created_at', { ascending: true });
    commentRows = retry.data;
    commentError = retry.error;
  }

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
      isOfficial: row.is_official === true,
      replyToId: row.reply_to_id,
      createdAt: new Date(row.created_at).toLocaleDateString('en-US')
    };
  });
}

// リクエストへのアイデア(作る前の機能提案)をSupabaseから読み込み、cachedRequestCommentsを更新する
async function loadRequestComments() {
  const { data: rows, error } = await supabaseClient
    .from('request_comments')
    .select('id, request_id, user_id, text, created_at, profiles(handle)')
    .order('created_at', { ascending: true });

  // request_commentsは0032のマイグレーションで追加される。
  // 未実行の環境でもページが壊れないよう、エラーのときは「アイデア0件」として扱う。
  if (error) {
    console.error('Failed to load request ideas from Supabase:', error.message);
    cachedRequestComments = [];
    return;
  }

  cachedRequestComments = (rows || []).map(function (row) {
    return {
      id: row.id,
      requestId: row.request_id,
      // 投稿はログイン必須なので、名前は必ずハンドル名から取れる
      ownerId: row.user_id,
      authorName: row.profiles ? row.profiles.handle : null,
      text: row.text,
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
  refreshMatchingDeck();
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

// テキストを検索用の単語配列に分解する。
//
// 英語は空白で単語に切れるが、日本語・中国語には単語の区切りが無い。
// 以前は a-z0-9 以外をすべて区切り文字として捨てていたため、日本語で検索すると
// 単語が0個になり、サジェストが必ず0件になっていた。
// そこで日本語・中国語・韓国語の部分は「2文字ずつ」に切り出して単語の代わりにする。
// 例:「持ち物」→「持ち」「ち物」。説明文側も同じ切り方をすれば部分一致で拾える。
const CJK_RUN_PATTERN = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]+/g;

function toSearchWords(text) {
  const lower = (text || '').toLowerCase();

  // 英数字の単語（2文字以下はノイズになりやすいので除く）
  const words = lower.split(/[^a-z0-9]+/).filter(function (word) { return word.length >= 3; });

  // 日本語などの連続部分を2文字ずつに切り出す
  (lower.match(CJK_RUN_PATTERN) || []).forEach(function (run) {
    if (run.length === 1) {
      words.push(run);
      return;
    }
    for (let i = 0; i + 2 <= run.length; i++) {
      words.push(run.slice(i, i + 2));
    }
  });

  return words;
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
  // 「株」のような漢字1文字での検索。説明文側は2文字ずつに切ってあるので、
  // その中に含まれていれば一致とみなす（英数字は3文字未満を捨てているのでここには来ない）
  if (qWord.length === 1 && aWord.includes(qWord)) return true;
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

    const glyph = createAppGlyph(app.url);
    if (glyph) item.appendChild(glyph);
    item.appendChild(name);
    item.appendChild(category);
    item.appendChild(desc);
    box.appendChild(item);
  });

  box.hidden = false;
}

// ページ読み込み完了後に一覧を表示する
/* ===========================================================
   使い方ガイド：画面に重ねて3枚のスライドを見せるモーダル
   初めて来た人には自動で開き、2回目以降はボタンからだけ開く
   =========================================================== */
let guideIndex = 0; // いま何枚目を見せているか（0始まり）
let guideLastFocused = null; // 開く前にどこを触っていたか（閉じたら戻すため）

function showGuideSlide(index) {
  const slides = document.querySelectorAll('.guide-slide');
  const dots = document.querySelectorAll('.guide-dot');
  if (!slides.length) return;

  guideIndex = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach(function (slide, i) {
    slide.hidden = i !== guideIndex;
  });
  dots.forEach(function (dot, i) {
    dot.classList.toggle('guide-dot--active', i === guideIndex);
  });

  const prevBtn = document.getElementById('guidePrevBtn');
  const nextLabel = document.getElementById('guideNextLabel');
  if (prevBtn) prevBtn.disabled = guideIndex === 0;
  // 最後の1枚では「次へ」ではなく「使ってみる」にして、押すと閉じる
  if (nextLabel) {
    nextLabel.textContent = guideIndex === slides.length - 1
      ? (t.guideStart || 'Start looking')
      : (t.guideNext || 'Next');
  }
}

function openGuide() {
  const modal = document.getElementById('guideModal');
  if (!modal) return;
  guideLastFocused = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden'; // 後ろのページが動かないようにする
  showGuideSlide(0);
  const closeBtn = document.getElementById('guideCloseBtn');
  if (closeBtn) closeBtn.focus();
}

function closeGuide() {
  const modal = document.getElementById('guideModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (guideLastFocused && typeof guideLastFocused.focus === 'function') {
    guideLastFocused.focus();
  }
}

function initHowItWorksGuide() {
  const modal = document.getElementById('guideModal');
  const openBtn = document.getElementById('howItWorksBtn');
  if (!modal || !openBtn) return; // トップページ以外では何もしない

  openBtn.addEventListener('click', openGuide);

  const closeBtn = document.getElementById('guideCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeGuide);

  const prevBtn = document.getElementById('guidePrevBtn');
  if (prevBtn) prevBtn.addEventListener('click', function () {
    showGuideSlide(guideIndex - 1);
  });

  const nextBtn = document.getElementById('guideNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', function () {
    const last = document.querySelectorAll('.guide-slide').length - 1;
    if (guideIndex >= last) closeGuide();
    else showGuideSlide(guideIndex + 1);
  });

  // 背景の暗い部分を押したら閉じる（中身を押したときは閉じない）
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeGuide();
  });

  // キーボードでも操作できるようにする（Esc＝閉じる、←→＝前後の枚）
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeGuide();
    else if (e.key === 'ArrowRight') showGuideSlide(guideIndex + 1);
    else if (e.key === 'ArrowLeft') showGuideSlide(guideIndex - 1);
  });

  showGuideSlide(0);

  // 自動では開かない。トップの上半分がランディングになり、そこで使い方を説明しているため、
  // 初見の人にモーダルをかぶせるとランディングが読めなくなる。
  // 「See how it works」ボタンからは今までどおり開ける。
}

document.addEventListener('DOMContentLoaded', async function () {
  applyStaticTranslations();
  initHowItWorksGuide();
  initLpRail(); // 画面右の「下に実画面がある」目印
  initLpFaq(); // FAQ：スマホ幅のときだけ折りたたむ

  // トップページの検索欄から遷移してきた場合、URLのqパラメータを検索欄に反映する
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const searchField = document.getElementById('searchInput');
  if (searchField && initialQuery) {
    searchField.value = initialQuery;
  }

  // サイドバーの「最近使ったアプリ」「お気に入り」は、前回の控えを使って
  // 通信を待たずに先に描いておく（下のloadSharedData後に最新版で描き直す）
  renderRecentApps();
  renderFavoriteApps();

  // 一覧を描画する前に、Supabaseからrequests/mini_appsを読み込んでおく
  await loadSharedData();

  // profile.html?u=ハンドル で開かれていれば、その人のプロフィールも先に読んでおく
  await loadViewedProfile();

  renderRequests(initialQuery);
  populateRequestDropdown();
  renderApps(initialQuery);
  renderYourApps();
  renderRecentApps();
  renderFavoriteApps();
  renderPopularApps();
  renderLandingPage(); // トップのランディング部分を実データで埋める
  initMatchingPage(); // Matchingページのときだけ、リクエストの山札を用意する
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
  // トップページはミニアプリ、Requestsページはリクエストと、そのページの一覧だけが絞り込まれる
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

  // 検索はその場で絞り込むだけなので、Enterやボタンでページ遷移はさせない
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAppSuggestions();
      renderApps(searchField ? searchField.value.trim() : '');
      const appsListSection = document.getElementById('apps-list-section');
      if (appsListSection) appsListSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 検索欄の外をクリックしたら、サジェストの候補は閉じる
  document.addEventListener('click', function (e) {
    const form = document.getElementById('searchForm');
    if (form && !form.contains(e.target)) hideAppSuggestions();
  });

  // 並び替えタブ：押した並び順でMini Apps一覧を並び替える
  const sortTabs = document.getElementById('sortTabs');
  if (sortTabs) {
    sortTabs.addEventListener('click', function (e) {
      const tab = e.target.closest('.sort-tab');
      if (!tab) return;
      selectedSort = tab.dataset.sort;
      sortTabs.querySelectorAll('.sort-tab').forEach(function (btn) {
        btn.classList.toggle('sort-tab--active', btn === tab);
      });
      renderApps(searchField ? searchField.value.trim() : '');
    });
  }

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

// 「こちらも関連するかも」に出す最大件数（多すぎると読みづらいので絞る）
const MAX_RELATED_APPS = 5;

// 正式に紐づいていないが、内容が近そうなミニアプリを探す（一致が多い順に最大5件）
function getRelatedApps(request, linkedApps) {
  // 古い投稿にしか無い項目は空文字として扱う
  const requestWords = new Set(tokenize([
    request.problem || '',
    request.desiredFeatures || '',
    request.targetUsers || '',
    request.currentWorkaround || ''
  ].join(' ')));

  const linkedIds = linkedApps.map(function (app) { return String(app.id); });

  const scored = [];
  getApps().forEach(function (app) {
    if (linkedIds.indexOf(String(app.id)) !== -1) return;

    const appWords = tokenize([app.name, app.description, app.targetUsers].join(' '));
    const matched = new Set();
    appWords.forEach(function (word) {
      if (requestWords.has(word)) matched.add(word);
    });
    if (matched.size >= 2) scored.push({ app: app, score: matched.size });
  });

  // 一致した単語が多いものほど関連が強いとみなして先頭に置く
  scored.sort(function (a, b) { return b.score - a.score; });

  return scored.slice(0, MAX_RELATED_APPS).map(function (item) { return item.app; });
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

// 文字列をクリップボードへコピーする。成功したかどうかを返す
async function copyTextToClipboard(text) {
  // https（本番）ではこちらが使える
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // 権限が下りなかった場合は下の方式を試す
    }
  }

  // 古いブラウザ・http環境向けのフォールバック
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  document.body.appendChild(area);
  area.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

// このリクエストを解くミニアプリを作るための仕様書。
// Claude / Cursor / Bolt など、どのAIツールに貼っても通じるMarkdownにする。
// （AIへの指示なので、サイトの表示言語に関わらず英語で組み立てる）
function buildRequestPrompt(request) {
  const submitUrl = new URL('index.html', window.location.href);
  submitUrl.searchParams.set('builtFor', request.id);

  const lines = [];
  lines.push('# Build a mini app for CobbleWorks');
  lines.push('');
  lines.push('Someone posted this problem on CobbleWorks. Build a small web app that solves it.');

  const count = getWantedCount(request.id);
  if (count > 0) {
    lines.push('');
    lines.push(count === 1
      ? '1 person said they want this too.'
      : count + ' people said they want this too.');
  }

  lines.push('');
  lines.push('## The problem');
  lines.push(request.problem);
  lines.push('');
  lines.push('## What they want it to do');
  lines.push(request.desiredFeatures);

  if (request.targetUsers) {
    lines.push('');
    lines.push('## Who it is for');
    lines.push(request.targetUsers);
  }

  if (request.currentWorkaround) {
    lines.push('');
    lines.push('## What they do today');
    lines.push(request.currentWorkaround);
  }

  // 見た目だけは指示文で決めない。ここを固定にすると、この指示文で作られたアプリが
  // 全部同じ見た目になってしまうため、作る人が本人に選んでもらう手順にしている。
  lines.push('');
  lines.push('## Before you build: let them choose the look');
  lines.push('');
  lines.push('Do not pick the visual design on your own. Every app ends up looking the same when the builder skips this step, and the person who asked for it never gets a say.');
  lines.push('');
  lines.push('1. Work out what the one screen needs — the fields, the list, the buttons.');
  lines.push('2. Make a single throwaway HTML file that draws that same screen three times, side by side, one per visual direction. Use the app\'s real labels and sample rows, never lorem ipsum.');
  lines.push('3. Make the three genuinely different. Vary the palette, the type (system stacks only — serif vs sans vs monospace; no web fonts, see "How to build it"), the corner radius (sharp / soft / pill), the density (airy / compact), and what carries the structure (hairline borders / soft shadows / flat blocks of colour). Three shades of one idea is not a choice.');
  lines.push('4. Name each one and say how it should feel in one line — for example "1. Notebook — cream paper, serif headings, hand-drawn ticks".');
  lines.push('5. Show it to them: open the file in a browser, or attach it as an image if your tool can only send pictures. Then ask which number they want, and say that "2, but the colours from 3" is a fine answer.');
  lines.push('6. Build the real app only after they have answered.');
  lines.push('');
  lines.push('If they truly do not mind, choose the direction that suits the problem — a budget tracker and a bedtime reminder should not look alike.');
  lines.push('');
  lines.push('## How to build it');
  lines.push('- One screen. No routing, no sign-in, no server.');
  lines.push('- Three files only: `index.html`, `style.css`, `script.js`. Plain HTML, CSS and JavaScript — no framework, no build step, no npm.');
  lines.push('- Write all of the interface text in English.');
  lines.push('- Save data in the browser with `localStorage`, under a key like `bin-day:items:v1`. Never store passwords, API keys or anything private.');
  lines.push('- Design for a 375px-wide phone screen first, then let the layout grow on desktop.');
  lines.push('- When there is no data yet, say what to do instead of showing a blank screen.');
  lines.push('- Check what people type and show the problem next to the field it belongs to.');
  lines.push('- Use real `<button>` and `<label>` elements so it works with a keyboard and a screen reader.');
  lines.push('- Put a short "How to use" section on the page itself.');
  lines.push('- Make no external requests: no CDN scripts, no web fonts, no analytics.');
  lines.push('');
  lines.push('## The CobbleWorks palette (one option, not the default)');
  lines.push('');
  lines.push('The platform itself uses these. Offer them as one of the three directions above, for someone who wants the app to match the site. Do not fall back on them just because they are written here.');
  lines.push('```css');
  lines.push(':root {');
  lines.push('  --bg: #FAF4EC;      /* page background */');
  lines.push('  --card: #FFFFFF;    /* card background */');
  lines.push('  --border: #EDE2D4;  /* hairlines */');
  lines.push('  --ink: #3D3229;     /* headings and body text */');
  lines.push('  --muted: #8C7F70;   /* secondary text */');
  lines.push('  --accent: #D9704C;  /* buttons and highlights */');
  lines.push('  --success: #2E9E54; /* links to apps, success */');
  lines.push('  --radius: 20px;');
  lines.push('}');
  lines.push('```');
  lines.push('');
  lines.push('## When it works');
  lines.push('Publish it anywhere you like — Vercel, Netlify, GitHub Pages, or whatever your tool offers — then share the link here:');
  lines.push(submitUrl.href);

  return lines.join('\n');
}

// 全文を出す小さなポップアップ。ページに1つだけ作って使い回す
let fullTextModal = null;
let fullTextLastFocus = null;

function ensureFullTextModal() {
  if (fullTextModal) return fullTextModal;

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.id = 'fullTextModal';
  scrim.hidden = true;

  const box = document.createElement('div');
  box.className = 'map-modal fulltext-modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'fullTextModalTitle');

  const heading = document.createElement('h2');
  heading.id = 'fullTextModalTitle';

  const body = document.createElement('p');
  body.className = 'fulltext-modal-body';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'map-btn map-btn--secondary fulltext-modal-close';

  box.appendChild(heading);
  box.appendChild(body);
  box.appendChild(closeBtn);
  scrim.appendChild(box);
  document.body.appendChild(scrim);

  closeBtn.addEventListener('click', closeFullText);
  // 背景の暗い部分を押したら閉じる（中身を押したときは閉じない）
  scrim.addEventListener('click', function (e) {
    if (e.target === scrim) closeFullText();
  });
  document.addEventListener('keydown', function (e) {
    if (!scrim.hidden && e.key === 'Escape') closeFullText();
  });

  fullTextModal = { scrim: scrim, heading: heading, body: body, closeBtn: closeBtn };
  return fullTextModal;
}

function openFullText(sectionTitle, text) {
  const m = ensureFullTextModal();
  m.heading.textContent = sectionTitle;
  m.body.textContent = text;
  m.closeBtn.textContent = t.guideClose; // 言語を切り替えたあとでも正しいラベルにする
  fullTextLastFocus = document.activeElement;
  m.scrim.hidden = false;
  m.closeBtn.focus();
}

function closeFullText() {
  if (!fullTextModal) return;
  fullTextModal.scrim.hidden = true;
  // 押した「…」に戻しておくと、キーボードだけでも続けて操作できる
  if (fullTextLastFocus && fullTextLastFocus.focus) fullTextLastFocus.focus();
  fullTextLastFocus = null;
}

// 長い本文は4行で折りたたみ、末尾に「…」ボタンを出す。押すと全文をポップアップで見せる。
// 4行に収まっている投稿にはボタンを出したくないが、高さはDOMに入るまで測れないため、
// いったんボタンを作っておいて次の描画フレームで不要なら隠す。
function makeReadMoreButton(textEl, sectionTitle) {
  textEl.classList.add('card-clamp');
  const fullText = textEl.textContent;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card-more-btn';
  btn.textContent = '…';
  // 画面には「…」だけを出しつつ、読み上げや説明用のラベルは言葉で持たせる
  btn.setAttribute('aria-label', t.readMore);
  btn.title = t.readMore;
  btn.addEventListener('click', function () {
    openFullText(sectionTitle, fullText);
  });

  // 4行に収まっている投稿には「…」を出さない。
  // ただし高さはDOMに入ってからでないと測れず、カードの幅もあとから決まるため、
  // 一度きりの判定だと誤って全部に「…」が出てしまう。
  // そこでサイズが変わるたびに測り直す（幅が変わる画面回転やウィンドウ操作にも追従する）。
  function updateDots() {
    // +1px は端数の丸め対策（ぴったり4行のときに誤ってボタンが出るのを防ぐ）
    btn.hidden = textEl.scrollHeight <= textEl.clientHeight + 1;
  }

  requestAnimationFrame(updateDots);
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(updateDots).observe(textEl);
  }

  return btn;
}

// この文字数を超えた困りごとは、見出しではなく本文の見た目にする
const LONG_PROBLEM_CHARS = 90;

function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  // カードのタイトル（困りごとをそのまま見出しにする）
  const title = document.createElement('p');
  title.className = 'card-title';
  // 長文を太字のアクセント色のまま出すと読みづらいので、その場合だけ本文寄りの見た目に落とす
  if ((request.problem || '').length > LONG_PROBLEM_CHARS) {
    title.classList.add('card-title--long');
  }
  title.textContent = request.problem;
  const titleMoreBtn = makeReadMoreButton(title, t.problemLabel);

  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'card-label';
  featuresLabel.textContent = t.desiredFeaturesLabel;

  const featuresText = document.createElement('p');
  featuresText.className = 'card-text';
  featuresText.textContent = request.desiredFeatures;
  const featuresMoreBtn = makeReadMoreButton(featuresText, t.desiredFeaturesLabel);

  const date = document.createElement('p');
  date.className = 'card-date';
  // シード（運営が用意したサンプル）は投稿者名を出さない。
  // 全て同じアカウントに紐づいているため、1人が100件投稿しているように見えてしまうため。
  if (request.isSeed) {
    date.textContent = t.seedSharedBy(request.createdAt);
  } else if (request.postedBy) {
    date.textContent = t.sharedBy(request.postedBy, request.createdAt);
  } else {
    date.textContent = t.postedOn(request.createdAt);
  }

  // 翻訳リンク：投稿本文をGoogle翻訳（設定言語向け）で開く。APIキー不要・無料
  const translateText = [request.problem, request.desiredFeatures].filter(Boolean).join('\n\n');
  const translateLink = document.createElement('a');
  translateLink.className = 'translate-link';
  translateLink.target = '_blank';
  translateLink.rel = 'noopener noreferrer';
  translateLink.textContent = t.translateBtn;
  translateLink.href = 'https://translate.google.com/?sl=auto&tl=' + encodeURIComponent(getLang()) + '&text=' + encodeURIComponent(translateText) + '&op=translate';

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

  // AI（Claude/Cursor/Boltなど）にそのまま貼れる仕様書をコピーするボタン
  const promptBtn = document.createElement('button');
  promptBtn.type = 'button';
  promptBtn.className = 'prompt-btn';
  promptBtn.textContent = t.copyAiPrompt;
  promptBtn.addEventListener('click', async function () {
    const copied = await copyTextToClipboard(buildRequestPrompt(request));
    showToast(copied ? t.toastPromptCopied : t.toastCopyFailed);
  });

  wantArea.appendChild(wantBtn);
  wantArea.appendChild(promptBtn);
  wantArea.appendChild(buildBtn);
  wantArea.appendChild(wantCount);

  // 誰かがMatchingで「作る」と宣言していれば、その人数を出す
  const makingChip = createMakingChip(request.id);
  if (makingChip) wantArea.appendChild(makingChip);

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
      const appGlyph = createAppGlyph(app.url);
      if (appGlyph) appLink.appendChild(appGlyph);
      appLink.appendChild(document.createTextNode(app.name + ' ↗'));
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
      const relatedGlyph = createAppGlyph(app.url);
      if (relatedGlyph) relatedLink.appendChild(relatedGlyph);
      relatedLink.appendChild(document.createTextNode(app.name + ' ↗'));
      bubble.appendChild(relatedLink);
    });

    relatedArea.appendChild(bubble);
  }

  if (request.isSeed) {
    const seedBadge = document.createElement('span');
    seedBadge.className = 'card-badge card-badge--seed';
    seedBadge.textContent = t.seedBadge;
    card.appendChild(seedBadge);
  }

  card.appendChild(title);
  card.appendChild(titleMoreBtn);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);
  card.appendChild(featuresMoreBtn);

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
  card.appendChild(translateLink);
  card.appendChild(wantArea);
  card.appendChild(appsArea);
  card.appendChild(relatedArea);
  card.appendChild(createIdeasSection(request));

  return card;
}

// =====================
// リクエストへのアイデア（まだアプリが無い段階での「こういう機能はどう？」）
// =====================

function getRequestIdeas(requestId) {
  return cachedRequestComments.filter(function (c) {
    return String(c.requestId) === String(requestId);
  });
}

function getIdeaCount(requestId) {
  return getRequestIdeas(requestId).length;
}

// アイデアの投稿はログイン必須（誰の提案か分かるようにするため。RLS側でも同条件を強制）
async function postRequestIdea(requestId, text) {
  const { error } = await supabaseClient.from('request_comments').insert({
    request_id: requestId,
    user_id: currentUser.id,
    text: text
  });
  return error;
}

async function deleteRequestIdea(id) {
  const { error } = await supabaseClient.from('request_comments').delete().eq('id', id);
  return error;
}

// アイデアの一覧＋投稿フォームを組み立てる。
// Requestsページでは折りたたみの中身、Matchingページではモーダルの中身として使い回す。
// onCountChange は「件数が変わったら呼んでほしい処理」（見出しの件数の更新など）。
function createIdeasPanel(request, onCountChange) {
  const panel = document.createElement('div');
  panel.className = 'ideas-panel';

  const list = document.createElement('div');
  list.className = 'ideas-list';

  function renderList() {
    list.innerHTML = '';
    const ideas = getRequestIdeas(request.id);

    if (ideas.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'comments-empty';
      empty.textContent = t.noIdeasYet;
      list.appendChild(empty);
      return;
    }

    ideas.forEach(function (idea) {
      const item = document.createElement('div');
      item.className = 'idea-item';

      const text = document.createElement('p');
      text.className = 'comment-text';
      text.textContent = idea.text;

      const meta = document.createElement('p');
      meta.className = 'comment-meta';
      meta.textContent = (idea.authorName || t.anonymous) + ' · ' + idea.createdAt;

      item.appendChild(text);
      item.appendChild(meta);

      // 自分が書いたアイデア（と管理者）だけ消せる
      if (canManage(idea)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'idea-delete-btn';
        deleteBtn.textContent = '🗑';
        deleteBtn.setAttribute('aria-label', t.deleteIdeaLabel);
        deleteBtn.title = t.deleteIdeaLabel;
        deleteBtn.addEventListener('click', async function () {
          if (!confirm(t.confirmDeleteIdea)) return;
          const error = await deleteRequestIdea(idea.id);
          if (error) {
            console.error('Failed to delete idea:', error.message);
            showToast(t.toastFailedDeleteIdea);
            return;
          }
          await loadRequestComments();
          renderList();
          if (onCountChange) onCountChange();
          showToast(t.toastIdeaDeleted);
        });
        item.appendChild(deleteBtn);
      }

      list.appendChild(item);
    });
  }

  panel.appendChild(list);

  if (!currentUser) {
    // 未ログインのときは、フォームの代わりにログインを促す一言を出す（読むのは誰でもできる）
    const note = document.createElement('p');
    note.className = 'ideas-signin-note';
    note.textContent = t.signInToPostIdea;
    panel.appendChild(note);
  } else {
    const form = document.createElement('form');
    form.className = 'comment-form ideas-form';

    const textInput = document.createElement('textarea');
    textInput.placeholder = t.ideaPlaceholder;
    textInput.maxLength = 500;
    textInput.setAttribute('aria-label', t.ideaAriaLabel);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'map-btn map-btn--secondary';
    submitBtn.textContent = t.postIdea;

    form.appendChild(textInput);
    form.appendChild(submitBtn);

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const text = textInput.value.trim();
      if (!text) {
        showToast(t.toastWriteIdeaFirst);
        return;
      }

      const error = await postRequestIdea(request.id, text);
      if (error) {
        console.error('Failed to post idea:', error.message);
        showToast(t.toastFailedPostIdea);
        return;
      }

      form.reset();
      await loadRequestComments();
      renderList();
      if (onCountChange) onCountChange();
      showToast(t.toastIdeaPosted);
    });

    panel.appendChild(form);
  }

  renderList();
  return { element: panel, refresh: renderList };
}

// Requestsページのカードに入れる、折りたたみ式のアイデア欄
function createIdeasSection(request) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ideas-area';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'comments-toggle ideas-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');

  function updateToggleLabel() {
    toggleBtn.textContent = t.ideasToggle(getIdeaCount(request.id));
  }

  const panel = createIdeasPanel(request, updateToggleLabel);
  panel.element.hidden = true;

  toggleBtn.addEventListener('click', function () {
    panel.element.hidden = !panel.element.hidden;
    toggleBtn.setAttribute('aria-expanded', String(!panel.element.hidden));
  });

  updateToggleLabel();
  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(panel.element);
  return wrapper;
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

// --- 「今このリクエストを作っている」宣言（Matching画面の🔨） ---

// このリクエストを何人が「作っている」と言っているか
function getClaimCount(requestId) {
  return cachedClaims.filter(function (c) { return String(c.requestId) === String(requestId); }).length;
}

// ログイン中のユーザーが、このリクエストを既に宣言しているか
function hasClaimed(requestId) {
  if (!currentUser) return false;
  return cachedClaims.some(function (c) {
    return String(c.requestId) === String(requestId) && String(c.userId) === String(currentUser.id);
  });
}

// 宣言を付ける（1人1回）。既に付いていれば何もしない
async function claimRequest(requestId) {
  if (hasClaimed(requestId)) return null;
  const { error } = await supabaseClient
    .from('request_claims')
    .insert({ request_id: requestId, user_id: currentUser.id });
  return error;
}

// 宣言を取り下げる
async function unclaimRequest(requestId) {
  const { error } = await supabaseClient
    .from('request_claims')
    .delete()
    .eq('request_id', requestId)
    .eq('user_id', currentUser.id);
  return error;
}

// 「🔨 2 making now」の小さな札。誰も作っていなければ何も返さない
function createMakingChip(requestId) {
  const count = getClaimCount(requestId);
  if (count === 0) return null;
  const chip = document.createElement('span');
  chip.className = 'making-chip';
  chip.textContent = count === 1 ? t.makingNowOne : t.makingNowMany(count);
  return chip;
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

  // 検索欄に文字があれば、problemに含まれるものだけに絞り込む。新しい投稿が上に来るよう並べ替える
  const requests = getRequests().reverse().filter(function (request) {
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

// 選択中の並び替えタブに応じてアプリ一覧を並び替える
function sortAppsForDisplay(apps) {
  const newestFirst = [...apps].reverse(); // 新着順（元の並びはSupabaseのcreated_at昇順）

  if (selectedSort === 'trending') {
    // 直近7日間のいいね数が多い順（Array.sortは安定ソートなので同数なら新着順を維持）
    return newestFirst.slice().sort(function (a, b) {
      return getRecentLikeCount(b.id, 7) - getRecentLikeCount(a.id, 7);
    });
  }
  if (selectedSort === 'viral') {
    // 元になったリクエストの「欲しい」数が多い順
    return newestFirst.slice().sort(function (a, b) {
      const wantsA = a.builtForRequestId ? getWantedCount(a.builtForRequestId) : 0;
      const wantsB = b.builtForRequestId ? getWantedCount(b.builtForRequestId) : 0;
      return wantsB - wantsA;
    });
  }
  if (selectedSort === 'popular') {
    // 合計いいね数（バッジ階層）が多い順
    return newestFirst.slice().sort(function (a, b) {
      return getLikeCount(b.id) - getLikeCount(a.id);
    });
  }
  return newestFirst; // 'new'
}

function renderApps(query) {
  query = query || '';
  let apps = getApps();
  const list = document.getElementById('appsList');
  if (!list) return; // このページにミニアプリ一覧が無ければ何もしない

  // 検索文字列・カテゴリ・並び順が変わったときだけ1ページ目に戻す（お気に入り登録などの再描画では現在のページを保つ）
  if (query !== lastAppsQuery || selectedCategory !== lastAppsCategory || selectedSort !== lastAppsSort) {
    appsPage = 1;
    lastAppsQuery = query;
    lastAppsCategory = selectedCategory;
    lastAppsSort = selectedSort;
  }

  list.innerHTML = '';

  if (selectedCategory !== 'all') {
    apps = apps.filter(function (app) { return app.category === selectedCategory; });
  }

  if (query) {
    const q = query.toLowerCase();
    // インポートしたデータに項目が欠けていても落ちないように空文字として扱う
    const exactMatches = apps.filter(function (app) {
      return (
        (app.name || '').toLowerCase().includes(q) ||
        (app.description || '').toLowerCase().includes(q) ||
        (app.targetUsers || '').toLowerCase().includes(q)
      );
    });

    if (exactMatches.length > 0) {
      apps = exactMatches;
    } else {
      // 文字がそのまま含まれていなくても、単語レベルで関連していれば拾う。
      // （例: 「持ち物 旅行」のように語順や助詞が違って一致しなかった場合）
      const queryWords = toSearchWords(query);
      apps = queryWords.length === 0 ? [] : apps.filter(function (app) {
        return fuzzyMatchScoreApp(app, queryWords) > 0;
      });
    }
  }

  if (apps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = (query || selectedCategory !== 'all')
      ? t.noAppsSearch
      : t.noAppsYet;
    list.appendChild(empty);
    return;
  }

  const sorted = sortAppsForDisplay(apps);
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

// profile.html?u=ハンドル で開かれた「他人のプロフィール」。自分のページなら null のまま
let viewedProfile = null;
let viewedProfileMissing = false;

// URLの ?u= からハンドルを取り出す（無ければ null ＝ 自分のプロフィール）
function getViewedHandle() {
  const handle = new URLSearchParams(window.location.search).get('u');
  return handle && handle.trim() ? handle.trim() : null;
}

// ?u= で指定された人のプロフィールを読む（profilesは全員閲覧可のRLSなので未ログインでも読める）
async function loadViewedProfile() {
  const handle = getViewedHandle();
  if (!handle) return;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, handle, avatar_url, bio')
    .eq('handle', handle);

  if (error) {
    console.error('Failed to load profile from Supabase:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    viewedProfileMissing = true; // ハンドルが変更された/存在しない
    return;
  }

  viewedProfile = data[0];
}

// このページで見せるプロフィールを決める。まだ読めていない・見つからない場合は null
function getProfileTarget() {
  if (getViewedHandle()) {
    if (!viewedProfile) return null;
    const isSelf = !!currentUser && String(viewedProfile.id) === String(currentUser.id);
    // 自分のページを ?u= 付きで開いた場合は、編集できる自分用の表示に寄せる
    return { profile: isSelf && currentProfile ? currentProfile : viewedProfile, isSelf: isSelf };
  }

  if (!currentUser || !currentProfile) return null;
  return { profile: currentProfile, isSelf: true };
}

// Portfolio：そのプロフィールの持ち主が投稿したアプリを表示する
function renderYourApps() {
  const list = document.getElementById('yourAppsList');
  if (!list) return;

  list.innerHTML = '';

  const target = getProfileTarget();

  if (!target) {
    // 他人のページで見つからなかった場合のメッセージは renderProfilePage が出すので、ここは空のまま
    if (!getViewedHandle()) {
      const prompt = document.createElement('p');
      prompt.textContent = t.signInToSeeYourApps;
      list.appendChild(prompt);
    }
    return;
  }

  const ownerApps = getApps().filter(function (app) {
    return String(app.ownerId) === String(target.profile.id);
  });

  if (ownerApps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = target.isSelf ? t.noYourAppsYet : t.noAppsFromThisPerson;
    list.appendChild(empty);
    return;
  }

  [...ownerApps].reverse().forEach(function (app) {
    list.appendChild(createAppCard(app));
  });
}

// プロフィールページ（profile.html）：アバター・ハンドル・自己紹介を表示する（Portfolio部分はrenderYourApps()が担当）
function renderProfilePage() {
  const card = document.getElementById('profileCard');
  const signedOutPrompt = document.getElementById('profileSignedOutPrompt');
  const portfolioSection = document.getElementById('your-apps-section');
  const notFound = document.getElementById('profileNotFound');
  if (!card && !signedOutPrompt) return; // このページにプロフィールカードが無ければ何もしない

  const target = getProfileTarget();

  // ?u= の人が見つからなかった場合（ハンドル変更・打ち間違いなど）
  if (getViewedHandle() && !target) {
    if (card) card.hidden = true;
    if (portfolioSection) portfolioSection.hidden = true;
    if (signedOutPrompt) signedOutPrompt.hidden = true;
    // まだ読み込み中のうちは何も出さず、見つからないと確定してから知らせる
    if (notFound) notFound.hidden = !viewedProfileMissing;
    return;
  }
  if (notFound) notFound.hidden = true;

  // 自分のプロフィールを未ログインで開いた場合（従来どおりサインインを促す）
  if (!target) {
    if (card) card.hidden = true;
    if (portfolioSection) portfolioSection.hidden = true;
    if (signedOutPrompt) signedOutPrompt.hidden = false;
    return;
  }

  if (signedOutPrompt) signedOutPrompt.hidden = true;
  if (card) card.hidden = false;
  if (portfolioSection) portfolioSection.hidden = false;

  const profile = target.profile;

  // 設定（⋯）は自分のページでだけ押せるようにする
  const settingsBtn = document.getElementById('profileSettingsBtn');
  if (settingsBtn) settingsBtn.hidden = !target.isSelf;

  const avatarWrap = document.getElementById('profileAvatarWrap');
  if (avatarWrap) {
    avatarWrap.innerHTML = '';
    if (profile.avatar_url) {
      const img = document.createElement('img');
      img.className = 'profile-avatar-lg';
      img.alt = '';
      img.src = profile.avatar_url;
      avatarWrap.appendChild(img);
    } else {
      const fallback = createAppAvatar(profile.handle || '', false);
      fallback.classList.add('profile-avatar-lg', 'profile-avatar-lg--fallback');
      avatarWrap.appendChild(fallback);
    }
  }

  const handleEl = document.getElementById('profileHandleLarge');
  if (handleEl) handleEl.textContent = profile.handle || '';

  const bioEl = document.getElementById('profileBioText');
  if (bioEl) {
    const bioText = profile.bio || '';
    bioEl.textContent = bioText || (target.isSelf ? t.profileBioEmpty : t.profileBioEmptyOther);
    bioEl.classList.toggle('profile-bio-empty', !bioText);
  }

  // 見出し・説明・タブのタイトルを、自分のページか他人のページかで出し分ける
  const subtitle = document.querySelector('[data-i18n="profileSubtitle"]');
  if (subtitle) {
    subtitle.textContent = target.isSelf ? t.profileSubtitle : t.profileSubtitleOther(profile.handle);
  }

  const portfolioNote = document.querySelector('[data-i18n="yourAppsNote"]');
  if (portfolioNote) {
    portfolioNote.textContent = target.isSelf ? t.yourAppsNote : t.portfolioNoteOther(profile.handle);
  }

  document.title = target.isSelf ? t.profileDocTitle : profile.handle + ' · CobbleWorks';
}

// アプリ名から見分けやすい頭文字バッジを作る（色は名前から決まる固定色）
const APP_AVATAR_COLORS = ['app-avatar-c0', 'app-avatar-c1', 'app-avatar-c2', 'app-avatar-c3'];

// アプリのバッジ。app-icons.js に絵があるアプリはアイコン、無ければ従来の頭文字。
// url を渡さない呼び出し（プロフィールのアバター代替など）は常に頭文字になる。
function createAppAvatar(name, small, url) {
  const avatar = document.createElement('div');
  avatar.className = 'app-avatar' + (small ? ' app-avatar--sm' : '');
  avatar.setAttribute('aria-hidden', 'true'); // 名前はリンク側で読み上げられるため重複させない

  const icon = typeof window.getAppIcon === 'function' ? window.getAppIcon(url) : null;
  if (icon) {
    avatar.classList.add(icon.colorClass);
    avatar.innerHTML = icon.svg; // app-icons.js に直接書いた固定の文字列だけを入れる
    return avatar;
  }

  const safeName = typeof name === 'string' ? name.trim() : '';
  avatar.textContent = safeName ? safeName.charAt(0).toUpperCase() : '?';

  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash + safeName.charCodeAt(i)) % APP_AVATAR_COLORS.length;
  }
  avatar.classList.add(APP_AVATAR_COLORS[hash]);

  return avatar;
}

// 作者クレジット（小さいアバター＋ハンドル）。作者が分からないアプリでは null を返す
function createAuthorCredit(app) {
  if (!app.postedBy) return null;

  // 作者のプロフィール（ポートフォリオ）へのリンクにする
  const wrap = document.createElement('a');
  wrap.className = 'app-author';
  wrap.href = 'profile.html?u=' + encodeURIComponent(app.postedBy);
  wrap.setAttribute('aria-label', t.viewProfileOf(app.postedBy));

  if (app.postedByAvatar) {
    const img = document.createElement('img');
    img.className = 'app-author-avatar';
    img.alt = '';
    img.src = app.postedByAvatar;
    wrap.appendChild(img);
  } else {
    // アバター未設定の人は、ハンドルの頭文字バッジで代用する
    wrap.appendChild(createAppAvatar(app.postedBy, true));
  }

  const name = document.createElement('span');
  name.className = 'app-author-name';
  name.textContent = t.builtBy(app.postedBy);
  wrap.appendChild(name);

  return wrap;
}

// 別のサイトで公開されているアプリなら、そのドメイン名を返す（このサイト内のアプリなら null）
function externalHostLabel(url) {
  if (!isSafeUrl(url)) return null;
  const parsed = new URL(url, window.location.href);
  if (parsed.host === window.location.host) return null;
  return parsed.host.replace(/^www\./, '');
}

// チップや候補リストの中に置く小さいアイコン。タイルは付けず、線の色は
// 置かれた場所の文字色をそのまま使う(SVG側が stroke="currentColor" のため)。
// アイコンが無いアプリでは null を返すので、呼び出し側は今までどおり文字だけになる。
function createAppGlyph(url) {
  const icon = typeof window.getAppIcon === 'function' ? window.getAppIcon(url) : null;
  if (!icon) return null;

  const glyph = document.createElement('span');
  glyph.className = 'app-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.innerHTML = icon.svg; // app-icons.js に直接書いた固定の文字列だけを入れる
  return glyph;
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
  nameRow.appendChild(createAppAvatar(app.name, false, app.url));
  nameRow.appendChild(nameLink);
  nameRow.appendChild(createFavoriteStarButton(app.id));

  // カテゴリバッジ
  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'map-chip map-chip--success app-category-badge';
  categoryBadge.textContent = categoryLabel(app.category);

  // いいねバッジ（銅・銀・金。しきい値未満なら表示しない）
  const likeBadge = createLikeBadgeChip(getLikeCount(app.id));

  // 別サイトで公開されているアプリは、そのドメインを見せて外部リンクだと分かるようにする
  const externalHost = externalHostLabel(app.url);
  let externalChip = null;
  if (externalHost) {
    externalChip = document.createElement('span');
    externalChip.className = 'map-chip app-external-badge';
    externalChip.textContent = '↗ ' + externalHost;
    externalChip.title = t.externalAppNote;
  }

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

  // 誰が作ったかは、埋もれないようにアプリ名のすぐ下に置く
  const authorCredit = createAuthorCredit(app);
  if (authorCredit) card.appendChild(authorCredit);

  if (categoryBadge.textContent) card.appendChild(categoryBadge);
  if (likeBadge) card.appendChild(likeBadge);
  if (externalChip) card.appendChild(externalChip);
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

  // 投稿日（投稿者名はカード上部のクレジットで出しているので、ここでは日付だけ）
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = t.postedOn(app.createdAt);

  // いいねボタンエリア
  const likeArea = createLikeArea(app.id);

  // 星評価エリア
  const ratingArea = createStarRating(app.id);

  // コメントエリア（作者へのフィードバック）
  const commentsArea = createCommentsSection(app);

  card.appendChild(date);
  card.appendChild(likeArea);
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

// =====================
// いいね・バッジ関連
// =====================

// バッジの階層としきい値（合計いいね数）。あとで調整しやすいよう1箇所にまとめておく
const BADGE_THRESHOLDS = { gold: 50, silver: 20, bronze: 5 };

function getLikeCount(appId) {
  return cachedLikes.filter(function (l) { return String(l.appId) === String(appId); }).length;
}

// 直近N日間に付いたいいねの数（トレンド並び替え用）
function getRecentLikeCount(appId, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return cachedLikes.filter(function (l) {
    return String(l.appId) === String(appId) && new Date(l.createdAt).getTime() >= cutoff;
  }).length;
}

// ログイン中のユーザーが、このアプリに既にいいねを付けているか
function hasLiked(appId) {
  if (!currentUser) return false;
  return cachedLikes.some(function (l) {
    return String(l.appId) === String(appId) && String(l.userId) === String(currentUser.id);
  });
}

// いいねを付ける／既に付けていれば外す（1人1票）
async function toggleLike(appId) {
  if (hasLiked(appId)) {
    const { error } = await supabaseClient
      .from('likes')
      .delete()
      .eq('app_id', appId)
      .eq('user_id', currentUser.id);
    return error;
  }

  const { error } = await supabaseClient
    .from('likes')
    .insert({ app_id: appId, user_id: currentUser.id });
  return error;
}

// 合計いいね数からバッジの階層を判定する（'gold' | 'silver' | 'bronze' | 'none'）
function getAppBadge(likeCount) {
  if (likeCount >= BADGE_THRESHOLDS.gold) return 'gold';
  if (likeCount >= BADGE_THRESHOLDS.silver) return 'silver';
  if (likeCount >= BADGE_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

const BADGE_EMOJI = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const BADGE_LABEL_KEYS = { gold: 'badgeGold', silver: 'badgeSilver', bronze: 'badgeBronze' };

// いいねバッジのチップ要素を作る。しきい値未満（'none'）なら何も返さない
function createLikeBadgeChip(likeCount) {
  const tier = getAppBadge(likeCount);
  if (tier === 'none') return null;

  const chip = document.createElement('span');
  chip.className = 'map-chip app-like-badge app-like-badge--' + tier;
  chip.textContent = BADGE_EMOJI[tier] + ' ' + t[BADGE_LABEL_KEYS[tier]];
  return chip;
}

// いいねボタン＋件数を組み立てる
function createLikeArea(appId) {
  const area = document.createElement('div');
  area.className = 'card-like-area';

  const alreadyLiked = hasLiked(appId);
  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'like-btn';
  if (alreadyLiked) likeBtn.classList.add('like-btn--active');
  likeBtn.textContent = alreadyLiked ? t.likeActive : t.likeInactive;
  likeBtn.addEventListener('click', async function () {
    if (!currentUser) {
      showToast(t.toastSignInToVote);
      return;
    }
    const error = await toggleLike(appId);
    if (error) {
      console.error('Failed to update like:', error.message);
      showToast(t.toastSomethingWrong);
      return;
    }
    await loadSharedData();
    const searchField = document.getElementById('searchInput');
    renderApps(searchField ? searchField.value.trim() : '');
  });

  const likeCount = document.createElement('p');
  likeCount.className = 'like-count';
  const count = getLikeCount(appId);
  if (count === 1) {
    likeCount.textContent = t.likeCountOne;
  } else if (count > 1) {
    likeCount.textContent = t.likeCountMany(count);
  }

  area.appendChild(likeBtn);
  area.appendChild(likeCount);
  return area;
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

      // 運営名義のコメントには必ずバッジを付け、
      // 一般ユーザーの投稿と見分けが付くようにする
      if (comment.isOfficial) {
        item.classList.add('comment-item--official');
        const officialBadge = document.createElement('span');
        officialBadge.className = 'comment-official-badge';
        officialBadge.textContent = t.officialBadge;
        item.appendChild(officialBadge);
      }

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

// サイドバーの描画に必要な項目だけを控えておく（Supabaseの読み込み完了後に呼ぶ）
function saveSidebarAppCache() {
  if (cachedApps.length === 0) return; // 読み込み失敗時に前回の控えを消さない
  try {
    const slim = cachedApps.map(function (app) {
      return { id: app.id, name: app.name, url: app.url };
    });
    localStorage.setItem(SIDEBAR_APPS_CACHE_KEY, JSON.stringify(slim));
  } catch (e) {
    // 保存できなくてもサイドバーが少し遅く出るだけなので、何もしない
  }
}

// サイドバーが参照するアプリ一覧。
// Supabaseの読み込みが終わっていればそちらを、まだなら前回の控えを使う。
function getAppsForSidebar() {
  if (cachedApps.length > 0) return cachedApps.slice();
  try {
    const data = localStorage.getItem(SIDEBAR_APPS_CACHE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

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

  const apps = getAppsForSidebar();
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

  left.appendChild(createAppAvatar(app.name, true, app.url));
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

  const apps = getAppsForSidebar();
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

// =====================
// Matching（リクエストを1枚ずつ見て、作るか見送るか決める画面）
// =====================

// このブラウザで「Not now」にしたリクエストのID。端末ごとの記録で、他の人には共有しない
const MATCHING_SKIPPED_KEY = 'cobbleworks:matching:skipped:v1';

const MATCHING_VISIBLE_CARDS = 3; // 奥行きを出すために重ねて描く枚数
const SWIPE_THRESHOLD = 90;       // これ以上横に動かしたら「決定」とみなす（px）

let matchingDeck = [];    // まだ判定していないリクエスト。先頭が今めくれている1枚
let matchingHistory = []; // 「↩」で1つ前に戻すための履歴
let matchingBusy = false; // カードが飛んでいく最中の二重操作を防ぐ
let matchingSearching = false;   // 「探しています」の演出を出している間だけ true
let matchingSearchTimer = null;  // 演出を終わらせるためのタイマー

function getSkippedRequestIds() {
  try {
    const raw = localStorage.getItem(MATCHING_SKIPPED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(String) : [];
  } catch (e) {
    return []; // 壊れたデータが入っていても画面は動かす
  }
}

function addSkippedRequestId(id) {
  const list = getSkippedRequestIds();
  if (list.indexOf(String(id)) === -1) list.push(String(id));
  localStorage.setItem(MATCHING_SKIPPED_KEY, JSON.stringify(list));
}

function removeSkippedRequestId(id) {
  const list = getSkippedRequestIds().filter(function (x) { return x !== String(id); });
  localStorage.setItem(MATCHING_SKIPPED_KEY, JSON.stringify(list));
}

// このリクエストに、もうミニアプリが作られているか
function isRequestBuilt(request, apps) {
  return apps.some(function (app) {
    return String(app.builtForRequestId) === String(request.id);
  });
}

// 新しいリクエストほど高い点にする。14日たつごとに点が半分になっていく
const MATCHING_RECENCY_MAX = 60;      // 投稿直後にもらえる点
const MATCHING_RECENCY_HALF_LIFE = 14; // 点が半分になるまでの日数

function requestRecencyScore(request) {
  const posted = new Date(request.createdAtRaw || request.createdAt).getTime();
  if (isNaN(posted)) return 0; // 日付が読めないときは加点しない
  const days = Math.max(0, (Date.now() - posted) / (1000 * 60 * 60 * 24));
  return MATCHING_RECENCY_MAX * Math.pow(0.5, days / MATCHING_RECENCY_HALF_LIFE);
}

// 山札の並び順を決める点数。高いほど先に出てくる
function matchingScore(request, apps) {
  let score = 0;
  if (isRequestBuilt(request, apps)) score -= 10000;   // もうアプリがあるものは必ず最後に回す
  if (!request.isSeed) score += 1000;                  // ユーザーの投稿は、サンプルより必ず先に出す
  score += requestRecencyScore(request);               // 新しいリクエストほど前へ
  score += getWantedCount(request.id) * 3;             // 欲しい人が多いほど前へ
  if (getClaimCount(request.id) === 0) score += 2;     // まだ誰も手を付けていないものを少し前へ
  score += Math.random() * 2;                          // 同じ点のとき、毎回まったく同じ順番にならないよう少し揺らす
  return score;
}

// 今出すべきリクエストを、順番に並べた配列にして返す
function buildMatchingDeck() {
  const skipped = getSkippedRequestIds();
  const apps = getApps();

  return getRequests()
    .filter(function (request) {
      if (skipped.indexOf(String(request.id)) !== -1) return false; // 見送り済み
      if (hasClaimed(request.id)) return false;                     // 自分がもう作っている
      return true;
    })
    .map(function (request) {
      return { request: request, score: matchingScore(request, apps) };
    })
    .sort(function (a, b) { return b.score - a.score; })
    .map(function (entry) { return entry.request; });
}

// カード1枚を組み立てる。isTopがtrueのときだけ中のボタンを触れるようにする
function createSwipeCard(request, isTop) {
  const card = document.createElement('article');
  card.className = 'swipe-card';

  // 左右にドラッグしたときに濃くなる2つのスタンプ
  const nopeStamp = document.createElement('span');
  nopeStamp.className = 'swipe-stamp swipe-stamp--nope';
  nopeStamp.textContent = t.matchingNotNow;
  nopeStamp.setAttribute('aria-hidden', 'true');

  const yesStamp = document.createElement('span');
  yesStamp.className = 'swipe-stamp swipe-stamp--yes';
  yesStamp.textContent = t.matchingMakingNow;
  yesStamp.setAttribute('aria-hidden', 'true');

  card.appendChild(nopeStamp);
  card.appendChild(yesStamp);

  // 上段の小さな札（サンプル／欲しい人数／作っている人数／作成済み）
  const chips = document.createElement('div');
  chips.className = 'swipe-card-chips';

  if (request.isSeed) {
    const seedChip = document.createElement('span');
    seedChip.className = 'swipe-chip swipe-chip--seed';
    seedChip.textContent = t.seedBadge;
    chips.appendChild(seedChip);
  }

  const wantCount = getWantedCount(request.id);
  if (wantCount > 0) {
    const wantChip = document.createElement('span');
    wantChip.className = 'swipe-chip swipe-chip--want';
    wantChip.textContent = wantCount === 1 ? t.wantCountOne : t.wantCountMany(wantCount);
    chips.appendChild(wantChip);
  }

  const makingChip = createMakingChip(request.id);
  if (makingChip) chips.appendChild(makingChip);

  if (isRequestBuilt(request, getApps())) {
    const builtChip = document.createElement('span');
    builtChip.className = 'swipe-chip swipe-chip--built';
    builtChip.textContent = t.matchingAlreadyBuilt;
    chips.appendChild(builtChip);
  }

  if (chips.children.length > 0) card.appendChild(chips);

  const problem = document.createElement('p');
  problem.className = 'swipe-card-problem';
  if ((request.problem || '').length > 120) problem.classList.add('swipe-card-problem--long');
  problem.textContent = request.problem;
  card.appendChild(problem);

  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'swipe-card-label';
  featuresLabel.textContent = t.desiredFeaturesLabel;
  card.appendChild(featuresLabel);

  const features = document.createElement('p');
  features.className = 'swipe-card-features';
  features.textContent = request.desiredFeatures;
  card.appendChild(features);

  const meta = document.createElement('p');
  meta.className = 'swipe-card-meta';
  if (request.isSeed) {
    meta.textContent = t.seedSharedBy(request.createdAt);
  } else if (request.postedBy) {
    meta.textContent = t.sharedBy(request.postedBy, request.createdAt);
  } else {
    meta.textContent = t.postedOn(request.createdAt);
  }
  card.appendChild(meta);

  // 先頭のカードだけ、♡（欲しい）と 💡（アイデア）の2つのボタンを出す
  if (isTop) {
    const actions = document.createElement('div');
    actions.className = 'swipe-card-actions';

    const wantBtn = document.createElement('button');
    wantBtn.type = 'button';
    const alreadyWanted = hasWanted(request.id);
    wantBtn.className = 'swipe-want-btn' + (alreadyWanted ? ' swipe-want-btn--active' : '');
    wantBtn.textContent = alreadyWanted ? t.wantActive : t.wantInactive;
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
      renderMatchingDeck();
    });

    // 💡：カードの上に入力欄を置くと左右スワイプの指の動きとぶつかるので、
    // ボタンだけ置いて、中身はモーダルで開く
    const ideasBtn = document.createElement('button');
    ideasBtn.type = 'button';
    ideasBtn.className = 'swipe-ideas-btn';
    ideasBtn.textContent = t.ideasToggle(getIdeaCount(request.id));
    ideasBtn.addEventListener('click', function () {
      openIdeasModal(request);
    });

    actions.appendChild(wantBtn);
    actions.appendChild(ideasBtn);
    card.appendChild(actions);
  }

  return card;
}

// 山札を配る前に、少しのあいだ「今そこを探しています」という演出を出す。
// リクエストのデータ自体はもう手元にあるので、これは体感を作るためのわざとの間。
const MATCHING_SEARCH_MS = 1000;

function startMatchingSearch() {
  const searchEl = document.getElementById('matchingSearching');
  if (!searchEl) { renderMatchingDeck(); return; } // 演出用の場所が無いページでは今まで通り

  if (matchingSearchTimer) clearTimeout(matchingSearchTimer);
  matchingSearching = true;
  searchEl.hidden = false;
  renderMatchingDeck(); // 演出中はカードも操作ボタンも隠す

  // 動きを減らす設定にしている人は、ほとんど待たせずに配る
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  matchingSearchTimer = setTimeout(function () {
    matchingSearchTimer = null;
    matchingSearching = false;
    searchEl.hidden = true;
    renderMatchingDeck(true); // true にすると、カードが配られる動きつきで出る
  }, reduced ? 300 : MATCHING_SEARCH_MS);
}

// 山札を描き直す。dealIn が true のときだけ、配るアニメーションを付ける
function renderMatchingDeck(dealIn) {
  const deckEl = document.getElementById('matchingDeck');
  if (!deckEl) return;

  deckEl.innerHTML = '';

  // 「探しています」の演出中は、まだ何も見せない
  if (matchingSearching) {
    const hiddenEmpty = document.getElementById('matchingEmpty');
    if (hiddenEmpty) hiddenEmpty.hidden = true;
    const hiddenControls = document.getElementById('matchingControls');
    if (hiddenControls) hiddenControls.hidden = true;
    const hiddenCounter = document.getElementById('matchingCounter');
    if (hiddenCounter) hiddenCounter.textContent = '';
    const hiddenHint = document.querySelector('.matching-hint');
    if (hiddenHint) hiddenHint.hidden = true;
    return;
  }

  const visible = matchingDeck.slice(0, MATCHING_VISIBLE_CARDS);

  // 奥のカードから先に置くと、先頭の1枚が一番手前に来る
  visible.slice().reverse().forEach(function (request, i) {
    const depth = visible.length - 1 - i; // 0 が一番手前
    const isTop = depth === 0;
    const card = createSwipeCard(request, isTop);
    card.style.setProperty('--depth', depth);
    if (dealIn === true) {
      // 奥のカードほど少し遅れて着地させると、順番に配られたように見える
      card.style.setProperty('--deal-delay', (visible.length - 1 - depth) * 90 + 'ms');
      card.classList.add('swipe-card--dealing');
    }
    if (isTop) {
      card.classList.add('swipe-card--top');
      enableSwipe(card);
    } else {
      card.setAttribute('aria-hidden', 'true');
    }
    deckEl.appendChild(card);
  });

  const hasCards = matchingDeck.length > 0;
  const emptyEl = document.getElementById('matchingEmpty');
  if (emptyEl) emptyEl.hidden = hasCards;
  const controlsEl = document.getElementById('matchingControls');
  if (controlsEl) controlsEl.hidden = !hasCards;

  const counterEl = document.getElementById('matchingCounter');
  if (counterEl) counterEl.textContent = hasCards ? t.matchingLeft(matchingDeck.length) : '';

  // 操作するカードが無いときは「横にドラッグ」の案内も出さない
  const hintEl = document.querySelector('.matching-hint');
  if (hintEl) hintEl.hidden = !hasCards;

  const undoBtn = document.getElementById('matchUndoBtn');
  if (undoBtn) undoBtn.disabled = matchingHistory.length === 0;
}

// 横へのずれに合わせて、2つのスタンプの濃さを変える
function setStampOpacity(card, dx) {
  const strength = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
  const nope = card.querySelector('.swipe-stamp--nope');
  const yes = card.querySelector('.swipe-stamp--yes');
  if (nope) nope.style.opacity = dx < 0 ? strength : 0;
  if (yes) yes.style.opacity = dx > 0 ? strength : 0;
}

// 一番手前のカードを指やマウスで動かせるようにする
function enableSwipe(card) {
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  let pointerId = null;

  card.addEventListener('pointerdown', function (e) {
    if (matchingBusy) return;
    if (e.target.closest('button, a')) return; // カードの中のボタンはドラッグ扱いにしない
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    // 指がカードの外へ出ても追従させる（対応していない環境では無視する）
    try { card.setPointerCapture(pointerId); } catch (err) { /* 未対応でもドラッグ自体は動く */ }
    card.classList.add('swipe-card--dragging');
  });

  card.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = e.clientX - startX;
    const dy = (e.clientY - startY) * 0.25; // 縦は少しだけ付いてくる
    card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + (dx / 18) + 'deg)';
    setStampOpacity(card, dx);
  });

  function finishDrag(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    card.classList.remove('swipe-card--dragging');
    try { card.releasePointerCapture(pointerId); } catch (err) { /* すでに離れているときは無視 */ }

    if (dx > SWIPE_THRESHOLD) {
      decideMatching('build');
    } else if (dx < -SWIPE_THRESHOLD) {
      decideMatching('skip');
    } else {
      card.style.transform = ''; // 中途半端な位置なら元に戻す
      setStampOpacity(card, 0);
    }
  }

  card.addEventListener('pointerup', finishDrag);
  card.addEventListener('pointercancel', finishDrag);
}

// 決定したカードを画面外へ飛ばす。飛び終わるまで待てるようPromiseを返す
function flyOutTopCard(action) {
  return new Promise(function (resolve) {
    const card = document.querySelector('.swipe-card--top');
    if (!card) { resolve(); return; }
    const direction = action === 'build' ? 1 : -1;
    card.classList.add('swipe-card--leaving');
    setStampOpacity(card, direction * SWIPE_THRESHOLD);
    card.style.transform = 'translate(' + (direction * 700) + 'px, 40px) rotate(' + (direction * 22) + 'deg)';
    card.style.opacity = '0';
    setTimeout(resolve, 260);
  });
}

// 一番手前のカードを「見送る」または「作る」で処理する
async function decideMatching(action) {
  if (matchingBusy) return;
  const request = matchingDeck[0];
  if (!request) return;

  // 「作る」はみんなに見える宣言なので、ログインが要る
  if (action === 'build' && !currentUser) {
    showToast(t.toastSignInToClaim);
    const card = document.querySelector('.swipe-card--top');
    if (card) {
      card.style.transform = '';
      setStampOpacity(card, 0);
    }
    return;
  }

  matchingBusy = true;
  await flyOutTopCard(action);

  matchingDeck.shift();
  matchingHistory.push({ request: request, action: action });
  if (action === 'skip') addSkippedRequestId(request.id);

  renderMatchingDeck();
  matchingBusy = false;

  if (action === 'build') {
    const error = await claimRequest(request.id);
    if (error) {
      console.error('Failed to claim request:', error.message);
      showToast(t.toastSomethingWrong);
      return;
    }
    await loadSharedData();
    renderMatchingDeck(); // 宣言の人数を反映し直す
    openClaimModal(request);
  }
}

// 「↩」：直前の1枚を山札に戻す
async function undoMatching() {
  if (matchingBusy) return;
  const last = matchingHistory.pop();
  if (!last) return;

  if (last.action === 'skip') {
    removeSkippedRequestId(last.request.id);
  }

  matchingDeck.unshift(last.request);
  renderMatchingDeck();

  // 「作る」を取り消したときは、みんなに見えている宣言も外す
  if (last.action === 'build' && currentUser) {
    const error = await unclaimRequest(last.request.id);
    if (error) {
      console.error('Failed to drop claim:', error.message);
      showToast(t.toastSomethingWrong);
      return;
    }
    await loadSharedData();
    renderMatchingDeck();
    showToast(t.toastClaimUndone);
  }
}

// --- 「作る」を押した直後に出る案内 ---

function openClaimModal(request) {
  const modal = document.getElementById('claimModal');
  if (!modal) return;

  const textEl = document.getElementById('claimRequestText');
  if (textEl) textEl.textContent = request.problem;

  const link = document.getElementById('claimSubmitLink');
  if (link) link.href = 'index.html?builtFor=' + encodeURIComponent(request.id);

  const copyBtn = document.getElementById('claimCopyPromptBtn');
  if (copyBtn) {
    copyBtn.onclick = async function () {
      const copied = await copyTextToClipboard(buildRequestPrompt(request));
      showToast(copied ? t.toastPromptCopied : t.toastCopyFailed);
    };
  }

  modal.hidden = false;
}

function closeClaimModal() {
  const modal = document.getElementById('claimModal');
  if (modal) modal.hidden = true;
}

// --- 「💡」を押したときに出るアイデア欄 ---

function openIdeasModal(request) {
  const modal = document.getElementById('ideasModal');
  if (!modal) return;

  const textEl = document.getElementById('ideasRequestText');
  if (textEl) textEl.textContent = request.problem;

  const host = document.getElementById('ideasPanelHost');
  if (host) {
    host.innerHTML = '';
    // 件数が変わったら、後ろのカードのボタンの件数も更新する
    const panel = createIdeasPanel(request, renderMatchingDeck);
    host.appendChild(panel.element);
  }

  modal.hidden = false;
}

function closeIdeasModal() {
  const modal = document.getElementById('ideasModal');
  if (modal) modal.hidden = true;
  const host = document.getElementById('ideasPanelHost');
  if (host) host.innerHTML = ''; // 次に開いたとき前のリクエストの内容が残らないように
}

// ログイン状態が変わったとき、まだ1枚も判定していなければ山札を作り直す
function refreshMatchingDeck() {
  if (!document.getElementById('matchingDeck')) return;

  const prompt = document.getElementById('matchingSignInPrompt');
  if (prompt) prompt.hidden = !!currentUser;

  if (matchingHistory.length > 0) return; // 途中まで進んでいる人の手を止めない

  matchingDeck = buildMatchingDeck();
  if (matchingSearching) return; // 演出中。終わったときにまとめて描かれる
  renderMatchingDeck();
}

// Matchingページを初期化する。他のページでは何もしない
function initMatchingPage() {
  const deckEl = document.getElementById('matchingDeck');
  if (!deckEl) return;

  matchingDeck = buildMatchingDeck();
  matchingHistory = [];
  startMatchingSearch();

  const skipBtn = document.getElementById('matchSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', function () { decideMatching('skip'); });

  const buildBtn = document.getElementById('matchBuildBtn');
  if (buildBtn) buildBtn.addEventListener('click', function () { decideMatching('build'); });

  const undoBtn = document.getElementById('matchUndoBtn');
  if (undoBtn) undoBtn.addEventListener('click', undoMatching);

  const resetBtn = document.getElementById('matchResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    localStorage.removeItem(MATCHING_SKIPPED_KEY);
    matchingHistory = [];
    matchingDeck = buildMatchingDeck();
    startMatchingSearch(); // 配り直すときも、もう一度探す動きを見せる
  });

  const keepGoingBtn = document.getElementById('claimKeepGoingBtn');
  if (keepGoingBtn) keepGoingBtn.addEventListener('click', closeClaimModal);

  const claimModal = document.getElementById('claimModal');
  if (claimModal) claimModal.addEventListener('click', function (e) {
    if (e.target === claimModal) closeClaimModal(); // 外側を押したら閉じる
  });

  const ideasCloseBtn = document.getElementById('ideasCloseBtn');
  if (ideasCloseBtn) ideasCloseBtn.addEventListener('click', closeIdeasModal);

  const ideasModal = document.getElementById('ideasModal');
  if (ideasModal) ideasModal.addEventListener('click', function (e) {
    if (e.target === ideasModal) closeIdeasModal(); // 外側を押したら閉じる
  });

  // キーボードでも操作できるようにする（← 見送る／→ 作る／Esc 閉じる）
  document.addEventListener('keydown', function (e) {
    // アイデア欄を開いている間は、矢印キーでカードが飛んでいかないようにする
    if (ideasModal && !ideasModal.hidden) {
      if (e.key === 'Escape') closeIdeasModal();
      return;
    }
    if (claimModal && !claimModal.hidden) {
      if (e.key === 'Escape') closeClaimModal();
      return;
    }
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') decideMatching('skip');
    if (e.key === 'ArrowRight') decideMatching('build');
  });
}

// ===========================
// ランディング（index.html の上半分）
// 棚のアプリ・まだ作られていないリクエスト・アプリ数を、Supabaseの実データで置き換える。
// 読み込み前や失敗時はHTMLに書いてある内容がそのまま残る（0件を見せないため）。
// ===========================

const LP_SHELF_COUNT = 6; // 棚に出すアプリの数
const LP_REQUEST_COUNT = 3; // 「まだ誰も作っていない」に出すリクエストの数

// 棚：いいねが多い順に上位を出す。同数なら新しいものが先。
function renderLpShelf() {
  const list = document.getElementById('lpShelf');
  if (!list) return;

  const apps = getApps()
    .reverse() // 元の並びは created_at 昇順なので、新しい順にしてから並び替える
    .filter(function (app) { return isSafeUrl(app.url); })
    .sort(function (a, b) { return getLikeCount(b.id) - getLikeCount(a.id); })
    .slice(0, LP_SHELF_COUNT);

  if (apps.length === 0) return; // 1件も取れなければHTMLの初期表示のまま

  list.textContent = '';

  apps.forEach(function (app) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'contents'; // li のレイアウト（アイコン＋文字）をそのまま使う
    link.addEventListener('click', function () {
      recordAppView(app.id);
      renderRecentApps();
    });

    link.appendChild(createAppAvatar(app.name, false, app.url));

    const text = document.createElement('span');
    text.className = 'lp-shelf-text';

    const name = document.createElement('b');
    name.textContent = app.name;
    text.appendChild(name);

    const desc = document.createElement('span');
    desc.textContent = app.description;
    text.appendChild(desc);

    link.appendChild(text);
    item.appendChild(link);
    list.appendChild(item);
  });
}

// まだミニアプリが作られていない＝「作る人」に向けて出せるリクエスト
function getUnbuiltRequests() {
  const builtFor = {};
  getApps().forEach(function (app) {
    if (app.builtForRequestId) builtFor[String(app.builtForRequestId)] = true;
  });

  return getRequests()
    .filter(function (req) {
      if (builtFor[String(req.id)]) return false; // もう作られている
      return getClaimCount(req.id) === 0; // 誰かが「今作っている」と言っていない
    })
    .sort(function (a, b) {
      // 実際に人が投稿したものを、見本データより先に出す
      if (a.isSeed !== b.isSeed) return a.isSeed ? 1 : -1;
      return new Date(b.createdAtRaw) - new Date(a.createdAtRaw);
    });
}

function renderLpRequests() {
  const section = document.getElementById('lpRequestsSection');
  const list = document.getElementById('lpRequests');
  if (!section || !list) return;

  const requests = getUnbuiltRequests().slice(0, LP_REQUEST_COUNT);

  // 出せるものが無ければセクションごと隠す（空欄を見せない）
  if (requests.length === 0) {
    section.hidden = true;
    return;
  }

  list.textContent = '';

  requests.forEach(function (req) {
    const item = document.createElement('li');

    const text = document.createElement('span');
    text.className = 'lp-req-text';
    text.textContent = '“' + req.problem + '”';
    item.appendChild(text);

    // 押すと投稿フォームが開き、そのリクエスト宛てが選ばれた状態になる
    const build = document.createElement('a');
    build.className = 'lp-btn lp-btn--sec';
    build.href = 'index.html?builtFor=' + encodeURIComponent(req.id);
    build.textContent = "I'll build this";
    item.appendChild(build);

    list.appendChild(item);
  });

  section.hidden = false;
}

// 棚に並んでいるアプリの数。0件のときは書き換えない（初見の人に0を見せないため）
function renderLpAppCount() {
  const count = getApps().length;
  if (count === 0) return;

  const big = document.getElementById('lpAppCount');
  const inline = document.getElementById('lpCountInline');
  if (big) big.textContent = String(count);
  if (inline) inline.textContent = String(count);

  const browseAll = document.getElementById('lpBrowseAll');
  if (browseAll) browseAll.textContent = 'Browse all ' + count;
}

// 画面右の目印。実画面（#board）まで来たら引っ込める
function initLpRail() {
  const rail = document.getElementById('lpRail');
  const board = document.getElementById('board');
  if (!rail || !board) return;

  function update() {
    // 実画面の上端が画面の下半分より上に来たら、もう案内は要らない
    const gone = board.getBoundingClientRect().top < window.innerHeight * 0.5;
    rail.classList.toggle('lp-rail--gone', gone);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

// FAQ：スマホ幅のときだけ折りたたむ。
// HTMLでは open を付けてあるので、JSが動かない場合も中身は読める（PCと同じ表示）。
function initLpFaq() {
  const items = document.querySelectorAll('.lp-faq-item');
  if (!items.length || !window.matchMedia) return;

  const phone = window.matchMedia('(max-width: 639px)');

  function apply() {
    items.forEach(function (item) {
      item.open = !phone.matches;
    });
  }

  apply();
  // 画面を回転させるなどで幅の境目をまたいだときだけ入れ直す
  if (phone.addEventListener) phone.addEventListener('change', apply);
  else if (phone.addListener) phone.addListener(apply); // 古いSafari向け
}

function renderLandingPage() {
  renderLpAppCount();
  renderLpShelf();
  renderLpRequests();
}

/* ===========================================================
   AI検索（Gemini）
   -----------------------------------------------------------
   キーワードが思いつかない人や、日本語で探したい人のための「意味で探す」検索。
   実際のAI呼び出しは ai.js → Edge Function 側にあり、ここは画面の担当。
   =========================================================== */

function setupAiSearch() {
  const button = document.getElementById('aiSearchBtn');
  const input = document.getElementById('searchInput');
  const panel = document.getElementById('aiSearchPanel');
  if (!button || !input || !panel) return; // このページにAI検索が無ければ何もしない

  const status = document.getElementById('aiSearchStatus');
  const list = document.getElementById('aiSearchResults');
  const closeBtn = document.getElementById('aiSearchClose');
  let running = false;

  function showPanel() {
    panel.hidden = false;
  }

  function showStatus(message) {
    list.innerHTML = '';
    status.textContent = message;
    status.hidden = false;
    showPanel();
  }

  function hidePanel() {
    panel.hidden = true;
    list.innerHTML = '';
    status.hidden = true;
  }

  // 見つからなかったときは、リクエスト板へ誘導する（プラットフォームの本来の流れ）
  function showNoResults() {
    showStatus(t.aiNoResults);
    const link = document.createElement('a');
    link.className = 'ai-search-cta';
    link.href = 'requests.html';
    link.textContent = t.aiPostRequest;
    list.appendChild(link);
  }

  function renderResults(results) {
    list.innerHTML = '';
    status.textContent = t.aiResultsTitle;
    status.hidden = false;

    results.forEach(function (app, index) {
      const item = document.createElement('a');
      // 1件目は本命なので、枠と色を少し強くする
      item.className = 'ai-search-item' + (index === 0 ? ' ai-search-item--top' : '');
      // リンク先はDBに入っているURLだけ。念のため形式も確かめる
      if (isSafeUrl(app.url)) {
        item.href = app.url;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
      }

      // 「これかも？」の一言。1件目と2件目以降で言い方を変える
      const guess = document.createElement('span');
      guess.className = 'ai-search-guess' + (index === 0 ? ' ai-search-guess--top' : '');
      guess.textContent = index === 0 ? t.aiMaybeThis : t.aiMaybeThisToo;
      item.appendChild(guess);

      const head = document.createElement('span');
      head.className = 'ai-search-item-head';

      // アプリ一覧と同じ色付きアイコンタイルを使って、見た目を揃える
      head.appendChild(createAppAvatar(app.name, false, app.url));

      const text = document.createElement('span');
      text.className = 'ai-search-item-text';

      const name = document.createElement('span');
      name.className = 'ai-search-name';
      name.textContent = app.name;
      text.appendChild(name);

      if (app.category) {
        const category = document.createElement('span');
        category.className = 'ai-search-category';
        category.textContent = categoryLabel(app.category);
        text.appendChild(category);
      }

      head.appendChild(text);

      const arrow = document.createElement('span');
      arrow.className = 'ai-search-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      head.appendChild(arrow);

      // AIが書いた文章は textContent で入れる（HTMLとして解釈させない）
      const reason = document.createElement('span');
      reason.className = 'ai-search-reason';
      reason.textContent = app.reason || app.description || '';

      item.appendChild(head);
      item.appendChild(reason);
      list.appendChild(item);
    });

    showPanel();
  }

  function messageForError(res) {
    if (res.error === 'missing_query') return t.aiErrorEmpty;
    if (res.error === 'global_limit') return t.aiErrorGlobal;
    if (res.error === 'limit_reached') {
      return res.signedIn ? t.aiErrorLimitUser : t.aiErrorLimitAnon;
    }
    return t.aiErrorGeneric;
  }

  async function runAiSearch() {
    if (running) return; // 連打で回数を無駄に使わないようにする

    const query = input.value.trim();
    if (!query) {
      showStatus(t.aiErrorEmpty);
      input.focus();
      return;
    }

    running = true;
    button.disabled = true;
    showStatus(t.aiSearching);

    const res = await AI.searchApps(query);

    running = false;
    button.disabled = false;

    if (!res.ok) {
      showStatus(messageForError(res));
      return;
    }

    if (!res.results || res.results.length === 0) {
      showNoResults();
      return;
    }

    renderResults(res.results);
  }

  button.addEventListener('click', runAiSearch);
  if (closeBtn) closeBtn.addEventListener('click', hidePanel);
}

document.addEventListener('DOMContentLoaded', setupAiSearch);
