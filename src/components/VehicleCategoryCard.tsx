import React from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  bgClass: string;
}

interface VehicleCategoryCardProps {
  category: CategoryItem;
  isSelected?: boolean;
  onSelect: (category: CategoryItem) => void;
}

export const VehicleCategoryCard: React.FC<VehicleCategoryCardProps> = ({
  category,
  isSelected,
  onSelect
}) => {
  return (
    <div
      className={`category-card ${category.bgClass} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(category)}
      role="button"
      tabIndex={0}
      title={`Select ${category.name}`}
    >
      <div className="category-image-box">
        <img
          src={category.image}
          alt={category.name}
          className="category-vehicle-img"
          loading="lazy"
        />
      </div>

      <span className="category-card-name">
        {category.name}
      </span>
    </div>
  );
};

