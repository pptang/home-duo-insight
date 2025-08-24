import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Users, Search, Sparkles, Heart, Brain } from "lucide-react";
import { useEffect, useRef } from "react";

const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parallax scroll effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      if (heroRef.current) {
        const layers = heroRef.current.querySelectorAll('.parallax-layer');
        layers.forEach((layer, index) => {
          const speed = (index + 1) * 0.3;
          (layer as HTMLElement).style.transform = `translateY(${rate * speed}px)`;
        });
      }
    };

    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections with fade animation
    document.querySelectorAll('.section-fade').forEach((el) => {
      observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="relative">
        {/* Immersive Hero Section */}
        <section 
          ref={heroRef}
          className="hero-landscape min-h-screen relative flex items-center justify-center text-center overflow-hidden"
        >
          {/* Background Layers for Parallax */}
          <div className="parallax-layer absolute inset-0 opacity-20">
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary/30 to-transparent rounded-t-[50px]"></div>
          </div>
          <div className="parallax-layer absolute inset-0 opacity-30">
            <div className="absolute bottom-20 left-1/4 w-16 h-32 bg-primary/40 rounded-full transform -rotate-12"></div>
            <div className="absolute bottom-16 right-1/3 w-12 h-24 bg-secondary/60 rounded-full transform rotate-6"></div>
            <div className="absolute top-1/3 left-1/6 w-8 h-16 bg-accent/50 rounded-full"></div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
            <div className="bg-background/90 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-border/20">
              <div className="inline-flex items-center space-x-4 mb-8 animate-in">
                <span className="aisumai-logo text-6xl micro-animation">愛住</span>
                <div className="text-left">
                  <h1 className="cinematic-heading text-foreground">
                    AiSumai
                  </h1>
                  <p className="text-2xl text-accent font-semibold">Love to live</p>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 animate-in-delayed">
                Two homes. One perfect choice. 🏡
              </h2>
              
              <p className="text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-in-delayed leading-relaxed">
                Make confident housing decisions in Japan with AI analysis, expert insights, 
                and community wisdom — all in one beautiful comparison.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-in-delayed">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-lg px-8 py-4 hover-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link to="/compare">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Comparing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 hover-lift border-2 bg-background/50"
                >
                  <Link to="/feed">
                    <Heart className="mr-2 h-5 w-5" />
                    Browse Stories
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-foreground/30 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Features Section - Continuous Flow */}
        <section className="scrollytelling-section py-32 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 section-fade">
              <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
                How the magic works ✨
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Three powerful layers of intelligence working together to guide your decision
              </p>
            </div>

            {/* Horizontal Scrolling Features */}
            <div className="section-fade" ref={featuresRef}>
              <div className="feature-scroll-container max-w-none px-4 md:px-8">
                {/* AI Analysis */}
                <div className="flex-shrink-0 w-80 p-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-3xl hover-lift border border-primary/20">
                  <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 micro-animation">
                    <Brain className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    🤖 AI Analysis
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Our AI examines every detail — from commute times to neighborhood vibes — 
                    creating personalized insights tailored to your lifestyle.
                  </p>
                  <div className="mt-6 flex items-center text-primary font-medium">
                    <span>See AI in action</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>

                {/* Expert Insights */}
                <div className="flex-shrink-0 w-80 p-8 bg-gradient-to-br from-accent/10 to-accent/20 rounded-3xl hover-lift border border-accent/20">
                  <div className="w-20 h-20 bg-accent/30 rounded-2xl flex items-center justify-center mb-6 micro-animation">
                    <Users className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    👥 Expert Insights
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Real estate professionals vote and share insider knowledge — 
                    from hidden costs to future development plans.
                  </p>
                  <div className="mt-6 flex items-center text-accent-foreground font-medium">
                    <span>Meet the experts</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>

                {/* Community Wisdom */}
                <div className="flex-shrink-0 w-80 p-8 bg-gradient-to-br from-secondary/20 to-secondary/30 rounded-3xl hover-lift border border-secondary/30">
                  <div className="w-20 h-20 bg-secondary/40 rounded-2xl flex items-center justify-center mb-6 micro-animation">
                    <Home className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    🏠 Community Stories
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Learn from others who faced similar decisions — real experiences 
                    from real people in your exact situation.
                  </p>
                  <div className="mt-6 flex items-center text-primary font-medium">
                    <span>Read their stories</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Sample Comparison */}
        <section className="py-32 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 section-fade">
              <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
                See it in action 🎯
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Hover over each property to discover the differences that matter
              </p>
            </div>

            <div className="section-fade max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Property A */}
                <div className="interactive-comparison group relative bg-card rounded-3xl overflow-hidden shadow-xl border border-border hover-lift">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-primary-foreground">
                        <Home className="h-16 w-16 mx-auto mb-2 opacity-80" />
                        <p className="text-lg font-medium">Shibuya Apartment</p>
                      </div>
                    </div>
                    <div className="comparison-overlay">
                      <div className="text-center text-primary-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2" />
                        <p className="font-bold text-lg">Click to compare!</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Shibuya Dream</h3>
                    <p className="text-primary font-bold text-xl mb-4">¥135,000/month</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Layout:</span>
                        <span className="font-semibold text-foreground">1LDK (45m²)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Station:</span>
                        <span className="font-semibold text-foreground">7 min walk</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Building:</span>
                        <span className="font-semibold text-foreground">10 years old</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property B */}
                <div className="interactive-comparison group relative bg-card rounded-3xl overflow-hidden shadow-xl border border-border hover-lift">
                  <div className="aspect-video bg-gradient-to-br from-secondary/30 to-accent/20 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-primary-foreground">
                        <Home className="h-16 w-16 mx-auto mb-2 opacity-80" />
                        <p className="text-lg font-medium">Nakameguro Apartment</p>
                      </div>
                    </div>
                    <div className="comparison-overlay">
                      <div className="text-center text-primary-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2" />
                        <p className="font-bold text-lg">Click to compare!</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Nakameguro Haven</h3>
                    <p className="text-primary font-bold text-xl mb-4">¥142,000/month</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Layout:</span>
                        <span className="font-semibold text-foreground">1LDK (48m²)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Station:</span>
                        <span className="font-semibold text-foreground">5 min walk</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Building:</span>
                        <span className="font-semibold text-foreground">5 years old</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Preview */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-8 border border-primary/20">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-2">AI Recommendation</h4>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      For a young professional prioritizing nightlife and convenience, 
                      <span className="font-semibold text-primary"> Shibuya Dream</span> offers 
                      exceptional value with unmatched access to entertainment and dining, 
                      despite being slightly older. The 7-minute walk keeps you in the heart of Tokyo's energy! ⚡
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12">
                <Button asChild size="lg" className="text-lg px-12 py-4 hover-glow">
                  <Link to="/compare">
                    Create Your Comparison
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-32 scrollytelling-section">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 section-fade">
              <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
                Happy endings 💕
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Real people, real decisions, real satisfaction
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 section-fade">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-3xl hover-lift border border-primary/20">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mr-4"></div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">Tanaka Yuki</h4>
                    <p className="text-muted-foreground">Tokyo • Software Engineer</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg italic">
                  "AiSumai revealed hidden costs and neighborhood insights I never would have found. 
                  The AI caught things that even my realtor missed! Now I'm living my best life in Shibuya 🎉"
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/10 to-accent/20 p-8 rounded-3xl hover-lift border border-accent/30">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-secondary mr-4"></div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">Smith John</h4>
                    <p className="text-muted-foreground">Osaka • Designer</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg italic">
                  "The expert insights saved me from a huge mistake. An agent spotted potential noise issues 
                  that I completely overlooked. Dodged a bullet! 🛡️"
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/20 to-secondary/30 p-8 rounded-3xl hover-lift border border-secondary/40">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary mr-4"></div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">Yamamoto Keiko</h4>
                    <p className="text-muted-foreground">Kyoto • Teacher</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg italic">
                  "Finally, no more second-guessing! The visual comparison made everything crystal clear. 
                  My family found our dream home without any stress 🏡✨"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* High-Contrast CTA */}
        <section className="gradient-cta py-32 relative">
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="cinematic-heading text-primary-foreground mb-8">
                Your perfect home awaits 🌟
              </h2>
              <p className="text-2xl text-primary-foreground/90 mb-12 leading-relaxed max-w-3xl mx-auto">
                Stop overthinking. Start comparing. Make the decision that changes everything.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="text-2xl px-16 py-6 bg-card text-primary hover:bg-card/90 hover-glow shadow-2xl border-4 border-card/20"
              >
                <Link to="/compare">
                  <Sparkles className="mr-3 h-6 w-6" />
                  Start Your Journey
                  <ArrowRight className="ml-3 h-6 w-6" />
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