import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Building,
  Home,
  CheckCheck,
  User,
  Users,
  Search,
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow">
        {/* Immersive Hero Section */}
        <section className="hero-landscape relative py-20 md:py-32 overflow-hidden">
          <div className="parallax-layer absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-95"></div>
          <div className="parallax-layer absolute inset-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M40 40c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm20 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')", opacity: 0.2}}></div>
          
          {/* Floating Elements */}
          <div className="absolute top-1/4 left-1/4 text-6xl micro-animation opacity-70">🏠</div>
          <div className="absolute top-3/4 right-1/4 text-5xl micro-animation opacity-60" style={{animationDelay: '0.5s'}}>🌸</div>
          <div className="absolute top-1/2 left-1/6 text-4xl micro-animation opacity-50" style={{animationDelay: '1s'}}>⛩️</div>
          <div className="absolute bottom-1/4 right-1/6 text-5xl micro-animation opacity-60" style={{animationDelay: '1.5s'}}>🏙️</div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Visual Brand Identity */}
            <div className="mb-8">
              <div className="aisumai-logo text-6xl md:text-8xl text-white mb-4">
                愛住
              </div>
              <div className="text-2xl md:text-3xl font-semibold text-white/90">
                AiSumai
              </div>
              <div className="mt-2 text-lg text-white/70 flex items-center justify-center gap-2">
                <span>AI</span>
                <span className="text-accent">×</span>
                <span>住まい (home)</span>
                <span className="text-accent">×</span>
                <span>愛 (love)</span>
              </div>
            </div>
            
            <h1 className="cinematic-heading text-white leading-tight max-w-4xl mx-auto mb-6">
              Making It Easier to Choose Your Perfect Home
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12">
              Helping renters and home buyers in Japan make confident final housing decisions through 
              <span className="font-semibold text-accent"> AI-powered analysis</span>,
              <span className="font-semibold text-accent"> expert insights</span>, and
              <span className="font-semibold text-accent"> community wisdom</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gradient-cta text-white px-8 py-4 h-auto text-lg font-semibold hover-glow transition-all duration-300 transform hover:scale-105">
                <Link to="/compare" className="flex items-center gap-2">
                  <span>🚀 Compare Properties</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-4 h-auto text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300">
                <Link to="/feed" className="flex items-center gap-2">
                  <span>📊 Browse Comparisons</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* <div className="section-fade text-center mb-16">
              <h2 className="cinematic-heading text-foreground mb-6">
                How AiSumai Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three powerful perspectives working together for your perfect decision
              </p>
            </div> */}

            {/* Interactive Feature Scroll */}
            <div className="feature-scroll-container max-w-6xl mx-auto pb-8">
              <div className="interactive-comparison group bg-card p-8 rounded-2xl shadow-xl border border-border hover-lift min-w-[300px] md:min-w-[350px]">
                <div className="comparison-overlay">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🤖</div>
                    <p className="font-semibold">Click to see AI in action</p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl micro-animation">✨</div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  AI Analysis
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI evaluates both properties based on objective criteria and your personal priorities. 
                  It analyzes floor plans, location data, pricing, and more to provide a detailed comparison.
                </p>
                
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <span>🎯</span>
                    <span>Personalized recommendations based on your lifestyle</span>
                  </div>
                </div>
              </div>

              <div className="interactive-comparison group bg-card p-8 rounded-2xl shadow-xl border border-border hover-lift min-w-[300px] md:min-w-[350px]">
                <div className="comparison-overlay">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">👨‍💼</div>
                    <p className="font-semibold">Real expert opinions</p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl micro-animation" style={{animationDelay: '0.5s'}}>💼</div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Expert Insights
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Local real estate professionals provide their expert opinion on your choices, 
                  highlighting factors you might have missed and offering practical advice based on experience.
                </p>
                
                <div className="mt-6 p-4 bg-secondary/10 rounded-xl border border-secondary/30">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <span>🏆</span>
                    <span>Verified local market expertise</span>
                  </div>
                </div>
              </div>

              <div className="interactive-comparison group bg-card p-8 rounded-2xl shadow-xl border border-border hover-lift min-w-[300px] md:min-w-[350px]">
                <div className="comparison-overlay">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-semibold">Community experiences</p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl micro-animation" style={{animationDelay: '1s'}}>💬</div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Community Wisdom
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Browse similar comparisons from other users and learn from their experiences. 
                  See which properties others chose and why, gaining valuable perspective for your decision.
                </p>
                
                <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/30">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <span>🌟</span>
                    <span>Real stories from real decisions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center">
                Frequently Asked Questions
              </h2>

              <div className="mt-10 space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    What types of properties can I compare?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    You can compare any two residential properties in Japan,
                    including apartments, houses, condominiums, and more. The
                    service works for both rentals and properties for sale.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    How much does it cost to use DuoHome Advisor?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Basic property comparisons are free. Premium features,
                    including detailed AI analysis and expert consultations,
                    will be available through subscription plans (coming soon).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Which real estate websites are supported for URL importing?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    In the future, we plan to support automatic data importing
                    from major Japanese real estate platforms including Suumo,
                    at home, LIFULL HOME'S, and others. Currently, you can enter
                    property information manually.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    How accurate is the AI recommendation?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Our AI provides recommendations based on the data available
                    and your stated preferences. It's designed to offer an
                    objective analysis, but we always recommend considering the
                    expert insights alongside the AI recommendation for a
                    complete picture.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Who are the experts providing insights?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Our experts include licensed real estate agents, property
                    managers, and other industry professionals in Japan. Each
                    expert has a verified profile showing their credentials,
                    experience, and areas of specialization.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Is my comparison private?
                  </h3>
                  <p className="mt-2 text-gray-600">
                    By default, your property comparisons are private. You have
                    the option to make them public to contribute to our
                    community knowledge base, but this is entirely optional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-softgray">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Our Team
            </h2>
            <p className="mt-4 text-xl text-gray-600 text-center max-w-2xl mx-auto">
              We're a passionate team of real estate professionals, data
              scientists, and developers dedicated to making property decisions
              easier in Japan.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Tanaka Hiroshi
                </h3>
                <p className="text-gray-600">Founder & CEO</p>
                <p className="mt-3 text-gray-600">
                  Former real estate consultant with 15+ years experience in the
                  Tokyo market.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Emma Takahashi
                </h3>
                <p className="text-gray-600">Head of Data Science</p>
                <p className="mt-3 text-gray-600">
                  AI specialist focused on property valuation and recommendation
                  systems.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto"></div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Yamamoto Ken
                </h3>
                <p className="text-gray-600">Expert Relations Manager</p>
                <p className="mt-3 text-gray-600">
                  Coordinates our network of real estate professionals across
                  Japan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Strong CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
          <div className="absolute inset-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M50 50c0-13.8-11.2-25-25-25S0 36.2 0 50s11.2 25 25 25 25-11.2 25-25zm50 0c0-13.8-11.2-25-25-25s-25 11.2-25 25 11.2 25 25 25 25-11.2 25-25z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')", opacity: 0.2}}></div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="text-6xl mb-6 micro-animation">🎉</div>
              
              <h2 className="cinematic-heading text-white mb-6">
                Ready to Start Your Journey with AiSumai?
              </h2>
              
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-10">
                Compare your shortlisted properties now and get personalized insights 
                to help you choose the <span className="font-bold text-accent">perfect home</span> 
                with confidence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  asChild
                  className="gradient-cta text-white px-10 py-5 h-auto text-xl font-bold hover-glow transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <Link to="/compare" className="flex items-center gap-3">
                    <span className="text-2xl">🚀</span>
                    <span>Start Your Comparison</span>
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
                
                <div className="text-white/70 text-lg">
                  <span>Free to use</span> • <span>No registration required</span>
                </div>
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center text-white/80">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-medium">Instant Analysis</div>
                </div>
                <div className="text-center text-white/80">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-medium">Personalized Results</div>
                </div>
                <div className="text-center text-white/80">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="font-medium">Expert Insights</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
