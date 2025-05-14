
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  ThumbsUp, 
  Star, 
  Filter, 
  Search, 
  Building,
  Home
} from "lucide-react";

interface ComparisonPost {
  id: number;
  title: string;
  propertyA: string;
  propertyB: string;
  priceA: string;
  priceB: string;
  recommendation: string;
  votes: {
    expert: number;
    community: number;
  };
  comments: number;
  date: string;
  imageA?: string;
  imageB?: string;
  userName: string;
  userAvatar?: string;
}

const SAMPLE_COMPARISONS: ComparisonPost[] = [
  {
    id: 1,
    title: "Shibuya vs Nakameguro: Modern 1LDK Apartments",
    propertyA: "Shibuya Modern Apartment",
    propertyB: "Nakameguro Riverside Flat",
    priceA: "¥135,000/month",
    priceB: "¥142,000/month",
    recommendation: "The Shibuya apartment offers better value for young professionals considering its central location and lower price point.",
    votes: {
      expert: 3,
      community: 12,
    },
    comments: 5,
    date: "2025-05-10",
    userName: "Tanaka Yuki",
  },
  {
    id: 2,
    title: "Family Home Decision: Setagaya vs Suginami",
    propertyA: "Setagaya Park House",
    propertyB: "Suginami Garden Home",
    priceA: "¥68,000,000",
    priceB: "¥62,500,000",
    recommendation: "The Suginami home offers better value with its larger garden space and proximity to top-rated schools.",
    votes: {
      expert: 2,
      community: 8,
    },
    comments: 3,
    date: "2025-05-08",
    userName: "Smith John",
  },
  {
    id: 3,
    title: "Studio Apartment Comparison in Shinjuku",
    propertyA: "Shinjuku Station Apartment",
    propertyB: "Shinjuku Gyoen View Studio",
    priceA: "¥95,000/month",
    priceB: "¥88,000/month",
    recommendation: "The Shinjuku Gyoen property provides a better living environment with its park views, despite being a 3-minute further walk to the station.",
    votes: {
      expert: 4,
      community: 15,
    },
    comments: 7,
    date: "2025-05-05",
    userName: "Kobayashi Mei",
  }
];

const Feed = () => {
  const [comparisons, setComparisons] = useState<ComparisonPost[]>(SAMPLE_COMPARISONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-softgray py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Comparison Feed</h1>
              <Button asChild variant="outline">
                <Link to="/compare">New Comparison</Link>
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

            {/* Comparison Posts */}
            <div className="mt-8 space-y-6">
              {comparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300">
                        {comparison.userAvatar && (
                          <img 
                            src={comparison.userAvatar} 
                            alt={comparison.userName} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {comparison.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(comparison.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {comparison.title}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-softgray p-3 rounded-lg">
                        <div className="flex items-center">
                          <Home className="h-5 w-5 text-primary mr-2" />
                          <h3 className="font-medium text-gray-900">{comparison.propertyA}</h3>
                        </div>
                        <p className="text-primary font-medium mt-1">{comparison.priceA}</p>
                      </div>

                      <div className="bg-softgray p-3 rounded-lg">
                        <div className="flex items-center">
                          <Home className="h-5 w-5 text-secondary mr-2" />
                          <h3 className="font-medium text-gray-900">{comparison.propertyB}</h3>
                        </div>
                        <p className="text-primary font-medium mt-1">{comparison.priceB}</p>
                      </div>
                    </div>

                    <div className="bg-softgray p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900">AI Recommendation</h4>
                      <p className="mt-1 text-gray-600">{comparison.recommendation}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center text-gray-600">
                          <Building className="h-4 w-4 mr-1" />
                          <span className="text-sm">{comparison.votes.expert} expert votes</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span className="text-sm">{comparison.votes.community} community votes</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          <span className="text-sm">{comparison.comments} comments</span>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feed;
