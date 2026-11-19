import React from 'react';

/**
 * Centralized Commercial Asset Library & Vehicle Image Mapping Utility
 * for the Desi Ride Application.
 *
 * Strictly uses high-resolution, original, non-cropped commercial assets
 * organized under `/assets/`. Never assigns images randomly or by list index.
 */

export const BRANDING_ASSETS = {
  logo: '/assets/branding/desi-ride-logo.png',
  icon: '/assets/branding/desi-ride-icon.png',
};

export const HERO_ASSETS = {
  customerHero: '/assets/hero/customer-hero.png',
  operatorHero: '/assets/hero/operator-hero.png',
  ownerHero: '/assets/hero/owner-hero.png',
  homeHero: '/assets/hero/home-hero.jpg',
  homeHeroSlide1: '/assets/hero/home-hero-slide1.jpg',
  homeHeroSlide3: '/assets/hero/home-hero-slide3.jpg',
};

export const AGRICULTURE_VEHICLE_ASSETS = {
  tractor60hp: '/assets/vehicles/agriculture/tractor-60hp.png',
  tractor50hp: '/assets/vehicles/agriculture/tractor-50hp.jpg',
  tractorField: '/assets/vehicles/agriculture/tractor-field.jpg',
  tractorTrailer: '/assets/vehicles/agriculture/tractor-trailer.png',
  harvester: '/assets/vehicles/agriculture/harvester.png',
  harvesterField: '/assets/vehicles/agriculture/harvester-field.jpg',
  drone: '/assets/vehicles/agriculture/drone.png',
  cultivator: '/assets/vehicles/agriculture/cultivator.png',
  plough: '/assets/vehicles/agriculture/disc-plough.jpg',
  discPlough: '/assets/vehicles/agriculture/disc-plough.jpg',
  cultivatorTine: '/assets/vehicles/agriculture/cultivator-tine.jpg',
  landLeveller: '/assets/vehicles/agriculture/land-leveller.jpg',
  seedDrill: '/assets/vehicles/agriculture/seed-drill.jpg',
  paddyTransplanter: '/assets/vehicles/agriculture/paddy-transplanter.jpg',
  powerTiller: '/assets/vehicles/agriculture/power-tiller.jpg',
  boomSprayer: '/assets/vehicles/agriculture/boom-sprayer.jpg',
  fertilizerSpreader: '/assets/vehicles/agriculture/fertilizer-spreader.jpg',
  thresherBaler: '/assets/vehicles/agriculture/thresher-baler.jpg',
  sprinklerIrrigation: '/assets/vehicles/agriculture/sprinkler-irrigation.jpg',
  postHoleDigger: '/assets/vehicles/agriculture/post-hole-digger.jpg',
  waterPump: '/assets/vehicles/agriculture/water-pump.png',
};

export const CONSTRUCTION_VEHICLE_ASSETS = {
  jcbBackhoe: '/assets/vehicles/construction/jcb-backhoe.png',
  excavator: '/assets/vehicles/construction/excavator.png',
  bulldozer: '/assets/vehicles/construction/bulldozer.png',
  wheelLoader: '/assets/vehicles/construction/wheel-loader.png',
  roadRoller: '/assets/vehicles/construction/road-roller.png',
};

export const TRANSPORTATION_VEHICLE_ASSETS = {
  tata6TonTruck: '/assets/vehicles/transportation/tata-6-ton-truck.jpg',
  cargoTruck: '/assets/vehicles/transportation/cargo-truck.png',
  miniTruck: '/assets/vehicles/transportation/mini-truck.png',
  pickup: '/assets/vehicles/transportation/pickup.png',
  waterTanker: '/assets/vehicles/transportation/water-tanker-supply.jpg',
  waterTankerSupply: '/assets/vehicles/transportation/water-tanker-supply.jpg',
  innova: '/assets/vehicles/transportation/innova.jpg',
  suvStudio: '/assets/vehicles/transportation/suv-studio.jpg',
  van: '/assets/vehicles/transportation/van.jpg',
  bus: '/assets/vehicles/transportation/bus.jpg',
  auto: '/assets/vehicles/transportation/auto.jpg',
  bike: '/assets/vehicles/transportation/bike.jpg',
};

export const PROFILE_ASSETS = {
  customerDefault: '/assets/profiles/customer-default.jpg',
  operatorDefault: '/assets/profiles/operator-default.jpg',
  ownerDefault: '/assets/profiles/owner-default.jpg',
};

export const ILLUSTRATION_ASSETS = {
  noBookings: '/assets/illustrations/no-bookings.svg',
  noVehicles: '/assets/illustrations/no-vehicles.svg',
  bookingSuccess: '/assets/illustrations/booking-success.svg',
  paymentSuccess: '/assets/illustrations/payment-success.svg',
  noData: '/assets/illustrations/no-data.svg',
  vehicleVerification: '/assets/illustrations/vehicle-verification.svg',
  promoNearYou: '/assets/illustrations/promo-near-you.png',
  promoSaveTime: '/assets/illustrations/promo-save-time.png',
};

