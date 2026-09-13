# 引き継ぎメモ — CobbleWorks ビルドインパブリック X投稿プロジェクト

最終更新: 2026-09-13

新しいセッションを始めたら、まずこのファイルを読んで状況を把握すること。
(プラットフォーム開発の状況は `PROGRESS.md` 側。こちらは記事執筆専用)

---

## 背景

- ユーザー: 天(Ten)、日本在住、プログラミング初心者(vibe coding 歴2ヶ月弱)
- 「CobbleWorks」= 誰でもアプリを作ってシェアできるプラットフォームを開発中
- X(Twitter)で英語で毎日ビルドインパブリック投稿
- 目標: 半年で1000フォロワー + 最初のユーザー獲得
- 現在 200フォロワー超(2026-09-10 時点)

## 記事の型(毎回この構成)

1. 決まった自己紹介ブロックで開始(一字一句この通り):

   Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone
   can turn their own ideas into apps and share them. I dream of a world where
   that kind of power can genuinely update people's lives.

2. "Today's topic: [トピック]." の一文
3. 本文
4. 最後に読者への問いかけで締める

## 厳守ルール

- **X投稿はマークダウン非対応** → アスタリスク・見出し・引用記号・箇条書きは一切使わない
- **出力時は段落ごとに1行**(手動改行を入れない)。入れるとコピペ時にガタガタになる
- 質問に答えてもらっても勝手に記事化しない。**「書いて」と言われて初めて執筆**(トークン節約)
- 記事の材料(実体験・判断軸)はユーザー自身の言葉から拾う。**Claudeが創作しない**
- 統計・事実は必ず WebSearch で裏取りしてから使う
- 図は dataviz skill に従う。作ったら **必ず Read tool で目視確認してから** SendUserFile

## 図の作り方(このセッションで確立した手順)

1. HTML + CSS を書く。フォントは Nunito(Google Fonts)、配色は `tokens.css` の
   Terracotta & Cream(`--map-accent:#D9704C` / 背景 `#FAF4EC` / 文字 `#3D3229`)
2. **アクセントは1色だけ使う。** 2色使うと `validate_palette.js` の色覚テストで落ちる
   (テラコッタ + グレーは ΔE 5.2 で FAIL 実績あり)。対比は色ではなく構造で出す
3. Playwright でレンダリング。**`NODE_PATH=/opt/node22/lib/node_modules` が必要**
   (playwright はグローバルにのみ入っている)。1600x900 / deviceScaleFactor 2
4. Read tool で画像を確認 → はみ出し・折り返し崩れを直す → SendUserFile

**数値グラフにしない判断も重要。** 単位が違う2つの数字(例: 利用者数と順位)を
1枚に入れると2軸グラフになるので禁止。数字が主役ならスタットタイルにする。

---

## これまで書いた記事(時系列)

1. Why Build in Public(導入)
2. Why building in public in English
3. Why Is Claude Code the King?
4. Why I'm Really Building CobbleWorks(5 Whys)
5. The Cost of AI for Indie Developers(ROI論、モデル使い分け)
6. What I Let AI Do — and What I Never Will(AIに感情がない)
7. One Month In
8. GPT-6 Astra vs Claude Code(乗り換えない)
9. スランプ記事(継続率グラフ付き。5分ルール+PDCA)
10. デジタルノマドを目指す理由(ビザ収入比較の棒グラフ付き)

## 完成済み・投稿待ちの原稿(全文は下部に保管)

11. **The bug that never showed me an error** — 同期バグ。46個のアプリがlocalStorage
    だけで動いていた。スマホで開いたら空。エラーなし。Sonnet→Opusで解決
12. **Is ChatGPT Astra truly AGI?** — Technology × Autonomy × Humanity の3軸。
    結論「まだAGIではない」。図1枚あり(3軸のうち目盛りがあるのは1本だけ)※未作成
    **要修正: "thirty six" → 46**
13. **Maybe you're not in a slump** — 130→200フォロワー。伸びの鈍化は異常ではない。
    スペイン旅行で読者層が変化(日本が2位→圏外)
