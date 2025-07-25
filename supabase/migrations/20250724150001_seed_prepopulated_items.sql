-- Seed prepopulated categories and items based on the Foundational Line Item Database
-- This populates the global_categories and global_items tables with tier-based access

-- Insert Service Categories
INSERT INTO public.global_categories (name, description, color, access_tier, sort_order) VALUES
-- Free tier categories (basic lawn care)
('Lawn Maintenance', 'Core recurring revenue services for lawn care businesses', '#22c55e', 'free', 1),
('General Labor', 'Basic labor services and miscellaneous tasks', '#6b7280', 'free', 12),

-- Paid tier categories (professional services)
('Consultation & Design', 'Professional planning, assessment, and design services', '#3b82f6', 'paid', 2),
('Garden & Bed Maintenance', 'Detailed upkeep of planting beds and landscaped areas', '#84cc16', 'paid', 3),
('Fertilization & Treatments', 'Agronomic services and chemical applications', '#f59e0b', 'paid', 4),
('Tree, Shrub & Hedge Care', 'Specialized plant care and removal services', '#10b981', 'paid', 5),
('Seasonal Services', 'Weather-dependent and time-specific services', '#f97316', 'paid', 6),

-- Premium tier categories (advanced/specialized)
('Hardscaping Installation', 'High-value construction-oriented projects', '#ef4444', 'premium', 7),
('Irrigation & Drainage', 'Technical water management systems', '#06b6d4', 'premium', 8),
('Installation Services', 'Specialized planting and material installation', '#8b5cf6', 'premium', 9);

-- Insert Material Categories
INSERT INTO public.global_categories (name, description, color, access_tier, sort_order) VALUES
-- Free tier materials (basic supplies)
('Basic Materials', 'Common soil, sand, and basic landscape materials', '#78716c', 'free', 20),

-- Paid tier materials
('Mulch & Ground Cover', 'Surface materials for garden beds and landscaping', '#a3a3a3', 'paid', 21),
('Plant Materials', 'Live plants, trees, shrubs, and lawn establishment', '#16a34a', 'paid', 22),
('Fertilizers & Chemicals', 'Treatment products and soil amendments', '#ca8a04', 'paid', 23),

-- Premium tier materials
('Hardscape Materials', 'Pavers, stone, blocks, and construction materials', '#dc2626', 'premium', 24),
('Irrigation Components', 'Sprinkler heads, valves, controllers, and system parts', '#0891b2', 'premium', 25),
('Specialty Materials', 'Professional-grade and specialized materials', '#7c3aed', 'premium', 26);

