-- KantinKita starter seed.
-- Run only after 20260809100000_kantinkita_mvp.sql on a dedicated project.
-- This file does not create auth users or grant roles.

insert into public.outlets (id, code, name, location, active)
values ('11111111-1111-4111-8111-111111111111', 'UTAMA', 'Outlet Utama', 'Area kantin sekolah', true)
on conflict (code) do update
set name = excluded.name, location = excluded.location, active = excluded.active;

insert into public.categories (outlet_id, name, sort_order, active)
select o.id, seed.name, seed.sort_order, true
from public.outlets o
cross join (values ('Makanan', 1), ('Minuman', 2), ('Camilan', 3), ('Lainnya', 4)) as seed(name, sort_order)
where o.code = 'UTAMA'
on conflict (outlet_id, name) do update
set sort_order = excluded.sort_order, active = true;

insert into public.inventory_items (outlet_id, sku, name, unit, qty_on_hand, min_stock, avg_cost, active)
select o.id, seed.sku, seed.name, seed.unit, seed.qty_on_hand, seed.min_stock, seed.avg_cost, true
from public.outlets o
cross join (values
  ('BHN-001', 'Beras premium', 'kg', 24::numeric, 12::numeric, 12000::numeric),
  ('BHN-002', 'Teh celup', 'box', 40::numeric, 10::numeric, 18000::numeric),
  ('BHN-003', 'Roti tawar', 'pack', 12::numeric, 6::numeric, 14500::numeric),
  ('BHN-004', 'Air mineral 600ml', 'botol', 42::numeric, 12::numeric, 2500::numeric)
) as seed(sku, name, unit, qty_on_hand, min_stock, avg_cost)
where o.code = 'UTAMA'
on conflict (outlet_id, sku) do update
set name = excluded.name,
    unit = excluded.unit,
    min_stock = excluded.min_stock,
    avg_cost = excluded.avg_cost,
    active = true,
    updated_at = now();

insert into public.products (outlet_id, category_id, inventory_item_id, sku, barcode, name, sell_price, cost_reference, unit, track_stock, favorite, active)
select o.id, c.id, i.id, seed.sku, seed.barcode, seed.name, seed.sell_price, seed.cost_reference, seed.unit, true, seed.favorite, true
from public.outlets o
join (values
  ('Makanan', 'BHN-001', 'MKN-001', '899000000001', 'Nasi Goreng Spesial', 15000::numeric, 9500::numeric, 'porsi', true),
  ('Minuman', 'BHN-002', 'MNM-001', '899000000002', 'Es Teh Manis', 5000::numeric, 2200::numeric, 'gelas', true),
  ('Camilan', 'BHN-003', 'CML-001', '899000000003', 'Roti Bakar Coklat', 10000::numeric, 6000::numeric, 'porsi', true),
  ('Minuman', 'BHN-004', 'MNM-002', '899000000004', 'Air Mineral 600ml', 4000::numeric, 2500::numeric, 'botol', false)
) as seed(category_name, inventory_sku, sku, barcode, name, sell_price, cost_reference, unit, favorite) on true
join public.categories c on c.outlet_id = o.id and c.name = seed.category_name
left join public.inventory_items i on i.outlet_id = o.id and i.sku = seed.inventory_sku
where o.code = 'UTAMA'
on conflict (outlet_id, sku) do update
set category_id = excluded.category_id,
    inventory_item_id = excluded.inventory_item_id,
    barcode = excluded.barcode,
    name = excluded.name,
    sell_price = excluded.sell_price,
    cost_reference = excluded.cost_reference,
    unit = excluded.unit,
    favorite = excluded.favorite,
    active = true,
    updated_at = now();

insert into public.suppliers (outlet_id, name, contact_name, phone, active)
select o.id, seed.name, seed.contact_name, seed.phone, true
from public.outlets o
cross join (values
  ('CV Pangan Jaya', 'Budi Santoso', '081200000001'),
  ('Depot Segar', 'Rina Lestari', '081200000002')
) as seed(name, contact_name, phone)
where o.code = 'UTAMA'
on conflict (outlet_id, name) do update
set contact_name = excluded.contact_name, phone = excluded.phone, active = true, updated_at = now();
