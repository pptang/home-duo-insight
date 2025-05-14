
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";

type Vote = Database['public']['Tables']['votes']['Row'] & {
  expert: {
    full_name: string | null;
    avatar_url: string | null;
    area_specialization: string | null;
  }
};

interface FeedExpertInsightsProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
}

export const FeedExpertInsights = ({ comparisonId, propertyAName, propertyBName }: FeedExpertInsightsProps) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVotes = async () => {
      if (!comparisonId) return;
      
      setIsLoading(true);
      
      try {
        // Make sure comparisonId is a string
        const comparison_id = String(comparisonId);
        
        const { data, error } = await supabase
          .from('votes')
          .select(`
            *,
            expert:profiles(
              full_name, 
              avatar_url, 
              area_specialization
            )
          `)
          .eq('comparison_id', comparison_id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching votes:", error);
          return;
        }
        
        setVotes(data as Vote[]);
      } catch (error) {
        console.error("Error fetching votes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVotes();
  }, [comparisonId]);
  
  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading expert insights...</div>;
  }
  
  if (votes.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
        No expert votes yet
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Expert Insights</h3>
      </div>
      <div className="divide-y">
        {votes.map((vote) => (
          <div key={vote.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {vote.expert.avatar_url ? (
                  <img 
                    src={vote.expert.avatar_url} 
                    alt={vote.expert.full_name || "Expert"} 
                  />
                ) : (
                  <AvatarFallback>
                    {(vote.expert.full_name?.charAt(0) || "E").toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{vote.expert.full_name || "Expert"}</h4>
                    {vote.expert.area_specialization && (
                      <p className="text-xs text-gray-500">{vote.expert.area_specialization}</p>
                    )}
                  </div>
                  <div className="bg-[#F7F7F8] text-sm py-1 px-2 rounded-full flex items-center gap-1">
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
        ))}
      </div>
    </div>
  );
};
