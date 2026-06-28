import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isMobileApp } from "./lib/platform";
import { SiteLayout } from "./components/orchestra-core/SiteLayout";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Lessons from "./pages/Lessons";
import Lesson from "./pages/Lesson";
import Try from "./pages/Try";
import Ask from "./pages/Ask";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Download from "./pages/Download";
import Support from "./pages/Support";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AppShell from "./pages/AppShell";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            {/* On mobile (Capacitor), send root → /app so the app shell loads */}
            <Route path="/" element={isMobileApp ? <Navigate to="/app" replace /> : <Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:code" element={<Lesson />} />
            <Route path="/try" element={<Try />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/download" element={<Download />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>
          {/* Electron-only screen — no site nav/footer */}
          <Route path="/app" element={<AppShell />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
