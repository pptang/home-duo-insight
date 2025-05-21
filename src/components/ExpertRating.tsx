
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpertRatingProps {
  expertId: string;
  className?: string;
  onRatingSubmitted?: () => void;
}

export function ExpertRating({ expertId, className, onRatingSubmitted }: ExpertRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [userPreviousRating, setUserPreviousRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if the user has already rated this expert
  useEffect(() => {
    const checkExistingRating = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("expert_ratings")
          .select("rating")
          .eq("expert_user_id", expertId)
          .eq("user_id", user.id)
          .single();
          
        if (data) {
          setRating(data.rating);
          setUserPreviousRating(data.rating);
        }
      } catch (error) {
        // No previous rating exists
      }
    };
    
    checkExistingRating();
  }, [expertId, user]);

  const handleRatingClick = async (value: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to rate experts",
        variant: "destructive",
      });
      return;
    }
    
    setRating(value);
    setIsSubmitting(true);
    
    try {
      if (userPreviousRating) {
        // Update existing rating
        const { error } = await supabase
          .from("expert_ratings")
          .update({ rating: value })
          .eq("expert_user_id", expertId)
          .eq("user_id", user.id);
          
        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase
          .from("expert_ratings")
          .insert({
            expert_user_id: expertId,
            user_id: user.id,
            rating: value
          });
          
        if (error) throw error;
      }
      
      setUserPreviousRating(value);
      
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit your rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate the star buttons
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = (hoveredRating !== null ? hoveredRating >= i : rating !== null && rating >= i);
      
      stars.push(
        <Button
          key={i}
          type="button"
          variant="ghost"
          size="sm"
          className="p-1 h-auto"
          onMouseEnter={() => setHoveredRating(i)}
          onClick={() => handleRatingClick(i)}
          disabled={isSubmitting}
        >
          <Star 
            className={`h-6 w-6 ${isFilled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        </Button>
      );
    }
    return stars;
  };
  
  return (
    <div 
      className={`flex flex-col ${className}`}
      onMouseLeave={() => setHoveredRating(null)}
    >
      <p className="text-sm mb-1">
        {userPreviousRating ? "Your rating:" : "Rate this expert:"}
      </p>
      <div className="flex items-center">
        {renderStars()}
      </div>
    </div>
  );
}
