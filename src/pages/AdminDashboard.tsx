import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Users,
  Truck,
  Calendar,
  CreditCard,
  Layers,
  AlertTriangle,
  BarChart3,
  Settings,
  CheckCircle2,
  LogOut,
  Wrench,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { HomeHeader } from '../components/HomeHeader';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { getVehicleImage, PROFILE_ASSETS } from '../utils/assetLibrary';

type AdminTab =
  | 'Dashboard'
  | 'Users'
  | 'Customers'
  | 'Owners'
  | 'Operators'
  | 'Vehicles'
  | 'Equipment'
  | 'Bookings'
  | 'Payments'
  | 'Categories'
  | 'Complaints'
  | 'Reports'
  | 'AuditLogs'
  | 'Settings';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const [currentLocation, setCurrentLocation] = useState('Gadwal, Telangana');
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryGroup, setNewCategoryGroup] = useState('Soil Preparation');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [commPlatformPct, setCommPlatformPct] = useState('10');
  const [commOperatorPct, setCommOperatorPct] = useState('20');
  const [commGstPct, setCommGstPct] = useState('5');
  const [commCancelPct, setCommCancelPct] = useState('10');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((p) => (p === msg ? null : p)), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await authApi.getAdminDashboard();
      setData(res);
      if (res?.commission_config) {
        setCommPlatformPct(String(res.commission_config.platform_commission_pct ?? 10));
        setCommOperatorPct(String(res.commission_config.operator_share_pct ?? 20));
        setCommGstPct(String(res.commission_config.gst_pct ?? 5));
        setCommCancelPct(String(res.commission_config.cancellation_fee_pct ?? 10));
      }
    } catch (err: any) {
      showToast(err.message || 'Could not load admin dashboard');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeSync({
    onEvent: () => {
      loadData();
    },
  });

  const usersList = data?.users || [];
  const vehiclesList = data?.vehicles || [];
  const bookingsList = data?.bookings || [];
  const equipmentListings = data?.equipment_listings || [];
  const equipmentCategories = data?.equipment_categories || [];
  const categoryAnalytics = data?.category_analytics || [];
  const auditLogs = data?.audit_logs || [];
  const searchLower = adminSearchQuery.trim().toLowerCase();
  const matchesQuery = (text: string) =>
    !searchLower || text.toLowerCase().includes(searchLower);
  const categoriesList = data?.categories || [
    'Cars & SUVs',
    'Bikes & Scooters',
    'Auto Rickshaws',
    'Vans & Tempo',
    'Buses',
    'Trucks & Lorries',
    'JCB & Excavators',
    'Tractors',
  ];

  const handleAdminEquipmentAction = async (payload: any, successMsg: string) => {
    try {
      await authApi.adminManageEquipment(payload);
      await loadData();
      showToast(successMsg);
    } catch (err: any) {
      showToast(err?.message || 'Admin action failed.');
    }
  };

  const customers = usersList.filter((u: any) => u.role === 'customer');
  const owners = usersList.filter((u: any) => u.role === 'owner');
  const operators = usersList.filter((u: any) => u.role === 'operator');

  return (
    <div className="app-layout-root">
      <HomeHeader
        currentLocation={currentLocation}
        onSelectLocation={setCurrentLocation}
        activeSection={activeTab}
        onNavigateTab={(tab) => {
          if (
            tab === 'Dashboard' ||
            tab === 'Users' ||
            tab === 'Vehicles' ||
            tab === 'Bookings' ||
            tab === 'Reports'
          ) {
            setActiveTab(tab as AdminTab);
          }
        }}
      />

      <main className="app-main-content">
        <div className="dashboard-hero-bar">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <span className="dashboard-role-pill" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                PRIVATE ADMIN CONTROL CENTER
              </span>
              <h1 className="dashboard-welcome-title">
                Desi Ride Platform Administration ({user?.full_name})
              </h1>
              <p className="dashboard-welcome-subtitle">
                Manage Users, Owners, Operators, Vehicles, Agricultural Equipment, Bookings, Commissions & Audit Logs.
              </p>
            </div>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search users, vehicles, equipment, bookings..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              aria-label="Search platform records"
            />
          </div>

          <div className="dashboard-tabs-row admin-mobile-tabs">
            {[
              { id: 'Dashboard', label: 'Overview', icon: Shield },
              { id: 'Users', label: `All Users (${usersList.length})`, icon: Users },
              { id: 'Customers', label: `Customers (${customers.length})`, icon: Users },
              { id: 'Owners', label: `Owners (${owners.length})`, icon: Truck },
              { id: 'Operators', label: `Operators (${operators.length})`, icon: Users },
              { id: 'Vehicles', label: `Vehicles (${vehiclesList.length})`, icon: Truck },
              { id: 'Equipment', label: `Equipment (${equipmentListings.length})`, icon: Wrench },
              { id: 'Bookings', label: `Bookings (${bookingsList.length})`, icon: Calendar },
              { id: 'Payments', label: 'Payments', icon: CreditCard },
              { id: 'Categories', label: 'Categories', icon: Layers },
              { id: 'Reports', label: 'Reports', icon: BarChart3 },
              { id: 'AuditLogs', label: `Audit Logs (${auditLogs.length})`, icon: Shield },
              { id: 'Settings', label: 'Settings', icon: Settings },
            ].map((t) => {
              const IconComp = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`dashboard-tab-pill ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => handleSelectTab(t.id as AdminTab)}
                >
                  <IconComp size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-control-shell">
          <aside className="admin-sidebar" aria-label="Admin Navigation">
            <div className="admin-sidebar-label">Control Center</div>
            {[
              { id: 'Dashboard', label: 'Overview', icon: Shield },
              { id: 'Users', label: `All Users (${usersList.length})`, icon: Users },
              { id: 'Customers', label: `Customers (${customers.length})`, icon: Users },
              { id: 'Owners', label: `Owners (${owners.length})`, icon: Truck },
              { id: 'Operators', label: `Operators (${operators.length})`, icon: Users },
              { id: 'Vehicles', label: `Vehicles (${vehiclesList.length})`, icon: Truck },
              { id: 'Equipment', label: `Equipment (${equipmentListings.length})`, icon: Wrench },
              { id: 'Bookings', label: `Bookings (${bookingsList.length})`, icon: Calendar },
              { id: 'Payments', label: 'Payments', icon: CreditCard },
              { id: 'Categories', label: 'Categories', icon: Layers },
              { id: 'Complaints', label: 'Complaints', icon: AlertTriangle },
              { id: 'Reports', label: 'Reports & Analytics', icon: BarChart3 },
              { id: 'AuditLogs', label: `Audit Logs (${auditLogs.length})`, icon: Shield },
              { id: 'Settings', label: 'Commission & Settings', icon: Settings },
            ].map((t) => {
              const IconComp = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`admin-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => handleSelectTab(t.id as AdminTab)}
                >
                  <IconComp size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                className="admin-nav-btn"
                style={{ color: '#DC2626' }}
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          <div ref={workspaceRef} className="admin-main-workspace">

        {/* Admin Summary Cards (Overview) */}
        {activeTab === 'Dashboard' && (
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="stat-label">Total Registered Users</span>
            <strong className="stat-value">{usersList.length}</strong>
            <span className="stat-sub">
              {customers.length} Customers • {owners.length} Owners • {operators.length} Operators
            </span>
          </div>
          <div className="dashboard-stat-card">
            <span className="stat-label">Verified Vehicle Listings</span>
            <strong className="stat-value">{vehiclesList.length}</strong>
            <span className="stat-sub">Across 8 mobility categories</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="stat-label">Total Bookings</span>
            <strong className="stat-value">{bookingsList.length}</strong>
            <span className="stat-sub">Live regional & farm dispatches</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="stat-label">Platform Gross Volume</span>
            <strong className="stat-value" style={{ color: '#08783F' }}>
              {data?.total_revenue || '₹ 4,82,900'}
            </strong>
            <span className="stat-sub">100% Settled & Audited</span>
          </div>
        </div>
        )}

        {(activeTab === 'Dashboard' ||
          activeTab === 'Users' ||
          activeTab === 'Customers' ||
          activeTab === 'Owners' ||
          activeTab === 'Operators') && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>
                {activeTab === 'Customers'
                  ? 'Registered Customers'
                  : activeTab === 'Owners'
                  ? 'Registered Vehicle Owners'
                  : activeTab === 'Operators'
                  ? 'Licensed Operators & Drivers'
                  : 'All Registered Platform Users'}
              </h2>
            </div>

            <div className="dashboard-list-grid">
              {(activeTab === 'Customers'
                ? customers
                : activeTab === 'Owners'
                ? owners
                : activeTab === 'Operators'
                ? operators
                : usersList
              )
                .filter((u: any) =>
                  matchesQuery(`${u.full_name} ${u.email} ${u.mobile} ${u.role} ${u.city || ''}`)
                )
                .map((u: any) => (
                <div key={u.id} className="dashboard-booking-item">
                  <div className="booking-item-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={PROFILE_ASSETS.customerDefault}
                        alt={u.full_name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid #08783F',
                        }}
                      />
                      <strong>{u.full_name}</strong>
                    </div>
                    <span className={`status-badge ${u.is_suspended ? 'status-cancelled' : 'status-confirmed'}`}>
                      {u.is_suspended ? 'SUSPENDED' : u.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="booking-item-details">
                    <span>Email: {u.email}</span>
                    <span>Mobile: {u.mobile}</span>
                    <span>Location: {u.city || 'Gadwal'}, {u.state || 'Telangana'}</span>
                    {u.business_name && <span>Fleet: {u.business_name}</span>}
                    {u.licence_number && <span>Licence: {u.licence_number}</span>}
                  </div>
                  {u.role !== 'admin' && (
                    <div className="booking-item-footer">
                      <span className="booking-operator">
                        Status: {u.is_suspended ? 'Account Suspended' : 'Verified Active'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAdminEquipmentAction(
                            {
                              action: u.is_suspended ? 'reactivate_user' : 'suspend_user',
                              user_id: u.id,
                            },
                            `${u.full_name} ${u.is_suspended ? 'reactivated' : 'suspended'}`
                          )
                        }
                        style={{
                          background: u.is_suspended ? '#087A43' : '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {u.is_suspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'Dashboard' || activeTab === 'Vehicles') && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>Platform Vehicle Listings</h2>
            </div>
            <div className="dashboard-list-grid">
              {vehiclesList.map((v: any) => (
                <div key={v.id} className="dashboard-booking-item">
                  <div className="booking-item-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={getVehicleImage({ name: v.name, category: v.category, image_key: v.image_key })}
                        alt={v.name}
                        style={{
                          width: '48px',
                          height: '36px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#F3F8F2',
                          border: '1px solid #E5E7EB',
                        }}
                      />
                      <strong>{v.name}</strong>
                    </div>
                    <span className="status-badge status-confirmed">{v.availability || 'Verified'}</span>
                  </div>
                  <div className="booking-item-details">
                    <span>Category: {v.category}</span>
                    <span>Reg No: {v.registration_number}</span>
                    <span>Rate: {v.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'Dashboard' || activeTab === 'Bookings' || activeTab === 'Payments') && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>All Platform Bookings & Payment Settlements</h2>
            </div>
            <div className="dashboard-list-grid">
              {bookingsList.map((b: any) => (
                <div key={b.id} className="dashboard-booking-item">
                  <div className="booking-item-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={getVehicleImage({ vehicle_name: b.vehicle_name, vehicle_category: b.vehicle_category, vehicle_image_key: b.vehicle_image_key })}
                        alt={b.vehicle_name}
                        style={{
                          width: '48px',
                          height: '36px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#F3F8F2',
                          border: '1px solid #E5E7EB',
                        }}
                      />
                      <strong>#{b.id} • {b.vehicle_name}</strong>
                    </div>
                    <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                  </div>
                  <div className="booking-item-details">
                    <span>Route: {b.pickup_location} → {b.destination}</span>
                    <span>Customer: {b.customer_name}</span>
                    <span>Scheduled: {b.scheduled_at}</span>
                  </div>
                  <div className="booking-item-footer">
                    <span className="booking-price">{b.price_estimate}</span>
                    <span className="booking-operator">Payment: Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'Dashboard' || activeTab === 'Equipment') && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>Agricultural Equipment & Implements Verification ({equipmentListings.length})</h2>
            </div>
            <div className="dashboard-list-grid">
              {equipmentListings.map((eq: any) => (
                <div key={eq.id} className="dashboard-booking-item">
                  <div className="booking-item-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={eq.image || getVehicleImage({ vehicle_name: eq.equipment_type || eq.name, vehicle_category: eq.equipment_type })}
                        alt={eq.name}
                        style={{
                          width: '52px',
                          height: '38px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#F3F8F2',
                          border: '1px solid #E5E7EB',
                        }}
                      />
                      <div>
                        <strong>{eq.name}</strong>
                        <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                          {eq.sub_category_group} • {eq.equipment_type}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${
                        eq.approval_status === 'approved'
                          ? 'status-confirmed'
                          : eq.approval_status === 'rejected'
                          ? 'status-cancelled'
                          : 'status-pending'
                      }`}
                    >
                      {eq.approval_status || 'pending'}
                    </span>
                  </div>
                  <div className="booking-item-details">
                    <span>Owner: {eq.owner_name} ({eq.location})</span>
                    <span>
                      Req HP: {eq.required_tractor_hp_min}–{eq.required_tractor_hp_max} HP • {eq.attachment_type}
                    </span>
                    {eq.reported && (
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>
                        Reported: {eq.report_reason || 'Pricing / listing review requested'}
                      </span>
                    )}
                  </div>
                  <div className="booking-item-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() =>
                        handleAdminEquipmentAction(
                          { action: 'approve_equipment', equipment_id: eq.id },
                          `${eq.name} approved & verified`
                        )
                      }
                      style={{
                        background: '#087A43',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={13} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAdminEquipmentAction(
                          { action: 'reject_equipment', equipment_id: eq.id },
                          `${eq.name} rejected`
                        )
                      }
                      style={{
                        background: '#E52525',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <X size={13} />
                      Reject
                    </button>
                    {eq.reported && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAdminEquipmentAction(
                            { action: 'resolve_report', equipment_id: eq.id },
                            `Dispute resolved for ${eq.name}`
                          )
                        }
                        style={{
                          background: '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Resolve Dispute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Categories' && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>Vehicle & Agricultural Equipment Categories</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                handleAdminEquipmentAction(
                  {
                    action: 'add_equipment_category',
                    name: newCategoryName.trim(),
                    group: newCategoryGroup,
                  },
                  `Added equipment category "${newCategoryName.trim()}"`
                );
                setNewCategoryName('');
              }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}
            >
              <input
                type="text"
                placeholder="New implement/category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
              />
              <select
                value={newCategoryGroup}
                onChange={(e) => setNewCategoryGroup(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
              >
                <option value="Soil Preparation">Soil Preparation</option>
                <option value="Sowing & Planting">Sowing & Planting</option>
                <option value="Spraying & Fertilizing">Spraying & Fertilizing</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Irrigation">Irrigation</option>
                <option value="Other Agricultural Equipment">Other Agricultural Equipment</option>
              </select>
              <button
                type="submit"
                style={{
                  background: '#075B32',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Plus size={15} />
                Add Category
              </button>
            </form>

            <div className="dashboard-list-grid">
              {equipmentCategories.map((cat: any) => (
                <div key={cat.id || cat.name} className="dashboard-booking-item">
                  <div className="booking-item-top">
                    <div>
                      <strong>{cat.name}</strong>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{cat.group || 'General'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAdminEquipmentAction(
                          {
                            action: 'toggle_equipment_category',
                            category_id: cat.id,
                            active: !cat.active,
                          },
                          `${cat.name} ${!cat.active ? 'enabled' : 'disabled'}`
                        )
                      }
                      style={{
                        background: cat.active !== false ? '#087A43' : '#E52525',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {cat.active !== false ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
              {equipmentCategories.length === 0 &&
                categoriesList.map((c: string) => (
                  <div key={c} className="dashboard-booking-item">
                    <div className="booking-item-top">
                      <strong>{c}</strong>
                      <span className="status-badge status-confirmed">Active</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'AuditLogs' && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>Security & Admin Audit Logs ({auditLogs.length})</h2>
            </div>
            {auditLogs.length === 0 ? (
              <p className="dashboard-empty-text">No security or admin events recorded yet.</p>
            ) : (
              <div className="responsive-table-scroll">
                <table className="admin-audit-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Role</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td><strong>{log.action}</strong></td>
                        <td>{log.actor}</td>
                        <td>{log.role}</td>
                        <td>{log.details}</td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Reports' && (() => {
          const totalBookingsCount = bookingsList.length;
          const completedBookings = bookingsList.filter((b: any) =>
            String(b.status || '').toLowerCase().includes('complet')
          ).length;
          const activeBookings = bookingsList.filter((b: any) => {
            const s = String(b.status || '').toLowerCase();
            return s.includes('confirm') || s.includes('progress') || s.includes('accept') || s.includes('assign');
          }).length;
          const pendingBookings = bookingsList.filter((b: any) =>
            String(b.status || '').toLowerCase().includes('pend')
          ).length;
          const cancelledBookings = bookingsList.filter((b: any) =>
            String(b.status || '').toLowerCase().includes('cancel') || String(b.status || '').toLowerCase().includes('reject')
          ).length;

          const computedBookingRevenue = bookingsList.reduce((sum: number, b: any) => {
            const raw = Number(b.total_amount ?? b.estimated_price ?? b.amount ?? 0);
            return sum + (Number.isFinite(raw) ? raw : 0);
          }, 0);
          const categoryRevenueSum = categoryAnalytics.reduce(
            (sum: number, ca: any) => sum + Number(ca.revenue || 0),
            0
          );
          const grossRevenue = Math.max(computedBookingRevenue, categoryRevenueSum);
          const platformPct = Number(commPlatformPct) || 10;
          const operatorPct = Number(commOperatorPct) || 20;
          const estimatedCommission = Math.round((grossRevenue * platformPct) / 100);
          const estimatedOperatorPayout = Math.round((grossRevenue * operatorPct) / 100);
          const completionRate = totalBookingsCount > 0 ? Math.round((completedBookings / totalBookingsCount) * 100) : 0;

          const approvedEquipment = equipmentListings.filter(
            (eq: any) => String(eq.approval_status || '').toLowerCase() === 'approved'
          ).length;
          const pendingEquipment = equipmentListings.length - approvedEquipment;

          const maxCategoryRevenue = Math.max(
            1,
            ...categoryAnalytics.map((ca: any) => Number(ca.revenue || 0))
          );

          const statusBars = [
            { label: 'Completed', count: completedBookings, color: '#08783F', bg: '#DCFCE7' },
            { label: 'Active / Confirmed', count: activeBookings, color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Pending', count: pendingBookings, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Cancelled / Rejected', count: cancelledBookings, color: '#DC2626', bg: '#FEE2E2' },
          ];

          const handleExportCsv = () => {
            const rows: string[][] = [
              ['Desi Ride Platform Analytics Report', new Date().toISOString()],
              [],
              ['Metric', 'Value'],
              ['Total Users', String(usersList.length)],
              ['Customers', String(customers.length)],
              ['Vehicle Owners', String(owners.length)],
              ['Operators', String(operators.length)],
              ['Total Vehicles', String(vehiclesList.length)],
              ['Total Equipment Listings', String(equipmentListings.length)],
              ['Total Bookings', String(totalBookingsCount)],
              ['Completion Rate (%)', String(completionRate)],
              ['Gross Revenue (INR)', String(grossRevenue)],
              [`Est. Platform Commission (${platformPct}%)`, String(estimatedCommission)],
              [],
              ['Category', 'Listings', 'Bookings', 'Revenue (INR)', `Est. Commission (${platformPct}%)`],
              ...categoryAnalytics.map((ca: any) => [
                String(ca.category || ''),
                String(ca.listings || 0),
                String(ca.bookings || 0),
                String(ca.revenue || 0),
                String(Math.round((Number(ca.revenue || 0) * platformPct) / 100)),
              ]),
            ];
            const csvContent = rows
              .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
              .join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `desi-ride-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Analytics CSV report downloaded!');
          };

          return (
            <div className="dashboard-panel-card">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Reports &amp; Platform Analytics</h2>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', marginTop: '2px' }}>
                    Live revenue, booking conversion, fleet utilization, and category performance across {currentLocation}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" className="dr-btn-primary" onClick={handleExportCsv}>
                    <BarChart3 size={15} />
                    <span>Export CSV Report</span>
                  </button>
                </div>
              </div>

              {/* Analytics KPI Cards */}
              <div className="dashboard-stats-grid" style={{ marginBottom: '18px' }}>
                <div className="dashboard-stat-card">
                  <span className="stat-label">Tracked Gross Volume</span>
                  <strong className="stat-value" style={{ color: '#08783F' }}>
                    ₹{grossRevenue.toLocaleString('en-IN')}
                  </strong>
                  <span className="stat-sub">
                    Reported total: {data?.total_revenue || `₹${grossRevenue.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="stat-label">Est. Platform Commission ({platformPct}%)</span>
                  <strong className="stat-value">₹{estimatedCommission.toLocaleString('en-IN')}</strong>
                  <span className="stat-sub">
                    Operator share ({operatorPct}%): ₹{estimatedOperatorPayout.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="stat-label">Booking Completion Rate</span>
                  <strong className="stat-value">{completionRate}%</strong>
                  <span className="stat-sub">
                    {completedBookings} of {totalBookingsCount} bookings completed
                  </span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="stat-label">Fleet &amp; Equipment Inventory</span>
                  <strong className="stat-value">{vehiclesList.length + equipmentListings.length}</strong>
                  <span className="stat-sub">
                    {vehiclesList.length} Vehicles • {approvedEquipment} Approved / {pendingEquipment} Pending Equip.
                  </span>
                </div>
              </div>

              {/* Booking Status & Role Mix */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                  gap: '16px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    background: '#F8FAF7',
                    border: '1px solid #E2EAE0',
                    borderRadius: '14px',
                    padding: '16px',
                  }}
                >
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
                    Booking Status Breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {statusBars.map((sb) => {
                      const pct = totalBookingsCount > 0 ? Math.round((sb.count / totalBookingsCount) * 100) : 0;
                      return (
                        <div key={sb.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{sb.label}</span>
                            <span style={{ fontWeight: 700, color: sb.color }}>
                              {sb.count} ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: '8px', borderRadius: '999px', background: sb.bg, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: sb.color,
                                borderRadius: '999px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F8FAF7',
                    border: '1px solid #E2EAE0',
                    borderRadius: '14px',
                    padding: '16px',
                  }}
                >
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
                    Platform User &amp; Activity Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span>Registered Customers</span>
                      <strong>{customers.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span>Verified Vehicle &amp; Equipment Owners</span>
                      <strong>{owners.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span>Active Field Operators</span>
                      <strong>{operators.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span>Recorded Security &amp; Audit Events</span>
                      <strong>{auditLogs.length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Revenue & Utilization Table */}
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
                Category Performance &amp; Revenue Share
              </h3>
              {categoryAnalytics.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  No category analytics records available yet.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-audit-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Listings</th>
                        <th>Bookings</th>
                        <th>Verified Revenue</th>
                        <th>Est. Commission ({platformPct}%)</th>
                        <th>Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryAnalytics.map((ca: any) => {
                        const rev = Number(ca.revenue || 0);
                        const sharePct = Math.round((rev / maxCategoryRevenue) * 100);
                        const commAmt = Math.round((rev * platformPct) / 100);
                        return (
                          <tr key={ca.category}>
                            <td><strong>{ca.category}</strong></td>
                            <td>{ca.listings || 0}</td>
                            <td>{ca.bookings || 0}</td>
                            <td style={{ fontWeight: 700, color: '#08783F' }}>
                              ₹{rev.toLocaleString('en-IN')}
                            </td>
                            <td>₹{commAmt.toLocaleString('en-IN')}</td>
                            <td style={{ minWidth: '140px' }}>
                              <div style={{ height: '8px', borderRadius: '999px', background: '#E5E7EB', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${sharePct}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #08783F, #16A34A)',
                                    borderRadius: '999px',
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {(activeTab === 'Complaints' || activeTab === 'Settings') && (
          <div className="dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>System {activeTab} & Platform Configuration</h2>
              <button type="button" className="header-login-btn" onClick={logout}>
                <LogOut size={15} />
                <span>Admin Logout</span>
              </button>
            </div>

            {activeTab === 'Settings' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdminEquipmentAction(
                    {
                      action: 'update_commission',
                      platform_commission_pct: Number(commPlatformPct),
                      operator_share_pct: Number(commOperatorPct),
                      gst_pct: Number(commGstPct),
                      cancellation_fee_pct: Number(commCancelPct),
                    },
                    'Platform commission & tax rates updated!'
                  );
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
                  gap: '12px',
                  padding: '16px',
                  background: '#F8FAF7',
                  border: '1px solid #E2EAE0',
                  borderRadius: '14px',
                  alignItems: 'end',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Platform Commission (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={commPlatformPct}
                    onChange={(e) => setCommPlatformPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Operator Share (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={commOperatorPct}
                    onChange={(e) => setCommOperatorPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    GST (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={28}
                    value={commGstPct}
                    onChange={(e) => setCommGstPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Cancellation Fee (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={commCancelPct}
                    onChange={(e) => setCommCancelPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <button type="submit" className="dr-btn-primary">
                  Save Commission Rates
                </button>
              </form>
            )}

            {categoryAnalytics.length > 0 && (
              <div className="dashboard-list-grid" style={{ marginBottom: '14px' }}>
                {categoryAnalytics.map((ca: any) => (
                  <div key={ca.category} className="dashboard-booking-item">
                    <div className="booking-item-top">
                      <strong>{ca.category}</strong>
                      <span className="status-badge status-confirmed">{ca.listings} listings</span>
                    </div>
                    <div className="booking-item-details">
                      <span>Bookings: {ca.bookings}</span>
                      <span>Verified Revenue: ₹{(ca.revenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '13.5px', color: '#374151' }}>
              All role-based access guards, JWT token refresh policies, login rate limiting, and password hashing (PBKDF2-SHA256) are active. Zero unresolved complaints in {currentLocation}.
            </p>
          </div>
        )}
          </div>
        </div>
      </main>

      {toast && (
        <div className="toast-notice" role="status">
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

