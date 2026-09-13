import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBlueRate } from '../api/currency';

type DisplayMode = 'original' | 'ars';

interface CurrencyContextValue {
  blueRate: number | null;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  formatAmount: (amount: number, currency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// Los pesos se muestran sin centavos: son cifras de seis dígitos y el diseño las escribe
// enteras ("$575.000"). El dólar sí los conserva, donde dos centavos son plata.
const ARS_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const USD_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

/** Intl mete un espacio duro entre el signo y la cifra; el diseño los escribe pegados. */
function tighten(formatted: string): string {
  return formatted.replace(/\u00A0/g, '');
}

function formatAmount(amount: number, currency: string | undefined, displayMode: DisplayMode, blueRate: number | null): string {
  const curr = currency ?? 'ARS';
  if (displayMode === 'ars' && curr === 'USD' && blueRate !== null) {
    return tighten(ARS_FORMATTER.format(amount * blueRate));
  }
  if (curr === 'USD') {
    return tighten(USD_FORMATTER.format(amount));
  }
  return tighten(ARS_FORMATTER.format(amount));
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [blueRate, setBlueRate] = useState<number | null>(null);
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('currency_display');
    return saved === 'ars' ? 'ars' : 'original';
  });

  useEffect(() => {
    getBlueRate()
      .then(r => setBlueRate(r.rate))
      .catch(() => {
        // Non-fatal: blue rate unavailable, USD will show as-is
      });
  }, []);

  const setDisplayMode = (mode: DisplayMode) => {
    setDisplayModeState(mode);
    localStorage.setItem('currency_display', mode);
  };

  const value: CurrencyContextValue = {
    blueRate,
    displayMode,
    setDisplayMode,
    formatAmount: (amount, currency) => formatAmount(amount, currency, displayMode, blueRate),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
