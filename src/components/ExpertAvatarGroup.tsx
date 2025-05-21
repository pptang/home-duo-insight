
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "lucide-react";

interface Expert {
  user_id: string;
  name: string;
  profile_image_url: string | null;
}

interface ExpertAvatarGroupProps {
  experts: Expert[];
  maxVisible?: number;
}

const ExpertAvatarGroup: React.FC<ExpertAvatarGroupProps> = ({ 
  experts, 
  maxVisible = 5 
}) => {
  if (!experts || experts.length === 0) return null;

  const visibleExperts = experts.slice(0, maxVisible);
  const remainingCount = experts.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visibleExperts.map((expert) => (
          <Tooltip key={expert.user_id}>
            <TooltipTrigger asChild>
              <Link
                to={`/experts/${expert.user_id}`}
                className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                aria-label={`View ${expert.name}'s profile`}
              >
                <Avatar className="h-8 w-8 border-2 border-white">
                  {expert.profile_image_url ? (
                    <AvatarImage
                      src={expert.profile_image_url}
                      alt={expert.name}
                    />
                  ) : (
                    <AvatarFallback className="bg-[#6A7FDB] text-white">
                      {expert.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{expert.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more expert{remainingCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ExpertAvatarGroup;
