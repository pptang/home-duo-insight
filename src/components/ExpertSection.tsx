import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpertVoting } from "@/components/ExpertVoting";
import { ExpertInsights } from "@/components/ExpertInsights";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ExpertSectionProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
}

export function ExpertSection({ comparisonId, propertyAName, propertyBName }: ExpertSectionProps) {
  const { user, isExpert } = useAuth();
  const { t } = useTranslation();
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCheckingVote, setIsCheckingVote] = useState(true);

  useEffect(() => {
    const checkExpertVote = async () => {
      if (!user || !isExpert) {
        setIsCheckingVote(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("votes")
          .select("id")
          .eq("comparison_id", comparisonId)
          .eq("expert_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking vote:", error);
        } else {
          setHasVoted(!!data);
        }
      } catch (error) {
        console.error("Unexpected error checking vote:", error);
      } finally {
        setIsCheckingVote(false);
      }
    };

    checkExpertVote();
  }, [user, isExpert, comparisonId]);

  const handleVoteSubmitted = () => {
    setHasVoted(true);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!comparisonId) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">{t("expertSection.title")}</h2>
      
      {isExpert && !isCheckingVote && (
        <ExpertVoting
          comparisonId={comparisonId}
          propertyAName={propertyAName}
          propertyBName={propertyBName}
          hasVoted={hasVoted}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}
      
      <ExpertInsights
        comparisonId={comparisonId}
        propertyAName={propertyAName}
        propertyBName={propertyBName}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
