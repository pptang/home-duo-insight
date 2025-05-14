
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Building, Home, CheckCheck, User, Users, Search } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-softgray">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
              Making It Easier to Choose Your Perfect Home
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              DuoHome Advisor helps renters and home buyers in Japan make confident final housing decisions 
              through AI-powered analysis, expert insights, and community wisdom.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/compare">
                  Compare Properties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/feed">Browse Comparisons</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center">Our Mission</h2>
              <p className="mt-6 text-lg text-gray-600">
                The final decision between two properties is often the most stressful part of the home search process. Even after narrowing 
                down your options, it can be challenging to confidently choose one over the other – especially in Japan's unique real estate market.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                At DuoHome Advisor, we believe that by combining three powerful perspectives – unbiased AI analysis, expert local insights, 
                and community wisdom – we can help you make a decision you'll feel genuinely good about, whether you're renting or buying.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                Our goal is to reduce decision fatigue, eliminate second-guessing, and give you confidence that you've made the 
                right choice for your unique situation.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-softgray">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">How DuoHome Advisor Works</h2>
            
            <div className="mt-12 grid gap-12 md:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI Analysis</h3>
                <p className="mt-3 text-gray-600">
                  Our AI evaluates both properties based on objective criteria and your personal priorities. 
                  It analyzes floor plans, location data, pricing, and more to provide a detailed comparison.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Expert Insights</h3>
                <p className="mt-3 text-gray-600">
                  Local real estate professionals provide their expert opinion on your choices, 
                  highlighting factors you might have missed and offering practical advice based on experience.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community Wisdom</h3>
                <p className="mt-3 text-gray-600">
                  Browse similar comparisons from other users and learn from their experiences. 
                  See which properties others chose and why, gaining valuable perspective for your decision.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>
              
              <div className="mt-10 space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">What types of properties can I compare?</h3>
                  <p className="mt-2 text-gray-600">
                    You can compare any two residential properties in Japan, including apartments, houses, 
                    condominiums, and more. The service works for both rentals and properties for sale.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">How much does it cost to use DuoHome Advisor?</h3>
                  <p className="mt-2 text-gray-600">
                    Basic property comparisons are free. Premium features, including detailed AI analysis 
                    and expert consultations, will be available through subscription plans (coming soon).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Which real estate websites are supported for URL importing?</h3>
                  <p className="mt-2 text-gray-600">
                    In the future, we plan to support automatic data importing from major Japanese real estate 
                    platforms including Suumo, at home, LIFULL HOME'S, and others. Currently, you can enter property information manually.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">How accurate is the AI recommendation?</h3>
                  <p className="mt-2 text-gray-600">
                    Our AI provides recommendations based on the data available and your stated preferences. 
                    It's designed to offer an objective analysis, but we always recommend considering the 
                    expert insights alongside the AI recommendation for a complete picture.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Who are the experts providing insights?</h3>
                  <p className="mt-2 text-gray-600">
                    Our experts include licensed real estate agents, property managers, and other industry 
                    professionals in Japan. Each expert has a verified profile showing their credentials, 
                    experience, and areas of specialization.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Is my comparison private?</h3>
                  <p className="mt-2 text-gray-600">
                    By default, your property comparisons are private. You have the option to make them 
                    public to contribute to our community knowledge base, but this is entirely optional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-softgray">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Our Team</h2>
            <p className="mt-4 text-xl text-gray-600 text-center max-w-2xl mx-auto">
              We're a passionate team of real estate professionals, data scientists, and developers dedicated 
              to making property decisions easier in Japan.
            </p>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Tanaka Hiroshi</h3>
                <p className="text-gray-600">Founder & CEO</p>
                <p className="mt-3 text-gray-600">
                  Former real estate consultant with 15+ years experience in the Tokyo market.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Emma Takahashi</h3>
                <p className="text-gray-600">Head of Data Science</p>
                <p className="mt-3 text-gray-600">
                  AI specialist focused on property valuation and recommendation systems.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Yamamoto Ken</h3>
                <p className="text-gray-600">Expert Relations Manager</p>
                <p className="mt-3 text-gray-600">
                  Coordinates our network of real estate professionals across Japan.
                </p>
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
                <Link to="/compare">
                  Start Comparing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
