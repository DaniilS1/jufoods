-- ============================================
-- SQL Befehl zum Einfügen von Designs
-- ============================================
-- Führen Sie diesen Befehl im Supabase SQL Editor aus
-- oder verwenden Sie die Migration
-- ============================================

-- Beispiel-Designs einfügen
INSERT INTO designs (
  name_uk,
  name_de,
  image_url
) VALUES
-- Design 1: Klassisch
(
  'Класичний',
  'Klassisch',
  '/placeholder-cake.svg'
),

-- Design 2: Elegant
(
  'Елегантний',
  'Elegant',
  '/placeholder-cake.svg'
),

-- Design 3: Modern
(
  'Сучасний',
  'Modern',
  '/placeholder-cake.svg'
),

-- Design 4: Romantisch
(
  'Романтичний',
  'Romantisch',
  '/placeholder-cake.svg'
),

-- Design 5: Minimalistisch
(
  'Мінімалістичний',
  'Minimalistisch',
  '/placeholder-cake.svg'
);

-- Überprüfe die Einfügung
SELECT 
  id,
  name_uk,
  name_de,
  image_url,
  created_at
FROM designs
ORDER BY created_at DESC;

-- Beispiel: Verknüpfung von Designs mit Produkten
-- (Dies müssen Sie nach dem Einfügen der Produkte anpassen)
-- 
-- INSERT INTO product_designs (product_id, design_id)
-- SELECT 
--   p.id as product_id,
--   d.id as design_id
-- FROM products p
-- CROSS JOIN designs d
-- WHERE p.slug = 'zitronen-mohn-torte'
--   AND d.name_de IN ('Klassisch', 'Elegant', 'Modern');