14. **What I actually do when someone passes me** — 週1000人増の人を見て。
    「向こうの方がすごい。問題は自分が次に何をするか」。図1枚あり(日本はX世界2位
    だが英語力123カ国中96位)→ `japan-x-english.png` 作成済み
15. **The part of my own product I forgot to build** — 通知が無い。リクエストに応えて
    アプリを作ったのに、頼んだ本人に伝わらない。画像3枚(図+リクエストカード+アプリ)
    → 図は `cobbleworks-two-weeks.png` 作成済み
16. **Whether someone who builds with AI still needs to learn to code** — 結論は
    「作るためではなく、断るために学ぶ」。20〜30時間、4項目だけ

---

## 未処理タスク

1. **記事12の "thirty six" → 46 に修正**(現在形で語っている数字なので要更新)
2. 記事12用の図(3軸のうち目盛りがあるのは1本だけ)がまだ未作成
3. 記事15を出す場合、画像4(ユーザー表)はハンドル名を伏せること。
   代わりに作った図 `cobbleworks-two-weeks.png` を使えば問題なし
4. 記事の投稿順をユーザーが決める

## 次の記事の候補(未着手)

- **提出の摩擦と「アイデアだけ持ち逃げ」問題** — 記事15から切り出して温存中。
  アプリ提出には先に公開URLが必要で、初心者はそこで詰まる。一番楽な行動が
  「リクエストだけ持ち帰って自分で作る」になってしまっている設計の話
- **AIとの実際の作業の仕方** — SKILL.md にルールを書く、PROGRESS.md で端末間を繋ぐ
- **普通の人が本当に欲しがるアプリ** — 46個の実データから。エンジニアの想像とのズレ
- **作ったものは誰にも見つけてもらえない** — sitemap / meta / Search Console

---

## CobbleWorks の現状の数字(2026-09-12 時点)

- ミニアプリ **46個**(`apps/` 配下)
- 2週間で **130 visits**(Cloudflare Web Analytics)
- アカウント作成 **4**(うち1つは本人 devcobble)
- 実際にアプリを使った人 **1人**(mila)
- 本物のリクエスト **1件**(ipanditshashi、2026-09-11)
  → 「自分のプロダクトをAIが推薦してくれるか分からない」という内容。
  応えてアプリを作成済み(AI readability score)。**ただし通知機能が無いため
  本人に伝わっていない** ← 記事15の核
- リクエストボードの大半は自前のシード(`seed-requests-general.json`)

## 提出フォームの必須項目(記事の材料として)

アプリ名 / 説明 / **アプリのURL** / 対象ユーザー / カテゴリ(+任意で対応リクエスト)

→ URLが必須なので、提出前に自力でホスティングが必要。ここが初心者の脱落点。
  ホスティング先を案内するなら **Netlify Drop** 推奨(アカウント無しで開始でき、
  後から紐付けて永続化可能)。**Cloudflare Drop は60分で消えるので不可。**

---

## 参考: 確認済みの事実(裏取り済み)

- X Articles(装飾つき長文)は **デスクトップの x.com からのみ作成可能**。
  スマホからは作れない。2026年1月から Premium 全体に開放
- 長文ポスト(約25,000文字)は Premium ならスマホからも投稿可能
  → プレーンテキストで書いているので、スマホからはこちらで出せる
- 日本は X の世界2位の市場、約7,100万人、普及率約6割(米国は約1億400万人)
- 日本の EF 英語能力指数は **123カ国中96位**、5段階で最下位バンド、11年連続下落

---

# 完成原稿(全文)

投稿時はこのまま使える。アスタリスク無し、段落ごとに1行。

## 記事11: The bug that never showed me an error

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: the bug that never showed me an error.

In a little over a month, I had built thirty six mini apps. Small, ordinary things. A habit tracker. A shift board for a team. A budget sheet. A place to keep notes on companies I was watching. Every one of them worked. I tested them, I used them, I shipped them, and I moved on to the next one.

Then one day I thought about what these apps were actually for. They are supposed to be small and casual. The kind of tool you pull out while you are standing in line, or on the train, or waiting for a friend. Not something you sit down at a desk for. So for the first time, I opened one on my phone.

