import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
  
    useEffect(() => {
      // Set up the delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      // Cancel the timeout if value changes (also on unmount)
      // This is how we prevent debouncedValue from updating if value is changed within the delay period
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
  }