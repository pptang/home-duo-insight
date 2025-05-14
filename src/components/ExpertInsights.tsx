
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Vote = Database["public"]["Tables"]["votes"]["Row"] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    area_specialization: string | null;
  };
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
          .eq("comparison_id", comparisonId)
          .order("created_at", { ascending: false });

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
  }, [comparisonId, refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expert Insights</CardTitle>
          <CardDescription>Loading expert opinions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expert Insights</CardTitle>
          <CardDescription>No expert opinions yet for this comparison</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 text-gray-500">
          Experts haven't voted on this comparison yet
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
        <CardTitle>Expert Insights</CardTitle>
        <CardDescription>Professional opinions from real estate experts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vote summary */}
        <div className="bg-slate-50 p-4 rounded-md mb-4">
          <div className="text-sm mb-2">Expert votes: {totalVotes}</div>
          <div className="flex justify-between text-sm mb-1">
            <span>{propertyAName}: {propertyAVotes} votes ({propertyAPercentage}%)</span>
            <span>{propertyBName}: {propertyBVotes} votes ({propertyBPercentage}%)</span>
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
            const expertName = vote.profiles?.full_name || "Expert";
            const initials = expertName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase();
              
            return (
              <div key={vote.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={vote.profiles?.avatar_url || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{expertName}</div>
                    {vote.profiles?.area_specialization && (
                      <div className="text-sm text-gray-500">{vote.profiles.area_specialization}</div>
                    )}
                  </div>
                  <div className="ml-auto">
                    <Badge className={vote.voted_for === "A" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                      Property {vote.voted_for}
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