It was empty. Not one piece of my data was in it.

No error message. No red text. Nothing crashed. The app looked completely healthy. It just had nothing inside.

If you have never been a beginner at this, it is hard to explain what that does to you. When you get an error, you have something to hold. You can copy it, search it, paste it somewhere and ask what it means. It is a thread, and you can pull it. Here there was no thread. Everything looked right and everything was wrong, and I had no idea which of those two facts to trust.

The cause turned out to be a contradiction I had built with my own hands.

The platform had proper login. Your account followed you anywhere, on any device. That part worked. But every mini app underneath it was saving its data inside the device itself. Data made on my laptop lived on my laptop. Data made on my phone lived on my phone. They were two separate worlds that were never going to meet, and I had written both halves myself without ever noticing they disagreed.

I did not notice for over a month for a very boring reason. I only ever tested on the one machine I was building on.

And the repair was not one fix. It was thirty six decisions. I had to go back through every app I had already called finished and ask what it was actually storing and where that data should live. Twenty eight of them had to be moved onto a shared data layer so their data follows the account instead of the device. Four were already talking to the database directly and were fine. Three turned out to hold nothing worth syncing at all, just a language setting or a key. One was built differently enough that I left it alone on purpose.

That is what a quiet mistake costs. Not one bad afternoon. A pass back over everything you thought you had already finished.

And then the second bug appeared, which was worse than the first.

Data that had been saved before I ever logged in carried no owner on it. My sync logic decided which version wins by asking one simple question: which one was saved more recently? A half finished, ownerless draft sitting on one device was technically newer. So it won. It overwrote a list I had patiently built up on the other device, and that data was gone.

Zero errors, again. The code ran exactly as I had written it. It was just quietly deleting things.

Here is the part I want to be honest about, because build in public is worth nothing if I only post the wins.

I could not diagnose this myself. I do not have the experience. What I did was follow the steps Claude gave me and keep grinding, attempt after attempt, and for a long stretch nothing worked at all. I would try something, watch it fail in the same silent way, and go back to the start.

Then I switched the model from Sonnet to Opus, and it was solved almost immediately.

I would love to tell you it was my persistence that cracked it. Some of it was. But I would be lying if I said my effort mattered more than the model I happened to be using that day. I think that is worth saying out loud, because a lot of beginners quietly decide they are not smart enough, when the truth is they were pointing a lighter tool at a heavy problem. Knowing when to reach for the stronger one is a skill of its own, and nobody teaches it to you.

What I did afterward matters more to me than the fix itself. I wrote the rules down into the template and the instructions my AI reads before it builds anything new. Not the code. The invariants. What must never be synced. Why data from before login is dangerous. And one line I keep coming back to: checking that the code has no syntax errors proves absolutely nothing about whether it syncs. Now every new app starts out already knowing what cost me real data.

Then I opened them on my actual phone, one by one, and checked.

One thing is still imperfect on purpose. The sync replaces a whole record at once, so if two devices edit the same thing at the same moment, one side still loses. I know. I left it there, written down, until it actually hurts someone. Pretending my project has no known weak points would be a strange way to build in public.

The real lesson is smaller and harder than any of the code.

No error is not the same as it works. The bugs that scare me now are the silent ones, the ones that look like success. And my actual blind spot was never a missing skill. It was that I only ever tested in the exact situation I had built in.

What is the bug that taught you the most, and did it arrive with an error message or with silence?

## 記事12: Is ChatGPT Astra truly AGI?

**※ "thirty six" を 46 に修正してから投稿すること**

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: is ChatGPT Astra actually AGI? My answer is no, not yet — and the reason has less to do with how smart it is than you would expect.

Everyone is asking the question right now. Before I could answer it, I had to work out what I would even be answering. So I built myself a frame with three parts, and then I ran Astra through it honestly. Here is what I got.

The first part is technology. Can it write code, debug it, solve hard problems, learn new skills, use tools, move between completely different kinds of work? This is the part everyone measures, and it is the part Astra clearly scores high on.

