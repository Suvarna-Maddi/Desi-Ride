/**
 * Desi Ride Dynamic Surge Pricing & Revenue Share Engine
 * Implements real-world demand/supply surge balancing, transparent itemized billing,
 * multi-unit pricing (Per Km, Per Hour, Per Acre), and platform escrow split.
 */

import { db } from './db.mjs';

export function getDynamicSurgeMultiplier(city = 'Gadwal') {
  try {
    const supplyRow = db
      .prepare(
        `SELECT COUNT(*) as c
         FROM operator_profiles op
         JOIN users u ON u.id = op.user_id
         WHERE COALESCE(op.on_duty, 1) = 1`
      )
      .get();
    const supplyCount = supplyRow?.c || 1;

    const demandRow = db
      .prepare(
        `SELECT COUNT(*) as c
         FROM bookings
         WHERE status IN ('Pending', 'Confirmed', 'Accepted')
           AND job_stage NOT IN ('Completed', 'Cancelled')`
      )
      .get();
    const demandCount = demandRow?.c || 0;

    // Surge formula: 1.0 + (demand - supply) / (supply + 1) * 0.4
    // Clamped between 1.0x (normal) and 2.2x (high surge)
    let surge = 1.0;
    if (demandCount > supplyCount) {
      const ratio = (demandCount - supplyCount) / (supplyCount + 1);
      surge = 1.0 + Math.min(1.2, ratio * 0.35);
    }

    const roundedSurge = Number(surge.toFixed(2));
    let surgeLabel = 'Normal (1.0x)';
    if (roundedSurge >= 1.4) surgeLabel = `High Demand (${roundedSurge}x Surge)`;
    else if (roundedSurge > 1.05) surgeLabel = `Moderate Demand (${roundedSurge}x Surge)`;

    return {
      multiplier: roundedSurge,
      label: surgeLabel,
      demand_count: demandCount,
      supply_count: supplyCount,
    };
  } catch {
    return {
      multiplier: 1.0,
      label: 'Normal (1.0x)',
      demand_count: 1,
      supply_count: 1,
    };
  }
}

/**
 * Calculates itemized fare breakdown for any Desi Ride booking
 */
export function calculateFareEstimate({
  baseRate = 600,
  rateUnit = 'Per Hour', // 'Per Hour' | 'Per Km' | 'Per Acre'
  quantity = 4, // hours, km, or acres
  needOperator = true,
  hasAttachedEquipment = false,
  attachedEquipmentName = '',
  city = 'Gadwal',
}) {
  const surgeInfo = getDynamicSurgeMultiplier(city);
  const surgeMultiplier = surgeInfo.multiplier;

  // Base trip service fee
  const baseBookingFee = 150;

  // Usage fee
  const usageCost = Math.round(baseRate * Math.max(1, quantity));

  // Attached equipment fee (e.g. rotavator / cultivator attachment surcharge)
  const equipmentAttachmentFee = hasAttachedEquipment ? 350 : 0;

  // Dedicated licensed operator charge
  const operatorWage = needOperator ? Math.round(250 * Math.max(1, Math.min(8, quantity))) : 0;

  // Subtotal before surge
  const subtotalBeforeSurge = baseBookingFee + usageCost + equipmentAttachmentFee + operatorWage;

  // Surge surcharge
  const surgeSurcharge = Math.round(subtotalBeforeSurge * (surgeMultiplier - 1.0));

  // Gross total before tax
  const grossTotal = subtotalBeforeSurge + surgeSurcharge;

  // 5% GST
  const gstAmount = Math.round(grossTotal * 0.05);

  // Final Customer Payable
  const finalTotal = grossTotal + gstAmount;

  // Platform Commission & Escrow Split
  const platformFee = Math.round(grossTotal * 0.10); // 10% platform take
  const operatorShare = needOperator ? Math.round(grossTotal * 0.20) : 0; // 20% operator take
  const ownerShare = grossTotal - platformFee - operatorShare; // ~70% fleet owner

  return {
    pricing_model: rateUnit,
    quantity,
    base_rate: baseRate,
    base_booking_fee: baseBookingFee,
    usage_cost: usageCost,
    equipment_attachment_fee: equipmentAttachmentFee,
    attached_equipment_name: attachedEquipmentName,
    operator_wage: operatorWage,
    need_operator: needOperator,
    surge_multiplier: surgeMultiplier,
    surge_label: surgeInfo.label,
    surge_surcharge: surgeSurcharge,
    subtotal: grossTotal,
    gst_percentage: 5,
    gst_amount: gstAmount,
    total_amount: finalTotal,
    currency: 'INR',
    currency_symbol: '₹',
    escrow_split: {
      platform_fee: platformFee,
      owner_share: ownerShare,
      operator_share: operatorShare,
      tax_reserve: gstAmount,
    },
  };
}
