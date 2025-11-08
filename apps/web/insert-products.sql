-- ============================================
-- SQL Befehl zum Einfügen aller Produkte
-- ============================================
-- Führen Sie diesen Befehl im Supabase SQL Editor aus
-- oder verwenden Sie die Migration: 20240102000000_insert_products.sql
-- ============================================

-- Lösche zuerst alle bestehenden Produkte (optional, falls Sie neu starten wollen)
-- DELETE FROM products;

-- Füge alle Produkte ein
INSERT INTO products (
  slug,
  name_uk,
  name_de,
  description_uk,
  description_de,
  category,
  ingredients_uk,
  ingredients_de,
  allergens_uk,
  allergens_de,
  available_designs,
  image_url
) VALUES
-- Product 1: Zitronen-Mohn-Torte
(
  'zitronen-mohn-torte',
  'Лимонно-маковий',
  'Zitronen-Mohn-Torte',
  'Легкий лимонний торт із маком, ягідним прошарком та ніжним крем-чізом',
  'Ein leichter Zitronenkuchen mit Mohn, Beerenschicht und zarter Cream-Cheese-Creme',
  'torten',
  ARRAY['Лимонний бісквіт із маком', 'Ягідне конфі', 'Лимонний мус', 'Крем-чиз'],
  ARRAY['Zitronen-Biskuit mit Mohn', 'Beerenkonfitüre', 'Zitronen-Mousse', 'Cream Cheese'],
  ARRAY['молоко', 'яйця', 'пшеничне борошно', 'соєвий лецитин'],
  ARRAY['Milch', 'Eier', 'Weizenmehl', 'Sojalecithin'],
  '[
    {"id": "classic", "name_uk": "Класичний", "name_de": "Klassisch", "image": "/placeholder-cake.svg"},
    {"id": "elegant", "name_uk": "Елегантний", "name_de": "Elegant", "image": "/placeholder-cake.svg"},
    {"id": "modern", "name_uk": "Сучасний", "name_de": "Modern", "image": "/placeholder-cake.svg"}
  ]'::jsonb,
  '/placeholder-cake.svg'
),

-- Product 2: Schokoladen-Torte
(
  'schokoladen-torte',
  'Шоколадна',
  'Schokoladen-Torte',
  'Багатошаровий шоколадний торт з ніжним кремом',
  'Mehrschichtige Schokoladentorte mit zartem Creme',
  'torten',
  ARRAY['Шоколадний бісквіт', 'Шоколадний крем', 'Горіхи'],
  ARRAY['Schokoladen-Biskuit', 'Schokoladen-Creme', 'Nüsse'],
  ARRAY['молоко', 'яйця', 'пшеничне борошно', 'горіхи'],
  ARRAY['Milch', 'Eier', 'Weizenmehl', 'Nüsse'],
  '[
    {"id": "classic", "name_uk": "Класичний", "name_de": "Klassisch", "image": "/placeholder-cake.svg"},
    {"id": "elegant", "name_uk": "Елегантний", "name_de": "Elegant", "image": "/placeholder-cake.svg"}
  ]'::jsonb,
  '/placeholder-cake.svg'
),

-- Product 3: Erdbeer-Torte
(
  'erdbeer-torte',
  'Полунична',
  'Erdbeer-Torte',
  'Свіжа полунична торт з вершками',
  'Frische Erdbeertorte mit Sahne',
  'torten',
  ARRAY['Ванильний бісквіт', 'Полуничне пюре', 'Вершковий крем'],
  ARRAY['Vanille-Biskuit', 'Erdbeerpüree', 'Sahne-Creme'],
  ARRAY['молоко', 'яйця', 'пшеничне борошно'],
  ARRAY['Milch', 'Eier', 'Weizenmehl'],
  '[
    {"id": "classic", "name_uk": "Класичний", "name_de": "Klassisch", "image": "/placeholder-cake.svg"},
    {"id": "modern", "name_uk": "Сучасний", "name_de": "Modern", "image": "/placeholder-cake.svg"}
  ]'::jsonb,
  '/placeholder-cake.svg'
),

-- Product 4: Tiramisu
(
  'tiramisu',
  'Тірамісу',
  'Tiramisu',
  'Класичний італійський десерт з кави та маскарпоне',
  'Klassisches italienisches Dessert mit Kaffee und Mascarpone',
  'desserts',
  ARRAY['Маскарпоне', 'Кава', 'Какао', 'Печиво'],
  ARRAY['Mascarpone', 'Kaffee', 'Kakao', 'Kekse'],
  ARRAY['молоко', 'яйця', 'пшеничне борошно'],
  ARRAY['Milch', 'Eier', 'Weizenmehl'],
  '[
    {"id": "classic", "name_uk": "Класичний", "name_de": "Klassisch", "image": "/placeholder-cake.svg"}
  ]'::jsonb,
  '/placeholder-cake.svg'
);

-- Überprüfe die Einfügung
SELECT 
  id,
  slug,
  name_de,
  category,
  created_at
FROM products
ORDER BY created_at DESC;