But my own experience made me distrust this axis more than most people seem to. Last month I hit a bug I could not solve. I followed the steps my AI gave me and ground away at it for a long time, and nothing worked. Then I switched the model I was using from Sonnet to Opus, and it was solved almost immediately. Same person, same problem, same day. What changed was which intelligence I had in front of me.

That taught me something that keeps mattering. Capability is not one smooth line, and AI is not one thing. When people say the technology is nearly there, I want to ask: which model, in whose hands, at what price? So even a very high score here does not settle the question by itself.

The second part is autonomy. A general intelligence should not sit and wait for instructions. It should understand a goal, make a plan, carry it out, check the result, notice its own mistakes, adjust, and keep going until the goal is actually reached.

The word people skip in that list is check.

The bug I mentioned had no error message. Nothing crashed, nothing turned red. The code ran exactly as I had written it, and it was quietly deleting my data while looking perfectly healthy. If the only signal you can recognise as failure is an error, you cannot run that loop at all. You will report success and be wrong.

Real autonomy means noticing that nothing looks wrong and something is. And here I have to be honest: I cannot judge Astra on this. I have not handed it a long, silent, multi day piece of work and watched what it does when there is nothing obvious to react to. Neither has almost anyone posting about it. Demos are short and loud. This axis only shows itself in work that is long and quiet.

The third part is the one I find hardest, and it is where I think most of the argument goes wrong. Humanity.

People mix two completely different things here. One is whether an AI can understand human context, why a person is behaving the way they are, what they actually meant instead of what they typed. The other is whether it genuinely feels anything.

I have written before that AI has no emotions, and I still believe that. But I do not think AGI needs to feel. It needs to understand us well enough to work alongside us.

Which leads to the obvious objection, and I would rather raise it myself than have someone raise it for me: isn't understanding humans just another technical capability? If it is, my third axis collapses into my first one.

So let me define it more carefully. Humanity is not whether it can model you. It is whether you would rely on it. Whether you would hand it something that actually matters to you and not check over its shoulder. That is not a benchmark score, and I have no way to measure it from the outside yet.

Which leaves me with three axes, and only one of them has a ruler.

That is the real problem. We argue endlessly about the axis we happen to be able to measure, and stay quiet about the two we cannot. So my answer to the original question is no. Not because Astra is unimpressive, but because two of the three things I care about are things I cannot even measure right now, and there is no reason to assume all three arrive at the same time. Powerful is not the same as general.

And there is one more thing I would add to the definition that almost nobody includes.

I am a beginner. A little over a month ago I had never built an app in my life. Since then I have built thirty six of them, and the only reason that was possible is that this kind of intelligence was actually within my reach, at a price I could pay, on the machine I already owned. That is the entire reason CobbleWorks exists. The power to turn your own idea into something real should not be reserved for people who already know how.

So if we build the most capable intelligence in history and only a handful of institutions can afford to run it, I do not think we should call it general. General has two meanings. It can do anything, and it is available to anyone. We spend all our time arguing about the first one and almost none on the second.

The day I will believe AGI has arrived is not the day a model tops a benchmark. It is the day someone with no background, no funding and no permission uses one to change their own life, and nobody finds that remarkable.

What would it take for you to say we had arrived, and does your definition include who gets to hold it?

## 記事13: Maybe you're not in a slump

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: how to tell whether you are actually in a slump, or whether you have just misread your own numbers.

Yesterday I passed 200 followers on X. A week before that, I was at about 130 and quietly convinced I had stalled.

I want to be honest about something else, too. Hitting 200 felt less exciting than hitting 100 did. That reaction surprised me enough that I started thinking about why, and it led me somewhere more useful than the milestone itself.

I have written about slumps here before, when I was worried about giving up. This is a different question. Not how to keep going, but how to tell whether anything is actually wrong.

Here is the pattern I keep falling into. Growth arrives in an uneven burst. A post does better than expected, a few people share it, and for several days the numbers move faster than usual. Then the burst ends and things go back to the ordinary pace. And because I was just living inside the fast version, the ordinary pace feels like a collapse.

Imagine gaining ten followers a day for a stretch, and then gaining one or two. It feels like something broke.

