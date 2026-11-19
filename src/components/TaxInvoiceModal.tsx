import React, { useEffect, useState } from 'react';
import { X, Printer, Download, CheckCircle, FileText, Building2 } from 'lucide-react';
import { authApi } from '../services/api';

interface TaxInvoiceModalProps {
  bookingId: number;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ bookingId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getBookingTaxInvoice(bookingId)
      .then((res: any) => {
        setInvoice(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#075B32" />
            <strong style={{ fontSize: '16px', color: '#111827' }}>GST Tax Invoice & Receipt</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading invoice details...
          </div>
        ) : !invoice ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
            Invoice not available yet.
          </div>
        ) : (
          <div style={{ padding: '24px', fontSize: '13.5px', color: '#334155' }}>
            {/* Top Company Info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '18px',
                borderBottom: '2px solid #075B32',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#075B32' }}>
                  Desi Ride
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {invoice.company.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {invoice.company.address}
                </div>
                <div style={{ fontSize: '12px', color: '#075B32', fontWeight: 700, marginTop: '4px' }}>
                  GSTIN: {invoice.gstin}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                  {invoice.invoice_number}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Date: {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '11.5px',
                    fontWeight: 800,
                  }}
                >
                  PAID IN FULL
                </span>
              </div>
            </div>

            {/* Customer & Service Info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                  Billed To
                </span>
                <div style={{ fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                  {invoice.customer.name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569' }}>
                  Mobile: {invoice.customer.mobile || 'Registered Phone'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                  Service Details
                </span>
                <div style={{ fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                  {invoice.service.service_name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569' }}>
                  {invoice.service.pickup} • Duration: {invoice.service.duration}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left', fontSize: '12px', color: '#64748B' }}>
                  <th style={{ padding: '8px 4px' }}>Description (SAC: 996601)</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 4px' }}>
                    <strong>Vehicle & Operator Service</strong>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Booking code: {invoice.service.booking_code}</div>
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700 }}>
                    ₹{invoice.pricing_breakdown.net_service_amount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B' }}>
                  <td style={{ padding: '8px 4px' }}>CGST (2.5%)</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    ₹{invoice.pricing_breakdown.cgst_2_5_pct.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#64748B' }}>
                  <td style={{ padding: '8px 4px' }}>SGST (2.5%)</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    ₹{invoice.pricing_breakdown.sgst_2_5_pct.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 4px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                    Grand Total
                  </td>
                  <td style={{ padding: '12px 4px', textAlign: 'right', fontSize: '17px', fontWeight: 900, color: '#075B32' }}>
                    ₹{invoice.pricing_breakdown.grand_total.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer Note */}
            <div style={{ fontSize: '11.5px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
              This is a computer-generated tax invoice issued by Desi Ride Technologies India Pvt Ltd.<br />
              Need support? Contact support@desiride.in or toll-free +91 98480 22338.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
