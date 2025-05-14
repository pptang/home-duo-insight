import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle } from "lucide-react";

interface ExpertVotingProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
  hasVoted: boolean;
  onVoteSubmitted: () => void;
}

export function ExpertVoting({
  comparisonId,
  propertyAName,
  propertyBName,
  hasVoted,
  onVoteSubmitted,
}: ExpertVotingProps) {
  const { user, isExpert } = useAuth();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<"A" | "B" | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoteSubmit = async () => {
    if (!user || !isExpert || !selectedProperty) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("votes").insert({
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
    return (
      <Card className="bg-gray-50 border-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Vote Submitted
          </CardTitle>
          <CardDescription>
            You have already voted on this comparison
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expert Voting</CardTitle>
        <CardDescription>
          Share your professional opinion on this property comparison
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedProperty === "A" ? "default" : "outline"}
              className={
                selectedProperty === "A"
                  ? "bg-[#6A7FDB] hover:bg-[#5A6DCB]"
                  : ""
              }
              onClick={() => setSelectedProperty("A")}
            >
              Vote for {propertyAName}
            </Button>
            <Button
              variant={selectedProperty === "B" ? "default" : "outline"}
              className={
                selectedProperty === "B"
                  ? "bg-[#6A7FDB] hover:bg-[#5A6DCB]"
                  : ""
              }
              onClick={() => setSelectedProperty("B")}
            >
              Vote for {propertyBName}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Comment (optional, max 280 chars)
          </label>
          <Textarea
            id="comment"
            placeholder="Share your reasoning behind this vote..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 280))}
            maxLength={280}
            className="resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500 text-right">
            {comment.length}/280 characters
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleVoteSubmit}
          disabled={!selectedProperty || isSubmitting}
          className="w-full bg-[#6A7FDB] hover:bg-[#5A6DCB]"
        >
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </Button>
      </CardFooter>
    </Card>
  );
}
