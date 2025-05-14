
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Users, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-softgray py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl md:animate-slide-in">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Still deciding between two homes?
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                  Make confident housing decisions in Japan with side-by-side comparisons, AI analysis, and expert insights.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button asChild size="lg" className="text-md">
                    <Link to="/compare">Compare Properties <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-md">
                    <Link to="/feed">Browse Comparisons</Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="absolute -top-4 -left-4 w-3/4 h-64 bg-secondary rounded-lg transform -rotate-3"></div>
                <div className="absolute top-10 right-0 w-3/4 h-64 bg-primary rounded-lg transform rotate-3"></div>
                <div className="relative w-full h-80 bg-white shadow-xl rounded-xl p-4">
                  <div className="flex h-full items-center justify-center text-center text-gray-500">
                    <p className="font-medium">Preview comparison interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 text-xl text-gray-600">
                Three powerful components to help you make the right decision
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-softgray">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI Analysis</h3>
                <p className="mt-2 text-gray-600">
                  Our AI advisor analyzes both properties and provides personalized recommendations based on your unique needs.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-softgray">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary/20 text-secondary mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Expert Insights</h3>
                <p className="mt-2 text-gray-600">
                  Real estate professionals share their expert opinion and vote on which property is better for your situation.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-softgray">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community Wisdom</h3>
                <p className="mt-2 text-gray-600">
                  Browse public comparisons from other users to learn from their experiences and decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Comparison Section */}
        <section className="py-16 bg-softgray">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">See a Sample Comparison</h2>
              <p className="mt-4 text-xl text-gray-600">
                Here's what your property comparison might look like
              </p>
            </div>

            <div className="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900">Shibuya Apartment</h3>
                  <p className="text-primary font-medium">¥135,000/month</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Layout:</span>
                      <span className="font-medium">1LDK (45m²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nearest Station:</span>
                      <span className="font-medium">Shibuya (7 min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Building Age:</span>
                      <span className="font-medium">10 years</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900">Nakameguro Apartment</h3>
                  <p className="text-primary font-medium">¥142,000/month</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Layout:</span>
                      <span className="font-medium">1LDK (48m²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nearest Station:</span>
                      <span className="font-medium">Nakameguro (5 min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Building Age:</span>
                      <span className="font-medium">5 years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-softgray border-t border-gray-200">
                <h4 className="font-semibold text-gray-900">AI Recommendation</h4>
                <p className="mt-2 text-gray-600">
                  For a young professional prioritizing commute time and nightlife, the Shibuya apartment 
                  offers better value with excellent access to restaurants and entertainment, despite being slightly older.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button asChild size="lg">
                <Link to="/compare">Create Your Own Comparison <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
              <p className="mt-4 text-xl text-gray-600">
                Real stories from people who found their perfect home
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="bg-softgray p-6 rounded-xl">
                <p className="text-gray-600 italic">
                  "DuoHome Advisor helped me choose between two apartments in Tokyo that looked almost identical on paper. The AI analysis highlighted differences I hadn't considered!"
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Tanaka Yuki</h4>
                    <p className="text-sm text-gray-500">Tokyo</p>
                  </div>
                </div>
              </div>

              <div className="bg-softgray p-6 rounded-xl">
                <p className="text-gray-600 italic">
                  "The expert insights were incredibly valuable. An agent pointed out potential noise issues with one property that I completely missed during my viewing."
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Smith John</h4>
                    <p className="text-sm text-gray-500">Osaka</p>
                  </div>
                </div>
              </div>

              <div className="bg-softgray p-6 rounded-xl">
                <p className="text-gray-600 italic">
                  "Having all the data visually compared made our decision so much easier. We were able to confidently choose our new home in Kyoto without second-guessing."
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Yamamoto Keiko</h4>
                    <p className="text-sm text-gray-500">Kyoto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to make your decision?</h2>
            <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
              Compare your shortlisted properties now and get personalized insights to help you choose the right home.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 hover:text-primary">
                <Link to="/compare">Start Comparing <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