But probably nothing broke. You most likely just returned to your normal rate, and the contrast is doing all the emotional work.

This is the trap of judging yourself by short windows. A drop in the rate of growth is not the same as going backwards. Sometimes it only means an unusually good period ended, and unusually good periods are, by definition, not the baseline.

There is a second thing I did not expect, and I only noticed it because I happened to be traveling.

I am in Spain at the moment. Not a move, just a trip. But my posting hours shifted with the timezone, and the people my posts reach shifted with them. Japan used to be the second largest country in my audience. Right now it does not show up in the list at all.

Same person. Same account. Same kind of posts. The room I was speaking into quietly changed while I was standing in it.

And that is a small, ordinary example. Your audience can shift. The algorithm can change. Trends move. The platform itself changes. Expecting your numbers to follow a clean, stable line while all of that moves underneath you is not realistic. Volatility is not a sign that you are failing. It is the cost of playing at all.

So how do you tell a real slump from noise?

I start with the boring question: am I still doing the work? Am I still posting, still replying to people, still trying things I have not tried, still learning something each week? If the answer is yes, then a slow stretch is most likely just volatility, and the correct response is to keep going and stop staring at the graph.

But if I have been doing the same things for a meaningful length of time and genuinely nothing has moved, that is different. That is structural, and it deserves analysis instead of feelings.

Internally, that means looking honestly at content quality, at the topics I choose, at how often I post, at how I am positioned, at whether my replies are worth reading. Externally, it means the algorithm, the audience, the trends, the platform, and my own environment.

Then I form one hypothesis, try it, watch what happens, and adjust. One at a time, so I can actually tell what caused what.

And I try to remember that structural problems do not resolve overnight. If it took months to build the situation, a week of effort is not a fair test of the fix.

Which brings me back to 130.

I thought I had stalled. I had not. I kept posting, kept replying, kept experimenting, and about a week later I passed 200. Looking back, what felt like a slump was a normal pace, a changing environment, and my own habit of reading bad news louder than good news.

Growth is not supposed to be a straight line. A slow week is not proof of failure, and a viral week is not proof that you have worked anything out.

When your numbers slow down, how long do you wait before you decide something is actually wrong?

## 記事14: What I actually do when someone passes me

図 `japan-x-english.png` の挿入位置: 「The room is enormous and almost entirely sealed.」の直後

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: what I actually do when someone passes me.

It took me about a month to reach a little over a hundred followers. Around that time I watched someone gain more than a thousand in a single week.

Let me say the thing most posts about this refuse to say. By results, they did better than me. That is not close. I am not going to pretend otherwise, and I do not think you should either.

You have read the other version of this post. The one that tells you their numbers do not mean they are ahead of you, that you cannot compare, that you are doing fine. I understand why people write it. But readers can smell comfort, and comfort does not change anything on Monday.

Here is what I think is actually wrong with comparison. It is not that comparing is forbidden. It is that "who is better" is a question whose answer changes nothing about what I do tomorrow. I can answer it perfectly and be exactly where I started.

So I try to replace it with a question that does change tomorrow: what do I do now?

Which, in that case, meant opening their account and studying it properly. Which of their posts grew and which did not. What the ones that grew had in common. How they opened. What they asked for at the end.

But there is a step most people skip, and I think it is the step that separates studying from copying.

Before you take anything from someone's success, check the bias in what you are looking at.

Did they already have an audience somewhere else before this week? Was the topic riding something that was going to move with or without them? And the uncomfortable one: how many people did exactly what they did and got nothing, and how many of those people did I never see, precisely because it did not work for them?

If you skip that question, you are not copying their method. You are copying their position, and that part does not transfer. Their number is a result, and results are not instructions. Only the process is.

Which brings me to the part that I think is genuinely true rather than merely comforting.

We are not running the same experiment.

I write in my second language. Every post costs me time a native speaker never spends, and some of my sentences land slightly off in ways I cannot hear myself.

But I do not think that is a disadvantage, and the reason is more interesting than it first looks.

People assume I write in English because the market is bigger. That is not quite what happened. Japan is the second largest country on X in the world, with around seventy one million users, behind only the United States. Roughly six in ten Japanese people have an account. I did not leave a small room.

