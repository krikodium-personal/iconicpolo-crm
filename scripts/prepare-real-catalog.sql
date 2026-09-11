PRAGMA foreign_keys = ON;
BEGIN;
DROP TRIGGER IF EXISTS stock_immutable_update;
DROP TRIGGER IF EXISTS stock_immutable_delete;
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE id LIKE 'demo-%');
DELETE FROM stock_movements
WHERE product_id IN (SELECT id FROM products WHERE id LIKE 'demo-%')
   OR order_id IN (SELECT id FROM orders WHERE id LIKE 'demo-%');
DELETE FROM orders WHERE id LIKE 'demo-%';
DELETE FROM products WHERE id LIKE 'demo-%';
DELETE FROM contacts WHERE id LIKE 'demo-%';
UPDATE settings SET currency = 'USD' WHERE id = 1;
CREATE TRIGGER stock_immutable_update BEFORE UPDATE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END;
CREATE TRIGGER stock_immutable_delete BEFORE DELETE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END;
COMMIT;
PRAGMA optimize;
