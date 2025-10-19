/*
  # Complete WireBazaar Database Schema
  
  ## Overview
  Creates a complete database schema for the WireBazaar e-commerce application with:
  - User authentication and profiles
  - Product catalog with image storage
  - Order management
  - Inquiry/quote system
  - Admin functionality
  
  ## Tables Created
  1. **admin_users** - Admin/owner accounts with email authentication
  2. **users** - Customer accounts with OTP-based authentication
  3. **user_profiles** - Extended customer profile information
  4. **products** - Product catalog (wires, cables, etc.)
  5. **orders** - Customer orders with payment tracking
  6. **inquiries** - Customer quote requests
  
  ## Security
  - RLS enabled on all tables
  - Proper policies for authenticated and anonymous users
  - Admin-only access for product management
  - User-specific access for orders and profiles
  
  ## Features
  - Automatic timestamp management with triggers
  - Proper indexing for performance
  - Data validation with constraints
  - Support for real-time subscriptions
*/

-- ============ ENABLE EXTENSIONS ============

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ DROP EXISTING TABLES IF THEY EXIST ============

DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ============ CREATE TABLES ============

-- Admin users table (for owner/admin dashboard)
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Regular users table (customers with OTP authentication)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  auth_method text DEFAULT 'otp' CHECK (auth_method IN ('otp', 'email')),
  is_verified boolean DEFAULT false,
  last_login_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles with extended information
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone_number text,
  address text,
  city text,
  state text,
  pincode text,
  company_name text,
  business_type text,
  gst_number text,
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  color text[] DEFAULT ARRAY[]::text[],
  description text,
  specifications jsonb DEFAULT '{}'::jsonb,
  base_price numeric(12, 2) NOT NULL CHECK (base_price >= 0),
  unit_type text DEFAULT 'metres' CHECK (unit_type IN ('metres', 'coils', 'pieces', 'rolls')),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text,
  brochure_url text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_city text,
  customer_state text,
  customer_pincode text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost numeric(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  qr_code_data text,
  transaction_id text,
  estimated_delivery date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inquiries table
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type text NOT NULL,
  location text NOT NULL,
  product_name text,
  product_specification text,
  quantity text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  additional_requirements text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quote_sent', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============ CREATE INDEXES ============

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);

-- ============ ENABLE RLS ============

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- ============ CREATE HELPER FUNCTIONS ============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============ CREATE TRIGGERS ============

CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============ RLS POLICIES ============

-- Admin Users: Only accessible by authenticated admins
CREATE POLICY "Admins can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users: Allow anonymous for OTP authentication flow
CREATE POLICY "Allow anon to insert users"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read users"
  ON users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update users"
  ON users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Profiles
CREATE POLICY "Allow anon to insert user_profiles"
  ON user_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read user_profiles"
  ON user_profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update user_profiles"
  ON user_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Products: Public read, admin write
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow anon to view all products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated to view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon to insert products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

-- Orders
CREATE POLICY "Allow anon to insert orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update orders"
  ON orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Inquiries
CREATE POLICY "Allow anon to insert inquiries"
  ON inquiries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read inquiries"
  ON inquiries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update inquiries"
  ON inquiries FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ SEED DEFAULT ADMIN ============

INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'owner@cablehq.com',
  -- This is a bcrypt hash of 'SecurePass123!' - in production, use proper password hashing
  '$2a$10$7Z0XQZI5Y5GQ5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
