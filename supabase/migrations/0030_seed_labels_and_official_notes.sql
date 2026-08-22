-- Phase: プラットフォームの「賑わい」を、嘘をつかない形で作るための2点セット
--
-- 1. requests.is_seed
--    シードリクエスト100件は全てtenさんのアカウントに紐づいているため、一覧が
--    「1人が100件投稿している」ように見えてしまっていた。is_seedで印を付け、
--    UI側では投稿者名の代わりに「CobbleWorks サンプル」と表示する。
--
-- 2. app_comments.is_official
--    運営名義のコメント（アプリの紹介・使い方のヒント）を各ミニアプリに1件ずつ付け、
--    コメント欄が完全な空にならないようにする。運営バッジ付きで表示するので、
--    一般ユーザーの投稿と見分けが付く。
--
-- 架空の一般ユーザーは作らない。運営が運営として喋る形にしているので、
-- 後から実ユーザーが増えても取り下げる必要がない。

-- ---------------------------------------------------------------------------
-- 1. シードリクエストに印を付ける
-- ---------------------------------------------------------------------------

alter table public.requests add column if not exists is_seed boolean not null default false;

update public.requests set is_seed = true where problem = 'I want to know how much of my paycheck is left after fixed costs like rent and subscriptions, but doing the math every time is a hassle.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I keep forgetting which subscriptions I''m paying for until I see the charge on my card.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to save up for a trip, but I never actually stick to a savings goal.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Splitting bills with roommates always turns into a confusing group chat full of who-owes-who.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I don''t really know where my money goes each month, I just know it''s gone.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to compare prices before buying something big, but I forget what I found on different sites.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have a vague savings goal for a new laptop but no plan, so I never actually save.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have tasks scattered across notes apps, texts, and my memory, so things fall through the cracks.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I procrastinate on big assignments because they feel overwhelming as one giant task.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I lose track of which day I''m supposed to do recurring chores like laundry or watering plants.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I get distracted mid-task and forget what I was originally trying to do.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I set goals at the start of the week but never check back in on them.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to time-box my study or work sessions but keep losing track of how long I''ve actually focused.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have too many browser tabs open with things I meant to read or do later.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I''m trying to learn a new skill from scattered YouTube videos and forget what I''ve already watched.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I make flashcards but never review them on a schedule, so I forget what I learned.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track how many hours I''ve studied for an exam, but I keep losing count.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I read a lot of articles for a course but forget the key points a week later.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I''m learning a language but don''t have a way to track which words I already know.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a daily study habit but keep breaking my streak without noticing.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a habit of drinking more water but keep forgetting during the day.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I do home workouts but never remember which exercises I did last time to switch things up.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a consistent sleep schedule but have no idea how irregular it actually is.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I try to stretch every day but forget which stretches target which muscles.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track my steps or workouts across different apps but everything is scattered.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I set fitness goals but never check whether I''m actually making progress.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to notice patterns in my mood but never write anything down in the moment.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I know gratitude journaling helps me, but I forget to do it most days.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I get overwhelmed and don''t know what''s actually stressing me out.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a short daily reflection habit but journaling apps feel like too much.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I forget to check in with myself during busy weeks and burn out without noticing.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I always forget people''s birthdays until it''s too late to get a good gift.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I hear friends mention things they want but forget by the time their birthday comes around.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to stay in touch with friends who live far away but always lose track of who I last talked to.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Planning a group hangout always turns into a messy back-and-forth about times that work.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to remember small details friends tell me about their lives so I can ask about them later.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have a backlog of books I want to read but forget what''s actually on the list.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I start creative projects but abandon them because I lose track of my next step.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track which movies or shows I''ve watched and rate them, but keep forgetting titles.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I collect playlists across different moods but can never find the right one later.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a habit of drawing or writing daily but keep skipping days.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I forget which household items are running low until I''m already out.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to declutter my room but don''t know where to start or track progress.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Plants at home keep dying because I forget to water them on schedule.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I can never remember which household task I did last, like when I last cleaned the fridge.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Splitting chores with roommates always feels unfair because no one remembers who did what.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I''m applying to multiple jobs and lose track of which ones I''ve followed up on.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to prep for interviews but forget which questions I struggled with last time.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I keep meaning to update my resume with new skills but never actually do it.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track which recruiters or contacts I''ve networked with, but it''s all scattered in my messages.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I stand in front of the fridge every night with no idea what to cook.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I buy ingredients for recipes and then forget to use them before they go bad.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to meal prep for the week but keep underestimating how much time it''ll take.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I find good recipes online but lose the link and can never find them again.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to try cooking more variety but keep making the same three meals.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I order takeout more than I mean to and don''t realize how often until the bill arrives.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Planning a trip means juggling bookings, ideas, and packing lists across a dozen browser tabs.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I forget to pack something every single trip.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to budget for a trip but always end up spending more than planned.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I collect travel recommendations from friends but forget them by the time I actually plan a trip.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'My phone has so many apps I forget which ones I actually use.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have account info scattered across notes and my memory and can never remember what exists.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I keep meaning to back up my photos but never actually get around to it.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I sign up for free trials and forget to cancel before they charge me.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'My phone storage keeps filling up and I don''t know what''s taking up space.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to buy something but keep going back and forth between a few options.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I impulse buy things online and regret it later.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I forget which stores or brands had the best price on something I buy regularly.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track big purchases I''m saving up for, ranked by priority.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I play several games and lose track of my progress or what to do next in each.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track games I''ve finished and rate them, but forget to log it after finishing.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'My watchlist for shows and movies is scattered across different apps and screenshots.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to reduce how much I throw away but have no sense of my actual habits.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to buy more secondhand items but forget to check secondhand options before buying new.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track small eco-friendly habits like using a reusable bottle, but forget if I''ve been consistent.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I forget when my pet''s next vet appointment or vaccination is due.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track my pet''s feeding schedule when multiple people in the house feed them.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to log my pet''s weight and health notes over time but keep forgetting to write it down.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I never remember which bus or train combination is fastest for different times of day.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track how much I''m spending on transit each month but never add it up.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I carpool with coworkers and the schedule of who drives when gets confusing.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I do freelance work on the side and lose track of which clients still owe me payment.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track hours for a side project to see if it''s actually worth my time hourly.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I have small business ideas but they get lost in random notes and forgotten.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'Planning a group event means constant back-and-forth messages about who''s bringing what.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I RSVP to things and then forget to actually add them to my calendar.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track recurring events like monthly meetups but keep missing them.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I hear a song I like but forget to save it before I lose the moment.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build a workout or focus playlist but keep starting over from scratch.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I highlight passages in books but never revisit them afterward.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track my reading pace to hit a yearly reading goal.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to build better habits in general but forget which ones I''m even trying to build.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I make plans with friends and forget the details like time and place by the time it rolls around.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track small wins throughout the day but forget them by evening.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to compare a few apartment or room listings but keep losing track of details between tabs.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I set New Year''s or monthly resolutions but never look at them again after the first week.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track which chores or errands I''ve delegated to others so nothing gets forgotten.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I keep meaning to try new restaurants or cafes recommended to me but forget the names.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want to track my screen time goals but forget to check whether I''m sticking to them.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';
update public.requests set is_seed = true where problem = 'I want a single place to jot quick ideas throughout the day without them getting lost in other apps.' and owner_id = '1b3b2d99-cd41-4f8b-9805-63155203ff81';

