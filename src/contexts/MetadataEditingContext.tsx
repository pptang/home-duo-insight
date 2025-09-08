import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface PropertyData {
  id: string;
  property_name?: string;
  address?: string;
  price_yen?: number;
  floor_plan?: string;
  commute_minutes?: number;
  property_type?: string;
  private_area_sqm?: number;
  construction_year?: number;
  construction_month?: number;
  building_age_years?: number;
  image_urls: string[];
  notes?: string;
}

interface MetadataEditState {
  originalProperties: {
    property_a: PropertyData;
    property_b: PropertyData;
  };
  editedProperties: {
    property_a: PropertyData;
    property_b: PropertyData;
  };
  unsavedChanges: {
    property_a: Set<string>;
    property_b: Set<string>;
  };
  savingFields: Set<string>;
  validationErrors: Record<string, string>;
  currentStage: 'url-input' | 'metadata-review' | 'full-comparison';
  comparisonId?: string;
}

type MetadataEditAction =
  | { type: 'INIT_PROPERTIES'; payload: { property_a: PropertyData; property_b: PropertyData; comparison_id: string } }
  | { type: 'UPDATE_FIELD'; payload: { propertyKey: 'property_a' | 'property_b'; fieldName: string; value: any } }
  | { type: 'UPDATE_PROPERTY_DATA'; payload: { propertyKey: 'property_a' | 'property_b'; propertyData: PropertyData } }
  | { type: 'SET_SAVING'; payload: { fieldKey: string; saving: boolean } }
  | { type: 'SET_VALIDATION_ERROR'; payload: { fieldKey: string; error: string | null } }
  | { type: 'MARK_FIELD_SAVED'; payload: { propertyKey: 'property_a' | 'property_b'; fieldName: string } }
  | { type: 'SET_STAGE'; payload: { stage: MetadataEditState['currentStage'] } }
  | { type: 'RESET' };

interface MetadataEditingContextType {
  state: MetadataEditState;
  updateField: (propertyKey: 'property_a' | 'property_b', fieldName: string, value: any) => Promise<void>;
  hasUnsavedChanges: boolean;
  saveAllChanges: () => Promise<void>;
  resetToOriginal: () => void;
  proceedToComparison: () => Promise<void>;
  initializeProperties: (property_a: PropertyData, property_b: PropertyData, comparison_id: string) => void;
  setStage: (stage: MetadataEditState['currentStage']) => void;
}

const MetadataEditingContext = createContext<MetadataEditingContextType | null>(null);

function metadataEditReducer(state: MetadataEditState, action: MetadataEditAction): MetadataEditState {
  switch (action.type) {
    case 'INIT_PROPERTIES':
      return {
        ...state,
        originalProperties: { property_a: action.payload.property_a, property_b: action.payload.property_b },
        editedProperties: { property_a: action.payload.property_a, property_b: action.payload.property_b },
        unsavedChanges: { property_a: new Set(), property_b: new Set() },
        comparisonId: action.payload.comparison_id
      };

    case 'UPDATE_FIELD':
      const { propertyKey, fieldName, value } = action.payload;
      const newUnsavedChanges = { ...state.unsavedChanges };
      newUnsavedChanges[propertyKey] = new Set([...newUnsavedChanges[propertyKey], fieldName]);

      return {
        ...state,
        editedProperties: {
          ...state.editedProperties,
          [propertyKey]: {
            ...state.editedProperties[propertyKey],
            [fieldName]: value
          }
        },
        unsavedChanges: newUnsavedChanges
      };

    case 'UPDATE_PROPERTY_DATA':
      return {
        ...state,
        editedProperties: {
          ...state.editedProperties,
          [action.payload.propertyKey]: action.payload.propertyData
        }
      };

    case 'MARK_FIELD_SAVED':
      const updatedUnsaved = { ...state.unsavedChanges };
      updatedUnsaved[action.payload.propertyKey].delete(action.payload.fieldName);

      return {
        ...state,
        unsavedChanges: updatedUnsaved
      };

    case 'SET_SAVING':
      const newSavingFields = new Set(state.savingFields);
      if (action.payload.saving) {
        newSavingFields.add(action.payload.fieldKey);
      } else {
        newSavingFields.delete(action.payload.fieldKey);
      }

      return {
        ...state,
        savingFields: newSavingFields
      };

    case 'SET_VALIDATION_ERROR':
      const newErrors = { ...state.validationErrors };
      if (action.payload.error) {
        newErrors[action.payload.fieldKey] = action.payload.error;
      } else {
        delete newErrors[action.payload.fieldKey];
      }

      return {
        ...state,
        validationErrors: newErrors
      };

    case 'SET_STAGE':
      return {
        ...state,
        currentStage: action.payload.stage
      };

    case 'RESET':
      return {
        originalProperties: { property_a: {} as PropertyData, property_b: {} as PropertyData },
        editedProperties: { property_a: {} as PropertyData, property_b: {} as PropertyData },
        unsavedChanges: { property_a: new Set(), property_b: new Set() },
        savingFields: new Set(),
        validationErrors: {},
        currentStage: 'url-input'
      };

    default:
      return state;
  }
}

