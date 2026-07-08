
-- Supabase schema for Classroom Games orders
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  buyer_name text not null,
  buyer_phone text,
  buyer_email text not null,
  plan text,
  selected_templates jsonb not null default '[]'::jsonb,
  original_price numeric default 0,
  final_price numeric default 0,
  discount_amount numeric default 0,
  payment_proof_url text,
  payment_proof_path text,
  status text not null default 'pending',
  admin_note text,
  lang text default 'zh',
  order_text text,
  raw jsonb,
  sent_account_at timestamptz
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_buyer_email_idx on public.orders (buyer_email);

-- Storage bucket:
-- Create a Storage bucket named: payment-proofs
-- Recommended: set bucket as Public for easy admin viewing from admin.html.
-- If you prefer private bucket, admin preview links will need a signed URL API later.
