import React, { useState } from 'react';
import {
  ArrowRight,
  User as UserIcon,
  Calendar,
  MapPin,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getVehicleImageByKey } from './MyVehicles';

export interface OwnerBookingRequestItem {
  id: number;
  vehicle_name: string;
  image_key?: string;
  status: 'New' | 'Accepted' | 'Rejected';
  customer_name: string;
  booking_date: string;
  time_slot: string;
  route: string;
  amount_display: string;
  amount_value: number;
  duration: string;
  rejection_reason?: string;
}

export interface BookingRequestsProps {
  requests: OwnerBookingRequestItem[];
  onAcceptBooking: (booking: OwnerBookingRequestItem) => Promise<void>;
  onRejectBooking: (
    booking: OwnerBookingRequestItem,
    reason: string
  ) => Promise<void>;
  onViewAll?: () => void;
}

export const BookingRequests: React.FC<BookingRequestsProps> = ({
  requests,
  onAcceptBooking,
  onRejectBooking,
  onViewAll,
}) => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialogTarget, setRejectDialogTarget] =
    useState<OwnerBookingRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Vehicle already scheduled for another trip'
  );

  const handleAcceptClick = async (booking: OwnerBookingRequestItem) => {
    setProcessingId(booking.id);
    try {
      await onAcceptBooking(booking);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectDialogTarget) return;
    const target = rejectDialogTarget;
    setProcessingId(target.id);
    setRejectDialogTarget(null);
    try {
      await onRejectBooking(target, rejectReason);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section
      className="owner-booking-requests-section"
      aria-label="Recent Booking Requests"
    >
      <div className="owner-section-header">
        <h2 className="owner-section-title">Recent Booking Requests</h2>
        <button
          type="button"
          className="owner-view-all-link"
          onClick={onViewAll}
        >
          <span>View All</span>
          <ArrowRight size={15} strokeWidth={2.4} />
        </button>
      </div>

      <div className="owner-booking-requests-list">
        {requests.map((req) => {
          const thumbImg = getVehicleImageByKey(
            req.image_key,
            req.vehicle_name,
            req.vehicle_name
          );
          const isBusy = processingId === req.id;

          return (
            <div key={req.id} className="owner-booking-req-card">
              {/* Left: Vehicle Thumbnail */}
              <div className="owner-req-thumb-box">
                <img
                  src={thumbImg}
                  alt={req.vehicle_name}
                  className="owner-req-thumb-img"
                />
              </div>

              {/* Center-Left: Vehicle, Customer, Date, Time & Route */}
              <div className="owner-req-main-info">
                <div className="owner-req-title-row">
                  <h3 className="owner-req-vehicle-name">{req.vehicle_name}</h3>
                  <span
                    className={`owner-req-status-badge status-${req.status.toLowerCase()}`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="owner-req-customer-row">
                  <UserIcon size={13} color="#667085" />
                  <span>{req.customer_name}</span>
                </div>

                <div className="owner-req-schedule-route-row">
                  <span className="owner-req-meta-chip">
                    <Calendar size={12} color="#667085" />
                    <span>{req.booking_date}</span>
                  </span>

                  <span className="owner-req-time-text">{req.time_slot}</span>

                  <span className="owner-req-route-chip">
                    <MapPin size={12} color="#087A43" fill="#087A43" />
                    <span>{req.route}</span>
                  </span>
                </div>
              </div>

              {/* Center-Right: Amount & Duration */}
              <div className="owner-req-price-col">
                <strong className="owner-req-amount">{req.amount_display}</strong>
                <span className="owner-req-duration">{req.duration}</span>
              </div>

              {/* Right: Accept & Reject Buttons */}
              <div className="owner-req-actions-col">
                {req.status === 'New' ? (
                  <>
                    <button
                      type="button"
                      className="owner-req-accept-btn"
                      disabled={isBusy}
                      onClick={() => handleAcceptClick(req)}
                    >
                      {isBusy ? 'Saving...' : 'Accept'}
                    </button>

                    <button
                      type="button"
                      className="owner-req-reject-btn"
                      disabled={isBusy}
                      onClick={() => setRejectDialogTarget(req)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span
                    className={`owner-req-final-pill ${
                      req.status === 'Accepted'
                        ? 'final-accepted'
                        : 'final-rejected'
                    }`}
                  >
                    {req.status === 'Accepted' ? 'Accepted ✓' : 'Rejected'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Confirmation Dialog */}
      {rejectDialogTarget && (
        <div
          className="owner-modal-backdrop"
          onClick={() => setRejectDialogTarget(null)}
        >
          <div
            className="owner-dialog-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3>Reject Booking Request?</h3>
              </div>
              <button
                type="button"
                className="owner-icon-close-btn"
                onClick={() => setRejectDialogTarget(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="owner-dialog-desc">
              Are you sure you want to reject the booking request from{' '}
              <strong>{rejectDialogTarget.customer_name}</strong> for{' '}
              <strong>{rejectDialogTarget.vehicle_name}</strong> (
              {rejectDialogTarget.route} on {rejectDialogTarget.booking_date})?
            </p>

            <label className="owner-modal-label">
              Reason for Rejection (Sent to Customer)
            </label>
            <select
              className="owner-modal-input"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            >
              <option value="Vehicle already scheduled for another trip">
                Vehicle already scheduled for another trip
              </option>
              <option value="Operator unavailable during requested hours">
                Operator unavailable during requested hours
              </option>
              <option value="Vehicle undergoing routine maintenance">
                Vehicle undergoing routine maintenance
              </option>
              <option value="Out of operating route zone">
                Out of operating route zone
              </option>
            </select>

            <div className="owner-dialog-actions">
              <button
                type="button"
                className="owner-dialog-cancel-btn"
                onClick={() => setRejectDialogTarget(null)}
              >
                Keep Request
              </button>
              <button
                type="button"
                className="owner-dialog-confirm-reject-btn"
                onClick={handleConfirmReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

