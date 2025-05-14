
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDown, ImageIcon, Upload } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
}

const urlSchema = z.object({
  property_url_a: z.string().url("Must be a valid URL").min(1, "Property A URL is required"),
  property_url_b: z.string().url("Must be a valid URL").min(1, "Property B URL is required"),
});

type FormValues = z.infer<typeof urlSchema>;

const Compare = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      property_url_a: "",
      property_url_b: "",
    },
  });

  const handleAnalyzeProperties = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-properties", {
        body: {
          property_url_a: values.property_url_a,
          property_url_b: values.property_url_b,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not extract data. Please check the URLs or try another.",
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
    }
  };

  const resetForm = () => {
    form.reset();
    setComparisonResult(null);
  };

  // Function to format price in Japanese Yen
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY',
      maximumFractionDigits: 0 
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-[#F7F7F8] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Compare Two Properties</h1>
            <p className="mt-2 text-gray-600">
              Paste the URLs of two properties you're considering to see a side-by-side comparison.
            </p>

            {!comparisonResult ? (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Property URL Input</h2>
                  <div className="space-y-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAnalyzeProperties)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="property_url_a"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Property A URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/property/123"
                                  {...field}
                                  className="bg-white"
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
                              <FormLabel className="font-medium">Property B URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/property/456"
                                  {...field}
                                  className="bg-white"
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
                                <span className="opacity-0">Analyze Properties</span>
                                <span className="absolute inset-0 flex items-center justify-center">
                                  Analyzing properties with AI... please wait
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
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Property A */}
                    <div className="p-6">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                        {comparisonResult.property_a.image_urls && comparisonResult.property_a.image_urls.length > 0 ? (
                          <img
                            src={comparisonResult.property_a.image_urls[0]}
                            alt={comparisonResult.property_a.property_name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{comparisonResult.property_a.property_name}</h3>
                      <p className="text-[#6A7FDB] font-medium">{formatPrice(comparisonResult.property_a.price_yen)}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">{comparisonResult.property_a.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">{comparisonResult.property_a.floor_plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">{comparisonResult.property_a.commute_minutes} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">{comparisonResult.property_a.property_type}</span>
                        </div>
                        {comparisonResult.property_a.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">{comparisonResult.property_a.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property B */}
                    <div className="p-6">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                        {comparisonResult.property_b.image_urls && comparisonResult.property_b.image_urls.length > 0 ? (
                          <img
                            src={comparisonResult.property_b.image_urls[0]}
                            alt={comparisonResult.property_b.property_name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{comparisonResult.property_b.property_name}</h3>
                      <p className="text-[#6A7FDB] font-medium">{formatPrice(comparisonResult.property_b.price_yen)}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">{comparisonResult.property_b.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">{comparisonResult.property_b.floor_plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">{comparisonResult.property_b.commute_minutes} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">{comparisonResult.property_b.property_type}</span>
                        </div>
                        {comparisonResult.property_b.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">{comparisonResult.property_b.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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

      <Footer />
    </div>
  );
};

export default Compare;
