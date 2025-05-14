
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface FeedExpertVotingProps {
  comparisonId: number | string;
  propertyAName: string;
  propertyBName: string;
  hasVoted: boolean;
  onVoteSubmitted: () => void;
  isCompact?: boolean;
}

export function FeedExpertVoting({
  comparisonId,
  propertyAName,
  propertyBName,
  hasVoted,
  onVoteSubmitted,
  isCompact = true
}: FeedExpertVotingProps) {
  const { user, isExpert } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<"A" | "B" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(!isCompact);

  const handleVoteSubmit = async () => {
    if (!user || !isExpert || !selectedProperty) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          comparison_id: comparisonId,
          expert_user_id: user.id,
          voted_for: selectedProperty,
          comment: comment.trim() || null,
        });
      
      if (error) {
        console.error("Error submitting vote:", error);
        toast({
          variant: "destructive",
          title: "Vote failed",
          description: "Could not submit your vote. Please try again.",
        });
        return;
      }
      
      toast({
        title: "Vote submitted",
        description: `You voted for Property ${selectedProperty}`,
      });
      
      onVoteSubmitted();
      setSelectedProperty(null);
      setComment("");
      setShowComment(false);
    } catch (error) {
      console.error("Unexpected error submitting vote:", error);
      toast({
        variant: "destructive",
        title: "Vote failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpert) return null;
  
  if (hasVoted) {
    return isCompact ? null : (
      <div className="bg-gray-50 border-green-100 border rounded-md p-3 my-2 text-sm flex items-center gap-2">
        <span className="text-green-500">✓</span> You've already voted on this comparison
      </div>
    );
  }
  
  return (
    <div className="space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={selectedProperty === "A" ? "default" : "outline"}
          className={selectedProperty === "A" ? "bg-[#6A7FDB] hover:bg-[#5A6DCB]" : ""}
          onClick={() => setSelectedProperty("A")}
        >
          {propertyAName}
        </Button>
        <Button
          size="sm"
          variant={selectedProperty === "B" ? "default" : "outline"}
          className={selectedProperty === "B" ? "bg-[#6A7FDB] hover:bg-[#5A6DCB]" : ""}
          onClick={() => setSelectedProperty("B")}
        >
          {propertyBName}
        </Button>
      </div>
      
      {isCompact && selectedProperty && !showComment && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setShowComment(true)} 
          className="text-xs w-full"
        >
          + Add comment (optional)
        </Button>
      )}
      
      {(showComment || !isCompact) && (
        <Textarea
          placeholder="Add optional comment (max 280 chars)..."
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 280))}
          className="resize-none text-sm"
          rows={2}
        />
      )}
      
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleVoteSubmit}
          disabled={!selectedProperty || isSubmitting}
          className="bg-[#6A7FDB] hover:bg-[#5A6DCB]"
        >
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </Button>
      </div>
    </div>
  );
}
