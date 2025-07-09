import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDown,
  CheckCircle,
  ImageIcon,
  ThumbsDown,
  ThumbsUp,
  Upload,
  XCircle,
} from "lucide-react";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ExpertSection } from "@/components/ExpertSection";

interface PropertyData {
  property_name: string;
  address: string;
  price_yen: number;
  floor_plan: string;
  commute_minutes: number;
  property_type: string;
  image_urls: string[];
  notes: string;
}

interface ComparisonResult {
  comparison_id: string;
  property_a: PropertyData;
  property_b: PropertyData;
  image_extraction_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AIRecommendation {
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
}

// Improved URL validation schema
const urlSchema = z.object({
  property_url_a: z
    .string()
    .url("Must be a valid URL")
    .min(5, "Property A URL is too short")
    .refine(
      (url) => url.startsWith("http"),
      "URL must start with http:// or https://"
    ),
  property_url_b: z
    .string()
    .url("Must be a valid URL")
    .min(5, "Property B URL is too short")
    .refine(
      (url) => url.startsWith("http"),
      "URL must start with http:// or https://"
    ),
});

const personalizationSchema = z.object({
  has_pets: z.boolean().default(false),
  works_from_home: z.boolean().default(false),
  family_size: z.number().min(1).max(10).default(1),
  commute_priority: z.number().min(1).max(5).default(3),
  why_move: z.string().max(500).default(""),
  top_priority_1: z.string().max(100).default(""),
  top_priority_2: z.string().max(100).default(""),
  top_priority_3: z.string().max(100).default(""),
});

type FormValues = z.infer<typeof urlSchema>;
type PersonalizationValues = z.infer<typeof personalizationSchema>;

const Compare = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] =
    useState(false);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation | null>(null);
  const [showPersonalizationDialog, setShowPersonalizationDialog] =
    useState(false);
  const { user } = useAuth();
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

  // Subscribe to real-time updates for image extraction
  useComparisonSubscription({
    comparisonId: comparisonResult?.comparison_id || '',
    onImageExtractionComplete: async () => {
      // Refresh the comparison data to get the updated images
      if (comparisonResult?.comparison_id) {
        try {
          const { data: refreshedData, error } = await supabase
            .from('comparisons')
            .select(`
              *,
              property_a:properties!comparisons_property_a_id_fkey(*),
              property_b:properties!comparisons_property_b_id_fkey(*)
            `)
            .eq('id', comparisonResult.comparison_id)
            .single();

          if (!error && refreshedData) {
            setComparisonResult({
              comparison_id: refreshedData.id,
              property_a: refreshedData.property_a as PropertyData,
              property_b: refreshedData.property_b as PropertyData,
              image_extraction_status: refreshedData.image_extraction_status as 'pending' | 'in_progress' | 'completed' | 'failed'
            });
            
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
      if (comparisonResult) {
        setComparisonResult({
          ...comparisonResult,
          image_extraction_status: status
        });
      }
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      property_url_a: "",
      property_url_b: "",
    },
  });

  const personalizationForm = useForm<PersonalizationValues>({
    resolver: zodResolver(personalizationSchema),
    defaultValues: {
      has_pets: false,
      works_from_home: false,
      family_size: 1,
      commute_priority: 3,
      why_move: "",
      top_priority_1: "",
      top_priority_2: "",
      top_priority_3: "",
    },
  });

  const handleAnalyzeProperties = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Show loading stages for better user feedback
      setLoadingStage("Fetching property webpages...");

      // Call the Supabase Edge Function with user_id
      const { data, error } = await supabase.functions.invoke(
        "analyze-properties",
        {
          body: {
            property_url_a: values.property_url_a,
            property_url_b: values.property_url_b,
            user_id: user?.id || null, // Include user_id if logged in
          },
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Could not extract data. Please check the URLs or try another.",
        });
        return;
      }

      if (data.error) {
        console.error("API error:", data.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error,
        });
        return;
      }

      // Success - set comparison result
      setComparisonResult(data);
      toast({
        title: "Success",
        description: "Properties analyzed successfully!",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const resetForm = () => {
    form.reset();
    setComparisonResult(null);
    setAiRecommendation(null);
  };

  const handleGetRecommendation = async (values: PersonalizationValues) => {
    if (!comparisonResult) return;

    setIsGeneratingRecommendation(true);
    setShowPersonalizationDialog(false);

    try {
      // Update the comparison with all the preference data
      const { error: updateError } = await supabase
        .from("comparisons")
        .update({ 
          why_move: values.why_move,
          top_priority_1: values.top_priority_1,
          top_priority_2: values.top_priority_2,
          top_priority_3: values.top_priority_3
        })
        .eq("id", comparisonResult.comparison_id);

      if (updateError) {
        console.error("Error updating comparison with preferences:", updateError);
      }

      const { data, error } = await supabase.functions.invoke(
        "generate-recommendation",
        {
          body: {
            comparison_id: comparisonResult.comparison_id,
            property_a: comparisonResult.property_a,
            property_b: comparisonResult.property_b,
            user_profile: values,
            user_id: user?.id || null, // Include user_id if logged in
          },
        }
      );

      if (error) {
        console.error("Recommendation error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not generate recommendation. Please try again.",
        });
        return;
      }

      // Success - set AI recommendation
      setAiRecommendation(data);
      toast({
        title: "Success",
        description: "Recommendation generated successfully!",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "We couldn't generate your recommendation. Please try again.",
      });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  // Function to format price in Japanese Yen
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-[#F7F7F8] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              Compare Two Properties
            </h1>
            <p className="mt-2 text-gray-600">
              Paste the URLs of two properties you're considering to see a
              side-by-side comparison.
            </p>

            {!comparisonResult ? (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Property URL Input
                  </h2>
                  <div className="space-y-6">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleAnalyzeProperties)}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="property_url_a"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">
                                Property A URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/property/123"
                                  {...field}
                                  className="bg-white"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="property_url_b"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">
                                Property B URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/property/456"
                                  {...field}
                                  className="bg-white"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="mt-8 text-center">
                          <Button
                            size="lg"
                            type="submit"
                            disabled={isLoading || !form.formState.isValid}
                            className="relative bg-[#6A7FDB] hover:bg-[#5A6DCB] text-white px-6 py-3 rounded-lg"
                          >
                            {isLoading ? (
                              <>
                                <span className="opacity-0">
                                  Analyze Properties
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center">
                                  {loadingStage || "Analyzing properties..."}
                                </span>
                              </>
                            ) : (
                              <>Analyze Properties</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              </div>
            ) : (
              // Comparison Results
              <div className="mt-8 animate-fade-in">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Property A */}
                    <div className="p-6">
                      <PropertyImageDisplay
                        imageUrls={comparisonResult.property_a.image_urls}
                        propertyName={comparisonResult.property_a.property_name}
                        imageExtractionStatus={comparisonResult.image_extraction_status}
                        className="mb-4"
                        aspectRatio="video"
                        comparisonId={comparisonResult.comparison_id}
                        onRetryImageExtraction={handleRetryImageExtraction}
                      />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {comparisonResult.property_a.property_name}
                      </h3>
                      <p className="text-[#6A7FDB] font-medium">
                        {formatPrice(comparisonResult.property_a.price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">
                            {comparisonResult.property_a.address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">
                            {comparisonResult.property_a.floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">
                            {comparisonResult.property_a.commute_minutes}{" "}
                            minutes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">
                            {comparisonResult.property_a.property_type}
                          </span>
                        </div>
                        {comparisonResult.property_a.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">
                              {comparisonResult.property_a.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property B */}
                    <div className="p-6">
                      <PropertyImageDisplay
                        imageUrls={comparisonResult.property_b.image_urls}
                        propertyName={comparisonResult.property_b.property_name}
                        imageExtractionStatus={comparisonResult.image_extraction_status}
                        className="mb-4"
                        aspectRatio="video"
                        comparisonId={comparisonResult.comparison_id}
                        onRetryImageExtraction={handleRetryImageExtraction}
                      />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {comparisonResult.property_b.property_name}
                      </h3>
                      <p className="text-[#6A7FDB] font-medium">
                        {formatPrice(comparisonResult.property_b.price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">
                            {comparisonResult.property_b.address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">
                            {comparisonResult.property_b.floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">
                            {comparisonResult.property_b.commute_minutes}{" "}
                            minutes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">
                            {comparisonResult.property_b.property_type}
                          </span>
                        </div>
                        {comparisonResult.property_b.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">
                              {comparisonResult.property_b.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Recommendation Button */}
                <div className="text-center mb-8">
                  <Button
                    size="lg"
                    onClick={() => setShowPersonalizationDialog(true)}
                    disabled={isGeneratingRecommendation}
                    className="relative bg-[#6A7FDB] hover:bg-[#5A6DCB] text-white px-6 py-3 rounded-lg"
                  >
                    {isGeneratingRecommendation ? (
                      <>
                        <span className="opacity-0">Get My Recommendation</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          Generating your recommendation...
                        </span>
                      </>
                    ) : (
                      <>Get My Recommendation</>
                    )}
                  </Button>
                </div>

                {/* AI Recommendation Result */}
                {aiRecommendation && (
                  <div className="animate-fade-in space-y-8">
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
                            {aiRecommendation.summary_table.map((row, i) => (
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
                            {comparisonResult.property_a.property_name}
                          </CardTitle>
                          <CardDescription>Pros and Cons</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Pros
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_a_pros.map(
                                (pro, i) => (
                                  <li key={i}>{pro}</li>
                                )
                              )}
                            </ul>
                          </div>
                          {/* Cons */}
                          <div>
                            <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                              <ThumbsDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Cons
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_a_cons.map(
                                (con, i) => (
                                  <li key={i}>{con}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Property B */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>
                            {comparisonResult.property_b.property_name}
                          </CardTitle>
                          <CardDescription>Pros and Cons</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Pros
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_b_pros.map(
                                (pro, i) => (
                                  <li key={i}>{pro}</li>
                                )
                              )}
                            </ul>
                          </div>
                          {/* Cons */}
                          <div>
                            <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                              <ThumbsDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Cons
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_b_cons.map(
                                (con, i) => (
                                  <li key={i}>{con}</li>
                                )
                              )}
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
                          {aiRecommendation.final_recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Expert Section */}
                {comparisonResult && (
                  <div className="mt-8">
                    <ExpertSection
                      comparisonId={comparisonResult.comparison_id}
                      propertyAName={
                        comparisonResult.property_a.property_name ||
                        "Property A"
                      }
                      propertyBName={
                        comparisonResult.property_b.property_name ||
                        "Property B"
                      }
                    />
                  </div>
                )}

                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="bg-white"
                  >
                    Compare Different Properties
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Personalization Dialog */}
      <Dialog
        open={showPersonalizationDialog}
        onOpenChange={setShowPersonalizationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tell us about your preferences</DialogTitle>
            <DialogDescription>
              Help us personalize your property recommendation by answering a
              few questions.
            </DialogDescription>
          </DialogHeader>
          <Form {...personalizationForm}>
            <form
              onSubmit={personalizationForm.handleSubmit(
                handleGetRecommendation
              )}
              className="space-y-6 py-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={personalizationForm.control}
                  name="has_pets"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Do you have pets?</FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-l-md ${
                              field.value
                                ? "bg-[#6A7FDB] text-white"
                                : "bg-gray-100"
                            }`}
                            onClick={() => field.onChange(true)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-r-md ${
                              !field.value
                                ? "bg-[#6A7FDB] text-white"
                                : "bg-gray-100"
                            }`}
                            onClick={() => field.onChange(false)}
                          >
                            No
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="works_from_home"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Do you work from home?</FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-l-md ${
                              field.value
                                ? "bg-[#6A7FDB] text-white"
                                : "bg-gray-100"
                            }`}
                            onClick={() => field.onChange(true)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-r-md ${
                              !field.value
                                ? "bg-[#6A7FDB] text-white"
                                : "bg-gray-100"
                            }`}
                            onClick={() => field.onChange(false)}
                          >
                            No
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="family_size"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Family Size</FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            className="w-16 text-center"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                          <span className="ml-2">people</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="commute_priority"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>
                          How important is commute time? (1-5)
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              className={`w-8 h-8 rounded-full ${
                                field.value === value
                                  ? "bg-[#6A7FDB] text-white"
                                  : "bg-gray-100"
                              }`}
                              onClick={() => field.onChange(value)}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="why_move"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <div className="space-y-2">
                        <FormLabel htmlFor="whyMove">
                          Why do you want to move?
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          This helps us understand what matters most to you — e.g., "I want a quieter space for remote work."
                        </p>
                      </div>
                      <FormControl>
                        <Textarea
                          id="whyMove"
                          placeholder="Tell us about your motivation for moving..."
                          maxLength={500}
                          rows={4}
                          className="w-full mt-2 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-gray-400 text-right mt-1">
                        {field.value.length}/500 characters
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border p-4">
                  <div className="space-y-2 mb-4">
                    <FormLabel>What are your top 3 priorities when choosing a home?</FormLabel>
                    <p className="text-sm text-gray-500">
                      Help us focus on what matters most to you (optional)
                    </p>
                  </div>
                  <div className="space-y-3">
                    <FormField
                      control={personalizationForm.control}
                      name="top_priority_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="First Priority (e.g., Quiet neighborhood)"
                              className="w-full"
                              maxLength={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalizationForm.control}
                      name="top_priority_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Second Priority (e.g., Good natural light)"
                              className="w-full"
                              maxLength={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalizationForm.control}
                      name="top_priority_3"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Third Priority (e.g., Near shopping areas)"
                              className="w-full"
                              maxLength={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Generate Recommendation</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Compare;
