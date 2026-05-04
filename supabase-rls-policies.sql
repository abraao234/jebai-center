-- =============================================================
-- Jebai Dashboard — Policies de RLS e funções RPC (tolerante)
-- =============================================================
-- Este script aplica RLS apenas nas tabelas que JÁ EXISTEM.
-- Tabelas ausentes são silenciosamente puladas — você pode
-- rodar este script várias vezes sem problema.
--
-- COMO APLICAR:
--   1. https://supabase.com/dashboard → projeto gsqcqpcliqbzmzkwpnxf
--   2. SQL Editor → New query → cole este conteúdo → Run
-- =============================================================

-- -------------------------------------------------------------
-- 0. Helper: is_admin()
--    Funciona SEMPRE — não depende de outras tabelas RLS
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jebai_users
    where email = auth.email() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -------------------------------------------------------------
-- 1. jebai_users
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_users') is not null then
    execute 'alter table public.jebai_users enable row level security';

    execute 'drop policy if exists "users_select_self_or_admin" on public.jebai_users';
    execute 'drop policy if exists "users_insert_self" on public.jebai_users';
    execute 'drop policy if exists "users_update_self_no_role" on public.jebai_users';
    execute 'drop policy if exists "users_update_admin" on public.jebai_users';
    execute 'drop policy if exists "users_delete_admin" on public.jebai_users';

    execute $sql$
      create policy "users_select_self_or_admin"
      on public.jebai_users for select
      to authenticated
      using (email = auth.email() or public.is_admin())
    $sql$;

    execute $sql$
      create policy "users_insert_self"
      on public.jebai_users for insert
      to authenticated
      with check (email = auth.email() or public.is_admin())
    $sql$;

    -- UPDATE não-admin: pode editar a própria linha, MAS o role deve permanecer igual
    execute $sql$
      create policy "users_update_self_no_role"
      on public.jebai_users for update
      to authenticated
      using (email = auth.email() and not public.is_admin())
      with check (
        email = auth.email()
        and role = (select u2.role from public.jebai_users u2 where u2.email = auth.email())
      )
    $sql$;

    execute $sql$
      create policy "users_update_admin"
      on public.jebai_users for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $sql$;

    execute $sql$
      create policy "users_delete_admin"
      on public.jebai_users for delete
      to authenticated
      using (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 2. jebai_stores
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_stores') is not null then
    execute 'alter table public.jebai_stores enable row level security';

    execute 'drop policy if exists "stores_select_public_or_owner" on public.jebai_stores';
    execute 'drop policy if exists "stores_insert_admin" on public.jebai_stores';
    execute 'drop policy if exists "stores_update_owner_or_admin" on public.jebai_stores';
    execute 'drop policy if exists "stores_delete_admin" on public.jebai_stores';

    execute $sql$
      create policy "stores_select_public_or_owner"
      on public.jebai_stores for select
      to anon, authenticated
      using (
        status = 'published'
        or (auth.role() = 'authenticated' and (owner_email = auth.email() or public.is_admin()))
      )
    $sql$;

    execute $sql$
      create policy "stores_insert_admin"
      on public.jebai_stores for insert
      to authenticated
      with check (public.is_admin())
    $sql$;

    execute $sql$
      create policy "stores_update_owner_or_admin"
      on public.jebai_stores for update
      to authenticated
      using (owner_email = auth.email() or public.is_admin())
      with check (
        public.is_admin()
        or (
          owner_email = auth.email()
          and owner_email = (select s2.owner_email from public.jebai_stores s2 where s2.id = jebai_stores.id)
          and slug = (select s2.slug from public.jebai_stores s2 where s2.id = jebai_stores.id)
          and status in ('draft', 'pending_review')
        )
      )
    $sql$;

    execute $sql$
      create policy "stores_delete_admin"
      on public.jebai_stores for delete
      to authenticated
      using (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 3. jebai_store_products
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_store_products') is not null then
    execute 'alter table public.jebai_store_products enable row level security';

    execute 'drop policy if exists "products_select_public_or_owner" on public.jebai_store_products';
    execute 'drop policy if exists "products_insert_owner_or_admin" on public.jebai_store_products';
    execute 'drop policy if exists "products_update_owner_or_admin" on public.jebai_store_products';
    execute 'drop policy if exists "products_delete_owner_or_admin" on public.jebai_store_products';

    execute $sql$
      create policy "products_select_public_or_owner"
      on public.jebai_store_products for select
      to anon, authenticated
      using (
        exists (
          select 1 from public.jebai_stores s
          where s.id = jebai_store_products.store_id
          and (
            s.status = 'published'
            or (auth.role() = 'authenticated' and (s.owner_email = auth.email() or public.is_admin()))
          )
        )
      )
    $sql$;

    execute $sql$
      create policy "products_insert_owner_or_admin"
      on public.jebai_store_products for insert
      to authenticated
      with check (
        exists (
          select 1 from public.jebai_stores s
          where s.id = jebai_store_products.store_id
          and (s.owner_email = auth.email() or public.is_admin())
        )
      )
    $sql$;

    execute $sql$
      create policy "products_update_owner_or_admin"
      on public.jebai_store_products for update
      to authenticated
      using (
        exists (
          select 1 from public.jebai_stores s
          where s.id = jebai_store_products.store_id
          and (s.owner_email = auth.email() or public.is_admin())
        )
      )
    $sql$;

    execute $sql$
      create policy "products_delete_owner_or_admin"
      on public.jebai_store_products for delete
      to authenticated
      using (
        exists (
          select 1 from public.jebai_stores s
          where s.id = jebai_store_products.store_id
          and (s.owner_email = auth.email() or public.is_admin())
        )
      )
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 4. jebai_seller_requests
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_seller_requests') is not null then
    execute 'alter table public.jebai_seller_requests enable row level security';

    execute 'drop policy if exists "requests_select_self_or_admin" on public.jebai_seller_requests';
    execute 'drop policy if exists "requests_insert_self" on public.jebai_seller_requests';
    execute 'drop policy if exists "requests_update_admin" on public.jebai_seller_requests';
    execute 'drop policy if exists "requests_delete_admin" on public.jebai_seller_requests';

    execute $sql$
      create policy "requests_select_self_or_admin"
      on public.jebai_seller_requests for select
      to authenticated
      using (email = auth.email() or public.is_admin())
    $sql$;

    execute $sql$
      create policy "requests_insert_self"
      on public.jebai_seller_requests for insert
      to authenticated
      with check (email = auth.email())
    $sql$;

    execute $sql$
      create policy "requests_update_admin"
      on public.jebai_seller_requests for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $sql$;

    execute $sql$
      create policy "requests_delete_admin"
      on public.jebai_seller_requests for delete
      to authenticated
      using (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 5. jebai_home_hidden_stores
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_home_hidden_stores') is not null then
    execute 'alter table public.jebai_home_hidden_stores enable row level security';

    execute 'drop policy if exists "hidden_select_all" on public.jebai_home_hidden_stores';
    execute 'drop policy if exists "hidden_modify_admin" on public.jebai_home_hidden_stores';

    execute $sql$
      create policy "hidden_select_all"
      on public.jebai_home_hidden_stores for select
      to anon, authenticated
      using (true)
    $sql$;

    execute $sql$
      create policy "hidden_modify_admin"
      on public.jebai_home_hidden_stores for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 6. jebai_admin_logs
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_admin_logs') is not null then
    execute 'alter table public.jebai_admin_logs enable row level security';

    execute 'drop policy if exists "logs_admin_only" on public.jebai_admin_logs';

    execute $sql$
      create policy "logs_admin_only"
      on public.jebai_admin_logs for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 7. jebai_purchases
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_purchases') is not null then
    execute 'alter table public.jebai_purchases enable row level security';

    execute 'drop policy if exists "purchases_insert_anyone" on public.jebai_purchases';
    execute 'drop policy if exists "purchases_select_admin" on public.jebai_purchases';
    execute 'drop policy if exists "purchases_modify_admin" on public.jebai_purchases';
    execute 'drop policy if exists "purchases_delete_admin" on public.jebai_purchases';

    execute $sql$
      create policy "purchases_insert_anyone"
      on public.jebai_purchases for insert
      to anon, authenticated
      with check (true)
    $sql$;

    execute $sql$
      create policy "purchases_select_admin"
      on public.jebai_purchases for select
      to authenticated
      using (public.is_admin())
    $sql$;

    execute $sql$
      create policy "purchases_modify_admin"
      on public.jebai_purchases for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $sql$;

    execute $sql$
      create policy "purchases_delete_admin"
      on public.jebai_purchases for delete
      to authenticated
      using (public.is_admin())
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 8. jebai_store_analytics
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('public.jebai_store_analytics') is not null then
    execute 'alter table public.jebai_store_analytics enable row level security';

    execute 'drop policy if exists "analytics_insert_anyone" on public.jebai_store_analytics';
    execute 'drop policy if exists "analytics_select_owner_or_admin" on public.jebai_store_analytics';

    execute $sql$
      create policy "analytics_insert_anyone"
      on public.jebai_store_analytics for insert
      to anon, authenticated
      with check (true)
    $sql$;

    execute $sql$
      create policy "analytics_select_owner_or_admin"
      on public.jebai_store_analytics for select
      to authenticated
      using (
        public.is_admin()
        or exists (
          select 1 from public.jebai_stores s
          where s.id = jebai_store_analytics.store_id
          and s.owner_email = auth.email()
        )
      )
    $sql$;
  end if;
end $$;

-- -------------------------------------------------------------
-- 9. RPC promote_to_vendedor
-- -------------------------------------------------------------
create or replace function public.promote_to_vendedor(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem promover usuários';
  end if;
  update public.jebai_users
    set role = 'vendedor'
  where email = target_email
    and role <> 'admin';
end;
$$;

revoke all on function public.promote_to_vendedor(text) from public;
grant execute on function public.promote_to_vendedor(text) to authenticated;

-- -------------------------------------------------------------
-- 10. Storage policies (rodam mesmo se bucket não existir;
--     vão falhar silenciosamente se não houver storage.objects)
-- -------------------------------------------------------------
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "stores_storage_read_public" on storage.objects';
    execute 'drop policy if exists "stores_storage_write_owner" on storage.objects';
    execute 'drop policy if exists "stores_storage_update_owner" on storage.objects';
    execute 'drop policy if exists "stores_storage_delete_owner_or_admin" on storage.objects';

    execute $sql$
      create policy "stores_storage_read_public"
      on storage.objects for select
      to anon, authenticated
      using (bucket_id = 'jebai-stores')
    $sql$;

    execute $sql$
      create policy "stores_storage_write_owner"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'jebai-stores'
        and (storage.foldername(name))[1] = auth.email()
      )
    $sql$;

    execute $sql$
      create policy "stores_storage_update_owner"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'jebai-stores'
        and (storage.foldername(name))[1] = auth.email()
      )
    $sql$;

    execute $sql$
      create policy "stores_storage_delete_owner_or_admin"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'jebai-stores'
        and (
          (storage.foldername(name))[1] = auth.email()
          or public.is_admin()
        )
      )
    $sql$;
  end if;
end $$;

-- =============================================================
-- FIM. Tabelas que não existirem foram silenciosamente puladas.
-- =============================================================
