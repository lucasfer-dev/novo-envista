update public.notifications
set href = regexp_replace(href, '^/app/messages/', '/messages/')
where kind = 'message'
  and href like '/app/messages/%';

update public.notifications
set href = '/interests'
where href = '/app/interests';

update public.notifications
set href = '/social'
where href = '/app/social';
