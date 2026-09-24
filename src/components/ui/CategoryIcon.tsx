'use client';

import React from 'react';
import {
  Utensils, Home, Car, Gamepad2, HeartPulse, GraduationCap,
  ShoppingBag, Tv, MoreHorizontal, Banknote, Laptop, TrendingUp,
  Award, PlusCircle, CreditCard, Wallet, Landmark, DollarSign,
  Briefcase, Coffee, Gift, Tag
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = "w-5 h-5", size }) => {
  const iconMap: Record<string, React.ReactNode> = {
    Utensils: <Utensils className={className} size={size} />,
    Home: <Home className={className} size={size} />,
    Car: <Car className={className} size={size} />,
    Gamepad2: <Gamepad2 className={className} size={size} />,
    HeartPulse: <HeartPulse className={className} size={size} />,
    GraduationCap: <GraduationCap className={className} size={size} />,
    ShoppingBag: <ShoppingBag className={className} size={size} />,
    Tv: <Tv className={className} size={size} />,
    MoreHorizontal: <MoreHorizontal className={className} size={size} />,
    Banknote: <Banknote className={className} size={size} />,
    Laptop: <Laptop className={className} size={size} />,
    TrendingUp: <TrendingUp className={className} size={size} />,
    Award: <Award className={className} size={size} />,
    PlusCircle: <PlusCircle className={className} size={size} />,
    CreditCard: <CreditCard className={className} size={size} />,
    Wallet: <Wallet className={className} size={size} />,
    Landmark: <Landmark className={className} size={size} />,
    DollarSign: <DollarSign className={className} size={size} />,
    Briefcase: <Briefcase className={className} size={size} />,
    Coffee: <Coffee className={className} size={size} />,
    Gift: <Gift className={className} size={size} />,
    Tag: <Tag className={className} size={size} />,
  };

  return iconMap[name] || <Tag className={className} size={size} />;
};
