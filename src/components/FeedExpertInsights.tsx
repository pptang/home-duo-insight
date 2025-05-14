
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Vote = Database["public"]["Tables"]["votes"]["Row"] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    area_specialization: string | null;
  };
};

interface FeedExpertInsightsProps {
  comparisonId: string | number;
  propertyAName: string;
  propertyBName: string;
  isCompact?: boolean;
}

export function FeedExpertInsights({
  comparisonId,
  propertyAName,
  propertyBName,
  isCompact = true
}: FeedExpertInsightsProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpertVotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("votes")
          .select(`
            *,
            profiles:expert_user_id (
              full_name,
              avatar_url,
              area_specialization
            )
          `)
          .eq("comparison_id", comparisonId.toString())
          .order("created_at", { ascending: false })
          .limit(isCompact ? 3 : 10);

        if (error) {
          console.error("Error fetching expert votes:", error);
          return;
        }

        setVotes(data as Vote[]);
      } catch (error) {
        console.error("Unexpected error fetching votes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertVotes();
  }, [comparisonId, isCompact]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-2">
        Loading expert insights...
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No expert insights yet
      </div>
    );
  }

  // Count votes for each property
  const propertyAVotes = votes.filter(vote => vote.voted_for === "A").length;
  const propertyBVotes = votes.filter(vote => vote.voted_for === "B").length;
  const totalVotes = votes.length;

  return (
    <div className="space-y-2">
      {!isCompact && (
        <div className="font-medium text-sm">Expert Insights ({votes.length})</div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{propertyAName}: {propertyAVotes}</span>
        <span>{propertyBName}: {propertyBVotes}</span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#6A7FDB]"
          style={{ width: `${totalVotes > 0 ? (propertyAVotes / totalVotes) * 100 : 0}%` }}
        />
      </div>
      
      {!isCompact && votes.length > 0 && (
        <div className="space-y-3 mt-3">
          {votes.map((vote) => {
            const expertName = vote.profiles?.full_name || "Expert";
            const initials = expertName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase();
              
            return (
              <div key={vote.id} className="flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={vote.profiles?.avatar_url || ""} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{expertName}</span>
                <Badge className={vote.voted_for === "A" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                  {vote.voted_for}
                </Badge>
                {vote.comment && (
                  <span className="text-gray-600 text-xs italic ml-2">"{vote.comment}"</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