export const AUTH_ASSETS = {
  loginIllustration: '/assets/authentication/login-illustration.jpg',
  registrationIllustration: '/assets/authentication/registration-illustration.jpg',
  forgotPassword: '/assets/authentication/forgot-password.svg',
};

/**
 * Checks if a custom uploaded image URL is valid and not a legacy placeholder or screenshot crop.
 */
function isCustomUploadedImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed.includes('hero_user_banner') ||
    trimmed.includes('trusted_art') ||
    trimmed.includes('ref_crops') ||
    trimmed.includes('placeholder')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  );
}

/**
 * Resolves the exact high-resolution vehicle image for any vehicle or booking object.
 *
 * Priority 1: Use the vehicle's actual custom uploaded image from the database if present.
 * Priority 2: Use the exact model/category-specific high-resolution image from the asset library.
 * Priority 3: Use a neutral high-resolution vehicle image if category is unknown.
 *
 * Never assigns images randomly or by array index, and never mismatches a tractor, JCB, or truck.
 */
export function getVehicleImage(input: {
  name?: string;
  vehicle_name?: string;
  category?: string;
  vehicle_category?: string;
  image_key?: string;
  vehicle_image_key?: string;
  custom_image?: string;
  uploaded_image?: string;
  image_url?: string;
  preferStudio?: boolean;
}): string {
  // Priority 1: Custom owner-uploaded image from database
  const customUrl = input.custom_image || input.uploaded_image || input.image_url;
  if (isCustomUploadedImageUrl(customUrl)) {
    return customUrl!.trim();
  }

  const rawName = String(input.name || input.vehicle_name || '').toLowerCase();
  const rawCat = String(input.category || input.vehicle_category || '').toLowerCase();
  const rawKey = String(input.image_key || input.vehicle_image_key || '').toLowerCase();
  const combined = `${rawName} ${rawCat} ${rawKey}`;

  // Priority 2: Exact model & category matching

  // 1. Agricultural Spraying Drone
  if (combined.includes('drone') || rawKey === 'drone') {
    return AGRICULTURE_VEHICLE_ASSETS.drone;
  }

  // 2. Sowing & Planting Implements
  if (
    combined.includes('paddy rice transplanter') ||
    combined.includes('rice transplanter') ||
    combined.includes('transplanter')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.paddyTransplanter;
  }
  if (
    combined.includes('seed drill') ||
    combined.includes('zero till') ||
    combined.includes('planter') ||
    combined.includes('dibbling')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.seedDrill;
  }

  // 3. Spraying & Fertilizing Implements
  if (
    combined.includes('boom sprayer') ||
    combined.includes('mounted sprayer') ||
    combined.includes('mist blower') ||
    combined.includes('sprayer')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.boomSprayer;
  }
  if (
    combined.includes('fertilizer spreader') ||
    combined.includes('manure spreader') ||
    combined.includes('spreader')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.fertilizerSpreader;
  }

  // 4. Soil Preparation Implements (distinct from Tractors!)
  if (combined.includes('rotavator') || rawKey === 'rotavator') {
    return AGRICULTURE_VEHICLE_ASSETS.cultivator;
  }
  if (
    combined.includes('disc plough') ||
    combined.includes('mouldboard') ||
    combined.includes('plough') ||
    combined.includes('plow') ||
    combined.includes('subsoiler')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.discPlough;
  }
  if (
    combined.includes('cultivator') ||
    combined.includes('harrow') ||
    combined.includes('ridger') ||
    combined.includes('bed maker') ||
    rawKey === 'cultivator'
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.cultivatorTine;
  }
  if (combined.includes('land leveller') || combined.includes('leveller')) {
    return AGRICULTURE_VEHICLE_ASSETS.landLeveller;
  }
  if (combined.includes('power tiller') || combined.includes('power reaper')) {
    return AGRICULTURE_VEHICLE_ASSETS.powerTiller;
  }

  // 5. Harvesting Implements & Machinery
  if (
    combined.includes('thresher') ||
    combined.includes('sheller') ||
    combined.includes('baler') ||
    combined.includes('chaff cutter')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.thresherBaler;
  }
  if (
    combined.includes('harvester') ||
    combined.includes('combine') ||
    combined.includes('reaper') ||
    rawKey === 'harvester'
  ) {
    return input.preferStudio
      ? AGRICULTURE_VEHICLE_ASSETS.harvester
      : AGRICULTURE_VEHICLE_ASSETS.harvesterField;
  }

  // 6. Other Agricultural Implements
  if (
    combined.includes('post hole digger') ||
    combined.includes('brush cutter') ||
    combined.includes('grass cutter') ||
    combined.includes('shredder') ||
    combined.includes('hay rake') ||
    combined.includes('groundnut digger') ||
    combined.includes('sugarcane crusher')
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.postHoleDigger;
  }

  // 7. Hydraulic Tractor Trailer / Trolley
  if (
    combined.includes('trolley') ||
    combined.includes('trailer') ||
    rawKey === 'trolley' ||
    rawKey === 'tractor-trailer'
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.tractorTrailer;
  }

  // 8. Irrigation & Water Supply
  if (combined.includes('sprinkler') || combined.includes('drip irrigation')) {
    return AGRICULTURE_VEHICLE_ASSETS.sprinklerIrrigation;
  }
  if (
    combined.includes('water tanker') ||
    combined.includes('tanker') ||
    rawKey === 'water-tanker' ||
    rawKey === 'water-tanker-supply'
  ) {
    return TRANSPORTATION_VEHICLE_ASSETS.waterTankerSupply;
  }
  if (
    combined.includes('water pump') ||
    combined.includes('diesel pump') ||
    combined.includes('electric pump') ||
    combined.includes('kirloskar') ||
    combined.includes('irrigation') ||
    rawKey === 'pump' ||
    rawKey === 'water-pump'
  ) {
    return AGRICULTURE_VEHICLE_ASSETS.waterPump;
  }

  // 9. Tractors — distinguish 60 HP, 50 HP, Mahindra 575 DI, John Deere 5050D
  if (
    combined.includes('tractor') ||
    combined.includes('john deere') ||
    combined.includes('mahindra') ||
    combined.includes('swaraj') ||
    rawKey === 'tractor' ||
    rawKey === 'tractor-60hp'
  ) {
    if (rawName.includes('mahindra') || rawName.includes('50 hp') || rawKey === 'tractor-50hp') {
      return AGRICULTURE_VEHICLE_ASSETS.tractor50hp;
    }
    if (rawName.includes('60 hp') || rawKey === 'tractor-60hp') {
      return AGRICULTURE_VEHICLE_ASSETS.tractor60hp;
    }
    if (input.preferStudio) {
      return AGRICULTURE_VEHICLE_ASSETS.tractor60hp;
    }
    return AGRICULTURE_VEHICLE_ASSETS.tractorField;
  }

  // 7. Construction & Earthmoving (JCB Backhoe, Excavator, Bulldozer, Loader, Roller)
  if (
    combined.includes('jcb') ||
    combined.includes('backhoe') ||
    combined.includes('3dx') ||
    rawKey === 'jcb' ||
    rawKey === 'jcb-backhoe'
  ) {
    return CONSTRUCTION_VEHICLE_ASSETS.jcbBackhoe;
  }
  if (combined.includes('excavat') || rawKey === 'excavator') {
    return CONSTRUCTION_VEHICLE_ASSETS.excavator;
  }
  if (combined.includes('bulldozer') || rawKey === 'bulldozer') {
    return CONSTRUCTION_VEHICLE_ASSETS.bulldozer;
  }
  if (combined.includes('wheel loader') || combined.includes('loader')) {
    return CONSTRUCTION_VEHICLE_ASSETS.wheelLoader;
  }
  if (combined.includes('roller')) {
    return CONSTRUCTION_VEHICLE_ASSETS.roadRoller;
  }

  // 8. Commercial Trucks & Goods Carriers
  if (
    combined.includes('tata') ||
    combined.includes('6 ton') ||
    combined.includes('truck') ||
    combined.includes('lorry') ||
    combined.includes('cargo') ||
    rawKey === 'truck' ||
    rawKey === 'transport'
  ) {
    if (input.preferStudio) {
      return TRANSPORTATION_VEHICLE_ASSETS.cargoTruck;
    }
    return TRANSPORTATION_VEHICLE_ASSETS.tata6TonTruck;
  }
  if (combined.includes('mini truck') || combined.includes('chota hathi') || combined.includes('ace')) {
    return TRANSPORTATION_VEHICLE_ASSETS.miniTruck;
  }
  if (combined.includes('pickup') || combined.includes('bolero')) {
    return TRANSPORTATION_VEHICLE_ASSETS.pickup;
  }

  // 9. Passenger Vehicles (Vans, Buses, Autos, Bikes, Cars/Innova)
  if (combined.includes('van') || combined.includes('traveller') || combined.includes('tempo') || rawKey === 'van') {
    return TRANSPORTATION_VEHICLE_ASSETS.van;
  }
  if (combined.includes('bus') || combined.includes('coach') || rawKey === 'bus') {
    return TRANSPORTATION_VEHICLE_ASSETS.bus;
  }
  if (combined.includes('auto') || combined.includes('rickshaw') || rawKey === 'auto') {
    return TRANSPORTATION_VEHICLE_ASSETS.auto;
  }
  if (combined.includes('bike') || combined.includes('scooter') || combined.includes('activa') || rawKey === 'bike') {
    return TRANSPORTATION_VEHICLE_ASSETS.bike;
  }
  if (
    combined.includes('innova') ||
    combined.includes('car') ||
    combined.includes('suv') ||
    combined.includes('crysta') ||
    rawKey === 'innova' ||
    rawKey === 'car'
  ) {
    return input.preferStudio
      ? TRANSPORTATION_VEHICLE_ASSETS.suvStudio
      : TRANSPORTATION_VEHICLE_ASSETS.innova;
  }

  // Priority 3: Neutral high-res multi-purpose vehicle fallback
  return AGRICULTURE_VEHICLE_ASSETS.tractorField;
}

