
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, User, Eye } from "lucide-react";

type Vote = Database["public"]["Tables"]["votes"]["Row"] & {
  expert_profiles: {
    name: string | null;
    profile_image_url: string | null;
    user_id: string | null;
    profiles: {
      full_name: string | null;
      area_specialization: string | null;
    } | null;
  } | null;
};

interface ExpertInsightsProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
  refreshTrigger?: number;
}

interface AuthorProfile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function ExpertInsights({
  comparisonId,
  propertyAName,
  propertyBName,
  refreshTrigger = 0
}: ExpertInsightsProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [showAuthorEmail, setShowAuthorEmail] = useState(false);
  const [canRevealAuthorEmail, setCanRevealAuthorEmail] = useState(false);
  const { user, isExpert } = useAuth();

  useEffect(() => {
    const fetchExpertVotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("votes")
          .select(`
            *,
            expert_profiles:expert_user_id (
              name,
              profile_image_url,
              user_id,
              profiles:user_id (
                full_name,
                area_specialization
              )
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

  useEffect(() => {
    const fetchAuthorAndCheckPermission = async () => {
      if (!isExpert || !user) {
        setCanRevealAuthorEmail(false);
        return;
      }

      try {
        // Check if current expert has commented on this comparison
        const { data: expertVote, error: voteError } = await supabase
          .from("votes")
          .select("id")
          .eq("comparison_id", comparisonId)
          .eq("expert_user_id", user.id)
          .maybeSingle();

        if (voteError) {
          console.error("Error checking expert vote:", voteError);
          return;
        }

        const hasCommented = !!expertVote;

        if (hasCommented) {
          // Fetch comparison author's profile
          const { data: comparisonData, error: comparisonError } = await supabase
            .from("comparisons")
            .select(`
              user_id,
              profiles:user_id (
                full_name,
                email,
                avatar_url
              )
            `)
            .eq("id", comparisonId)
            .single();

          if (comparisonError) {
            console.error("Error fetching comparison author:", comparisonError);
            return;
          }

          if (comparisonData?.user_id && comparisonData.profiles) {
            setAuthorProfile(comparisonData.profiles);
            setCanRevealAuthorEmail(true);
          }
        }
      } catch (error) {
        console.error("Unexpected error checking permissions:", error);
      }
    };

    fetchAuthorAndCheckPermission();
  }, [comparisonId, user, isExpert, refreshTrigger]);

  const handleRevealAuthorEmail = () => {
    setShowAuthorEmail(true);
  };

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

        {/* Author contact reveal section */}
        {canRevealAuthorEmail && (
          <div className="mt-6 pt-4 border-t">
            {!showAuthorEmail ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevealAuthorEmail}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Reveal Author's Contact
              </Button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Comparison Author</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Name:</span>
                    <span>{authorProfile?.full_name || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span className="text-blue-600">{authorProfile?.email || "Not available"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
