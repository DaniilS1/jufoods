-- Convert products ingredients/allergens from text[] to text for free-form admin input.
alter table public.products
  alter column ingredients_de type text using array_to_string(ingredients_de, E'\n'),
  alter column ingredients_uk type text using array_to_string(ingredients_uk, E'\n'),
  alter column allergens_de type text using array_to_string(allergens_de, E'\n'),
  alter column allergens_uk type text using array_to_string(allergens_uk, E'\n');
