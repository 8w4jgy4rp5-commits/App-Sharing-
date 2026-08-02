-- Phase 5のシードデータ（0007）に含まれていた誤字・崩れた英文を修正する。
-- 実際の本番データへの反映は、devcobbleアカウント（is_admin）でサイトのEdit UIから直接行った。
-- このファイルは変更内容の記録用。

update public.mini_apps set name = 'Company Watchlist' where name = 'Campany Watchlist';

update public.mini_apps set
  name = 'Restock Planner',
  description = 'Have you ever forgotten how much you spend on consumables? Track when items like shampoo will run out and the extra cost you''ll incur. Try it out!'
where name = 'Restock Plannner';

update public.mini_apps set
  name = 'Forgetful Tracker',
  description = 'A simple tool to track items you tend to forget, using notifications. Note: if you close this app''s tab, you won''t receive notifications, so keep it open!'
where name = 'Fogetful Tracker';

update public.mini_apps set name = 'Shift Calendar' where name = 'Shift Calender';

update public.mini_apps set
  name = 'QR Creator',
  description = 'Turn any link or image into a QR code — handy for lessons, studying, and more.'
where name = 'QR-creater';

update public.mini_apps set
  description = 'A simple tool for watching stock prices. Linked to the Watchlist app.'
where name = 'Stock Price Checker';

update public.mini_apps set
  description = 'Track your spending on fan activities — idols, artists, athletes, etc. If you''re not into any fan activity, you can just track your daily spending instead.',
  target_users = 'People who tend to overspend without realizing it.'
where name = 'Fan-Activity-Tracker';

update public.mini_apps set
  description = 'Do a quick stretch whenever you have a few spare minutes. Includes a habit-tracking feature to help you keep up your daily workout.'
where name = 'Micro-Stretch';

update public.mini_apps set
  description = 'In this app, you can track books and shows that you want. And after reading or watching them, you can keep a memo of what you''ve learned.'
where name = 'Book & Show Tracker';

update public.mini_apps set
  description = 'Track your reading streak and how much you''ve read.'
where name = 'Read Streak';

update public.mini_apps set
  description = 'Never get stuck when you want to write a message for any situation, by email.'
where name = 'Message Writer';

update public.mini_apps set
  description = 'Browse flashcards for what you want to learn and take 10-question mini tests in this app.'
where name = 'English-Flashcard';

update public.mini_apps set
  description = 'A simple flashcards app in Spanish — you can also take a short vocabulary quiz.',
  target_users = 'Spanish learner'
where name = 'Spanish-Flashcards';

update public.mini_apps set
  description = 'A simple unit conversion app. Instantly convert length, weight, temperature, and volume.'
where name = 'Unit-Converter';
