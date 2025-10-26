import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";

type ExpertProfile = {
  name: string | null;
  profile_image_url: string | null;
  user_id: string | null;
  profiles: {
    full_name: string | null;
    area_specialization: string | null;
  } | null;
};

type Vote = Database['public']['Tables']['votes']['Row'] & {
  expert_profiles: ExpertProfile | null;
};

interface FeedExpertInsightsProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
}

export const FeedExpertInsights = ({ comparisonId, propertyAName, propertyBName }: FeedExpertInsightsProps) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchVotes = async () => {
      if (!comparisonId) return;
      
      setIsLoading(true);
      
      try {
        const comparison_id = String(comparisonId);
        
        const { data: votesData, error } = await supabase
          .from('votes')
          .select("*")
          .eq('comparison_id', comparison_id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching votes:", error);
          return;
        }
        
        // Fetch expert profiles and user profiles separately
        const votesWithProfiles = await Promise.all(
          (votesData || []).map(async (vote) => {
            const { data: expertProfile } = await supabase
              .from("expert_profiles")
              .select("name, profile_image_url, user_id")
              .eq("user_id", vote.expert_user_id)
              .single();

            let profiles = null;
            if (expertProfile?.user_id) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, area_specialization")
                .eq("id", expertProfile.user_id)
                .single();
              profiles = profileData;
            }

            return {
              ...vote,
              expert_profiles: expertProfile ? {
                ...expertProfile,
                profiles
              } : null
            };
          })
        );
        
        setVotes(votesWithProfiles as Vote[]);
      } catch (error) {
        console.error("Error fetching votes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVotes();
  }, [comparisonId]);
  
  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">{t("feedExpertInsights.loading")}</div>;
  }
  
  if (votes.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
        {t("feedExpertInsights.noVotes")}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">{t("feedExpertInsights.title")}</h3>
      </div>
      <div className="divide-y">
        {votes.map((vote) => {
          const expertName = vote.expert_profiles?.profiles?.full_name || vote.expert_profiles?.name || "Expert";
          
          return (
            <div key={vote.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {vote.expert_profiles?.profile_image_url ? (
                    <img 
                      src={vote.expert_profiles.profile_image_url} 
                      alt={expertName} 
                    />
                  ) : (
                    <AvatarFallback>
                      {expertName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{expertName}</h4>
                      {vote.expert_profiles?.profiles?.area_specialization && (
                        <p className="text-xs text-gray-500">{vote.expert_profiles.profiles.area_specialization}</p>
                      )}
                    </div>
                    <div className="bg-muted text-sm py-1 px-2 rounded-full flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>
                        {vote.voted_for === 'A' ? propertyAName || 'Property A' : propertyBName || 'Property B'}
                      </span>
                    </div>
                  </div>
                  
                  {vote.comment && (
                    <p className="mt-2 text-sm text-gray-700">{vote.comment}</p>
                  )}
                  
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(vote.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
