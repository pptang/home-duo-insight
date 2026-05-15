export const useFieldValidation = () => {
  const validateField = (value: string | number | null | undefined, fieldName: string, type: string = 'text') => {
    // Empty fields are always valid
    if (!value || value === '') {
      return { isValid: true, error: null };
    }

    switch (fieldName) {
      case 'price_yen':
        if (type === 'number') {
          const num = Number(value);
          if (isNaN(num) || num <= 0) {
            return { isValid: false, error: 'Price must be a positive number' };
          }
        }
        break;
        
      case 'private_area_sqm':
        if (type === 'number') {
          const num = Number(value);
          if (isNaN(num) || num <= 0) {
            return { isValid: false, error: 'Area must be a positive number' };
          }
        }
        break;
        
      case 'construction_year':
        if (type === 'number') {
          const num = Number(value);
          if (isNaN(num) || num < 1900 || num > 2025) {
            return { isValid: false, error: 'Year must be between 1900 and 2025' };
          }
        }
        break;
        
      case 'construction_month':
        if (type === 'number') {
          const num = Number(value);
          if (isNaN(num) || num < 1 || num > 12) {
            return { isValid: false, error: 'Month must be between 1 and 12' };
          }
        }
        break;
        
      case 'commute_minutes':
        if (type === 'number') {
          const num = Number(value);
          if (isNaN(num) || num < 0) {
            return { isValid: false, error: 'Commute time cannot be negative' };
          }
        }
        break;
        
      case 'floor_plan': {
        const floorPlanRegex = /^(\d+[DKLR]+|\d+部屋)$/i;
        if (typeof value === 'string' && !floorPlanRegex.test(value)) {
          return { isValid: false, error: 'Invalid floor plan format (e.g., 1LDK, 2DK)' };
        }
        break;
      }
    }
    
    return { isValid: true, error: null };
  };

  return { validateField };
};