-- Now insert items for each category
-- We'll use variables to store category IDs for cleaner code
DO $$
DECLARE
  cat_lawn_maintenance UUID;
  cat_consultation UUID;
  cat_garden_bed UUID;
  cat_fertilization UUID;
  cat_tree_care UUID;
  cat_hardscaping UUID;
  cat_irrigation UUID;
  cat_installation UUID;
  cat_seasonal UUID;
  cat_general_labor UUID;
  cat_basic_materials UUID;
  cat_mulch UUID;
  cat_plant_materials UUID;
  cat_fertilizers UUID;
  cat_hardscape_materials UUID;
  cat_irrigation_components UUID;
  cat_specialty_materials UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_lawn_maintenance FROM public.global_categories WHERE name = 'Lawn Maintenance';
  SELECT id INTO cat_consultation FROM public.global_categories WHERE name = 'Consultation & Design';
  SELECT id INTO cat_garden_bed FROM public.global_categories WHERE name = 'Garden & Bed Maintenance';
  SELECT id INTO cat_fertilization FROM public.global_categories WHERE name = 'Fertilization & Treatments';
  SELECT id INTO cat_tree_care FROM public.global_categories WHERE name = 'Tree, Shrub & Hedge Care';
  SELECT id INTO cat_hardscaping FROM public.global_categories WHERE name = 'Hardscaping Installation';
  SELECT id INTO cat_irrigation FROM public.global_categories WHERE name = 'Irrigation & Drainage';
  SELECT id INTO cat_installation FROM public.global_categories WHERE name = 'Installation Services';
  SELECT id INTO cat_seasonal FROM public.global_categories WHERE name = 'Seasonal Services';
  SELECT id INTO cat_general_labor FROM public.global_categories WHERE name = 'General Labor';
  SELECT id INTO cat_basic_materials FROM public.global_categories WHERE name = 'Basic Materials';
  SELECT id INTO cat_mulch FROM public.global_categories WHERE name = 'Mulch & Ground Cover';
  SELECT id INTO cat_plant_materials FROM public.global_categories WHERE name = 'Plant Materials';
  SELECT id INTO cat_fertilizers FROM public.global_categories WHERE name = 'Fertilizers & Chemicals';
  SELECT id INTO cat_hardscape_materials FROM public.global_categories WHERE name = 'Hardscape Materials';
  SELECT id INTO cat_irrigation_components FROM public.global_categories WHERE name = 'Irrigation Components';
  SELECT id INTO cat_specialty_materials FROM public.global_categories WHERE name = 'Specialty Materials';

  -- FREE TIER SERVICES (Lawn Maintenance)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Lawn Mowing - Standard', cat_lawn_maintenance, 'Mowing & Edging', 'per Visit', 45.00, 'Standard residential lawn mowing service', 'For typical residential lawns using push or walk-behind mowers', 'free', ARRAY['mowing', 'weekly', 'maintenance'], 1),
  ('Line Trimming (Weed Eating)', cat_lawn_maintenance, 'Mowing & Edging', 'per Hour', 35.00, 'Trimming grass around obstacles and fence lines', 'Often included in standard mowing package', 'free', ARRAY['trimming', 'edging', 'maintenance'], 2),
  ('Lawn Edging - Hard Surfaces', cat_lawn_maintenance, 'Mowing & Edging', 'per Linear Ft.', 0.75, 'Clean edge along concrete walkways and driveways', 'Creates professional appearance', 'free', ARRAY['edging', 'cleanup'], 3);

  -- FREE TIER MATERIALS (Basic Materials)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Screened Topsoil', cat_basic_materials, 'Soils & Compost', 'per Cubic Yard', 35.00, 'All-purpose soil for grading and new lawns', 'Standard topsoil for basic landscaping needs', 'free', ARRAY['soil', 'topsoil', 'grading'], 1),
  ('Fill Dirt (Unscreened)', cat_basic_materials, 'Soils & Compost', 'per Cubic Yard', 20.00, 'Low-cost material for filling depressions', 'Used where soil quality is not a concern', 'free', ARRAY['fill', 'grading', 'budget'], 2);

  -- FREE TIER LABOR
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('General Labor - Unskilled', cat_general_labor, NULL, 'per Hour', 25.00, 'Basic tasks and material moving', 'For cleanup, moving materials, assisting skilled workers', 'free', ARRAY['labor', 'basic', 'cleanup'], 1),
  ('General Labor - Skilled', cat_general_labor, NULL, 'per Hour', 45.00, 'Tasks requiring expertise or equipment operation', 'For specialized tasks and equipment operation', 'free', ARRAY['labor', 'skilled', 'equipment'], 2);

  -- PAID TIER SERVICES

  -- Consultation & Design (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Initial Site Consultation', cat_consultation, NULL, 'Flat Fee', 200.00, 'First client meeting to assess property and discuss scope', 'Often credited back if client proceeds with larger project', 'paid', ARRAY['consultation', 'design', 'assessment'], 1),
  ('Landscape Design Plan - 2D Conceptual', cat_consultation, NULL, 'Flat Fee', 1500.00, 'Top-down schematic showing layout of major elements', 'Standard entry-level design deliverable', 'paid', ARRAY['design', '2D', 'planning'], 2),
  ('Planting Plan / Softscape Design', cat_consultation, NULL, 'per Hour', 75.00, 'Specialized design for plant selection and placement', 'Focus on plant selection, quantities, and scheduling', 'paid', ARRAY['planting', 'softscape', 'design'], 3);

  -- Advanced Lawn Maintenance (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Core Aeration', cat_lawn_maintenance, 'Turf Health & Renovation', 'per 1,000 Sq. Ft.', 75.00, 'Mechanical soil compaction relief', 'Key seasonal service, pricing decreases for larger lawns', 'paid', ARRAY['aeration', 'seasonal', 'health'], 10),
  ('Overseeding', cat_lawn_maintenance, 'Turf Health & Renovation', 'per Sq. Ft.', 0.15, 'Spreading grass seed over existing lawn', 'Often performed with core aeration', 'paid', ARRAY['seeding', 'renovation', 'density'], 11),
  ('Dethatching / Power Raking', cat_lawn_maintenance, 'Turf Health & Renovation', 'per Sq. Ft.', 0.12, 'Mechanical removal of thatch layer', 'Labor-intensive, priced by area', 'paid', ARRAY['dethatching', 'renovation', 'mechanical'], 12);

  -- Garden & Bed Maintenance (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Garden Bed Weeding', cat_garden_bed, NULL, 'per Hour', 35.00, 'Manual weed removal from planting beds', 'Time varies with weed density, hourly billing safest', 'paid', ARRAY['weeding', 'maintenance', 'manual'], 1),
  ('Mulch Installation / Spreading', cat_garden_bed, NULL, 'per Cubic Yard', 85.00, 'Labor to spread mulch in garden beds', 'Includes labor, often bundled with material cost', 'paid', ARRAY['mulch', 'installation', 'beds'], 2),
  ('Bed Edging - Natural Edge Definition', cat_garden_bed, NULL, 'per Linear Ft.', 1.25, 'Clean trench between garden bed and lawn', 'Using spade or bed edger for defined look', 'paid', ARRAY['edging', 'definition', 'beds'], 3);

  -- Fertilization & Treatments (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Granular Fertilizer Application', cat_fertilization, 'Fertilizer Applications', 'per 1,000 Sq. Ft.', 45.00, 'Standard slow-release lawn feeding', 'Basis of seasonal feeding programs', 'paid', ARRAY['fertilizer', 'granular', 'feeding'], 1),
  ('Pre-Emergent Herbicide Application', cat_fertilization, 'Weed Control', 'per 1,000 Sq. Ft.', 50.00, 'Prevents crabgrass and weed germination', 'Critical spring and fall application', 'paid', ARRAY['herbicide', 'prevention', 'weeds'], 2),
  ('Post-Emergent Herbicide (Broadleaf)', cat_fertilization, 'Weed Control', 'per 1,000 Sq. Ft.', 55.00, 'Targets existing broadleaf weeds', 'For dandelions, clover, plantain', 'paid', ARRAY['herbicide', 'broadleaf', 'treatment'], 3),
  ('Lawn Insect Control', cat_fertilization, 'Pest & Disease Control', 'per 1,000 Sq. Ft.', 60.00, 'Grub and insect pest treatment', 'Can be preventative or curative', 'paid', ARRAY['insect', 'grubs', 'pest'], 4);

  -- Tree, Shrub & Hedge Care (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Shrub/Bush Trimming', cat_tree_care, 'Pruning & Trimming', 'per Hour', 55.00, 'General shaping and size maintenance', 'Hourly rates common for multiple plants', 'paid', ARRAY['pruning', 'shrubs', 'trimming'], 1),
  ('Hedge Trimming / Shearing', cat_tree_care, 'Pruning & Trimming', 'per Linear Ft.', 3.50, 'Creating formal geometric shapes', 'Scales with length and height', 'paid', ARRAY['hedge', 'shearing', 'formal'], 2),
  ('Tree Pruning - Small (Under 15 ft)', cat_tree_care, 'Pruning & Trimming', 'Each', 125.00, 'Pruning from ground or small ladder', 'No special equipment required', 'paid', ARRAY['tree', 'pruning', 'small'], 3),
  ('Shrub/Bush Removal', cat_tree_care, 'Removal & Stump Grinding', 'Each', 85.00, 'Complete removal including root ball', 'Price varies with size and root system', 'paid', ARRAY['removal', 'shrub', 'excavation'], 4);

  -- Seasonal Services (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Spring Cleanup', cat_seasonal, 'Yard Cleanup', 'Flat Fee', 275.00, 'Package service for spring preparation', 'Removes winter debris, cuts perennials, defines edges', 'paid', ARRAY['cleanup', 'spring', 'package'], 1),
  ('Fall Cleanup', cat_seasonal, 'Yard Cleanup', 'Flat Fee', 325.00, 'Leaf removal and winter preparation', 'More expensive due to leaf volume', 'paid', ARRAY['cleanup', 'fall', 'leaves'], 2),
  ('Leaf Removal', cat_seasonal, 'Debris Management', 'per Hour', 45.00, 'Standalone leaf removal service', 'Can use various methods: blowing, raking, vacuuming', 'paid', ARRAY['leaves', 'removal', 'fall'], 3),
  ('Gutter Cleaning', cat_seasonal, 'Debris Management', 'Flat Fee', 150.00, 'Clean gutters and downspouts', 'Common fall service add-on', 'paid', ARRAY['gutters', 'cleaning', 'maintenance'], 4);

  -- PAID TIER MATERIALS

  -- Mulch & Ground Cover (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Double-Shredded Hardwood Mulch', cat_mulch, 'Organic Mulch', 'per Cubic Yard', 45.00, 'Most common and cost-effective landscape mulch', 'Standard choice for most applications', 'paid', ARRAY['mulch', 'hardwood', 'organic'], 1),
  ('Dyed Hardwood Mulch (Brown)', cat_mulch, 'Organic Mulch', 'per Cubic Yard', 55.00, 'Color-enhanced mulch with lasting color', 'Retains color longer than natural hardwood', 'paid', ARRAY['mulch', 'dyed', 'brown'], 2),
  ('Cedar Mulch', cat_mulch, 'Organic Mulch', 'per Cubic Yard', 65.00, 'Premium mulch with natural insect repelling', 'Pleasant aroma, lighter color, long lasting', 'paid', ARRAY['mulch', 'cedar', 'premium'], 3),
  ('Pine Bark Mulch', cat_mulch, 'Organic Mulch', 'per Cubic Yard', 50.00, 'Lightweight and acidic mulch', 'Beneficial for acid-loving plants', 'paid', ARRAY['mulch', 'pine', 'acidic'], 4);

  -- Plant Materials (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Annuals', cat_plant_materials, 'Annuals', 'per Flat', 45.00, 'Seasonal color plants for beds and containers', 'Typically 48 plants per flat', 'paid', ARRAY['annuals', 'color', 'seasonal'], 1),
  ('Perennial - 1 Gallon (#1)', cat_plant_materials, 'Perennials', 'Each', 12.00, 'Standard size perennials and ornamental grasses', 'Common size for many perennial varieties', 'paid', ARRAY['perennial', '1gallon', 'container'], 2),
  ('Shrub - 3 Gallon (#3)', cat_plant_materials, 'Shrubs', 'Each', 35.00, 'Common size for landscape shrubs', 'Used for foundation plantings and borders', 'paid', ARRAY['shrub', '3gallon', 'landscape'], 3),
  ('Tall Fescue Sod', cat_plant_materials, 'Sod', 'per Sq. Ft.', 0.85, 'Common cool-season grass sod', 'Typically ordered by pallet (450-500 sq ft)', 'paid', ARRAY['sod', 'fescue', 'cool-season'], 4),
  ('Tall Fescue Grass Seed', cat_plant_materials, 'Seed', 'per Bag', 85.00, 'Quality grass seed for new lawns', '50 lb bag with coverage information', 'paid', ARRAY['seed', 'fescue', 'establishment'], 5);

  -- Fertilizers & Chemicals (Paid Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Granular Lawn Fertilizer (50 lb)', cat_fertilizers, 'Fertilizers', 'per Bag', 65.00, 'Standard slow-release fertilizer', 'N-P-K ratio specified in description', 'paid', ARRAY['fertilizer', 'granular', 'bag'], 1),
  ('Liquid Broadleaf Weed Control', cat_fertilizers, 'Herbicides', 'per Gallon', 125.00, 'Concentrate for post-emergent weed control', 'For dandelions, clover, and other broadleaf weeds', 'paid', ARRAY['herbicide', 'liquid', 'broadleaf'], 2),
  ('Granular Grub Control (15 lb)', cat_fertilizers, 'Pesticides & Fungicides', 'per Bag', 85.00, 'Preventative or curative grub control', 'Apply according to manufacturer directions', 'paid', ARRAY['grub', 'control', 'preventative'], 3),
  ('Pelletized Lime (40 lb)', cat_fertilizers, 'Soil Amendments', 'per Bag', 12.00, 'Raises soil pH in acidic soils', 'Based on soil test recommendations', 'paid', ARRAY['lime', 'pH', 'amendment'], 4);

  -- PREMIUM TIER SERVICES

  -- Hardscaping Installation (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Excavation & Grading', cat_hardscaping, 'Site Preparation & Demolition', 'per Sq. Ft.', 3.50, 'Preparing sub-base for hardscape structures', 'Cost varies with depth and soil conditions', 'premium', ARRAY['excavation', 'grading', 'preparation'], 1),
  ('Existing Sod Removal', cat_hardscaping, 'Site Preparation & Demolition', 'per Sq. Ft.', 0.85, 'Mechanical or manual turf removal', 'Necessary for hardscape installation', 'premium', ARRAY['sod', 'removal', 'preparation'], 2),
  ('Paver Patio Installation', cat_hardscaping, 'Patios & Walkways', 'per Sq. Ft.', 18.50, 'Complete paver patio installation', 'Includes base prep, sand, pavers, edge restraint', 'premium', ARRAY['paver', 'patio', 'installation'], 3),
  ('Flagstone Patio Installation (Dry-Laid)', cat_hardscaping, 'Patios & Walkways', 'per Sq. Ft.', 22.00, 'Natural stone patio on gravel/sand base', 'More labor-intensive than concrete pavers', 'premium', ARRAY['flagstone', 'patio', 'natural'], 4),
  ('Retaining Wall Installation (Block)', cat_hardscaping, 'Retaining & Seating Walls', 'per Sq. Ft.', 25.00, 'Interlocking block retaining wall', 'Price based on visible face area', 'premium', ARRAY['retaining', 'wall', 'block'], 5),
  ('Fire Pit Installation (Kit)', cat_hardscaping, 'Outdoor Living Features', 'Each', 485.00, 'Assembly of pre-packaged fire pit kit', 'Includes block and metal insert installation', 'premium', ARRAY['firepit', 'kit', 'installation'], 6);

  -- Irrigation & Drainage (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Sprinkler System Installation', cat_irrigation, 'System Installation', 'per Zone', 750.00, 'Complete zone installation with valve and heads', 'Standard unit includes valve, pipes, and heads', 'premium', ARRAY['sprinkler', 'zone', 'installation'], 1),
  ('Drip Irrigation System Installation', cat_irrigation, 'System Installation', 'per Zone', 450.00, 'Drip system for beds and shrubs', 'More efficient for targeted watering', 'premium', ARRAY['drip', 'irrigation', 'efficient'], 2),
  ('Spring System Start-Up', cat_irrigation, 'System Maintenance & Repair', 'per System', 125.00, 'Seasonal system activation and inspection', 'Flat fee service for system preparation', 'premium', ARRAY['startup', 'spring', 'maintenance'], 3),
  ('Fall System Winterization', cat_irrigation, 'System Maintenance & Repair', 'per System', 95.00, 'Blow-out service to prevent freeze damage', 'Essential in cold climates', 'premium', ARRAY['winterization', 'blowout', 'protection'], 4),
  ('French Drain Installation', cat_irrigation, 'Drainage Solutions', 'per Linear Ft.', 15.00, 'Subsurface drainage system', 'Work scales directly with trench length', 'premium', ARRAY['french', 'drain', 'drainage'], 5),
  ('Catch Basin Installation', cat_irrigation, 'Drainage Solutions', 'Each', 285.00, 'Surface water collection system', 'For capturing water in specific locations', 'premium', ARRAY['catch', 'basin', 'drainage'], 6);

  -- Installation Services (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Shrub & Tree Planting - #1 Gal', cat_installation, NULL, 'Each', 25.00, 'Labor to plant 1-gallon container plants', 'Basic planting service for small plants', 'premium', ARRAY['planting', 'shrub', '1gallon'], 1),
  ('Shrub & Tree Planting - #5 Gal', cat_installation, NULL, 'Each', 55.00, 'Labor to plant 5-gallon container plants', 'Larger plants require more effort', 'premium', ARRAY['planting', 'shrub', '5gallon'], 2),
  ('Shrub & Tree Planting - #15 Gal', cat_installation, NULL, 'Each', 125.00, 'Labor to plant 15-gallon container trees', 'Significant excavation and soil preparation', 'premium', ARRAY['planting', 'tree', '15gallon'], 3),
  ('Sod Installation', cat_installation, NULL, 'per Sq. Ft.', 1.25, 'Professional sod installation service', 'Often bundled with material cost', 'premium', ARRAY['sod', 'installation', 'lawn'], 4),
  ('Landscape Fabric Installation', cat_installation, NULL, 'per Sq. Ft.', 0.65, 'Professional fabric laying and securing', 'Labor to cut, lay, and pin fabric', 'premium', ARRAY['fabric', 'installation', 'weed'], 5);

  -- PREMIUM TIER MATERIALS

  -- Hardscape Materials (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Concrete Pavers (Standard)', cat_hardscape_materials, 'Pavers & Flagstone', 'per Sq. Ft.', 4.50, 'Common concrete pavers in various shapes', 'Available in multiple colors and patterns', 'premium', ARRAY['pavers', 'concrete', 'standard'], 1),
  ('Brick Pavers', cat_hardscape_materials, 'Pavers & Flagstone', 'per Sq. Ft.', 6.50, 'Clay brick pavers for classic look', 'Traditional aesthetic with durability', 'premium', ARRAY['pavers', 'brick', 'clay'], 2),
  ('Natural Flagstone', cat_hardscape_materials, 'Pavers & Flagstone', 'per Sq. Ft.', 12.00, 'Natural stone for premium applications', 'Includes bluestone, sandstone varieties', 'premium', ARRAY['flagstone', 'natural', 'premium'], 3),
  ('Interlocking Retaining Wall Block', cat_hardscape_materials, 'Wall Blocks & Caps', 'per Sq. Ft.', 8.50, 'Engineered blocks for retaining walls', 'Designed for structural integrity', 'premium', ARRAY['block', 'retaining', 'engineered'], 4),
  ('Wall Caps', cat_hardscape_materials, 'Wall Blocks & Caps', 'per Linear Ft.', 12.00, 'Finishing pieces for wall tops', 'Professional appearance and protection', 'premium', ARRAY['caps', 'finishing', 'wall'], 5),
  ('Pressure-Treated Landscape Timber', cat_hardscape_materials, 'Timbers & Edging', 'Each', 24.00, 'Standard 6x6x8 landscape timber', 'Treated for ground contact durability', 'premium', ARRAY['timber', 'treated', 'edging'], 6);

  -- Irrigation Components (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('4-inch Pop-Up Spray Head', cat_irrigation_components, 'Heads & Nozzles', 'Each', 8.50, 'Most common residential sprinkler head', 'Standard for lawn irrigation zones', 'premium', ARRAY['sprinkler', 'head', 'popup'], 1),
  ('Rotor Head', cat_irrigation_components, 'Heads & Nozzles', 'Each', 28.00, 'Rotating stream head for larger areas', 'Better for turf areas over 15 feet', 'premium', ARRAY['rotor', 'head', 'rotating'], 2),
  ('Electric Zone Valve (1-inch)', cat_irrigation_components, 'Valves & Manifolds', 'Each', 45.00, 'Electronic valve controlling zone water flow', 'Essential component for each zone', 'premium', ARRAY['valve', 'zone', 'electric'], 3),
  ('Smart Irrigation Controller (8-Zone)', cat_irrigation_components, 'Controllers & Sensors', 'Each', 285.00, 'Wi-Fi enabled weather-based controller', 'Adjusts watering based on conditions', 'premium', ARRAY['controller', 'smart', 'wifi'], 4),
  ('PVC Pipe - Schedule 40 (1-inch)', cat_irrigation_components, 'Pipe & Fittings', 'per 10 ft', 12.00, 'Standard rigid pipe for irrigation', 'Used for main and lateral lines', 'premium', ARRAY['pipe', 'pvc', 'irrigation'], 5);

  -- Specialty Materials (Premium Tier)
  INSERT INTO public.global_items (name, category_id, subcategory, unit, cost, description, notes, access_tier, tags, sort_order) VALUES
  ('Woven Landscape Fabric', cat_specialty_materials, NULL, 'per Roll', 85.00, 'Professional-grade weed barrier', 'Durable fabric for long-term weed control', 'premium', ARRAY['fabric', 'woven', 'professional'], 1),
  ('Landscape Fabric Staples', cat_specialty_materials, NULL, 'per Box', 25.00, 'Metal pins for securing fabric', 'Essential for proper fabric installation', 'premium', ARRAY['staples', 'fabric', 'pins'], 2),
  ('Tree Stakes (Metal)', cat_specialty_materials, NULL, 'Each', 15.00, 'Support stakes for newly planted trees', 'Prevents wind damage during establishment', 'premium', ARRAY['stakes', 'tree', 'support'], 3),
  ('Corrugated Drainage Pipe (4-inch)', cat_specialty_materials, NULL, 'per 100 ft Roll', 125.00, 'Flexible perforated drainage pipe', 'Used for French drains and drainage solutions', 'premium', ARRAY['pipe', 'drainage', 'corrugated'], 4),
  ('Polymeric Sand', cat_specialty_materials, NULL, 'per Bag', 18.00, 'Sand that hardens when wet', 'Locks pavers and inhibits weeds', 'premium', ARRAY['sand', 'polymeric', 'jointing'], 5);

END $$;