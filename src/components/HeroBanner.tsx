import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  HERO_ASSETS,
  AGRICULTURE_VEHICLE_ASSETS,
  CONSTRUCTION_VEHICLE_ASSETS,
  TRANSPORTATION_VEHICLE_ASSETS
} from '../utils/assetLibrary';

interface HeroBannerProps {
  onBookNow: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onBookNow }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      titlePart1: 'Farm, Site & Travel?',
      titlePart2: 'All-In-One Booking ',
      titlePart3: 'Made Easy.',
      description: 'Book tractors, farm implements, JCBs, water tankers\nand transport vehicles with verified operators.',
      image: HERO_ASSETS.homeHeroSlide1
    },
    {
      titlePart1: 'Farm & Harvest?',
      titlePart2: 'Tractors & Harvesters ',
      titlePart3: 'On Demand.',
      description: 'Verified operators and modern farm machinery\nat standard hourly rates.',
      image: AGRICULTURE_VEHICLE_ASSETS.harvesterField
    },
    {
      titlePart1: 'Heavy Construction?',
      titlePart2: 'JCBs & Dump Trucks ',
      titlePart3: 'Ready.',
      description: 'Reliable excavation equipment delivered\ndirectly to your project site.',
      image: HERO_ASSETS.homeHeroSlide3
    },
    {
      titlePart1: 'Outstation & Tours?',
      titlePart2: 'SUVs, Vans & Buses ',
      titlePart3: 'Available.',
      description: 'Safe, comfortable family and group travel\nacross cities and towns.',
      image: TRANSPORTATION_VEHICLE_ASSETS.innova
    }
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isPaused, activeSlide, slides.length]);

  return (
    <div
      className="hero-banner-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-banner-container">
        <img
          src={slides[activeSlide].image}
          alt={`${slides[activeSlide].titlePart1} ${slides[activeSlide].titlePart2}${slides[activeSlide].titlePart3}`}
          className="hero-banner-bg-img"
        />
        <div className="hero-banner-overlay" />

        {/* Left Side: Headings & CTA Button */}
        <div className="hero-banner-text-col">
          <h1 className="hero-title">
            {slides[activeSlide].titlePart1}
            <br />
            {slides[activeSlide].titlePart2}
            <span className="highlight-orange">{slides[activeSlide].titlePart3}</span>
          </h1>

          <p className="hero-description">
            {slides[activeSlide].description}
          </p>

          <button
            type="button"
            className="hero-book-now-btn"
            onClick={onBookNow}
            aria-label="Book Now"
          >
            <span>Book Now</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="hero-pagination-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${activeSlide === index ? 'active' : 'inactive'}`}
            onClick={() => setActiveSlide(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSlide(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
