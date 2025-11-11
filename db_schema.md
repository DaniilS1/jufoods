-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  customer_address text,
  notes text,
  items jsonb NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_uk text NOT NULL,
  name_de text NOT NULL,
  description_uk text,
  description_de text,
  category text NOT NULL CHECK (category = ANY (ARRAY['torten'::text, 'desserts'::text, 'cookies'::text, 'macarons'::text, 'cheesecakes'::text])),
  ingredients_uk ARRAY,
  ingredients_de ARRAY,
  allergens_uk ARRAY,
  allergens_de ARRAY,
  available_designs jsonb DEFAULT '[]'::jsonb,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  images_urls ARRAY,
  sub_category text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.torten_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_de text NOT NULL,
  name_uk text NOT NULL,
  description_de text,
  description_uk text,
  category text NOT NULL DEFAULT 'torten'::text CHECK (category = 'torten'::text),
  sub_category text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT torten_designs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.torten_flavours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_de text NOT NULL,
  name_uk text NOT NULL,
  description_de text,
  description_uk text,
  ingredients_de ARRAY DEFAULT '{}'::text[],
  ingredients_uk ARRAY DEFAULT '{}'::text[],
  allergens_de ARRAY DEFAULT '{}'::text[],
  allergens_uk ARRAY DEFAULT '{}'::text[],
  nutrition jsonb,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT torten_flavours_pkey PRIMARY KEY (id)
);