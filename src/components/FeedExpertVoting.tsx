import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedExpertVotingProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
  hasVoted?: boolean;
  onVoteSubmitted: () => void;
}

export const FeedExpertVoting = ({
  comparisonId,
  propertyAName,
  propertyBName,
  hasVoted = false,
  onVoteSubmitted,
}: FeedExpertVotingProps) => {
  const [voteOption, setVoteOption] = useState<"A" | "B" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // If the user has already voted, show a message instead of the voting form
  if (hasVoted) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <p className="text-center text-gray-600">
          {t("feedExpertVoting.alreadyVoted")}
        </p>
      </div>
    );
  }

  const handleVoteSubmit = async () => {
    if (!user?.id || !voteOption || !comparisonId) return;

    setIsSubmitting(true);

    try {
      // Make sure comparisonId is a string
      const comparison_id = String(comparisonId);

      const { error } = await supabase.from("votes").insert({
        comparison_id,
        expert_user_id: user.id,
        voted_for: voteOption,
        comment: comment.trim() || null,
      });

      if (error) {
        console.error("Error submitting vote:", error);
        toast({
          variant: "destructive",
          title: t("feedExpertVoting.voteFailed"),
          description: t("feedExpertVoting.voteFailedDesc"),
        });
        return;
      }

      toast({
        title: t("feedExpertVoting.voteSubmitted"),
        description: t("feedExpertVoting.voteSubmittedDesc"),
      });

      setVoteOption(null);
      setComment("");
      onVoteSubmitted();
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        variant: "destructive",
        title: t("feedExpertVoting.voteFailed"),
        description: t("feedExpertVoting.voteFailedDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold text-lg">{t("feedExpertVoting.title")}</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={voteOption === "A" ? "default" : "outline"}
          className={voteOption === "A" ? "bg-primary" : ""}
          onClick={() => setVoteOption("A")}
          size="sm"
        >
          {t("feedExpertVoting.voteFor")} {propertyAName || "Property A"}
        </Button>
        <Button
          variant={voteOption === "B" ? "default" : "outline"}
          className={voteOption === "B" ? "bg-primary" : ""}
          onClick={() => setVoteOption("B")}
          size="sm"
        >
          {t("feedExpertVoting.voteFor")} {propertyBName || "Property B"}
        </Button>
      </div>

      {voteOption && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("feedExpertVoting.commentLabel")}
            </label>
            <Textarea
              id="comment"
              placeholder={t("feedExpertVoting.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              className="w-full"
              maxLength={280}
              rows={3}
            />
            <div className="text-xs text-right text-gray-500 mt-1">
              {t("feedExpertVoting.characterCount", { count: comment.length })}
            </div>
          </div>

          <Button
            onClick={handleVoteSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? t("feedExpertVoting.submitting") : t("feedExpertVoting.submitVote")}
          </Button>
        </div>
      )}
    </div>
  );
};
