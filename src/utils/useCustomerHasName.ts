import { useEffect, useState } from 'react';
import { customerHasName, customerProfileChangedEvent } from './customerProfile';

export function useCustomerHasName(active = true) {
  const [hasCustomerName, setHasCustomerName] = useState(() => customerHasName());

  useEffect(() => {
    if (active) {
      setHasCustomerName(customerHasName());
    }
  }, [active]);

  useEffect(() => {
    const syncCustomerName = () => setHasCustomerName(customerHasName());
    window.addEventListener(customerProfileChangedEvent, syncCustomerName);
    window.addEventListener('storage', syncCustomerName);
    return () => {
      window.removeEventListener(customerProfileChangedEvent, syncCustomerName);
      window.removeEventListener('storage', syncCustomerName);
    };
  }, []);

  return [hasCustomerName, setHasCustomerName] as const;
}
