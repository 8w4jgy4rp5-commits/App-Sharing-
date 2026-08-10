-- Company Watchlist was split into a US version (apps/company-watchlist-us)
-- and a new Japan version (apps/company-watchlist-jp). This updates the
-- existing directory entry to point at the renamed US path.
-- As with 0014, the actual production update should be applied via the
-- site's Edit UI (devcobble/is_admin account) — this file is a record.

update public.mini_apps set
  name = 'Company Watchlist (US)',
  url = 'https://8w4jgy4rp5-commits.github.io/App-Sharing-/apps/company-watchlist-us/'
where name = 'Company Watchlist';
