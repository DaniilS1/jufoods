-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.custom_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_designs_pkey PRIMARY KEY (id),
  CONSTRAINT custom_designs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.design_flavour (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  design_id uuid NOT NULL,
  flavour_id uuid NOT NULL,
  CONSTRAINT design_flavour_pkey PRIMARY KEY (id),
  CONSTRAINT design_flavour_design_id_fkey FOREIGN KEY (design_id) REFERENCES public.torten_designs(id),
  CONSTRAINT design_flavour_flavour_id_fkey FOREIGN KEY (flavour_id) REFERENCES public.torten_flavours(id)
);
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
  custom_design_id uuid,
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
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferred_language text DEFAULT 'de'::text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  notifications_email boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  images_urls text[] DEFAULT '{}',
  classic boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT torten_designs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.torten_flavours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  flavour_number integer NOT NULL UNIQUE,
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
CREATE TABLE public.users (
  id uuid NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role IN ('customer', 'admin')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);