Here is the part that actually decided it. Japan ranks 96th out of 123 countries on the EF English Proficiency Index, in the lowest of its five bands, and it has fallen every year for eleven years. So the overlap between people who are on X in Japan and people who can follow a conversation like this one in English is very small. The room is enormous and almost entirely sealed.

And the reason it is sealed is not a lack of ability. It is that Japan's domestic market is large enough that most people genuinely never need English. Everything you want already exists in your own language. The size of the market is exactly what closes the door.

Meanwhile English is not one country. It is the United States, India, the Philippines, Malaysia, Nigeria, and everyone else who uses English as a working language rather than a native one. Many of the people I talk to every day are, like me, operating in their second language.

So the choice was never big market versus small market. It was one enormous closed room versus a lot of rooms that happen to share a working language.

That is why I take the cost. And it is why, when I stand next to a native speaker with the same follower count, the gap between us is not a measurement of effort or ability. Different inputs, different experiment. That is not an excuse I reach for when my numbers are bad. It cuts both ways: I also do not get to feel good when I am ahead of someone whose conditions I know nothing about.

And it goes further than I first realised. I wrote last time that my own audience shifted while I was traveling, to the point where Japan went from the second largest country in my audience to not appearing at all. Same account, same person, different experiment. If I cannot cleanly compare myself to myself two months ago, then comparing myself to a stranger was never a measurement in the first place.

So this is where I have landed. Look at people who are doing better than you, and look closely. Admit it when they are. Study what they did, question what you cannot see, and take the process and leave the score.

The only number that has ever told me anything useful is the one I had last month.

When you see someone far ahead of you, what do you actually do in the next ten minutes?

## 記事15: The part of my own product I forgot to build

画像の挿入位置:
- 図 `cobbleworks-two-weeks.png` → 「One of those four is me.」の直後
- リクエストカードのスクショ → 「walking away to see what would happen.」の直後
- 作ったアプリのスクショ → 「Whether a price appears anywhere at all.」の直後
(長文ポストなら末尾に 図 → リクエスト → アプリ の順)

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: the part of my own product I forgot to build, and the stranger who showed me.

Let me start with the numbers, because they are small and I would rather you hear them from me than guess.

Over the last two weeks, 130 people visited CobbleWorks. Four of them created an account. One of those four is me.

Of the other three, exactly one has ever opened an app and used it. That is the honest state of the thing I have been building.

I should admit something else, about the request board, which is the heart of the whole idea. Most of the requests sitting on it were written by me, to keep the place from looking abandoned. I am not proud of that. But an empty board asks nothing of anyone.

Then, last Friday, someone I have never met left a real one.

They wrote that they were struggling to market their product, and specifically that they had no way of knowing whether an AI would ever recommend it. There are tools that claim to tell you, they said, but they are not good. What they wanted was something that could look at their site and tell them how it would be seen, and where to push.

I read it about four times.

Because that is the entire thesis of CobbleWorks, arriving unannounced. Not a friend doing me a favour. Not one of my own seeded cards. A stranger with a real problem, writing it into a box I built for exactly that, and then walking away to see what would happen.

So I built it. It reads a page and scores how legible the product is to an AI, then shows which parts are missing. Whether the page says plainly what the thing actually is. Whether it names who it is for. Whether it uses the words people search with, rather than the words the founder likes. Whether a price appears anywhere at all.

And then I sat back, quite pleased with myself, and realised something that took all the air out of the room.

They have no way of knowing.

There is no notification in CobbleWorks. None at all. If you post a request and somebody builds it, nothing tells you. No email, no badge, no message, nothing. Your request gets answered, and you go on with your life never finding out.

I have built forty six apps. I have spent months on this platform. And I made a place whose entire promise is "ask, and someone will make it for you" while forgetting the part where you tell them it exists.

It is such an obvious hole that I still cannot fully explain how I missed it. But I think I understand the shape of the mistake now.

