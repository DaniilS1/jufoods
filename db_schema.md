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
  custom_design_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_custom_design_id_fkey FOREIGN KEY (custom_design_id) REFERENCES public.custom_designs(id)
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

CREATE TABLE public.design_flavour (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  design_id uuid NOT NULL REFERENCES public.torten_designs(id) ON DELETE CASCADE,
  flavour_id uuid NOT NULL REFERENCES public.torten_flavours(id) ON DELETE CASCADE,
  CONSTRAINT design_flavour_pkey PRIMARY KEY (id),
  CONSTRAINT design_flavour_design_flavour_key UNIQUE (design_id, flavour_id)
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_language text DEFAULT 'de',
  marketing_opt_in boolean DEFAULT false,
  notifications_email boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.custom_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);