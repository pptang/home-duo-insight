import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  ThumbsUp, 
  Building,
  Home,
  Search,
  Filter,
  AlertTriangle,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FeedExpertVoting } from "@/components/FeedExpertVoting";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  property_name: string;
  price_yen: number | null;
  floor_plan: string | null;
  image_urls: string[] | null;
  property_type: string | null;
}

interface ComparisonPost {
  id: string;
  created_at: string;
  user_id: string | null;
  propertyA: Property;
  propertyB: Property;
  ai_recommendation_text?: string | null;
  userName?: string; // Will be fetched separately if needed
  userAvatar?: string; // Will be fetched separately if needed
  expertVotes?: number;
  communityVotes?: number;
  comments?: number;
}

const Feed = () => {
  const { isExpert, user } = useAuth();
  const { toast } = useToast();
  const [comparisons, setComparisons] = useState<ComparisonPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [votedComparisons, setVotedComparisons] = useState<Record<string, boolean>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparisons = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch comparisons with their linked properties
        const { data: comparisonsData, error: comparisonsError } = await supabase
          .from("comparisons")
          .select(`
            *,
            propertyA:property_a_id(*),
            propertyB:property_b_id(*)
          `)
          .order('created_at', { ascending: false });
        
        if (comparisonsError) {
          console.error("Error fetching comparisons:", comparisonsError);
          setError("Failed to load comparisons. Please refresh.");
          return;
        }

        if (!comparisonsData || comparisonsData.length === 0) {
          setComparisons([]);
          setIsLoading(false);
          return;
        }

        // Transform the data to match our ComparisonPost interface
        const transformedData: ComparisonPost[] = comparisonsData.map(comparison => ({
          id: comparison.id,
          created_at: comparison.created_at,
          user_id: comparison.user_id,
          propertyA: comparison.propertyA as Property,
          propertyB: comparison.propertyB as Property,
          expertVotes: 0, // Will be updated with aggregation later
          communityVotes: 0, // Will be updated with aggregation later
          comments: 0 // Will be updated with aggregation later
        }));

        // Fetch vote counts for each comparison
        await Promise.all(transformedData.map(async (comparison) => {
          // Get expert votes
          const { count: expertCount, error: expertError } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: false })
            .eq("comparison_id", comparison.id);
          
          if (!expertError) {
            comparison.expertVotes = expertCount || 0;
          }

          // For now, we don't have community votes and comments tables
          // When implemented, similar queries would be added here
          comparison.communityVotes = 0;
          comparison.comments = 0;
        }));

        setComparisons(transformedData);
      } catch (err) {
        console.error("Unexpected error fetching comparisons:", err);
        setError("Failed to load comparisons. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [refreshTrigger]);

  useEffect(() => {
    if (isExpert && user) {
      // Check which comparisons the expert has already voted on
      const checkExpertVotes = async () => {
        try {
          const { data, error } = await supabase
            .from("votes")
            .select("comparison_id")
            .eq("expert_user_id", user.id);

          if (error) {
            console.error("Error fetching expert votes:", error);
            return;
          }

          if (data) {
            const votedIds = data.reduce<Record<string, boolean>>(
              (acc, vote) => ({ ...acc, [vote.comparison_id]: true }), 
              {}
            );
            setVotedComparisons(votedIds);
          }
        } catch (error) {
          console.error("Unexpected error checking votes:", error);
        }
      };

      checkExpertVotes();
    }
  }, [isExpert, user, refreshTrigger]);

  const handleVoteSubmitted = (comparisonId: string) => {
    setVotedComparisons(prev => ({ ...prev, [comparisonId]: true }));
    setRefreshTrigger(prev => prev + 1);
  };

  // Format yen price to show in a nice format
  const formatYenPrice = (price: number | null): string => {
    if (price === null) return "Price unavailable";
    
    // If price is >= 10,000,000 yen, show in millions
    if (price >= 10000000) {
      return `¥${(price / 1000000).toFixed(1)}M`;
    }
    
    // Otherwise show in thousands
    if (price >= 1000) {
      return `¥${(price / 1000).toFixed(0)}K`;
    }
    
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-softgray py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Comparison Feed</h1>
              <Button asChild variant="outline">
                <Link to="/compare">
                  <Plus className="mr-1 h-4 w-4" /> New Comparison
                </Link>
              </Button>
            </div>

            <p className="mt-2 text-gray-600">
              Browse public property comparisons from the community
            </p>

            {/* Search and Filters */}
            <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search comparisons..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              {filterOpen && (
                <div className="mt-4 p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">All Types</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condominium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">Any Price</option>
                      <option value="rental-low">Rental: Under ¥100,000</option>
                      <option value="rental-mid">Rental: ¥100,000 - ¥200,000</option>
                      <option value="rental-high">Rental: Over ¥200,000</option>
                      <option value="purchase-low">Purchase: Under ¥50M</option>
                      <option value="purchase-mid">Purchase: ¥50M - ¥100M</option>
                      <option value="purchase-high">Purchase: Over ¥100M</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Popular</option>
                      <option value="votes">Most Expert Votes</option>
                      <option value="comments">Most Comments</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="mt-8 space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Skeleton className="h-24 rounded-lg" />
                        <Skeleton className="h-24 rounded-lg" />
                      </div>
                      <Skeleton className="h-16 rounded-lg mb-4" />
                      <div className="flex justify-between">
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertTriangle className="text-red-500 mr-2" />
                <p>{error}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && comparisons.length === 0 && (
              <div className="mt-8 bg-white rounded-lg border p-8 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons yet</h3>
                  <p className="text-gray-600 mb-4">
                    No comparisons have been shared yet. Be the first to create one!
                  </p>
                  <Button asChild>
                    <Link to="/compare">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Comparison
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Comparison Posts */}
            {!isLoading && !error && comparisons.length > 0 && (
              <div className="mt-8 space-y-6">
                {comparisons.map((comparison) => (
                  <div
                    key={comparison.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300">
                          {comparison.userAvatar ? (
                            <img 
                              src={comparison.userAvatar} 
                              alt={comparison.userName || "User"} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#6A7FDB] flex items-center justify-center text-white font-medium">
                              {comparison.userName?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {comparison.userName || "Anonymous User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(comparison.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {comparison.propertyA.property_name || "Property A"} vs {comparison.propertyB.property_name || "Property B"}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-softgray p-3 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center">
                            {comparison.propertyA.image_urls && comparison.propertyA.image_urls.length > 0 ? (
                              <div className="w-16 h-16 mr-3 mb-2 sm:mb-0 overflow-hidden rounded-md bg-gray-100">
                                <AspectRatio ratio={1}>
                                  <img 
                                    src={comparison.propertyA.image_urls[0]} 
                                    alt={comparison.propertyA.property_name || "Property A"} 
                                    className="object-cover w-full h-full"
                                  />
                                </AspectRatio>
                              </div>
                            ) : (
                              <div className="w-16 h-16 mr-3 mb-2 sm:mb-0 flex items-center justify-center rounded-md bg-gray-100">
                                <Home className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-gray-900">{comparison.propertyA.property_name || "Property A"}</h3>
                              <p className="text-primary font-medium mt-1">
                                {comparison.propertyA.price_yen !== null 
                                  ? formatYenPrice(comparison.propertyA.price_yen)
                                  : "Price unavailable"}
                              </p>
                              {comparison.propertyA.floor_plan && (
                                <p className="text-sm text-gray-600">{comparison.propertyA.floor_plan}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-softgray p-3 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center">
                            {comparison.propertyB.image_urls && comparison.propertyB.image_urls.length > 0 ? (
                              <div className="w-16 h-16 mr-3 mb-2 sm:mb-0 overflow-hidden rounded-md bg-gray-100">
                                <AspectRatio ratio={1}>
                                  <img 
                                    src={comparison.propertyB.image_urls[0]} 
                                    alt={comparison.propertyB.property_name || "Property B"} 
                                    className="object-cover w-full h-full"
                                  />
                                </AspectRatio>
                              </div>
                            ) : (
                              <div className="w-16 h-16 mr-3 mb-2 sm:mb-0 flex items-center justify-center rounded-md bg-gray-100">
                                <Home className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-gray-900">{comparison.propertyB.property_name || "Property B"}</h3>
                              <p className="text-primary font-medium mt-1">
                                {comparison.propertyB.price_yen !== null 
                                  ? formatYenPrice(comparison.propertyB.price_yen)
                                  : "Price unavailable"}
                              </p>
                              {comparison.propertyB.floor_plan && (
                                <p className="text-sm text-gray-600">{comparison.propertyB.floor_plan}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {comparison.ai_recommendation_text && (
                        <div className="bg-softgray p-4 rounded-lg mb-4">
                          <h4 className="font-medium text-gray-900">AI Recommendation</h4>
                          <p className="mt-1 text-gray-600">
                            {comparison.ai_recommendation_text.length > 200
                              ? `${comparison.ai_recommendation_text.slice(0, 200)}...`
                              : comparison.ai_recommendation_text}
                          </p>
                        </div>
                      )}

                      {/* Expert Voting Section */}
                      {isExpert && (
                        <div className="border-t border-gray-100 pt-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Expert Voting
                            </Badge>
                          </div>
                          <FeedExpertVoting 
                            comparisonId={comparison.id}
                            propertyAName={comparison.propertyA.property_name || "Property A"}
                            propertyBName={comparison.propertyB.property_name || "Property B"}
                            hasVoted={!!votedComparisons[comparison.id]}
                            onVoteSubmitted={() => handleVoteSubmitted(comparison.id)}
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-1" />
                            <span className="text-sm">{comparison.expertVotes} expert {comparison.expertVotes === 1 ? 'vote' : 'votes'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">{comparison.communityVotes} community {comparison.communityVotes === 1 ? 'vote' : 'votes'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span className="text-sm">{comparison.comments} {comparison.comments === 1 ? 'comment' : 'comments'}</span>
                          </div>
                        </div>

                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                          className="mt-2 sm:mt-0"
                        >
                          <Link to={`/comparisons/${comparison.id}`}>View Full Comparison</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feed;
