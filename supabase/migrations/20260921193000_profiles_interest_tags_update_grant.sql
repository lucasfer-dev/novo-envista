-- Allow authenticated users to update their own profile interest tags.
-- The column was added after the original column-level UPDATE grant on profiles,
-- so onboarding/profile updates that include interest_tags were failing before
-- RLS evaluation with insufficient column privileges.

grant update (interest_tags)
on public.profiles
to authenticated;
