import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface RecommendationFeedbackProps {
  recommendationId: string;
  className?: string;
}

// Get or create a session ID for anonymous users
const getSessionId = (): string => {
  const storageKey = 'aisuma_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

// Get stored feedback for a specific recommendation
const getStoredFeedback = (recommendationId: string): 'positive' | 'negative' | null => {
  const storageKey = `aisuma_feedback_${recommendationId}`;
  const stored = localStorage.getItem(storageKey);
  return stored as 'positive' | 'negative' | null;
};

// Store feedback for a specific recommendation
const storeFeedback = (recommendationId: string, feedback: 'positive' | 'negative') => {
  const storageKey = `aisuma_feedback_${recommendationId}`;
  localStorage.setItem(storageKey, feedback);
};

export const RecommendationFeedback = ({ recommendationId, className }: RecommendationFeedbackProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submittedFeedback, setSubmittedFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing feedback on mount
  useEffect(() => {
    const existingFeedback = getStoredFeedback(recommendationId);
    if (existingFeedback) {
      setSubmittedFeedback(existingFeedback);
    }
  }, [recommendationId]);

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (isSubmitting || submittedFeedback) return;

    setIsSubmitting(true);

    try {
      const sessionId = getSessionId();

      const { error } = await supabase
        .from('recommendation_feedback')
        .upsert(
          {
            recommendation_id: recommendationId,
            user_id: user?.id || null,
            session_id: sessionId,
            feedback: feedback,
          },
          {
            onConflict: 'recommendation_id,session_id',
          }
        );

      if (error) {
        console.error('Error submitting feedback:', error);
        return;
      }

      // Store in localStorage and update state
      storeFeedback(recommendationId, feedback);
      setSubmittedFeedback(feedback);
    } catch (err) {
      console.error('Unexpected error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show thank you message after feedback is submitted
  if (submittedFeedback) {
    return (
      <div className={cn("text-center py-6", className)}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/30 rounded-full">
          <span className="text-lg">🙏</span>
          <span className="text-muted-foreground font-medium">
            {t('recommendation.feedback.thanks')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("text-center py-6 space-y-4", className)}>
      <p className="text-muted-foreground font-medium">
        {t('recommendation.feedback.title')}
      </p>
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => handleFeedback('positive')}
          disabled={isSubmitting}
          className="gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
        >
          <ThumbsUp className="h-4 w-4" />
          {t('recommendation.feedback.thumbs_up')}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleFeedback('negative')}
          disabled={isSubmitting}
          className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
        >
          <ThumbsDown className="h-4 w-4" />
          {t('recommendation.feedback.thumbs_down')}
        </Button>
      </div>
    </div>
  );
};
