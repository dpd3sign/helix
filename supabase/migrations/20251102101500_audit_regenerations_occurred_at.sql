alter table audit_regenerations
  add column if not exists occurred_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'audit_regenerations'
      and column_name = 'at'
  ) then
    execute 'update audit_regenerations set occurred_at = at where occurred_at is null';
  end if;
end
$$;
