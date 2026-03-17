import { useState, useEffect } from 'react';

export function useSynergyState() {
  const [energyCoins, setEnergyCoins] = useState(10);
  const [balanceState, setBalanceState] = useState('balanced');

  useEffect(() => {
    const calculateSynergy = () => {
      // Membaca state dari LocalStorage secara aman
      const savedState = localStorage.getItem('prodify_balance_state') || 'balanced';
      setBalanceState(savedState);
      
      // Kalkulasi koin otomatis terpusat di sini
      if (savedState === 'buffed') {
        setEnergyCoins(13);
      } else if (savedState === 'debuffed') {
        setEnergyCoins(7);
      } else {
        setEnergyCoins(10);
      }
    };

    calculateSynergy();
    
    // Auto-update jika ada perubahan dari tab/komponen lain
    window.addEventListener('storage', calculateSynergy);
    window.addEventListener('prodify-sync', calculateSynergy);
    return () => {
      window.removeEventListener('storage', calculateSynergy);
      window.removeEventListener('prodify-sync', calculateSynergy);
    };
  }, []);

  return { energyCoins, balanceState };
}
