import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComparisonSubscriptionProps {
  comparisonId: string;
  onImageExtractionComplete?: () => void;
  onImageExtractionStatusChange?: (status: 'pending' | 'in_progress' | 'completed' | 'failed') => void;
}

export const useComparisonSubscription = ({
  comparisonId,
  onImageExtractionComplete,
  onImageExtractionStatusChange
}: ComparisonSubscriptionProps) => {
  useEffect(() => {
    if (!comparisonId) return;

    // Subscribe to changes in the specific comparison
    const subscription = supabase
      .channel('comparison-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comparisons',
          filter: `id=eq.${comparisonId}`
        },
        (payload) => {
          console.log('Comparison updated:', payload);
          
          const newRecord = payload.new as { image_extraction_status: 'pending' | 'in_progress' | 'completed' | 'failed' };
          const oldRecord = payload.old as { image_extraction_status: 'pending' | 'in_progress' | 'completed' | 'failed' };
          
          // Check if image extraction status changed
          if (newRecord.image_extraction_status !== oldRecord.image_extraction_status) {
            onImageExtractionStatusChange?.(newRecord.image_extraction_status);
            
            // If completed, trigger callback
            if (newRecord.image_extraction_status === 'completed') {
              onImageExtractionComplete?.();
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [comparisonId, onImageExtractionComplete, onImageExtractionStatusChange]);
};