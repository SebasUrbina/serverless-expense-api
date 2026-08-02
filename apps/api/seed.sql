-- Datos Dummy para desarrollo local en Cloudflare D1

-- API Key de prueba para desarrollo o automatizaciones locales
INSERT OR IGNORE INTO api_keys (id, key, user_id) VALUES
(1, 'local-dev-api-key', 'local_user');

-- Cuentas de prueba
INSERT OR IGNORE INTO accounts (id, user_id, name, type, balance) VALUES
(1, 'local_user', 'Cuenta Corriente', 'checking', 1500000.00),
(2, 'local_user', 'Tarjeta de Crédito', 'credit', -250000.00),
(3, 'local_user', 'Efectivo', 'cash', 45000.00);

-- Categorías de prueba (los íconos deben ser Emojis Unicode reales)
INSERT OR IGNORE INTO categories (id, user_id, name, type, icon) VALUES
(1, 'local_user', 'Supermercado y Alimentación', 'expense', '🛒'),
(2, 'local_user', 'Transporte y Combustible', 'expense', '🚗'),
(3, 'local_user', 'Servicios del Hogar', 'expense', '🏠'),
(4, 'local_user', 'Restaurantes y Salidas', 'expense', '🍽️'),
(5, 'local_user', 'Sueldo e Ingresos', 'income', '💼'),
(6, 'local_user', 'Suscripciones y Tech', 'expense', '💻');

-- Etiquetas de prueba
INSERT OR IGNORE INTO tags (id, user_id, name) VALUES
(1, 'local_user', 'mensual'),
(2, 'local_user', 'supermercado'),
(3, 'local_user', 'ocio');

-- Transacciones de prueba del mes actual
INSERT OR IGNORE INTO transactions (id, title, amount, category_id, type, account_id, user_id, date) VALUES
(1, 'Sueldo Mensual Empresa', 2200000.00, 5, 'income', 1, 'local_user', DATE('now', 'start of month')),
(2, 'Compra Supermercado Líder', 85400.00, 1, 'expense', 2, 'local_user', DATE('now', '-5 days')),
(3, 'Carga Bip! / Metro', 15000.00, 2, 'expense', 3, 'local_user', DATE('now', '-4 days')),
(4, 'Pago Cuenta de Luz y Agua', 42300.00, 3, 'expense', 1, 'local_user', DATE('now', '-3 days')),
(5, 'Cena Restaurante con Amigos', 38500.00, 4, 'expense', 2, 'local_user', DATE('now', '-2 days')),
(6, 'Suscripción Spotify & Netflix', 14990.00, 6, 'expense', 2, 'local_user', DATE('now', '-1 day')),
(7, 'Feria de Verduras y Frutas', 12000.00, 1, 'expense', 3, 'local_user', DATE('now'));

-- Asociación de etiquetas a transacciones
INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES
(2, 2),
(2, 1),
(4, 1),
(5, 3);
