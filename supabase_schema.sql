-- SCHEMA FOR EKSPENSE

-- 1. Accounts Table
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('fiat', 'savings', 'cash', 'other')),
  currency text default 'BGN',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Transactions Table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  description text,
  from_account text,
  to_account text,
  amount decimal not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories Table (Optional, or manage in app)
create table categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('expense', 'income')),
  icon text
);

-- RLS POLICIES (Enable Row Level Security)
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table categories enable row level security;

-- Accounts Policies
create policy "Users can see own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts for delete using (auth.uid() = user_id);

-- Transactions Policies
create policy "Users can see own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);

-- Categories Policies
create policy "Users can see own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories for delete using (auth.uid() = user_id);
