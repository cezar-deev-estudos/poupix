'use client';

import React from 'react';
import { Wallet, Landmark, PiggyBank, TrendingUp, Building2 } from 'lucide-react';

interface BankBadgeProps {
  institution?: string;
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BankBadge: React.FC<BankBadgeProps> = ({
  institution,
  name,
  color = '#820AD1',
  size = 'md',
}) => {
  const normalized = (institution || name).toLowerCase();

  // Dimensões baseadas no size
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
  }[size];

  // Itaú
  if (normalized.includes('itau') || normalized.includes('itaú')) {
    return (
      <div
        className={`${sizeClasses} bg-[#EC7000] text-white flex items-center justify-center font-black tracking-tighter shadow-md shrink-0 border border-amber-400/20`}
        title="Itaú"
      >
        <span className="text-[11px] leading-none font-extrabold bg-[#003399] px-1 py-0.5 rounded text-white">
          Itaú
        </span>
      </div>
    );
  }

  // Nubank
  if (normalized.includes('nu') || normalized.includes('nubank')) {
    return (
      <div
        className={`${sizeClasses} bg-[#820AD1] text-white flex items-center justify-center font-black tracking-tight shadow-md shrink-0`}
        title="Nubank"
      >
        <span className="text-xs font-bold">nu</span>
      </div>
    );
  }

  // Inter
  if (normalized.includes('inter')) {
    return (
      <div
        className={`${sizeClasses} bg-[#FF7A00] text-white flex items-center justify-center font-black tracking-tight shadow-md shrink-0`}
        title="Banco Inter"
      >
        <span className="text-xs font-black">inter</span>
      </div>
    );
  }

  // Bradesco
  if (normalized.includes('bradesco')) {
    return (
      <div
        className={`${sizeClasses} bg-[#CC092F] text-white flex items-center justify-center font-bold tracking-tight shadow-md shrink-0`}
        title="Bradesco"
      >
        <span className="text-[11px] font-black">B</span>
      </div>
    );
  }

  // Santander
  if (normalized.includes('santander')) {
    return (
      <div
        className={`${sizeClasses} bg-[#EA1D2C] text-white flex items-center justify-center font-bold shadow-md shrink-0`}
        title="Santander"
      >
        <span className="text-[11px] font-black">SAN</span>
      </div>
    );
  }

  // Banco do Brasil / BB
  if (normalized.includes('brasil') || normalized.includes('bb')) {
    return (
      <div
        className={`${sizeClasses} bg-[#FDF001] text-[#003399] flex items-center justify-center font-black shadow-md shrink-0`}
        title="Banco do Brasil"
      >
        <span className="text-xs font-black">BB</span>
      </div>
    );
  }

  // Caixa
  if (normalized.includes('caixa') || normalized.includes('cef')) {
    return (
      <div
        className={`${sizeClasses} bg-[#0066B3] text-[#F39200] flex items-center justify-center font-black shadow-md shrink-0`}
        title="Caixa Econômica"
      >
        <span className="text-xs font-black">X</span>
      </div>
    );
  }

  // C6 Bank
  if (normalized.includes('c6')) {
    return (
      <div
        className={`${sizeClasses} bg-[#242424] text-white border border-slate-700 flex items-center justify-center font-bold shadow-md shrink-0`}
        title="C6 Bank"
      >
        <span className="text-xs font-bold">C6</span>
      </div>
    );
  }

  // XP Investimentos
  if (normalized.includes('xp')) {
    return (
      <div
        className={`${sizeClasses} bg-white text-black flex items-center justify-center font-black shadow-md shrink-0 border border-slate-300`}
        title="XP Investimentos"
      >
        <span className="text-xs font-black tracking-tight text-black">xp</span>
      </div>
    );
  }

  // Binance
  if (normalized.includes('binance') || normalized.includes('bitcoin') || normalized.includes('crypto')) {
    return (
      <div
        className={`${sizeClasses} bg-[#F3BA2F] text-black flex items-center justify-center font-black shadow-md shrink-0`}
        title="Binance"
      >
        <span className="text-sm font-black">❖</span>
      </div>
    );
  }

  // Nomad
  if (normalized.includes('nomad') || normalized.includes('nonad')) {
    return (
      <div
        className={`${sizeClasses} bg-[#FFDD00] text-black flex items-center justify-center font-black shadow-md shrink-0`}
        title="Nomad"
      >
        <span className="text-[11px] font-black tracking-tighter">N</span>
      </div>
    );
  }

  // Fallback padrão com a cor da conta
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center text-white font-bold shadow-md shrink-0`}
      style={{ backgroundColor: color }}
      title={institution || name}
    >
      <Landmark className="w-5 h-5 opacity-90" />
    </div>
  );
};
