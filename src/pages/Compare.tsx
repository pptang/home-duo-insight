
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowDown, ImageIcon, Upload } from "lucide-react";

interface PropertyData {
  name: string;
  price: string;
  layout: string;
  size: string;
  station: string;
  walkTime: string;
  buildingAge: string;
  imageUrl: string;
}

const emptyProperty: PropertyData = {
  name: "",
  price: "",
  layout: "",
  size: "",
  station: "",
  walkTime: "",
  buildingAge: "",
  imageUrl: "",
};

const Compare = () => {
  const [propertyA, setPropertyA] = useState<PropertyData>(emptyProperty);
  const [propertyB, setPropertyB] = useState<PropertyData>(emptyProperty);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setShowComparison(true);
    }, 1500);
  };

  const handleUpdateProperty = (
    property: "A" | "B",
    field: keyof PropertyData,
    value: string
  ) => {
    if (property === "A") {
      setPropertyA({ ...propertyA, [field]: value });
    } else {
      setPropertyB({ ...propertyB, [field]: value });
    }
  };

  const isFormValid = () => {
    const requiredFieldsA = propertyA.name && propertyA.price;
    const requiredFieldsB = propertyB.name && propertyB.price;
    return requiredFieldsA && requiredFieldsB;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-softgray py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Compare Two Properties</h1>
            <p className="mt-2 text-gray-600">
              Enter the details of two properties you're considering to see a side-by-side comparison.
            </p>

            {!showComparison ? (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Property Input Methods</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4 text-center cursor-not-allowed opacity-60">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Paste URL from Supported Sites</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Coming soon: Import data from Suumo, at home, and more
                      </p>
                    </div>
                    <div className="border border-primary rounded-lg p-4 text-center bg-primary/5">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Manual Entry</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Enter property details and upload images manually
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Property A Form */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-primary/10 p-4 border-b border-primary/20">
                      <h2 className="text-lg font-semibold text-gray-900">Property A</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Name/Address*
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., Shibuya Apartment"
                          value={propertyA.name}
                          onChange={(e) =>
                            handleUpdateProperty("A", "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (monthly rent or purchase price)*
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., ¥135,000/month"
                          value={propertyA.price}
                          onChange={(e) =>
                            handleUpdateProperty("A", "price", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Layout
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 1LDK"
                            value={propertyA.layout}
                            onChange={(e) =>
                              handleUpdateProperty("A", "layout", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Size (m²)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 45"
                            value={propertyA.size}
                            onChange={(e) =>
                              handleUpdateProperty("A", "size", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nearest Station
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., Shibuya"
                            value={propertyA.station}
                            onChange={(e) =>
                              handleUpdateProperty("A", "station", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Walk Time (min)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 7"
                            value={propertyA.walkTime}
                            onChange={(e) =>
                              handleUpdateProperty("A", "walkTime", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Building Age (years)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., 10"
                          value={propertyA.buildingAge}
                          onChange={(e) =>
                            handleUpdateProperty("A", "buildingAge", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Image
                        </label>
                        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Upload an image or paste a URL
                          </p>
                          <input
                            type="text"
                            className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Image URL (optional)"
                            value={propertyA.imageUrl}
                            onChange={(e) =>
                              handleUpdateProperty("A", "imageUrl", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property B Form */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-secondary/20 p-4 border-b border-secondary/30">
                      <h2 className="text-lg font-semibold text-gray-900">Property B</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Name/Address*
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., Nakameguro Apartment"
                          value={propertyB.name}
                          onChange={(e) =>
                            handleUpdateProperty("B", "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (monthly rent or purchase price)*
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., ¥142,000/month"
                          value={propertyB.price}
                          onChange={(e) =>
                            handleUpdateProperty("B", "price", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Layout
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 1LDK"
                            value={propertyB.layout}
                            onChange={(e) =>
                              handleUpdateProperty("B", "layout", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Size (m²)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 48"
                            value={propertyB.size}
                            onChange={(e) =>
                              handleUpdateProperty("B", "size", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nearest Station
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., Nakameguro"
                            value={propertyB.station}
                            onChange={(e) =>
                              handleUpdateProperty("B", "station", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Walk Time (min)
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., 5"
                            value={propertyB.walkTime}
                            onChange={(e) =>
                              handleUpdateProperty("B", "walkTime", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Building Age (years)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., 5"
                          value={propertyB.buildingAge}
                          onChange={(e) =>
                            handleUpdateProperty("B", "buildingAge", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Image
                        </label>
                        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Upload an image or paste a URL
                          </p>
                          <input
                            type="text"
                            className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Image URL (optional)"
                            value={propertyB.imageUrl}
                            onChange={(e) =>
                              handleUpdateProperty("B", "imageUrl", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Button 
                    size="lg"
                    onClick={handleCompare}
                    disabled={!isFormValid() || isLoading}
                    className="relative"
                  >
                    {isLoading ? (
                      <>
                        <span className="opacity-0">Compare Properties</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          Analyzing Properties...
                        </span>
                      </>
                    ) : (
                      <>Compare Properties</>
                    )}
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    * Required fields must be filled
                  </p>
                </div>
              </div>
            ) : (
              // Comparison Results
              <div className="mt-8 animate-fade-in">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <div className="p-6">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4">
                        {propertyA.imageUrl && (
                          <img
                            src={propertyA.imageUrl}
                            alt={propertyA.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{propertyA.name}</h3>
                      <p className="text-primary font-medium">{propertyA.price}</p>
                      <div className="mt-4 space-y-2">
                        {propertyA.layout && propertyA.size && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Layout:</span>
                            <span className="font-medium">
                              {propertyA.layout} ({propertyA.size}m²)
                            </span>
                          </div>
                        )}
                        {propertyA.station && propertyA.walkTime && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nearest Station:</span>
                            <span className="font-medium">
                              {propertyA.station} ({propertyA.walkTime} min)
                            </span>
                          </div>
                        )}
                        {propertyA.buildingAge && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Building Age:</span>
                            <span className="font-medium">{propertyA.buildingAge} years</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4">
                        {propertyB.imageUrl && (
                          <img
                            src={propertyB.imageUrl}
                            alt={propertyB.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{propertyB.name}</h3>
                      <p className="text-primary font-medium">{propertyB.price}</p>
                      <div className="mt-4 space-y-2">
                        {propertyB.layout && propertyB.size && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Layout:</span>
                            <span className="font-medium">
                              {propertyB.layout} ({propertyB.size}m²)
                            </span>
                          </div>
                        )}
                        {propertyB.station && propertyB.walkTime && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nearest Station:</span>
                            <span className="font-medium">
                              {propertyB.station} ({propertyB.walkTime} min)
                            </span>
                          </div>
                        )}
                        {propertyB.buildingAge && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Building Age:</span>
                            <span className="font-medium">{propertyB.buildingAge} years</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-softgray border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900">AI Recommendation</h4>
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <p className="text-gray-600">
                        Based on the information provided, {propertyA.name} appears to be slightly better value,
                        considering its {propertyA.price} price point compared to {propertyB.name} at {propertyB.price}.
                        {propertyA.station && propertyB.station && 
                          ` The location at ${propertyA.station} offers good access to central areas.`}
                        {propertyA.buildingAge && propertyB.buildingAge && 
                          ` While ${propertyB.name} is newer (${propertyB.buildingAge} years vs ${propertyA.buildingAge} years), 
                          the price difference may not justify the additional cost unless building age is a top priority.`}
                      </p>
                    </div>

                    <h4 className="font-semibold text-gray-900 mt-6">Expert Insights</h4>
                    <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                          <div className="ml-3">
                            <h5 className="font-medium text-gray-900">Sato Yuki</h5>
                            <p className="text-sm text-gray-500">Tokyo Real Estate Specialist</p>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-600">
                          I recommend {propertyA.name} for its better price-to-value ratio and convenient location.
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                          <div className="ml-3">
                            <h5 className="font-medium text-gray-900">Takahashi Ren</h5>
                            <p className="text-sm text-gray-500">Investment Property Advisor</p>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-600">
                          {propertyB.name} may have better long-term value retention due to its newer construction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowComparison(false)}
                    className="mr-4"
                  >
                    Edit Properties
                  </Button>
                  <Button>
                    Save Comparison
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
