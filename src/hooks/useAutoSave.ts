import { useEffect, useRef } from 'react';

export const useAutoSave = <T>(
  value: T,
  onSave: (value: T) => void,
  delay: number = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if value actually changed
    if (value !== previousValueRef.current) {
      timeoutRef.current = setTimeout(() => {
        onSave(value);
        previousValueRef.current = value;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onSave, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};