export const MetadataEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer<React.Reducer<MetadataEditState, MetadataEditAction>>(
    metadataEditReducer,
    {
      originalProperties: { property_a: {} as PropertyData, property_b: {} as PropertyData },
      editedProperties: { property_a: {} as PropertyData, property_b: {} as PropertyData },
      unsavedChanges: { property_a: new Set(), property_b: new Set() },
      savingFields: new Set(),
      validationErrors: {},
      currentStage: 'url-input'
    }
  );

  const { user } = useAuth();
  const { toast } = useToast();

  const updateField = useCallback(async (
    propertyKey: 'property_a' | 'property_b',
    fieldName: string,
    value: any
  ) => {
    const fieldKey = `${propertyKey}.${fieldName}`;

    // Update local state immediately (optimistic update)
    dispatch({ type: 'UPDATE_FIELD', payload: { propertyKey, fieldName, value } });

    // Clear any existing validation error
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: { fieldKey, error: null } });

    // Skip API call for empty values
    if (value === '' || value === null || value === undefined) {
      return;
    }

    // Save to backend
    dispatch({ type: 'SET_SAVING', payload: { fieldKey, saving: true } });

    try {
      const propertyId = state.editedProperties[propertyKey].id;

      const response = await supabase.functions.invoke('update-property-metadata', {
        body: {
          property_id: propertyId,
          field_name: fieldName,
          field_value: value,
          user_id: user?.id || null
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (!result.success) {
        if (result.validation_errors && result.validation_errors.length > 0) {
          const fieldError = result.validation_errors[0];
          dispatch({ type: 'SET_VALIDATION_ERROR', payload: { fieldKey, error: fieldError.message } });
        }
        return;
      }

      // Update with server response to ensure consistency
      if (result.property) {
        dispatch({
          type: 'UPDATE_PROPERTY_DATA',
          payload: {
            propertyKey,
            propertyData: result.property
          }
        });
      }

      // Mark field as saved
      dispatch({ type: 'MARK_FIELD_SAVED', payload: { propertyKey, fieldName } });

    } catch (error) {
      console.error('Update property error:', error);
      dispatch({ type: 'SET_VALIDATION_ERROR', payload: { fieldKey, error: 'Failed to save changes' } });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: { fieldKey, saving: false } });
    }
  }, [state.editedProperties, user?.id]);

  const saveAllChanges = useCallback(async () => {
    const allUnsavedChanges = [
      ...Array.from(state.unsavedChanges.property_a).map(field => ({ propertyKey: 'property_a' as const, field })),
      ...Array.from(state.unsavedChanges.property_b).map(field => ({ propertyKey: 'property_b' as const, field }))
    ];

    for (const { propertyKey, field } of allUnsavedChanges) {
      const value = (state.editedProperties[propertyKey] as any)[field];
      await updateField(propertyKey, field, value);
    }
  }, [state.unsavedChanges, state.editedProperties, updateField]);

  const resetToOriginal = useCallback(() => {
    dispatch({ type: 'INIT_PROPERTIES', payload: {
      property_a: state.originalProperties.property_a,
      property_b: state.originalProperties.property_b,
      comparison_id: state.comparisonId || ''
    } });
  }, [state.originalProperties, state.comparisonId]);

  const proceedToComparison = useCallback(async () => {
    // Save any remaining changes
    if (hasUnsavedChanges) {
      await saveAllChanges();
    }

    // Update comparison status to completed
    if (state.comparisonId) {
      try {
        await supabase.functions.invoke('update-comparison-status', {
          body: {
            comparison_id: state.comparisonId,
            status: 'completed',
            user_id: user?.id || null
          }
        });
      } catch (error) {
        console.error('Failed to update comparison status:', error);
      }
    }

    dispatch({ type: 'SET_STAGE', payload: { stage: 'full-comparison' } });

    // Also trigger the parent component to update its stage
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('metadataEditingComplete'));
    }
  }, [state.comparisonId, user?.id, saveAllChanges]);

  const initializeProperties = useCallback((property_a: PropertyData, property_b: PropertyData, comparison_id: string) => {
    dispatch({ type: 'INIT_PROPERTIES', payload: { property_a, property_b, comparison_id } });
  }, []);

  const setStage = useCallback((stage: MetadataEditState['currentStage']) => {
    dispatch({ type: 'SET_STAGE', payload: { stage } });
  }, []);

  const hasUnsavedChanges = state.unsavedChanges.property_a.size > 0 || state.unsavedChanges.property_b.size > 0;

  const contextValue: MetadataEditingContextType = {
    state,
    updateField,
    hasUnsavedChanges,
    saveAllChanges,
    resetToOriginal,
    proceedToComparison,
    initializeProperties,
    setStage
  };

  return (
    <MetadataEditingContext.Provider value={contextValue}>
      {children}
    </MetadataEditingContext.Provider>
  );
};

export const useMetadataEditing = () => {
  const context = useContext(MetadataEditingContext);
  if (!context) {
    throw new Error('useMetadataEditing must be used within MetadataEditingProvider');
  }
  return context;
};