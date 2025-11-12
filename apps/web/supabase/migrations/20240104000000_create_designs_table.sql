-- Create designs table
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk TEXT NOT NULL,
  name_de TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_designs_name_uk ON designs(name_uk);
CREATE INDEX IF NOT EXISTS idx_designs_name_de ON designs(name_de);

-- Enable Row Level Security
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Designs: Public read access
CREATE POLICY "Designs are viewable by everyone" ON designs
  FOR SELECT USING (true);

-- Create updated_at trigger for designs
CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a junction table for product-designs relationship
-- This allows many-to-many relationship between products and designs
CREATE TABLE IF NOT EXISTS product_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, design_id)
);

-- Create indexes for product_designs
CREATE INDEX IF NOT EXISTS idx_product_designs_product_id ON product_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_designs_design_id ON product_designs(design_id);

-- Enable RLS for product_designs
ALTER TABLE product_designs ENABLE ROW LEVEL SECURITY;

-- Product designs: Public read access
CREATE POLICY "Product designs are viewable by everyone" ON product_designs
  FOR SELECT USING (true);

-- Product designs: Anyone can create (for admin interface)
CREATE POLICY "Anyone can create product designs" ON product_designs
  FOR INSERT WITH CHECK (true);

-- Product designs: Anyone can delete (for admin interface)
CREATE POLICY "Anyone can delete product designs" ON product_designs
  FOR DELETE USING (true);