-- ---------------------------------------------------------------------------
-- 2. 運営コメント
-- ---------------------------------------------------------------------------

alter table public.app_comments add column if not exists is_official boolean not null default false;

-- 一般の投稿者が運営バッジ付きコメントを作れないようにする。
-- 中身は0019のポリシーそのままで、is_official = false の条件だけを足している。
drop policy if exists "Anyone can post a comment; only the app owner can reply" on public.app_comments;

create policy "Anyone can post a comment; only the app owner can reply"
  on public.app_comments for insert
  to anon, authenticated
  with check (
    is_official = false
    and (
      (
        reply_to_id is null
        and (user_id is null or user_id = auth.uid())
      )
      or (
        reply_to_id is not null
        and user_id = auth.uid()
        and exists (
          select 1 from public.mini_apps m
          where m.id = app_comments.app_id and m.owner_id = auth.uid()
        )
      )
    )
  );

-- 運営コメントをクライアントから書き換えられないようにする保険。
-- UPDATEポリシーは元々1つも無いので現状でもUPDATEは通らないが、
-- 将来誰かがUPDATEポリシーを足したときに漏れないよう明示しておく。
drop policy if exists "Nobody can edit comments from the client" on public.app_comments;
create policy "Nobody can edit comments from the client"
  on public.app_comments for update
  to anon, authenticated
  using (false);

