'use client';

import React from 'react';
import { CreditCard } from '@/types/finance';
import { CreditCard as CardIcon } from 'lucide-react';

interface CardBrandLogoProps {
  brand: CreditCard['brand'];
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardBrandLogo: React.FC<CardBrandLogoProps> = ({ brand, name = '', size = 'md' }) => {
  const normName = name.toLowerCase();

  // Dimensões
  const sizeClasses = {
    sm: 'h-6 text-xs',
    md: 'h-8 text-sm',
    lg: 'h-10 text-base',
  }[size];

  // Mastercard - Dois círculos sobrepostos
  if (brand === 'mastercard' || normName.includes('master')) {
    return (
      <div className={`flex items-center ${sizeClasses} select-none`} title="Mastercard">
        <div className="flex -space-x-2.5 items-center">
          <div className="w-6 h-6 rounded-full bg-[#EB001B] opacity-90"></div>
          <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90"></div>
        </div>
      </div>
    );
  }

  // Visa
  if (brand === 'visa' || normName.includes('visa')) {
    return (
      <div className={`flex items-center font-black italic tracking-tighter ${sizeClasses} select-none text-white`} title="VISA">
        <span className="text-base font-extrabold tracking-tighter">VISA</span>
      </div>
    );
  }

  // Elo
  if (brand === 'elo' || normName.includes('elo')) {
    return (
      <div className={`flex items-center font-bold ${sizeClasses} select-none text-[#00A4E8]`} title="Elo">
        <span className="text-sm font-black tracking-tight bg-white text-black px-1 rounded">elo</span>
      </div>
    );
  }

  // Amex
  if (brand === 'amex' || normName.includes('amex')) {
    return (
      <div className={`flex items-center font-bold ${sizeClasses} select-none text-[#006FCF]`} title="American Express">
        <span className="text-xs font-black bg-white text-[#006FCF] px-1 py-0.5 rounded">AMEX</span>
      </div>
    );
  }

  // Hipercard
  if (brand === 'hipercard' || normName.includes('hiper')) {
    return (
      <div className={`flex items-center font-bold ${sizeClasses} select-none text-[#B31B1B]`} title="Hipercard">
        <span className="text-xs font-black bg-white text-[#B31B1B] px-1 rounded">HIPER</span>
      </div>
    );
  }

  // Fallback genérico de cartão (círculo branco com ícone)
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white" title="Cartão">
      <CardIcon className="w-4 h-4 text-white" />
    </div>
  );
};
