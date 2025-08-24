import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Users, Search } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="gradient-overlay py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl section-fade">
                <div className="inline-flex items-center space-x-2 mb-6">
                  <span className="aisumai-logo text-4xl">愛住</span>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                      AiSumai
                    </h1>
                    <p className="text-lg text-accent font-medium">Love to live</p>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4">
                  Still deciding between two homes?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Make confident housing decisions in Japan with side-by-side
                  comparisons, AI analysis, and expert insights.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button asChild size="lg" className="text-md hover-lift">
                    <Link to="/compare">
                      Compare Properties <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="text-md hover-lift"
                  >
                    <Link to="/feed">Browse Comparisons</Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="absolute -top-4 -left-4 w-3/4 h-64 bg-secondary rounded-2xl transform -rotate-3 opacity-80"></div>
                <div className="absolute top-10 right-0 w-3/4 h-64 bg-primary rounded-2xl transform rotate-3 opacity-90"></div>
                <div className="relative w-full h-80 bg-card shadow-xl rounded-2xl p-4 border border-border">
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <p className="font-medium">Preview comparison interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto section-fade">
              <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Three powerful components to help you make the right decision
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-secondary/20 hover-lift">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  AI Analysis
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI advisor analyzes both properties and provides
                  personalized recommendations based on your unique needs.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-accent/10 hover-lift">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent/30 text-accent-foreground mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Expert Insights
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Real estate professionals share their expert opinion and vote
                  on which property is better for your situation.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-secondary/20 hover-lift">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Community Wisdom
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Browse public comparisons from other users to learn from their
                  experiences and decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Comparison Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto section-fade">
              <h2 className="text-3xl font-bold text-foreground">
                See a Sample Comparison
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Here's what your property comparison might look like
              </p>
            </div>

            <div className="mt-12 bg-card rounded-2xl shadow-xl overflow-hidden border border-border hover-lift">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-6">
                  <div className="aspect-video bg-muted rounded-xl mb-4"></div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Shibuya Apartment
                  </h3>
                  <p className="text-primary font-medium">¥135,000/month</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Layout:</span>
                      <span className="font-medium text-foreground">1LDK (45m²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nearest Station:</span>
                      <span className="font-medium text-foreground">Shibuya (7 min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Building Age:</span>
                      <span className="font-medium text-foreground">10 years</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="aspect-video bg-muted rounded-xl mb-4"></div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Nakameguro Apartment
                  </h3>
                  <p className="text-primary font-medium">¥142,000/month</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Layout:</span>
                      <span className="font-medium text-foreground">1LDK (48m²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nearest Station:</span>
                      <span className="font-medium text-foreground">Nakameguro (5 min)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Building Age:</span>
                      <span className="font-medium text-foreground">5 years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-secondary/20 border-t border-border">
                <h4 className="font-semibold text-foreground">
                  AI Recommendation
                </h4>
                <p className="mt-2 text-muted-foreground">
                  For a young professional prioritizing commute time and
                  nightlife, the Shibuya apartment offers better value with
                  excellent access to restaurants and entertainment, despite
                  being slightly older.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button asChild size="lg" className="hover-lift">
                <Link to="/compare">
                  Create Your Own Comparison{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto section-fade">
              <h2 className="text-3xl font-bold text-foreground">
                What Our Users Say
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Real stories from people who found their perfect home
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="bg-muted/30 p-8 rounded-2xl hover-lift border border-border">
                <p className="text-muted-foreground italic leading-relaxed">
                  "AiSumai helped me choose between two apartments in
                  Tokyo that looked almost identical on paper. The AI analysis
                  highlighted differences I hadn't considered!"
                </p>
                <div className="mt-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-secondary"></div>
                  <div className="ml-4">
                    <h4 className="font-medium text-foreground">Tanaka Yuki</h4>
                    <p className="text-sm text-muted-foreground">Tokyo</p>
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 p-8 rounded-2xl hover-lift border border-border">
                <p className="text-muted-foreground italic leading-relaxed">
                  "The expert insights were incredibly valuable. An agent
                  pointed out potential noise issues with one property that I
                  completely missed during my viewing."
                </p>
                <div className="mt-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                  <div className="ml-4">
                    <h4 className="font-medium text-foreground">Smith John</h4>
                    <p className="text-sm text-muted-foreground">Osaka</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-8 rounded-2xl hover-lift border border-border">
                <p className="text-muted-foreground italic leading-relaxed">
                  "Having all the data visually compared made our decision so
                  much easier. We were able to confidently choose our new home
                  in Kyoto without second-guessing."
                </p>
                <div className="mt-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-secondary"></div>
                  <div className="ml-4">
                    <h4 className="font-medium text-foreground">
                      Yamamoto Keiko
                    </h4>
                    <p className="text-sm text-muted-foreground">Kyoto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Ready to make your decision?
            </h2>
            <p className="mt-4 text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Compare your shortlisted properties now and get personalized
              insights to help you choose the right home.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-card text-primary hover:bg-card/90 hover-lift shadow-lg"
              >
                <Link to="/compare">
                  Start Comparing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default Index;
