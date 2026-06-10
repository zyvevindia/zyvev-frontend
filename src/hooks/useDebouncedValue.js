import { useEffect, useState } from "react";

/**
 * @param {T} value
 * @param {number} delayMs
 * @returns {T}
 * @template T
 */
export default function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
