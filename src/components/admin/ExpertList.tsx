import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ExpertProfileDetail } from "./ExpertProfileDetail";

interface ExpertProfile {
  id: string;
  name: string;
  email: string;
  profile_image_url: string | null;
  average_rating: number;
  rating_count: number;
  created_at: string;
}

export function ExpertList() {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(
    null
  );
  const { toast } = useToast();

  // Fetch expert profiles
  const fetchExperts = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("expert_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching experts:", error);
        toast({
          title: "Error",
          description: "Failed to load expert profiles",
          variant: "destructive",
        });
        return;
      }

      setExperts(data as ExpertProfile[]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load expert profiles on component mount
  useEffect(() => {
    fetchExperts();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format rating display
  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center">Loading expert profiles...</div>
      ) : experts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No expert profiles found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expert</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experts.map((expert) => (
              <TableRow key={expert.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={expert.profile_image_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(expert.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{expert.name}</span>
                  </div>
                </TableCell>
                <TableCell>{expert.email}</TableCell>
                <TableCell>
                  {expert.rating_count > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{formatRating(expert.average_rating)}</span>
                      <span className="text-gray-400 text-xs">
                        ({expert.rating_count})
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No ratings</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(expert.created_at)}</TableCell>
                <TableCell>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExpert(expert)}
                      >
                        View Details
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="sm:max-w-md">
                      {selectedExpert && (
                        <div>
                          <SheetHeader className="mb-4">
                            <SheetTitle>Expert Profile</SheetTitle>
                          </SheetHeader>
                          <ExpertProfileDetail
                            expertId={selectedExpert.id}
                            onUpdate={fetchExperts}
                          />
                        </div>
                      )}
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
