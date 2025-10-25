import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ExpertProfile = {
  name: string | null;
  profile_image_url: string | null;
  user_id: string | null;
  profiles: {
    full_name: string | null;
    area_specialization: string | null;
  } | null;
};

type Vote = Database["public"]["Tables"]["votes"]["Row"] & {
  expert_profiles: ExpertProfile | null;
};

interface ExpertInsightsProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
  refreshTrigger?: number;
}

export function ExpertInsights({
  comparisonId,
  propertyAName,
  propertyBName,
  refreshTrigger = 0
}: ExpertInsightsProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchExpertVotes = async () => {
      setLoading(true);
      try {
        const { data: votesData, error } = await supabase
          .from("votes")
          .select("*")
          .eq("comparison_id", comparisonId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching expert votes:", error);
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
        console.error("Unexpected error fetching votes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertVotes();
  }, [comparisonId, refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("expertInsights.title")}</CardTitle>
          <CardDescription>{t("expertInsights.loading")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("expertInsights.title")}</CardTitle>
          <CardDescription>{t("expertInsights.noOpinions")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 text-gray-500">
          {t("expertInsights.noVotes")}
        </CardContent>
      </Card>
    );
  }

  // Count votes for each property
  const propertyAVotes = votes.filter(vote => vote.voted_for === "A").length;
  const propertyBVotes = votes.filter(vote => vote.voted_for === "B").length;
  const totalVotes = votes.length;
  
  // Calculate percentages
  const propertyAPercentage = totalVotes > 0 ? Math.round((propertyAVotes / totalVotes) * 100) : 0;
  const propertyBPercentage = totalVotes > 0 ? Math.round((propertyBVotes / totalVotes) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("expertInsights.title")}</CardTitle>
        <CardDescription>{t("expertInsights.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vote summary */}
        <div className="bg-slate-50 p-4 rounded-md mb-4">
          <div className="text-sm mb-2">{t("expertInsights.expertVotes")} {totalVotes}</div>
          <div className="flex justify-between text-sm mb-1">
            <span>{propertyAName}: {propertyAVotes} {t("expertInsights.votes")} ({propertyAPercentage}%)</span>
            <span>{propertyBName}: {propertyBVotes} {t("expertInsights.votes")} ({propertyBPercentage}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#6A7FDB]"
              style={{ width: `${propertyAPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Expert votes list */}
        <div className="space-y-4">
          {votes.map(vote => {
            const expertName = vote.expert_profiles?.profiles?.full_name || vote.expert_profiles?.name || "Expert";
            const initials = expertName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase();
              
            return (
              <div key={vote.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={vote.expert_profiles?.profile_image_url || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{expertName}</div>
                    {vote.expert_profiles?.profiles?.area_specialization && (
                      <div className="text-sm text-gray-500">{vote.expert_profiles.profiles.area_specialization}</div>
                    )}
                  </div>
                  <div className="ml-auto">
                    <Badge className={vote.voted_for === "A" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                      {t("expertInsights.property")} {vote.voted_for}
                    </Badge>
                  </div>
                </div>
                {vote.comment && (
                  <div className="text-sm text-gray-700 pl-12">{vote.comment}</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
