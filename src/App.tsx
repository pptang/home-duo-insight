import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Index from '@/pages/Index';
import Compare from '@/pages/Compare';
import Feed from '@/pages/Feed';
import Experts from '@/pages/Experts';
import About from '@/pages/About';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import AdminExpertPanel from "./pages/AdminExpertPanel";
import AdminExpertReview from "./pages/AdminExpertReview";
import ExpertProfilePage from "./pages/ExpertProfilePage";
import ComparisonDetail from "./pages/ComparisonDetail";
import { usePageTracking } from '@/hooks/usePageTracking';
import { initGA } from '@/lib/analytics';

// Component to handle page tracking inside BrowserRouter
function PageTracker() {
  usePageTracking();
  return null;
}

function App() {
  const queryClient = new QueryClient();

  // Initialize Google Analytics on mount
  useEffect(() => {
    initGA();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PageTracker />
          <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/experts" element={<Experts />} />
                <Route path="/about" element={<About />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/experts" element={<AdminExpertPanel />} />
                <Route path="/admin/expert-review" element={<AdminExpertReview />} />
                <Route path="/experts/:expertId" element={<ExpertProfilePage />} />
                <Route path="/comparisons/:id" element={<ComparisonDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
