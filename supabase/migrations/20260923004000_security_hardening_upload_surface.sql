-- Security hardening: reduce the course material upload surface until a
-- server-side content inspection/antimalware pipeline is available.
update storage.buckets
set allowed_mime_types = array[
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
]::text[]
where id = 'course-assets';

comment on table public.account_private_identifiers is
  'Private one-way account identifiers. RLS intentionally has no client policies: browser roles must not read or write this table directly.';
