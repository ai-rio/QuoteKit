CREATE OR REPLACE VIEW admin_customers AS
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as name,
  u.created_at,
  u.last_sign_in_at,
  c.stripe_customer_id,
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_period_end as subscription_current_period_end,
  s.cancel_at_period_end as subscription_cancel_at_period_end,
  p.unit_amount as price_unit_amount,
  p.currency as price_currency,
  p.interval as price_interval,
  pr.name as product_name
FROM
  auth.users u
  LEFT JOIN customers c ON u.id = c.id
  LEFT JOIN subscriptions s ON u.id = s.user_id
  LEFT JOIN prices p ON s.price_id = p.id
  LEFT JOIN products pr ON p.product_id = pr.id;