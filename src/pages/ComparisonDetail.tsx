import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ImageIcon,
  ThumbsDown,
  ThumbsUp,
  Share,
  Calendar,
} from "lucide-react";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpertSection } from "@/components/ExpertSection";

interface PropertyData {
  id: string;
  property_name: string | null;
  address: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  commute_minutes: number | null;
  property_type: string | null;
  image_urls: string[] | null;
  notes: string | null;
}

interface ComparisonData {
  id: string;
  created_at: string;
  user_id: string | null;
  property_a: PropertyData;
  property_b: PropertyData;
  recommendations?: AIRecommendation[];
  image_extraction_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AIRecommendation {
  id: string;
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
  }[];
  final_recommendation: string;
  created_at: string;
}

const ComparisonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Handle retry image extraction
  const handleRetryImageExtraction = async (comparisonId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('retry-image-extraction', {
        body: { comparison_id: comparisonId }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Retry failed",
          description: "Could not retry image extraction. Please try again later.",
        });
        return;
      }

      toast({
        title: "Retry started",
        description: "Image extraction has been restarted. Please wait...",
      });
    } catch (error) {
      console.error('Retry image extraction error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while retrying.",
      });
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates for image extraction
  useComparisonSubscription({
    comparisonId: id || '',
    onImageExtractionComplete: async () => {
      // Refresh the comparison data to get the updated images
      if (id) {
        try {
          const { data: refreshedData, error } = await supabase
            .from('comparisons')
            .select(`
              id,
              created_at,
              user_id,
              image_extraction_status,
              property_a:properties!comparisons_property_a_id_fkey(
                id,
                property_name,
                address,
                price_yen,
                floor_plan,
                commute_minutes,
                property_type,
                image_urls,
                notes
              ),
              property_b:properties!comparisons_property_b_id_fkey(
                id,
                property_name,
                address,
                price_yen,
                floor_plan,
                commute_minutes,
                property_type,
                image_urls,
                notes
              )
            `)
            .eq('id', id)
            .single();

          if (!error && refreshedData) {
            setComparison(refreshedData);
            
            toast({
              title: "Images loaded!",
              description: "Property images have been successfully extracted.",
            });
          }
        } catch (error) {
          console.error('Error refreshing comparison data:', error);
        }
      }
    },
    onImageExtractionStatusChange: (status) => {
      if (comparison) {
        setComparison({
          ...comparison,
          image_extraction_status: status
        });
      }
    }
  });

  // Function to format price in Japanese Yen (reused from Compare.tsx)
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const shareComparison = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Property Comparison: ${comparison?.property_a.property_name} vs ${comparison?.property_b.property_name}`,
          url: url,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Comparison link copied to clipboard",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to copy link",
          description: "Please copy the URL manually",
        });
      }
    }
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!id) {
        setError("No comparison ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch comparison with properties and recommendations
        const { data: comparisonData, error: comparisonError } = await supabase
          .from("comparisons")
          .select(`
            id,
            created_at,
            user_id,
            image_extraction_status,
            property_a:properties!comparisons_property_a_id_fkey(
              id,
              property_name,
              address,
              price_yen,
              floor_plan,
              commute_minutes,
              property_type,
              image_urls,
              notes
            ),
            property_b:properties!comparisons_property_b_id_fkey(
              id,
              property_name,
              address,
              price_yen,
              floor_plan,
              commute_minutes,
              property_type,
              image_urls,
              notes
            ),
            recommendations(
              id,
              property_a_pros,
              property_a_cons,
              property_b_pros,
              property_b_cons,
              summary_table,
              final_recommendation,
              created_at
            )
          `)
          .eq("id", id)
          .single();

        if (comparisonError) {
          console.error("Error fetching comparison:", comparisonError);
          setError("Comparison not found");
          setIsLoading(false);
          return;
        }

        if (!comparisonData) {
          setError("Comparison not found");
          setIsLoading(false);
          return;
        }

        // Type assertion for the joined data
        const typedComparison: ComparisonData = {
          id: comparisonData.id,
          created_at: comparisonData.created_at,
          user_id: comparisonData.user_id,
          property_a: comparisonData.property_a as PropertyData,
          property_b: comparisonData.property_b as PropertyData,
          recommendations: comparisonData.recommendations as AIRecommendation[],
        };

        setComparison(typedComparison);

        // Set the first recommendation if available
        if (typedComparison.recommendations && typedComparison.recommendations.length > 0) {
          setRecommendation(typedComparison.recommendations[0]);
        }

      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load comparison data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-[#F7F7F8] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-6">
                  <Skeleton className="aspect-video mb-4" />
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="p-6">
                  <Skeleton className="aspect-video mb-4" />
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="bg-[#F7F7F8] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Comparison Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              {error || "The comparison you're looking for doesn't exist."}
            </p>
            <Button asChild>
              <Link to="/feed">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feed
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F7F8] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {comparison.property_a.property_name || "Property A"} vs{" "}
                  {comparison.property_b.property_name || "Property B"}
                </h1>
                <div className="flex items-center text-gray-600 mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Created {new Date(comparison.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
                <Button variant="outline" onClick={shareComparison}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Property Comparison Cards - Reused from Compare.tsx */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Property A */}
                <div className="p-6">
                  <PropertyImageDisplay
                    imageUrls={comparison.property_a.image_urls}
                    propertyName={comparison.property_a.property_name || "Property A"}
                    imageExtractionStatus={comparison.image_extraction_status}
                    className="mb-4"
                    aspectRatio="video"
                    comparisonId={comparison.id}
                    onRetryImageExtraction={handleRetryImageExtraction}
                  />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {comparison.property_a.property_name || "Property A"}
                  </h3>
                  {comparison.property_a.price_yen && (
                    <p className="text-[#6A7FDB] font-medium">
                      {formatPrice(comparison.property_a.price_yen)}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {comparison.property_a.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium">
                          {comparison.property_a.address}
                        </span>
                      </div>
                    )}
                    {comparison.property_a.floor_plan && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor Plan:</span>
                        <span className="font-medium">
                          {comparison.property_a.floor_plan}
                        </span>
                      </div>
                    )}
                    {comparison.property_a.commute_minutes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commute Time:</span>
                        <span className="font-medium">
                          {comparison.property_a.commute_minutes} minutes
                        </span>
                      </div>
                    )}
                    {comparison.property_a.property_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Type:</span>
                        <span className="font-medium">
                          {comparison.property_a.property_type}
                        </span>
                      </div>
                    )}
                    {comparison.property_a.notes && (
                      <div className="mt-2">
                        <span className="text-gray-600 block">Notes:</span>
                        <p className="mt-1 text-sm">{comparison.property_a.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property B */}
                <div className="p-6">
                  <PropertyImageDisplay
                    imageUrls={comparison.property_b.image_urls}
                    propertyName={comparison.property_b.property_name || "Property B"}
                    imageExtractionStatus={comparison.image_extraction_status}
                    className="mb-4"
                    aspectRatio="video"
                    comparisonId={comparison.id}
                    onRetryImageExtraction={handleRetryImageExtraction}
                  />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {comparison.property_b.property_name || "Property B"}
                  </h3>
                  {comparison.property_b.price_yen && (
                    <p className="text-[#6A7FDB] font-medium">
                      {formatPrice(comparison.property_b.price_yen)}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {comparison.property_b.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium">
                          {comparison.property_b.address}
                        </span>
                      </div>
                    )}
                    {comparison.property_b.floor_plan && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor Plan:</span>
                        <span className="font-medium">
                          {comparison.property_b.floor_plan}
                        </span>
                      </div>
                    )}
                    {comparison.property_b.commute_minutes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commute Time:</span>
                        <span className="font-medium">
                          {comparison.property_b.commute_minutes} minutes
                        </span>
                      </div>
                    )}
                    {comparison.property_b.property_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Type:</span>
                        <span className="font-medium">
                          {comparison.property_b.property_type}
                        </span>
                      </div>
                    )}
                    {comparison.property_b.notes && (
                      <div className="mt-2">
                        <span className="text-gray-600 block">Notes:</span>
                        <p className="mt-1 text-sm">{comparison.property_b.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation Section - Reused from Compare.tsx */}
            {recommendation && (
              <div className="animate-fade-in space-y-8 mb-8">
                {/* Summary Table */}
                <Card>
                  <CardHeader className="bg-[#F7F7F8]">
                    <CardTitle className="text-xl">
                      Property Comparison Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feature</TableHead>
                          <TableHead>Property A</TableHead>
                          <TableHead>Property B</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recommendation.summary_table.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {row.field}
                            </TableCell>
                            <TableCell>{row.property_a}</TableCell>
                            <TableCell>{row.property_b}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Property A */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>
                        {comparison.property_a.property_name || "Property A"}
                      </CardTitle>
                      <CardDescription>Pros and Cons</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pros */}
                      <div>
                        <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                          Pros
                        </h4>
                        <ul className="space-y-1 pl-6 list-disc">
                          {recommendation.property_a_pros.map((pro, i) => (
                            <li key={i}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Cons */}
                      <div>
                        <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                          Cons
                        </h4>
                        <ul className="space-y-1 pl-6 list-disc">
                          {recommendation.property_a_cons.map((con, i) => (
                            <li key={i}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property B */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>
                        {comparison.property_b.property_name || "Property B"}
                      </CardTitle>
                      <CardDescription>Pros and Cons</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pros */}
                      <div>
                        <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                          Pros
                        </h4>
                        <ul className="space-y-1 pl-6 list-disc">
                          {recommendation.property_b_pros.map((pro, i) => (
                            <li key={i}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Cons */}
                      <div>
                        <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                          Cons
                        </h4>
                        <ul className="space-y-1 pl-6 list-disc">
                          {recommendation.property_b_cons.map((con, i) => (
                            <li key={i}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Final Recommendation */}
                <Card className="bg-[#E5DEFF] border-[#C2A9FF]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-[#6A7FDB]">
                      DuoHome's Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 whitespace-pre-line">
                      {recommendation.final_recommendation}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Expert Section - Reused from Compare.tsx */}
            <div className="mt-8">
              <ExpertSection
                comparisonId={comparison.id}
                propertyAName={
                  comparison.property_a.property_name || "Property A"
                }
                propertyBName={
                  comparison.property_b.property_name || "Property B"
                }
              />
            </div>

            {/* Actions */}
            <div className="mt-8 text-center space-y-4">
              {!recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 mb-2">
                    AI recommendation is not available for this comparison yet.
                  </p>
                  <Button asChild>
                    <Link to="/compare">
                      Create New Comparison with AI Analysis
                    </Link>
                  </Button>
                </div>
              )}

              <Button variant="outline" asChild>
                <Link to="/compare">
                  Compare Different Properties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default ComparisonDetail;
