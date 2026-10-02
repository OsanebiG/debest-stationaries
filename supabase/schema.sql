create extension if not exists pgcrypto;
create table if not exists public.products (id text primary key,name text not null,description text not null,price numeric(12,2) not null check(price>=0),image_url text,category text not null,stock_quantity integer not null default 0 check(stock_quantity>=0),created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.orders (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,customer_name text not null,email text not null,phone_number text not null,delivery_address text not null,city text not null,state text not null,country text not null,total_amount numeric(12,2) not null,status text not null default 'pending',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.order_items (id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,product_id text not null references public.products(id),quantity integer not null check(quantity>0),unit_price numeric(12,2) not null,subtotal numeric(12,2) not null,created_at timestamptz default now());
create index if not exists orders_user_id_idx on public.orders(user_id);create index if not exists order_items_order_id_idx on public.order_items(order_id);
alter table public.products enable row level security;alter table public.orders enable row level security;alter table public.order_items enable row level security;
create policy "products public read" on public.products for select using(true);
create policy "users read own orders" on public.orders for select using(auth.uid()=user_id);
create policy "users read own order items" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
insert into public.products(id,name,description,price,category,stock_quantity,image_url) values
('notebook-a5','A5 Premium Notebook','Hard-cover lined notebook for school, work and everyday notes.',4500,'Paper',40,'/images/notebook.svg'),
('blue-pen-pack','Blue Ballpoint Pen Pack','Smooth-writing blue pens, ideal for school and office use.',2500,'Writing',80,'/images/pen.svg'),
('office-file','Office Document File','Durable file for organizing important documents.',3200,'Files & Folders',30,'/images/file.svg'),
('marker-set','Permanent Marker Set','Assorted markers for labeling, presentations and office tasks.',3800,'Writing',25,'/images/marker.svg'),
('sticky-notes','Sticky Notes Pack','Bright sticky notes for reminders, planning and study.',1800,'Office Supplies',55,'/images/sticky.svg'),
('ruler-30cm','30cm Plastic Ruler','Clear, sturdy ruler for school and technical work.',1200,'School Supplies',60,'/images/ruler.svg') on conflict(id) do nothing;
