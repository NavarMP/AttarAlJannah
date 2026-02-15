-- Create a table for promo content
create table if not exists public.promo_content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('video', 'image', 'youtube', 'instagram')),
  url text not null,
  thumbnail_url text, -- For videos, optional
  aspect_ratio text not null default '16:9' check (aspect_ratio in ('16:9', '9:16', '1:1', '4:5')),
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.promo_content enable row level security;

-- Drop existing policies to avoid conflicts during valid updates
drop policy if exists "Public content is viewable by everyone" on public.promo_content;
drop policy if exists "Admins can do everything with promo content" on public.promo_content;

-- Create policies
create policy "Public content is viewable by everyone"
  on public.promo_content for select
  using ( is_active = true );

create policy "Admins can do everything with promo content"
  on public.promo_content for all
  using (
    (auth.jwt() ->> 'email') in (
        'minhajuljanna@gmail.com',
        'navarmp@gmail.com'
    )
  );

-- Create storage bucket for promo assets if it doesn't exist
insert into storage.buckets (id, name, public)
values ('promo-assets', 'promo-assets', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Promo assets are viewable by everyone" on storage.objects;
drop policy if exists "Admins can upload promo assets" on storage.objects;
drop policy if exists "Admins can update promo assets" on storage.objects;
drop policy if exists "Admins can delete promo assets" on storage.objects;

create policy "Promo assets are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'promo-assets' );

create policy "Admins can upload promo assets"
  on storage.objects for insert
  with check (
    bucket_id = 'promo-assets' AND
    (auth.jwt() ->> 'email') in (
        'minhajuljanna@gmail.com',
        'navarmp@gmail.com'
    )
  );

create policy "Admins can update promo assets"
  on storage.objects for update
  using (
    bucket_id = 'promo-assets' AND
    (auth.jwt() ->> 'email') in (
        'minhajuljanna@gmail.com',
        'navarmp@gmail.com'
    )
  );

create policy "Admins can delete promo assets"
  on storage.objects for delete
  using (
    bucket_id = 'promo-assets' AND
    (auth.jwt() ->> 'email') in (
        'minhajuljanna@gmail.com',
        'navarmp@gmail.com'
    )
  );