-- カテゴリごとに3パターンの文面を用意し、同カテゴリ内で順番に割り当てる
-- （同じカテゴリのアプリを続けて見たときに同じ文章が並ばないようにするため）。
with numbered as (
  select
    id,
    category,
    created_at,
    (row_number() over (partition by category order by created_at, id) - 1) % 3 as v
  from public.mini_apps
),
tmpl (category, v, author_name, body, day_offset) as (
  values
    -- finance ---------------------------------------------------------------
    ('finance', 0, 'CobbleWorks Team', 'Built for the people who said they never know where their money actually goes. Everything stays in your own browser, so nothing about your spending leaves your device. This is a note-keeping tool, not financial advice.', 2),
    ('finance', 0, 'CobbleWorks Tips', 'Tip: log entries on the day they happen rather than catching up weekly. The whole point is to make the number honest, and honest numbers come from small daily entries.', 5),
    ('finance', 1, 'CobbleWorks Team', 'This one came out of a request about money slipping away without anyone noticing. It helps you organize your own notes and does not provide financial advice.', 2),
    ('finance', 1, 'CobbleWorks Tips', 'Tip: start with only the two or three categories you actually care about. A tracker with twenty categories is a tracker nobody fills in.', 5),
    ('finance', 2, 'CobbleWorks Team', 'A small tool for one specific money problem, rather than a full budgeting suite. It organizes what you enter and offers no financial advice. If it does not fit how you think about money, tell us on the request board.', 2),
    ('finance', 2, 'CobbleWorks Tips', 'Tip: check it once a week at a fixed time. Reviewing on a schedule turns the log from a chore into something that actually changes a decision.', 5),

    -- productivity ----------------------------------------------------------
    ('productivity', 0, 'CobbleWorks Team', 'Made for the request about things falling through the cracks between notes apps, texts and memory. One list, no folders, nothing to set up.', 2),
    ('productivity', 0, 'CobbleWorks Tips', 'Tip: if a task has been sitting untouched for a week, either break it into a smaller first step or delete it. A stale list stops being trusted.', 5),
    ('productivity', 1, 'CobbleWorks Team', 'Deliberately kept small. The request behind it asked for something you could open and use in a few seconds, not another system to maintain.', 2),
    ('productivity', 1, 'CobbleWorks Tips', 'Tip: add it to your phone home screen. The tools that get used are the ones that are one tap away, not one search away.', 5),
    ('productivity', 2, 'CobbleWorks Team', 'This answers a request about losing track mid-task. Your data stays in your browser, so there is no account to make before you can try it.', 2),
    ('productivity', 2, 'CobbleWorks Tips', 'Tip: write the next action, not the project. "Email the tutor" gets done, while "sort out the course" sits there for a month.', 5),

    -- health ----------------------------------------------------------------
    ('health', 0, 'CobbleWorks Team', 'Built from a request about wanting to notice a pattern in your own habits without wearing a device or signing up for anything. It is a log, not medical advice.', 2),
    ('health', 0, 'CobbleWorks Tips', 'Tip: log at the same moment each day, right after waking or right before bed. Tying it to something you already do is what makes it stick.', 5),
    ('health', 1, 'CobbleWorks Team', 'A small tracker rather than a coaching app. It shows you what you did, and what to change is up to you. Not medical advice.', 2),
    ('health', 1, 'CobbleWorks Tips', 'Tip: aim for a streak you can actually keep. Two minutes every day beats twenty minutes once a week, and the log will show you that.', 5),
    ('health', 2, 'CobbleWorks Team', 'Made for the request about losing track of your own routine. Everything is stored locally in your browser. Not medical advice.', 2),
    ('health', 2, 'CobbleWorks Tips', 'Tip: do not backfill missed days. A gap in the log is useful information, because it tells you when the routine tends to break.', 5),

    -- learning --------------------------------------------------------------
    ('learning', 0, 'CobbleWorks Team', 'This came from a request about learning from scattered sources and forgetting what you already covered. It keeps the order, so you always know where you stopped.', 2),
    ('learning', 0, 'CobbleWorks Tips', 'Tip: review a little before you feel ready to. The point at which recall is slightly hard is the point at which it sticks.', 5),
    ('learning', 1, 'CobbleWorks Team', 'Built for the request about reading a lot and remembering little. One line per item is enough, because the writing is what does the work.', 2),
    ('learning', 1, 'CobbleWorks Tips', 'Tip: write the summary in your own words, even badly. Copying a sentence from the source feels productive and teaches you nothing.', 5),
    ('learning', 2, 'CobbleWorks Team', 'A small study tool built around one request rather than a whole learning platform. Everything stays in your browser.', 2),
    ('learning', 2, 'CobbleWorks Tips', 'Tip: short sessions, often. Fifteen minutes on five days will beat one long session, and it is much easier to actually start.', 5),

    -- travel ----------------------------------------------------------------
    ('travel', 0, 'CobbleWorks Team', 'Made for the request about trip details scattered across screenshots, chats and browser tabs. One place, no account needed.', 2),
    ('travel', 0, 'CobbleWorks Tips', 'Tip: fill it in while you are still planning, not on the day. Anything you would have to look up while travelling is the thing worth writing down early.', 5),
    ('travel', 1, 'CobbleWorks Team', 'Built around one specific travel annoyance rather than trying to be a full itinerary app. Tell us on the request board if it is missing the part you needed.', 2),
    ('travel', 1, 'CobbleWorks Tips', 'Tip: keep notes short and specific. "Bus 42 from the north exit" is worth more later than a paragraph about the area.', 5),
    ('travel', 2, 'CobbleWorks Team', 'This answers a request about remembering places you meant to go back to. Data stays in your browser, so it is yours alone.', 2),
    ('travel', 2, 'CobbleWorks Tips', 'Tip: add a place the moment someone recommends it. The recommendation is always forgotten by the time you are actually nearby.', 5),

    -- lifestyle -------------------------------------------------------------
    ('lifestyle', 0, 'CobbleWorks Team', 'Built from a request about keeping track of something small without it turning into a whole project. Nothing to configure, nothing to sign up for.', 2),
    ('lifestyle', 0, 'CobbleWorks Tips', 'Tip: keep entries short. The version of you that has thirty seconds is the version that will actually keep this up.', 5),
    ('lifestyle', 1, 'CobbleWorks Team', 'A small, single-purpose tool made in response to one request on the board. Everything lives in your own browser.', 2),
    ('lifestyle', 1, 'CobbleWorks Tips', 'Tip: look back over a month of entries at once. Individual days say very little, but a month usually says something obvious.', 5),
    ('lifestyle', 2, 'CobbleWorks Team', 'Made for a request about a small everyday annoyance. If it solves nine tenths of your problem, the last tenth is worth posting as a new request.', 2),
    ('lifestyle', 2, 'CobbleWorks Tips', 'Tip: use it for a week before deciding whether it works. Most tools feel pointless on day one and useful on day seven.', 5),

    -- tools -----------------------------------------------------------------
    ('tools', 0, 'CobbleWorks Team', 'A small utility that does one thing. It runs entirely in your browser, so nothing you type here is sent anywhere.', 2),
    ('tools', 0, 'CobbleWorks Tips', 'Tip: bookmark it. Utilities like this are only worth having when you can reach them faster than searching for an alternative.', 5),
    ('tools', 1, 'CobbleWorks Team', 'Built because a request asked for exactly this and nothing more. No account, no upload, no ads.', 2),
    ('tools', 1, 'CobbleWorks Tips', 'Tip: it keeps working once the page has loaded, so it is still usable when your connection is not.', 5),
    ('tools', 2, 'CobbleWorks Team', 'One small job, done in the browser. If you need a variation of it, the request board is the place to ask.', 2),
    ('tools', 2, 'CobbleWorks Tips', 'Tip: check the result before relying on it for anything that matters. It is a convenience tool, not a source of truth.', 5)
)
insert into public.app_comments (app_id, user_id, author_name, text, is_official, created_at)
select
  n.id,
  null,
  tmpl.author_name,
  tmpl.body,
  true,
  n.created_at + (tmpl.day_offset * interval '1 day')
from numbered n
join tmpl on tmpl.category = n.category and tmpl.v = n.v
-- 何度流しても二重に入らないようにする
where not exists (
  select 1 from public.app_comments c
  where c.app_id = n.id and c.is_official and c.author_name = tmpl.author_name
);

create index if not exists app_comments_is_official_idx on public.app_comments (is_official);
