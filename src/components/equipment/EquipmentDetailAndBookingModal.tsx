import React, { useState, useMemo } from 'react';
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Tractor,
  UserCheck,
  Calendar,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import {
  EquipmentListing,
  TractorOption,
  PricingOption,
  isTractorCompatibleWithEquipment,
} from '../../types/equipment';
import { getVehicleImage } from '../../utils/assetLibrary';

interface EquipmentDetailAndBookingModalProps {
  equipment: EquipmentListing;
  compatibleTractors: TractorOption[];
  defaultLocation: string;
  onClose: () => void;
  onConfirmBooking: (payload: any) => Promise<void>;
  onAddToBookingCart?: (equipment: EquipmentListing) => void;
  onContactOwner?: (equipment: EquipmentListing) => void;
}

export const EquipmentDetailAndBookingModal: React.FC<
  EquipmentDetailAndBookingModalProps
> = ({
  equipment,
  compatibleTractors,
  defaultLocation,
  onClose,
  onConfirmBooking,
  onAddToBookingCart,
  onContactOwner,
}) => {
  const galleryImages =
    equipment.gallery && equipment.gallery.length > 0
      ? equipment.gallery
      : [
          equipment.image ||
            getVehicleImage({
              name: equipment.name,
              category: equipment.equipment_type,
            }),
        ];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [bookingMode, setBookingMode] = useState<
    'equipment_only' | 'tractor_plus_equipment'
  >(
    equipment.standalone_available
      ? 'equipment_only'
      : 'tractor_plus_equipment'
  );

  const [selectedTractorId, setSelectedTractorId] = useState<number | null>(() => {
    const firstValid = compatibleTractors.find(
      (t) => isTractorCompatibleWithEquipment(t, equipment).compatible
    );
    return firstValid ? firstValid.id : null;
  });

  const pricingOptions: PricingOption[] =
    equipment.pricing_options && equipment.pricing_options.length > 0
      ? equipment.pricing_options
      : [
          {
            unit: equipment.default_price_unit || 'hour',
            price: equipment.default_price || 350,
            label: `/ ${equipment.default_price_unit || 'hour'}`,
          },
        ];

  const [selectedPricing, setSelectedPricing] = useState<PricingOption>(
    pricingOptions[0]
  );
  const [quantity, setQuantity] = useState<number>(
    selectedPricing.unit === 'hour' ? 4 : selectedPricing.unit === 'acre' ? 3 : 1
  );
  const [selectedOperation, setSelectedOperation] = useState<string>(
    equipment.suitable_operations?.[0] || equipment.equipment_type
  );
  const [bookingDate, setBookingDate] = useState<string>('20 November 2026');
  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [serviceLocation, setServiceLocation] = useState<string>(
    defaultLocation || equipment.city || 'Gadwal, Telangana'
  );
  const [requiresOperator, setRequiresOperator] = useState<boolean>(
    equipment.operator_available
  );
  const [jobInstructions, setJobInstructions] = useState<string>('');
  const [showContactCard, setShowContactCard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedTractor = useMemo(
    () => compatibleTractors.find((t) => t.id === selectedTractorId) || null,
    [compatibleTractors, selectedTractorId]
  );

  const calculatedBreakdown = useMemo(() => {
    const qty = Math.max(1, Number(quantity) || 1);
    const equipmentCost =
      selectedPricing.unit === 'fixed'
        ? selectedPricing.price
        : selectedPricing.price * qty;

    let tractorCost = 0;
    if (bookingMode === 'tractor_plus_equipment' && selectedTractor) {
      const hoursEquiv =
        selectedPricing.unit === 'hour'
          ? qty
          : selectedPricing.unit === 'acre'
          ? qty * 1.5
          : selectedPricing.unit === 'day'
          ? qty * 8
          : 4;
      tractorCost = Math.round(selectedTractor.hourly_rate * hoursEquiv);
    }

    let operatorCost = 0;
    if (requiresOperator && equipment.operator_rate_per_hour) {
      const hoursEquiv =
        selectedPricing.unit === 'hour'
          ? qty
          : selectedPricing.unit === 'day'
          ? qty * 8
          : qty;
      operatorCost = Math.round(equipment.operator_rate_per_hour * hoursEquiv);
    }

    return {
      equipmentCost,
      tractorCost,
      operatorCost,
      total: equipmentCost + tractorCost + operatorCost,
    };
  }, [
    quantity,
    selectedPricing,
    bookingMode,
    selectedTractor,
    requiresOperator,
    equipment.operator_rate_per_hour,
  ]);

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      bookingMode === 'tractor_plus_equipment' &&
      equipment.combo_available &&
      !selectedTractor
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const endHourLabel =
        selectedPricing.unit === 'hour'
          ? `${quantity} hours`
          : selectedPricing.unit === 'acre'
          ? `${quantity} acres`
          : selectedPricing.unit === 'day'
          ? `${quantity} day(s)`
          : `${quantity} ${selectedPricing.unit}`;

      await onConfirmBooking({
        booking_mode: bookingMode,
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        equipment_type: equipment.equipment_type,
        tractor_id:
          bookingMode === 'tractor_plus_equipment' ? selectedTractor?.id : null,
        tractor_name:
          bookingMode === 'tractor_plus_equipment'
            ? selectedTractor?.name
            : null,
        vehicle_name:
          bookingMode === 'tractor_plus_equipment' && selectedTractor
            ? `${equipment.name} + ${selectedTractor.name}`
            : equipment.name,
        vehicle_image: galleryImages[0],
        work_category: selectedOperation,
        pickup_location: serviceLocation,
        destination: serviceLocation,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: '01:00 PM',
        duration: endHourLabel,
        pricing_unit: selectedPricing.unit,
        quantity,
        requires_operator: requiresOperator,
        equipment_requirements: `${equipment.attachment_type}${
          equipment.required_hp_min > 0
            ? ` • Min ${equipment.required_hp_min} HP Tractor`
            : ''
        }`,
        job_instructions:
          jobInstructions.trim() ||
          `${selectedOperation} (${endHourLabel}) at ${serviceLocation}`,
        total_amount: calculatedBreakdown.total,
        price_estimate: `₹ ${calculatedBreakdown.total.toLocaleString('en-IN')}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="owner-modal-backdrop"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="owner-dialog-sheet"
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="owner-dialog-header"
          style={{
            borderBottom: '1px solid #E5E7EB',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#075B32',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                {equipment.sub_category_group}
              </span>
              {equipment.is_verified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={13} /> Verified Equipment
                </span>
              )}
            </div>
            <h3 style={{ marginTop: '6px', fontSize: '21px', color: '#0F172A' }}>
              {equipment.name}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569' }}>
              {equipment.brand} • {equipment.model} • Condition:{' '}
              <strong>{equipment.condition}</strong>
            </p>
          </div>
          <button
            type="button"
            className="owner-icon-close-btn"
            onClick={onClose}
            aria-label="Close equipment details"
          >
            <X size={20} color="#111827" />
          </button>
        </div>

        {/* Image Gallery + Key Specs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
            marginBottom: '18px',
          }}
        >
          <div>
            <img
              src={galleryImages[activeImgIdx]}
              alt={equipment.name}
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            />
            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImgIdx(i)}
                    style={{
                      padding: 0,
                      border:
                        activeImgIdx === i
                          ? '2px solid #087A43'
                          : '1px solid #CBD5E1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: '54px', height: '40px', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F0FDF4',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                  Starting Rental Price
                </div>
                <strong style={{ fontSize: '20px', color: '#075B32' }}>
                  ₹ {equipment.default_price.toLocaleString('en-IN')}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    / {equipment.default_price_unit}
                  </span>
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                  }}
                >
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <span>{equipment.rating}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569' }}>
                  {equipment.bookings_count} bookings
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#334155',
                lineHeight: 1.5,
                background: '#F8FAFC',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <strong>Owner:</strong> {equipment.owner_name}
              </div>
              <div>
                <strong>Attachment:</strong> {equipment.attachment_type}
              </div>
              {equipment.required_hp_min > 0 && (
                <div>
                  <strong>Required Tractor HP:</strong>{' '}
                  {equipment.required_hp_min} – {equipment.required_hp_max || 75} HP
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <MapPin size={13} color="#087A43" />
                <span>
                  Service Area: {(equipment.service_locations || [equipment.city]).join(', ')}
                </span>
              </div>
            </div>

            {/* Technical Specifications */}
            {equipment.specifications &&
              Object.keys(equipment.specifications).length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                  }}
                >
                  {Object.entries(equipment.specifications).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '6px 9px',
                        fontSize: '11.5px',
                      }}
                    >
                      <div style={{ color: '#64748B' }}>{k}</div>
                      <strong style={{ color: '#0F172A' }}>{v}</strong>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Action Strip: Add to Booking / Contact Owner */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {onAddToBookingCart && (
            <button
              type="button"
              onClick={() => onAddToBookingCart(equipment)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #087A43',
                background: '#FFFFFF',
                color: '#087A43',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={15} />
              <span>Add to Booking</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowContactCard((p) => !p);
              if (onContactOwner) onContactOwner(equipment);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #D97706',
              background: '#FFFBEB',
              color: '#92400E',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Phone size={15} />
            <span>Contact Owner</span>
          </button>
        </div>

        {showContactCard && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#78350F',
            }}
          >
            <strong>{equipment.owner_name}</strong> • Verified Owner Phone:{' '}
            <strong>+91 {equipment.owner_phone || '9000000002'}</strong> • Hub:{' '}
            {equipment.city}
          </div>
        )}

        {/* Booking Form: Standalone vs Tractor + Equipment */}
        <form onSubmit={handleBookNow}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '14px',
            }}
          >
            <label
              className="owner-modal-label"
              style={{ marginBottom: '8px', display: 'block' }}
            >
              1. Select Booking Option
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}
            >
              {equipment.standalone_available && (
                <button
                  type="button"
                  onClick={() => setBookingMode('equipment_only')}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '12px',
                    border:
                      bookingMode === 'equipment_only'
                        ? '2px solid #087A43'
                        : '1px solid #CBD5E1',
                    background:
                      bookingMode === 'equipment_only' ? '#ECFDF5' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                      color: '#075B32',
                      fontSize: '13.5px',
                    }}
                  >
                    <Wrench size={15} />
                    <span>Option 1: Book Equipment Only</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#475569' }}>
                    {equipment.required_hp_min > 0
                      ? `For farmers who already own a ${equipment.required_hp_min}+ HP tractor.`
                      : 'Standalone self-propelled / portable machine rental.'}
                  </p>
                </button>
              )}

              {equipment.combo_available && (
                <button
                  type="button"
                  onClick={() => setBookingMode('tractor_plus_equipment')}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '12px',
                    border:
                      bookingMode === 'tractor_plus_equipment'
                        ? '2px solid #087A43'
                        : '1px solid #CBD5E1',
                    background:
                      bookingMode === 'tractor_plus_equipment'
                        ? '#ECFDF5'
                        : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                      color: '#075B32',
                      fontSize: '13.5px',
                    }}
                  >
                    <Tractor size={15} />
                    <span>Option 2: Book Tractor + Equipment</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#475569' }}>
                    Complete package with a compatible tractor &amp; operator.
                  </p>
                </button>
              )}
            </div>

            {/* Compatible Tractor Selection for Option 2 */}
            {bookingMode === 'tractor_plus_equipment' && equipment.combo_available && (
              <div style={{ marginTop: '12px' }}>
                <label className="owner-modal-label">
                  Select Compatible Tractor (Filtered by {equipment.required_hp_min}+ HP Requirement)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compatibleTractors.map((tr) => {
                    const check = isTractorCompatibleWithEquipment(tr, equipment);
                    const isSelected = selectedTractorId === tr.id;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        disabled={!check.compatible}
                        onClick={() => setSelectedTractorId(tr.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid #087A43'
                            : '1px solid #CBD5E1',
                          background: !check.compatible
                            ? '#FEF2F2'
                            : isSelected
                            ? '#FFFFFF'
                            : '#FFFFFF',
                          opacity: check.compatible ? 1 : 0.68,
                          cursor: check.compatible ? 'pointer' : 'not-allowed',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={tr.image}
                            alt={tr.name}
                            style={{
                              width: '48px',
                              height: '36px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                            }}
                          />
                          <div>
                            <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                              {tr.name}
                            </strong>
                            <div style={{ fontSize: '11.5px', color: '#475569' }}>
                              {check.compatible ? (
                                <span style={{ color: '#087A43', fontWeight: 600 }}>
                                  ✓ Compatible ({tr.hp} HP) • {tr.location}
                                </span>
                              ) : (
                                <span style={{ color: '#DC2626', fontWeight: 600 }}>
                                  <AlertTriangle size={11} style={{ verticalAlign: 'middle' }} />{' '}
                                  {check.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <strong style={{ fontSize: '13px', color: '#075B32' }}>
                          +₹{tr.hourly_rate}/hr
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Model, Operation, Schedule & Location */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label className="owner-modal-label">Farming Operation</label>
              <select
                className="owner-modal-input"
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
              >
                {(equipment.suitable_operations?.length
                  ? equipment.suitable_operations
                  : [equipment.equipment_type]
                ).map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="owner-modal-label">Pricing Model</label>
              <select
                className="owner-modal-input"
                value={selectedPricing.unit}
                onChange={(e) => {
                  const found = pricingOptions.find(
                    (p) => p.unit === e.target.value
                  );
                  if (found) setSelectedPricing(found);
                }}
              >
                {pricingOptions.map((opt) => (
                  <option key={opt.unit} value={opt.unit}>
                    ₹{opt.price} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="owner-modal-label">
                {selectedPricing.unit === 'acre'
                  ? 'Area (Acres)'
                  : selectedPricing.unit === 'hour'
                  ? 'Duration (Hours)'
                  : selectedPricing.unit === 'day'
                  ? 'Duration (Days)'
                  : 'Quantity / Trips'}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                className="owner-modal-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>

            <div>
              <label className="owner-modal-label">
                <Calendar size={12} /> Booking Date
              </label>
              <input
                type="text"
                className="owner-modal-input"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="owner-modal-label">
                <Clock size={12} /> Start Time
              </label>
              <select
                className="owner-modal-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="07:00 AM">07:00 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>

            <div>
              <label className="owner-modal-label">Service Location</label>
              <input
                type="text"
                className="owner-modal-input"
                value={serviceLocation}
                onChange={(e) => setServiceLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '12px',
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0F172A',
                cursor: equipment.operator_available ? 'pointer' : 'not-allowed',
              }}
            >
              <input
                type="checkbox"
                checked={requiresOperator}
                disabled={!equipment.operator_available}
                onChange={(e) => setRequiresOperator(e.target.checked)}
              />
              <UserCheck size={15} color="#087A43" />
              <span>
                {equipment.operator_available
                  ? `Include Certified Operator${
                      equipment.operator_rate_per_hour
                        ? ` (+₹${equipment.operator_rate_per_hour}/hr)`
                        : ' (Included)'
                    }`
                  : 'Operator Not Required / Self-Operated'}
              </span>
            </label>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="owner-modal-label">
              Field / Job Instructions (Optional)
            </label>
            <input
              type="text"
              className="owner-modal-input"
              placeholder="e.g., Black cotton soil, 2 passes needed near canal road..."
              value={jobInstructions}
              onChange={(e) => setJobInstructions(e.target.value)}
            />
          </div>

          {/* Live Price Breakdown */}
          <div
            style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', color: '#065F46' }}>
              <div>
                Equipment ({quantity} × ₹{selectedPricing.price}):{' '}
                <strong>₹{calculatedBreakdown.equipmentCost.toLocaleString('en-IN')}</strong>
              </div>
              {calculatedBreakdown.tractorCost > 0 && (
                <div>
                  Compatible Tractor ({selectedTractor?.name}):{' '}
                  <strong>₹{calculatedBreakdown.tractorCost.toLocaleString('en-IN')}</strong>
                </div>
              )}
              {calculatedBreakdown.operatorCost > 0 && (
                <div>
                  Operator Charge:{' '}
                  <strong>₹{calculatedBreakdown.operatorCost.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: '#065F46', fontWeight: 700 }}>
                Total Estimated Amount
              </div>
              <strong style={{ fontSize: '22px', color: '#075B32' }}>
                ₹ {calculatedBreakdown.total.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="owner-dialog-actions">
            <button
              type="button"
              className="owner-dialog-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="owner-dialog-primary-btn"
              disabled={isSubmitting}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Confirming Booking...' : 'Book Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

