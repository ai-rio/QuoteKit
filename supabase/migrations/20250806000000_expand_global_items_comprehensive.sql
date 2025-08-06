-- =====================================================
-- EXPAND GLOBAL ITEMS SYSTEM - COMPREHENSIVE SEED DATA
-- =====================================================
-- This migration expands the existing global items system with:
-- 1. Material items (soils, pavers, plants, supplies)
-- 2. Equipment/rental items (tools, machinery)
-- 3. Missing category items (Pest Control, Snow Services, Specialty Services)
-- 4. Price adjustment for Lawn Fertilization (market research correction)

-- =====================================================
-- PRICE CORRECTIONS (Based on 2024/2025 Market Research)
-- =====================================================

-- Adjust Lawn Fertilization price from $55 to $70 (market research shows $65-100 range)
UPDATE public.global_items 
SET cost = 70.00, updated_at = NOW()
WHERE name = 'Lawn Fertilization';

-- =====================================================
-- LANDSCAPING MATERIALS (Expand existing categories)
-- =====================================================

-- Lawn Care Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Premium Topsoil', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per cubic yard', 45.00, 'free', ARRAY['soil', 'topsoil', 'material'], 6, 'High-quality topsoil for lawn establishment and repair'),
('Grass Seed - Cool Season', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per 50lb bag', 180.00, 'free', ARRAY['seed', 'grass', 'cool season'], 7, 'Premium cool-season grass seed blend for northern climates'),
('Grass Seed - Warm Season', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per 50lb bag', 220.00, 'free', ARRAY['seed', 'grass', 'warm season'], 8, 'Premium warm-season grass seed blend for southern climates'),
('Lawn Repair Kit', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per kit', 25.00, 'free', ARRAY['repair', 'patch', 'seed'], 9, 'Complete lawn repair kit with seed, fertilizer, and mulch');

-- Landscaping Materials  
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Organic Mulch', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per cubic yard', 65.00, 'free', ARRAY['mulch', 'organic', 'material'], 6, 'Natural organic mulch for garden beds and landscaping'),
('Decorative Rock Mulch', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per cubic yard', 85.00, 'free', ARRAY['mulch', 'rock', 'decorative'], 7, 'Decorative rock mulch for low-maintenance landscaping'),
('Annual Flowers', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per flat (18 plants)', 32.00, 'free', ARRAY['flowers', 'annuals', 'plants'], 8, 'Seasonal annual flowers for color and garden displays'),
('Perennial Plants', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per plant', 18.00, 'free', ARRAY['perennials', 'plants', 'flowers'], 9, 'Hardy perennial plants for lasting garden beauty'),
('Small Shrubs', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per plant', 35.00, 'free', ARRAY['shrubs', 'plants', 'landscape'], 10, 'Small to medium ornamental shrubs for landscaping'),
('Landscape Fabric', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per square foot', 0.75, 'free', ARRAY['fabric', 'weed barrier', 'material'], 11, 'Professional-grade landscape fabric for weed control');

-- Tree Services Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Tree Stakes & Ties', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per set', 15.00, 'paid', ARRAY['stakes', 'support', 'installation'], 6, 'Professional tree staking system for newly planted trees'),
('Tree Fertilizer Spikes', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per package', 22.00, 'paid', ARRAY['fertilizer', 'spikes', 'nutrition'], 7, 'Slow-release fertilizer spikes for mature trees'),
('Wound Dressing', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per container', 18.00, 'paid', ARRAY['wound', 'treatment', 'pruning'], 8, 'Professional wound dressing for tree pruning cuts');

-- Irrigation Materials & Equipment
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Rotary Sprinkler Heads', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'each', 12.00, 'paid', ARRAY['sprinkler', 'heads', 'rotary'], 6, 'Professional rotary sprinkler heads for large coverage areas'),
('Spray Sprinkler Heads', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'each', 8.00, 'paid', ARRAY['sprinkler', 'heads', 'spray'], 7, 'Fixed spray sprinkler heads for precise watering'),
('PVC Pipe (4 inch)', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per linear foot', 3.50, 'paid', ARRAY['pipe', 'PVC', 'irrigation'], 8, '4-inch PVC pipe for irrigation main lines'),
('PVC Fittings', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per piece', 2.25, 'paid', ARRAY['fittings', 'PVC', 'connectors'], 9, 'Various PVC fittings and connectors for irrigation systems'),
('Irrigation Wire', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per linear foot', 0.35, 'paid', ARRAY['wire', 'electrical', 'control'], 10, 'Irrigation control wire for valve and controller connections'),
('Irrigation Valves', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'each', 45.00, 'paid', ARRAY['valves', 'control', 'zone'], 11, 'Professional irrigation zone control valves'),
('Drip Tubing', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per linear foot', 0.85, 'paid', ARRAY['drip', 'tubing', 'efficient'], 12, 'Drip irrigation tubing for water-efficient watering'),
('Drip Emitters', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per 25 pack', 18.00, 'paid', ARRAY['emitters', 'drip', 'precise'], 13, 'Adjustable drip emitters for precise plant watering');

-- Hardscaping Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Concrete Pavers', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per square foot', 2.50, 'premium', ARRAY['pavers', 'concrete', 'material'], 6, 'Durable concrete pavers for patios and walkways'),
('Natural Stone Pavers', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per square foot', 8.50, 'premium', ARRAY['pavers', 'stone', 'natural'], 7, 'Premium natural stone pavers for luxury hardscaping'),
('Brick Pavers', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per square foot', 6.00, 'premium', ARRAY['pavers', 'brick', 'classic'], 8, 'Traditional clay brick pavers for timeless appeal'),
('Paver Base Material', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per cubic yard', 28.00, 'premium', ARRAY['base', 'foundation', 'material'], 9, 'Crushed stone base material for paver installations'),
('Paver Sand', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per cubic yard', 35.00, 'premium', ARRAY['sand', 'leveling', 'material'], 10, 'Fine sand for paver leveling and joint filling'),
('Retaining Wall Blocks', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per square foot', 8.50, 'premium', ARRAY['blocks', 'retaining', 'structural'], 11, 'Interlocking blocks for retaining wall construction'),
('Flagstone', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per square foot', 12.00, 'premium', ARRAY['flagstone', 'natural', 'premium'], 12, 'Natural flagstone for premium walkways and patios'),
('Decorative Gravel', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per cubic yard', 45.00, 'premium', ARRAY['gravel', 'decorative', 'drainage'], 13, 'Decorative gravel for drainage and landscape accents');

-- Fertilization Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Premium Fertilizer', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per 50lb bag', 52.00, 'free', ARRAY['fertilizer', 'premium', 'material'], 6, 'High-quality lawn fertilizer for optimal grass nutrition'),
('Organic Fertilizer', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per 50lb bag', 68.00, 'free', ARRAY['fertilizer', 'organic', 'eco-friendly'], 7, 'Organic fertilizer for environmentally conscious lawn care'),
('Lime', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per 50lb bag', 12.00, 'free', ARRAY['lime', 'pH', 'soil treatment'], 8, 'Agricultural lime for soil pH adjustment'),
('Compost', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per cubic yard', 35.00, 'free', ARRAY['compost', 'organic', 'soil amendment'], 9, 'Premium compost for soil improvement and plant health'),
('Soil Amendment', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per cubic yard', 42.00, 'free', ARRAY['amendment', 'soil', 'improvement'], 10, 'Professional soil amendment for enhanced growing conditions');

-- =====================================================
-- MISSING CATEGORIES - PEST CONTROL ITEMS
-- =====================================================

INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Lawn Insect Control', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per application', 85.00, 'paid', ARRAY['insect', 'control', 'treatment'], 1, 'Professional insect control treatment for lawn areas'),
('Grub Control Treatment', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per application', 95.00, 'paid', ARRAY['grub', 'control', 'preventive'], 2, 'Specialized grub control and prevention treatment'),
('Weed Control Application', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per application', 125.00, 'paid', ARRAY['weed', 'herbicide', 'control'], 3, 'Professional weed control and herbicide application'),
('Disease Control Treatment', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per application', 110.00, 'paid', ARRAY['disease', 'fungicide', 'treatment'], 4, 'Fungicide treatment for lawn and plant disease control'),
('Integrated Pest Management', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per consultation', 150.00, 'paid', ARRAY['IPM', 'consultation', 'comprehensive'], 5, 'Comprehensive integrated pest management consultation'),
('Organic Pest Control', (SELECT id FROM public.global_categories WHERE name = 'Pest Control'), 'per application', 135.00, 'paid', ARRAY['organic', 'eco-friendly', 'pest control'], 6, 'Environmentally friendly organic pest control treatment');

-- =====================================================
-- MISSING CATEGORIES - SNOW SERVICES ITEMS
-- =====================================================

INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Snow Plowing', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per visit', 75.00, 'paid', ARRAY['plowing', 'snow removal', 'driveway'], 1, 'Professional snow plowing for driveways and parking areas'),
('Sidewalk Snow Removal', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per linear foot', 2.50, 'paid', ARRAY['sidewalk', 'shoveling', 'walkway'], 2, 'Hand removal of snow from sidewalks and walkways'),
('Ice Management', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per application', 45.00, 'paid', ARRAY['ice', 'salt', 'de-icing'], 3, 'Ice control and de-icing service for safety'),
('Snow Hauling', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per hour', 120.00, 'paid', ARRAY['hauling', 'removal', 'heavy snow'], 4, 'Snow hauling and removal for heavy accumulations'),
('Emergency Snow Service', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per hour', 150.00, 'paid', ARRAY['emergency', '24/7', 'urgent'], 5, '24/7 emergency snow removal service'),
('Seasonal Snow Contract', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per season', 1200.00, 'paid', ARRAY['seasonal', 'contract', 'unlimited'], 6, 'Seasonal unlimited snow removal contract');

-- Snow Services Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Rock Salt', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per 50lb bag', 8.50, 'paid', ARRAY['salt', 'ice melt', 'material'], 7, 'Rock salt for ice melting and traction'),
('Premium Ice Melt', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per 50lb bag', 18.00, 'paid', ARRAY['ice melt', 'premium', 'safe'], 8, 'Premium ice melt safe for plants and concrete'),
('Sand', (SELECT id FROM public.global_categories WHERE name = 'Snow Services'), 'per cubic yard', 25.00, 'paid', ARRAY['sand', 'traction', 'safety'], 9, 'Sand for traction on icy surfaces');

-- =====================================================
-- MISSING CATEGORIES - SPECIALTY SERVICES ITEMS  
-- =====================================================

INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Outdoor Kitchen Design', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per consultation', 500.00, 'premium', ARRAY['design', 'consultation', 'kitchen'], 1, 'Professional outdoor kitchen design consultation'),
('Water Feature Installation', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per installation', 2500.00, 'premium', ARRAY['water feature', 'fountain', 'pond'], 2, 'Custom water feature and fountain installation'),
('Outdoor Lighting System', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per fixture', 125.00, 'premium', ARRAY['lighting', 'outdoor', 'landscape'], 3, 'Professional landscape lighting installation'),
('Pergola Installation', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per square foot', 35.00, 'premium', ARRAY['pergola', 'structure', 'shade'], 4, 'Custom pergola design and installation'),
('Garden Bed Design', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per design', 350.00, 'premium', ARRAY['design', 'garden', 'beds'], 5, 'Professional garden bed design and planning'),
('Xeriscape Installation', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per square foot', 8.50, 'premium', ARRAY['xeriscape', 'drought tolerant', 'sustainable'], 6, 'Drought-tolerant landscaping installation'),
('Living Wall Installation', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per square foot', 85.00, 'premium', ARRAY['living wall', 'vertical garden', 'innovative'], 7, 'Vertical garden and living wall installation'),
('Outdoor Audio System', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per zone', 650.00, 'premium', ARRAY['audio', 'sound', 'entertainment'], 8, 'Weather-resistant outdoor audio system installation');

-- Specialty Services Materials
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Outdoor Lighting Fixtures', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'each', 85.00, 'premium', ARRAY['fixtures', 'lighting', 'material'], 9, 'Professional-grade outdoor lighting fixtures'),
('Low-Voltage Wire', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per linear foot', 1.25, 'premium', ARRAY['wire', 'low voltage', 'lighting'], 10, 'Low-voltage wire for outdoor lighting systems'),
('Water Feature Pumps', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'each', 185.00, 'premium', ARRAY['pump', 'water feature', 'fountain'], 11, 'Submersible pumps for water features and fountains'),
('Drought-Tolerant Plants', (SELECT id FROM public.global_categories WHERE name = 'Specialty Services'), 'per plant', 22.00, 'premium', ARRAY['plants', 'drought tolerant', 'xeriscape'], 12, 'Specialized drought-tolerant plants for xeriscaping');

-- =====================================================
-- EQUIPMENT & TOOL RENTALS (New approach for testing)
-- =====================================================

-- Create equipment items under existing categories where they logically fit
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
-- Lawn Care Equipment
('Lawn Mower Rental', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per day', 45.00, 'free', ARRAY['equipment', 'rental', 'mower'], 10, 'Commercial lawn mower rental for large properties'),
('Aerator Rental', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per day', 55.00, 'free', ARRAY['equipment', 'rental', 'aerator'], 11, 'Core aerator rental for lawn improvement'),
('Overseeder Rental', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per day', 65.00, 'free', ARRAY['equipment', 'rental', 'seeding'], 12, 'Overseeder rental for lawn renovation'),

-- Tree Services Equipment
('Chainsaw Rental', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per day', 65.00, 'paid', ARRAY['equipment', 'rental', 'chainsaw'], 9, 'Professional chainsaw rental for tree work'),
('Stump Grinder Rental', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per day', 285.00, 'paid', ARRAY['equipment', 'rental', 'grinder'], 10, 'Self-propelled stump grinder rental'),

-- Hardscaping Equipment
('Mini Excavator Rental', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per day', 320.00, 'premium', ARRAY['equipment', 'rental', 'excavator'], 14, 'Mini excavator rental for hardscaping projects'),
('Plate Compactor Rental', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per day', 75.00, 'premium', ARRAY['equipment', 'rental', 'compactor'], 15, 'Plate compactor rental for base preparation'),
('Wet Saw Rental', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per day', 95.00, 'premium', ARRAY['equipment', 'rental', 'saw'], 16, 'Wet tile/stone saw rental for precise cutting');

-- =====================================================
-- UPDATE EXISTING ITEM COUNTS AND ANALYTICS
-- =====================================================

-- Log completion with updated counts
DO $$
BEGIN
  RAISE NOTICE 'Global Items System Expansion completed successfully:';
  RAISE NOTICE '- Added materials, equipment, and missing category items';
  RAISE NOTICE '- Price correction for Lawn Fertilization ($55 -> $70)';
  RAISE NOTICE '- Current totals: % categories, % items', 
    (SELECT COUNT(*) FROM public.global_categories),
    (SELECT COUNT(*) FROM public.global_items);
  RAISE NOTICE '- Items by access tier:';
  RAISE NOTICE '  - Free: %', (SELECT COUNT(*) FROM public.global_items WHERE access_tier = 'free');
  RAISE NOTICE '  - Paid: %', (SELECT COUNT(*) FROM public.global_items WHERE access_tier = 'paid');
  RAISE NOTICE '  - Premium: %', (SELECT COUNT(*) FROM public.global_items WHERE access_tier = 'premium');
END $$;