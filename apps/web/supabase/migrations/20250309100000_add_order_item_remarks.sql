-- Document the expected structure of orders.items JSONB to include optional remarks per torte item
COMMENT ON COLUMN orders.items IS 'Array of order line items. Each item: { product_id, design_id, quantity, person_count?, delivery_date?, remarks? }. For torte orders, person_count and delivery_date are required; remarks is optional customer notes.';
