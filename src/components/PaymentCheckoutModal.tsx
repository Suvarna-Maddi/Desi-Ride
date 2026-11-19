import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { authApi } from '../services/api';

interface PaymentCheckoutModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  booking,
  onClose,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const amount = Number(booking.total_amount || 1800);
  const gst = Math.round(amount * 0.05);
  const net = amount - gst;

  const handlePayNow = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Create digital order
      const orderRes = await authApi.createPaymentOrder({
        booking_id: booking.id,
        amount,
        notes: `Ride payment for ${booking.service_name}`,
      });

      // 2. Simulate Razorpay/UPI gateway verification
      const verifyRes = await authApi.verifyPayment({
        order_id: orderRes.order_id,
        payment_id: `pay_${Date.now()}`,
        booking_id: booking.id,
        payment_method:
          selectedMethod === 'upi'
            ? 'UPI (PhonePe / Google Pay)'
            : selectedMethod === 'card'
            ? 'Visa / MasterCard Debit'
            : 'Pay on Work Completion (Cash)',
      });

      setPaymentDone(true);
      setInvoiceData(verifyRes);
      onSuccess(verifyRes);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #075B32 0%, #0F766E 100%)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#FFFFFF" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {paymentDone ? 'Payment Successful!' : 'Secure Checkout & Escrow'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', opacity: 0.9 }}>
                Desi Ride Escrow Protection • 100% Secure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '999px',
              padding: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {paymentDone ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: '20px', color: '#111827', fontWeight: 800 }}>
              ₹{amount.toLocaleString('en-IN')} Paid Successfully
            </h4>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B' }}>
              Tax Receipt <strong style={{ color: '#075B32' }}>{invoiceData?.invoice_number}</strong> issued.
              Funds are held in secure escrow and released to fleet owner & operator upon job completion.
            </p>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
                fontSize: '13.5px',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment ID:</span>
                <strong>{invoiceData?.payment_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Service:</span>
                <strong>{booking.service_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Method:</span>
                <strong>{invoiceData?.payment_method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>GST Included (5%):</span>
                <strong>₹{gst}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#075B32',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14.5px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Done & View Active Ride
            </button>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Bill Summary */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748B' }}>Service Cost:</span>
                <strong style={{ fontSize: '14px', color: '#111827' }}>₹{net.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748B' }}>GST Tax (5%):</span>
                <strong style={{ fontSize: '14px', color: '#111827' }}>₹{gst.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #CBD5E1',
                  marginTop: '8px',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Total Payable:</span>
                <strong style={{ fontSize: '18px', fontWeight: 900, color: '#075B32' }}>
                  ₹{amount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Select Payment Method
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  onClick={() => setSelectedMethod('upi')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${selectedMethod === 'upi' ? '#075B32' : '#E2E8F0'}`,
                    backgroundColor: selectedMethod === 'upi' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Smartphone size={20} color="#075B32" />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>Instant UPI (GPay / PhonePe / Paytm)</strong>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Zero transaction fee • Auto instant receipt</div>
                    </div>
                  </div>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #075B32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMethod === 'upi' && <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#075B32' }} />}
                  </span>
                </div>

                <div
                  onClick={() => setSelectedMethod('card')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${selectedMethod === 'card' ? '#075B32' : '#E2E8F0'}`,
                    backgroundColor: selectedMethod === 'card' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CreditCard size={20} color="#0369A1" />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>Credit / Debit Card</strong>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Visa, MasterCard, RuPay</div>
                    </div>
                  </div>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #075B32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMethod === 'card' && <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#075B32' }} />}
                  </span>
                </div>

                <div
                  onClick={() => setSelectedMethod('cash')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${selectedMethod === 'cash' ? '#075B32' : '#E2E8F0'}`,
                    backgroundColor: selectedMethod === 'cash' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Banknote size={20} color="#D97706" />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>Pay on Work Completion</strong>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Pay cash directly to verified operator</div>
                    </div>
                  </div>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #075B32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMethod === 'cash' && <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#075B32' }} />}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  color: '#B91C1C',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handlePayNow}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#075B32',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(7, 91, 50, 0.25)',
              }}
            >
              {isProcessing ? 'Processing Secure Payment...' : `Pay ₹${amount.toLocaleString('en-IN')} Now`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
