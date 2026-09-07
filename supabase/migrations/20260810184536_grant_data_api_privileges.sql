-- Supabase projects created with the 2026 Data API default do not expose new
-- public tables automatically. These grants are intentionally table-specific;
-- RLS remains the row and operation authorization boundary.

grant usage on schema public to authenticated, service_role;

grant select on
  public.outlets,
  public.profiles,
  public.outlet_memberships,
  public.categories,
  public.suppliers,
  public.inventory_items,
  public.products,
  public.purchase_orders,
  public.purchase_order_items,
  public.shifts,
  public.sales,
  public.sale_items,
  public.payments,
  public.refund_requests,
  public.stock_movements,
  public.cash_movements,
  public.expenses,
  public.audit_logs,
  public.app_settings
to authenticated;

grant update on
  public.profiles,
  public.products,
  public.shifts,
  public.refund_requests,
  public.expenses
to authenticated;

grant insert on
  public.shifts,
  public.refund_requests,
  public.cash_movements,
  public.expenses
to authenticated;

-- The secret/service role is used only by trusted provisioning and test tools.
-- Naming every table avoids silently exposing future tables.
grant select, insert, update, delete on
  public.outlets,
  public.profiles,
  public.outlet_memberships,
  public.categories,
  public.suppliers,
  public.inventory_items,
  public.products,
  public.purchase_orders,
  public.purchase_order_items,
  public.shifts,
  public.sales,
  public.sale_items,
  public.payments,
  public.refund_requests,
  public.stock_movements,
  public.cash_movements,
  public.expenses,
  public.audit_logs,
  public.app_settings
to service_role;

grant usage, select on sequence public.sale_no_seq to service_role;
