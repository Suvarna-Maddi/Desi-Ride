import React from 'react';
import { CalendarCheck, IndianRupee, Clock, Star } from 'lucide-react';

export interface OwnerStatsData {
  total_bookings: number;
  bookings_growth: string;
  total_earnings: number;
  earnings_growth: string;
  upcoming_jobs: number;
  upcoming_label: string;
  owner_rating: number;
  reviews_count: number;
}

export interface OwnerStatisticsProps {
  stats: OwnerStatsData;
}

export const OwnerStatistics: React.FC<OwnerStatisticsProps> = ({ stats }) => {
  const formattedEarnings = `₹ ${Number(stats.total_earnings || 48600).toLocaleString(
    'en-IN'
  )}`;

  return (
    <section className="owner-stats-section" aria-label="Owner Performance Statistics">
      <div className="owner-stats-strip">
        {/* Card 1: Total Bookings */}
        <div className="owner-stat-item">
          <div className="owner-stat-icon-circle bg-pastel-green">
            <CalendarCheck size={20} color="#087A43" strokeWidth={2.2} />
          </div>
          <div className="owner-stat-text-col">
            <strong className="owner-stat-number">{stats.total_bookings}</strong>
            <span className="owner-stat-label">Total Bookings</span>
            <span className="owner-stat-sub growth-green">{stats.bookings_growth}</span>
          </div>
        </div>

        {/* Card 2: Total Earnings */}
        <div className="owner-stat-item">
          <div className="owner-stat-icon-circle bg-pastel-orange">
            <IndianRupee size={20} color="#E87519" strokeWidth={2.5} />
          </div>
          <div className="owner-stat-text-col">
            <strong className="owner-stat-number">{formattedEarnings}</strong>
            <span className="owner-stat-label">Total Earnings</span>
            <span className="owner-stat-sub growth-green">{stats.earnings_growth}</span>
          </div>
        </div>

        {/* Card 3: Upcoming Jobs */}
        <div className="owner-stat-item">
          <div className="owner-stat-icon-circle bg-pastel-blue">
            <Clock size={20} color="#FFFFFF" fill="#1D7AFC" strokeWidth={2} />
          </div>
          <div className="owner-stat-text-col">
            <strong className="owner-stat-number">{stats.upcoming_jobs}</strong>
            <span className="owner-stat-label">Upcoming Jobs</span>
            <span className="owner-stat-sub muted-sub">{stats.upcoming_label}</span>
          </div>
        </div>

        {/* Card 4: Owner Rating */}
        <div className="owner-stat-item">
          <div className="owner-stat-icon-circle bg-pastel-orange">
            <Star size={20} color="#E87519" fill="#E87519" strokeWidth={2} />
          </div>
          <div className="owner-stat-text-col">
            <strong className="owner-stat-number">{stats.owner_rating}</strong>
            <span className="owner-stat-label">Owner Rating</span>
            <span className="owner-stat-sub muted-sub">
              ({stats.reviews_count} Reviews)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

