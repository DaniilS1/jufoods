CREATE TABLE IF NOT EXISTS category_images (
  section_id  TEXT        PRIMARY KEY,
  image_url   TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE category_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category_images_public_read"
  ON category_images FOR SELECT
  USING (true);

CREATE POLICY "category_images_admin_write"
  ON category_images FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
