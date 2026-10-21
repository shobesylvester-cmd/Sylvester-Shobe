import React from 'react';
import { Users, Laptop, DollarSign, Briefcase } from 'lucide-react';
import { DepartmentCategory } from '../types/classifier.ts';

interface CategoryBadgeProps {
  category: DepartmentCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
}) => {
  const getIcon = () => {
    switch (category) {
      case 'HR':
        return <Users className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'IT':
        return <Laptop className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'Finance':
        return <DollarSign className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'Operations':
        return <Briefcase className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
    }
  };

  const getStyle = () => {
    switch (category) {
      case 'HR':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'IT':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Finance':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Operations':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${getStyle()} ${sizeClasses}`}
    >
      {showIcon && getIcon()}
      <span>{category}</span>
    </span>
  );
};