I was building for the maker. Every part of the platform I had polished was a part I personally touch: the submit form, the app pages, the request board. I had walked the maker's path hundreds of times, because I am the maker. I had never once walked the other path. Post something, then wait. I had never been the person waiting, so I never noticed that the waiting leads nowhere.

You do not find that by testing. Testing is you, walking where you already know to walk. The only thing that finds it is a real stranger using your thing in a way you never rehearsed.

So the loop I thought I was building was request, then build. Two steps. It is actually four. Request, build, tell them, and then they use it. I had shipped half a loop and called it a platform.

Notifications are next, obviously. But the part I want to keep is not the feature. It is the reminder that the hardest thing about what I am making was never the making. Making is the part AI already handed me. Connecting one person to another is the part nobody hands you, and I keep underestimating it precisely because it involves no code that is interesting to write.

One person asked for something. I made it. They still do not know.

What is the part of your own thing that you have never once used the way a stranger would?

## 記事16: Whether someone who builds with AI still needs to learn to code

Hey, I'm Ten — from Japan. I'm building CobbleWorks, a platform where anyone can turn their own ideas into apps and share them. I dream of a world where that kind of power can genuinely update people's lives.

Today's topic: whether someone who builds with AI still needs to learn to code. I spent two months convinced the answer was no.

Here is my situation, stated plainly. In about two months I have built forty six apps. I have written essentially none of the code. AI writes it. I make the decisions — what to build, how it should look, what it is for, what to cut — and the machine does the part that used to require years of training.

And I want to be honest: it has cost me almost nothing so far. I have rarely been blocked by not knowing how to code. So the question is not rhetorical for me. Learning to code in 2026 feels a little like drilling long division in a world of calculators. The hours are real, the payoff is not obvious, and I could spend those same hours talking to people instead.

I was ready to answer no. Then I looked at what had already happened to me.

A while back I found that my apps were quietly losing data. There was no error. Nothing crashed, nothing turned red. The code ran exactly as written and deleted things anyway. AI had written that code. AI had told me it was done. And I had no way to tell the difference between working and broken, because the only signal I know how to read is whether something looks wrong on screen.

It took me a long time and a change of model to get out of it.

Someone asked me recently whether knowing more would have helped. I answered without thinking: of course it would. I would have handled it from the start. Not fixed it faster — prevented it. If I had understood where data actually lives and who it belongs to, I would never have written that rule in the first place.

But that is hindsight, and hindsight is cheap. The sharper version of the problem is happening right now.

Last week I had to decide whether to let people upload their own HTML files onto my platform. I decided not to, for security reasons, and I still think that was correct. But let me be honest about how I arrived there. I did not work it out. I was told, I understood the explanation, and I agreed with it.

That is the actual gap, and it is not the one I thought it was.

The problem is not that I cannot write code. The problem is that I cannot say no on technical grounds. When AI hands me something, I can accept it, or I can ask for a different version and accept that. When a person advises me, I can follow the advice, but I cannot evaluate it. Every decision I genuinely own is a product decision. Not one of them is a technical one. I am making choices in a room where I cannot read the signs.

And there is a line I crossed without noticing. Other people now have accounts on my platform. Their things are stored there. When I break something and it is my data, it is a bad afternoon. When it is the data of someone who trusted a stranger's website, it is a different category of thing entirely, and no amount of "the AI wrote it" will make that better.

So my answer to my own question is yes. But not the version I was dreading.

I am not going to memorise syntax. The machine writes better code than I ever will, and racing it is a bad use of a life. What I need is to read a map, not to lay bricks. Four things, specifically. Where data is stored and who can see it. What a web page is able to do to the person visiting it. How to read an error well enough to describe what happened. And how far a change can reach — whether this touches one screen or every user I have.

That is maybe twenty or thirty hours of learning. Not a degree.

Which reframes the whole thing, because I had been comparing the wrong options. I was weighing "learn to code," which is hundreds of hours, against "spend that time building an audience," and concluding the audience wins. But thirty hours was never a fork in the road. It is a Saturday and a few evenings, and it does not cost me a single conversation.

What I am buying with those hours is not speed. AI already gave me speed. It is the ability to refuse.

If you build with AI, what is the last technical decision you made that you could actually defend on your own?
