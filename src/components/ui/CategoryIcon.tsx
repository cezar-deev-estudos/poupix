'use client';

import React from 'react';
import {
  Utensils, Home, Car, Gamepad2, HeartPulse, Heart, GraduationCap,
  ShoppingBag, ShoppingCart, Tv, MoreHorizontal, Banknote, Laptop, TrendingUp,
  Award, PlusCircle, CreditCard, Wallet, Landmark, DollarSign,
  Briefcase, Coffee, Gift, Tag, Plane, Smartphone, Zap, Shield,
  Fuel, Bus, Bike, Train, Music, Film, Camera, Ticket, Smile,
  Shirt, Scissors, Dumbbell, Pill, Stethoscope, BookOpen, Building,
  PiggyBank, Coins, Receipt, Wifi, Flame, Droplets, Key, Wrench,
  Sparkles, Pizza, Beer, Apple, Package, Baby, Dog, Cat, Flower2
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
    Heart: <Heart className={className} size={size} />,
    GraduationCap: <GraduationCap className={className} size={size} />,
    ShoppingBag: <ShoppingBag className={className} size={size} />,
    ShoppingCart: <ShoppingCart className={className} size={size} />,
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
    Plane: <Plane className={className} size={size} />,
    Smartphone: <Smartphone className={className} size={size} />,
    Zap: <Zap className={className} size={size} />,
    Shield: <Shield className={className} size={size} />,
    Fuel: <Fuel className={className} size={size} />,
    Bus: <Bus className={className} size={size} />,
    Bike: <Bike className={className} size={size} />,
    Train: <Train className={className} size={size} />,
    Music: <Music className={className} size={size} />,
    Film: <Film className={className} size={size} />,
    Camera: <Camera className={className} size={size} />,
    Ticket: <Ticket className={className} size={size} />,
    Smile: <Smile className={className} size={size} />,
    Shirt: <Shirt className={className} size={size} />,
    Scissors: <Scissors className={className} size={size} />,
    Dumbbell: <Dumbbell className={className} size={size} />,
    Pill: <Pill className={className} size={size} />,
    Stethoscope: <Stethoscope className={className} size={size} />,
    BookOpen: <BookOpen className={className} size={size} />,
    Building: <Building className={className} size={size} />,
    PiggyBank: <PiggyBank className={className} size={size} />,
    Coins: <Coins className={className} size={size} />,
    Receipt: <Receipt className={className} size={size} />,
    Wifi: <Wifi className={className} size={size} />,
    Flame: <Flame className={className} size={size} />,
    Droplets: <Droplets className={className} size={size} />,
    Key: <Key className={className} size={size} />,
    Wrench: <Wrench className={className} size={size} />,
    Sparkles: <Sparkles className={className} size={size} />,
    Pizza: <Pizza className={className} size={size} />,
    Beer: <Beer className={className} size={size} />,
    Apple: <Apple className={className} size={size} />,
    Package: <Package className={className} size={size} />,
    Baby: <Baby className={className} size={size} />,
    Dog: <Dog className={className} size={size} />,
    Cat: <Cat className={className} size={size} />,
    Flower2: <Flower2 className={className} size={size} />,
  };

  return iconMap[name] || <Tag className={className} size={size} />;
};
