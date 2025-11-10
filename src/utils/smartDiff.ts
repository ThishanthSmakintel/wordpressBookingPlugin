/**
 * Smart Diffing Utilities
 * Industry-standard logic to prevent unnecessary re-renders
 */

/**
 * Compare two arrays for equality (order-independent)
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

/**
 * Deep compare two objects, excluding specified keys
 */
export const objectsEqual = (a: any, b: any, excludeKeys: string[] = []): boolean => {
  const cleanObj = (obj: any) => {
    const cleaned = { ...obj };
    excludeKeys.forEach(key => delete cleaned[key]);
    return cleaned;
  };
  
  return JSON.stringify(cleanObj(a)) === JSON.stringify(cleanObj(b));
};

/**
 * Smart state setter - only updates if value changed
 */
export const smartSetState = <T>(
  prev: T,
  next: T,
  compareFn: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
): T => {
  return compareFn(prev, next) ? prev : next;
};
