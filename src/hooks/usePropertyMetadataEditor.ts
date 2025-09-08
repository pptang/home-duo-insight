import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface UsePropertyMetadataEditorProps {
  comparisonId: string;
}

export const usePropertyMetadataEditor = ({ comparisonId }: UsePropertyMetadataEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const updateProperty = useCallback(async (
    propertyId: string, 
    fieldName: string, 
    value: any
  ) => {
    setIsSaving(true);
    setErrors(prev => ({ ...prev, [`${propertyId}.${fieldName}`]: '' }));

    try {
      const response = await supabase.functions.invoke('update-property-metadata', {
        body: {
          property_id: propertyId,
          field_name: fieldName,
          field_value: value,
          user_id: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (!result.success) {
        if (result.validation_errors && result.validation_errors.length > 0) {
          const fieldError = result.validation_errors[0];
          setErrors(prev => ({
            ...prev,
            [`${propertyId}.${fieldName}`]: fieldError.message
          }));
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update property error:', error);
      setErrors(prev => ({
        ...prev,
        [`${propertyId}.${fieldName}`]: 'Failed to save changes'
      }));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const batchUpdateProperty = useCallback(async (
    propertyId: string,
    updates: Record<string, any>
  ) => {
    setIsSaving(true);
    
    try {
      const response = await supabase.functions.invoke('update-property-metadata', {
        body: {
          property_id: propertyId,
          updates,
          user_id: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (!result.success) {
        if (result.validation_errors && result.validation_errors.length > 0) {
          result.validation_errors.forEach((error: any) => {
            setErrors(prev => ({
              ...prev,
              [`${propertyId}.${error.field}`]: error.message
            }));
          });
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Batch update property error:', error);
      Object.keys(updates).forEach(fieldName => {
        setErrors(prev => ({
          ...prev,
          [`${propertyId}.${fieldName}`]: 'Failed to save changes'
        }));
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const updateComparisonStatus = useCallback(async (status: string) => {
    try {
      const response = await supabase.functions.invoke('update-comparison-status', {
        body: {
          comparison_id: comparisonId,
          status,
          user_id: user?.id
        }
      });

      return !response.error;
    } catch (error) {
      console.error('Update comparison status error:', error);
      return false;
    }
  }, [comparisonId, user?.id]);

  return {
    updateProperty,
    batchUpdateProperty,
    updateComparisonStatus,
    isSaving,
    errors
  };
};