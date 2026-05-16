import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Topbar from '@/components/ui/Topbar';
import Footer from '@/components/ui/Footer';
import Index from '@/pages/Index';
import Feed from '@/pages/Feed';
import Experts from '@/pages/Experts';
import About from '@/pages/About';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import AdminExpertPanel from "./pages/AdminExpertPanel";
import AdminExpertReview from "./pages/AdminExpertReview";
import ExpertProfilePage from "./pages/ExpertProfilePage";
import ComparisonDetail from "./pages/ComparisonDetail";
import Dashboard from '@/pages/Dashboard';
import { usePageTracking } from '@/hooks/usePageTracking';
import { initGA } from '@/lib/analytics';

function PageTracker() {
  usePageTracking();
  return null;
}

// Routes that own their full layout (no global header/footer)
const FULL_LAYOUT_ROUTES = ['/auth'];

function AppShell() {
  const location = useLocation();
  const isFullLayout = FULL_LAYOUT_ROUTES.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {!isFullLayout && <Topbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/compare" element={<Navigate to="/#compare-widget" replace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/experts" element={<AdminExpertPanel />} />
          <Route path="/admin/expert-review" element={<AdminExpertReview />} />
          <Route path="/experts/:expertId" element={<ExpertProfilePage />} />
          <Route path="/comparisons/:id" element={<ComparisonDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isFullLayout && <Footer />}
    </div>
  );
}

function App() {
  const queryClient = new QueryClient();

  useEffect(() => {
    initGA();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PageTracker />
          <AppShell />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
