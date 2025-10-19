/*
  # Seed Initial Product Data
  
  ## Overview
  Seeds the products table with initial product data for the wire and cable catalog.
  
  ## Products Added
  - 10 different wires and cables
  - Various brands (Polycab, Havells, KEI, etc.)
  - Multiple categories (House Wires, Building Wires, Power Cables, etc.)
  - Complete specifications and pricing
*/

-- Insert initial products
INSERT INTO products (name, brand, category, color, description, specifications, base_price, unit_type, stock_quantity, image_url, is_active)
VALUES
  (
    'FR PVC Insulated Wire 1.5 sq mm',
    'Polycab',
    'House Wires',
    ARRAY['Red', 'Blue', 'Yellow', 'Green', 'Black'],
    'Flame retardant PVC insulated copper conductor wire suitable for domestic and commercial applications.',
    '{"voltage": "1100V", "conductor": "Annealed Copper", "insulation": "FR PVC", "size": "1.5 sq mm", "standard": "IS 694:2010"}'::jsonb,
    28.50,
    'metres',
    5000,
    'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg',
    true
  ),
  (
    'FR PVC Insulated Wire 2.5 sq mm',
    'Polycab',
    'House Wires',
    ARRAY['Red', 'Blue', 'Yellow', 'Black'],
    'Heavy duty flame retardant wire for higher load applications.',
    '{"voltage": "1100V", "conductor": "Annealed Copper", "insulation": "FR PVC", "size": "2.5 sq mm", "standard": "IS 694:2010"}'::jsonb,
    45.00,
    'metres',
    4000,
    'https://images.pexels.com/photos/6419122/pexels-photo-6419122.jpeg',
    true
  ),
  (
    'HRFR Cable 4 sq mm',
    'Havells',
    'Building Wires',
    ARRAY['Red', 'Blue', 'Yellow', 'Green'],
    'Heat resistant and flame retardant cable for industrial and residential use.',
    '{"voltage": "1100V", "conductor": "Electrolytic Copper", "insulation": "HRFR PVC", "size": "4 sq mm", "standard": "IS 694:2010"}'::jsonb,
    68.00,
    'metres',
    3500,
    'https://images.pexels.com/photos/163676/cannabis-hemp-plant-weed-163676.jpeg',
    true
  ),
  (
    'Armoured LT Cable 3 Core 50 sq mm',
    'KEI',
    'Power Cables',
    ARRAY['Black'],
    'Armoured low tension cable for underground and outdoor power distribution.',
    '{"voltage": "1.1 kV", "conductor": "Aluminium", "insulation": "XLPE", "size": "3 Core x 50 sq mm", "armour": "Galvanized Steel Wire"}'::jsonb,
    425.00,
    'metres',
    2000,
    'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg',
    true
  ),
  (
    'Flexible Cable 0.75 sq mm',
    'Finolex',
    'Flexible Cables',
    ARRAY['Red', 'Blue', 'Yellow', 'White', 'Black'],
    'Multi-strand flexible copper cable for appliances and electronics.',
    '{"voltage": "750V", "conductor": "Tinned Copper", "insulation": "PVC", "size": "0.75 sq mm", "strands": "24/0.20"}'::jsonb,
    18.00,
    'metres',
    6000,
    'https://images.pexels.com/photos/6419122/pexels-photo-6419122.jpeg',
    true
  ),
  (
    'FR Wire 6 sq mm',
    'V-Guard',
    'House Wires',
    ARRAY['Red', 'Blue', 'Yellow', 'Green', 'Black'],
    'High quality flame retardant wire for heavy duty applications.',
    '{"voltage": "1100V", "conductor": "Annealed Copper", "insulation": "FR PVC", "size": "6 sq mm", "standard": "IS 694:2010"}'::jsonb,
    95.00,
    'metres',
    3000,
    'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg',
    true
  ),
  (
    'Submersible Cable 3 Core 4 sq mm',
    'RR Kabel',
    'Submersible Cables',
    ARRAY['Black'],
    'Water resistant cable designed for submersible pump applications.',
    '{"voltage": "1100V", "conductor": "Tinned Copper", "insulation": "PVC", "size": "3 Core x 4 sq mm", "sheath": "PVC"}'::jsonb,
    85.00,
    'metres',
    2500,
    'https://images.pexels.com/photos/163676/cannabis-hemp-plant-weed-163676.jpeg',
    true
  ),
  (
    'Coaxial Cable RG6',
    'Anchor',
    'Communication Cables',
    ARRAY['White', 'Black'],
    'High quality coaxial cable for TV, CCTV and broadband applications.',
    '{"type": "RG6", "impedance": "75 Ohm", "conductor": "Copper Clad Steel", "shielding": "Braided + Foil", "jacket": "PVC"}'::jsonb,
    22.00,
    'metres',
    8000,
    'https://images.pexels.com/photos/6419122/pexels-photo-6419122.jpeg',
    true
  ),
  (
    'Control Cable 7 Core 1.5 sq mm',
    'L&T',
    'Control Cables',
    ARRAY['Grey'],
    'Multi-core control cable for industrial automation and control panels.',
    '{"voltage": "1100V", "conductor": "Annealed Copper", "insulation": "PVC", "size": "7 Core x 1.5 sq mm", "sheath": "PVC"}'::jsonb,
    72.00,
    'metres',
    1500,
    'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg',
    true
  ),
  (
    'Solar DC Cable 4 sq mm',
    'Polycab',
    'Solar Cables',
    ARRAY['Red', 'Black'],
    'UV resistant cable specially designed for solar panel installations.',
    '{"voltage": "1500V DC", "conductor": "Tinned Copper", "insulation": "XLPO", "size": "4 sq mm", "temperature": "-40°C to +120°C"}'::jsonb,
    58.00,
    'metres',
    4500,
    'https://images.pexels.com/photos/163676/cannabis-hemp-plant-weed-163676.jpeg',
    true
  )
ON CONFLICT DO NOTHING;
