export type MainServiceCategoryId =
  | 'agri-vehicles'
  | 'agri-equipment'
  | 'construction'
  | 'transportation'
  | 'water-supply'
  | 'other-services';

export type EquipmentSubCategoryGroup =
  | 'Soil Preparation Equipment'
  | 'Sowing and Planting Equipment'
  | 'Spraying and Fertilizing Equipment'
  | 'Harvesting Equipment'
  | 'Irrigation Equipment'
  | 'Other Agricultural Equipment';

export type PricingUnit = 'hour' | 'acre' | 'day' | 'trip' | 'fixed';

export interface PricingOption {
  unit: PricingUnit;
  price: number;
  label: string; // e.g., "/ hour", "/ acre", "/ day", "/ trip", "Fixed"
}

export interface EquipmentCategoryNode {
  id: string;
  group: EquipmentSubCategoryGroup | string;
  name: string;
  defaultAttachmentType: string;
  defaultMinHp: number;
  defaultOperations: string[];
  active: boolean;
}

export interface EquipmentListing {
  id: number;
  owner_id: number;
  owner_name: string;
  owner_phone?: string;
  name: string;
  main_category: MainServiceCategoryId;
  sub_category_group: EquipmentSubCategoryGroup | string;
  equipment_type: string; // e.g., "Rotavator", "Seed Drill", "Boom Sprayer"
  brand: string;
  model: string;
  image: string;
  gallery?: string[];
  specifications: Record<string, string>;
  required_hp_min: number;
  required_hp_max: number;
  attachment_type: string; // e.g., "3-Point Hitch (Cat-II) • 540 RPM PTO"
  suitable_operations: string[];
  pricing_options: PricingOption[];
  default_price: number;
  default_price_unit: PricingUnit;
  standalone_available: boolean; // Option 1: Book Equipment Only
  combo_available: boolean; // Option 2: Book Tractor + Equipment
  operator_available: boolean;
  operator_rate_per_hour?: number;
  availability_status: 'Available' | 'Busy' | 'Inactive';
  condition: 'Excellent' | 'Good' | 'Standard';
  service_locations: string[];
  city: string;
  distance?: string;
  rating: number;
  bookings_count: number;
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  is_verified: boolean;
  reported?: boolean;
  report_reason?: string;
  pricing_dispute?: string;
  description: string;
  created_at?: string;
}

export interface TractorOption {
  id: number;
  name: string;
  brand: string;
  hp: number;
  attachment_support: string[];
  hourly_rate: number;
  owner_id: number;
  owner_name: string;
  location: string;
  image: string;
  operator_available: boolean;
}

export const MAIN_SERVICE_CATEGORIES: Array<{
  id: MainServiceCategoryId;
  title: string;
  shortTitle: string;
  subtitle: string;
  imageKey: string;
  accentBg: string;
}> = [
  {
    id: 'agri-vehicles',
    title: 'Agricultural Vehicles',
    shortTitle: 'Agri Vehicles',
    subtitle: 'Tractors, Harvesters & Trailers',
    imageKey: 'tractor-60hp',
    accentBg: '#ECFDF5',
  },
  {
    id: 'agri-equipment',
    title: 'Agricultural Equipment & Implements',
    shortTitle: 'Agri Equipment',
    subtitle: 'Rotavators, Ploughs, Seed Drills, Sprayers',
    imageKey: 'rotavator',
    accentBg: '#FFF7ED',
  },
  {
    id: 'construction',
    title: 'Construction Equipment',
    shortTitle: 'Construction',
    subtitle: 'JCB 3DX, Excavators & Loaders',
    imageKey: 'jcb',
    accentBg: '#FEFCE8',
  },
  {
    id: 'transportation',
    title: 'Transportation Vehicles',
    shortTitle: 'Transport',
    subtitle: 'Cargo Trucks, Mini Trucks & SUVs',
    imageKey: 'truck',
    accentBg: '#EFF6FF',
  },
  {
    id: 'water-supply',
    title: 'Water Supply & Tankers',
    shortTitle: 'Water & Tankers',
    subtitle: 'Water Tankers, Diesel & Electric Pumps',
    imageKey: 'water-tanker-supply',
    accentBg: '#F0F9FF',
  },
  {
    id: 'other-services',
    title: 'Other Machinery & Services',
    shortTitle: 'Other Services',
    subtitle: 'Agri Drones, Brush Cutters & Diggers',
    imageKey: 'drone',
    accentBg: '#FAF5FF',
  },
];

export const AGRICULTURAL_IMPLEMENT_TAXONOMY: Record<
  EquipmentSubCategoryGroup,
  string[]
> = {
  'Soil Preparation Equipment': [
    'Rotavator',
    'Cultivator',
    'Disc Plough',
    'Mouldboard Plough',
    'Harrow',
    'Subsoiler',
    'Ridger',
    'Bed Maker',
    'Land Leveller',
    'Power Tiller',
  ],
  'Sowing and Planting Equipment': [
    'Seed Drill',
    'Zero Till Seed Drill',
    'Multi-Crop Planter',
    'Paddy Rice Transplanter',
    'Potato Planter',
    'Sugarcane Planter',
    'Dibbling Machine',
  ],
  'Spraying and Fertilizing Equipment': [
    'Tractor Mounted Sprayer',
    'Boom Sprayer',
    'Mist Blower',
    'Fertilizer Spreader',
    'Manure Spreader',
    'Agricultural Spraying Drone',
  ],
  'Harvesting Equipment': [
    'Combine Harvester',
    'Reaper',
    'Power Reaper',
    'Paddy Harvester',
    'Thresher',
    'Maize Sheller',
    'Straw Baler',
    'Chaff Cutter',
  ],
  'Irrigation Equipment': [
    'Water Pump',
    'Diesel Pump Set',
    'Electric Pump Set',
    'Sprinkler System',
    'Drip Irrigation Equipment',
    'Water Tanker',
  ],
  'Other Agricultural Equipment': [
    'Agricultural Trailer',
    'Hay Rake',
    'Grass Cutter',
    'Brush Cutter',
    'Post Hole Digger',
    'Sugarcane Crusher',
    'Groundnut Digger',
    'Agricultural Shredder',
  ],
};

/**
 * Checks whether a tractor is compatible with an agricultural implement
 * based on horsepower requirements and attachment type.
 */
export function isTractorCompatibleWithEquipment(
  tractor: TractorOption,
  equipment: EquipmentListing
): { compatible: boolean; reason?: string } {
  if (equipment.required_hp_min > 0 && tractor.hp < equipment.required_hp_min) {
    return {
      compatible: false,
      reason: `Requires at least ${equipment.required_hp_min} HP tractor (selected tractor is ${tractor.hp} HP).`,
    };
  }
  if (equipment.required_hp_max > 0 && tractor.hp > equipment.required_hp_max + 20) {
    return {
      compatible: false,
      reason: `Recommended max ${equipment.required_hp_max} HP tractor for safe PTO operation.`,
    };
  }
  return { compatible: true };
}

