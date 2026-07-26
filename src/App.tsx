import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Public, fast-path pages stay eager so they render the instant React boots.
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
// Everything else is code-split: each route loads its own chunk on demand, so
// the landing page no longer ships the entire app's JavaScript.
const Index = lazy(() => import("./pages/Index.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const Sales = lazy(() => import("./pages/Sales.tsx"));
const Exhibitions = lazy(() => import("./pages/Exhibitions.tsx"));
const Contacts = lazy(() => import("./pages/Contacts.tsx"));
const StudioManager = lazy(() => import("./pages/StudioManager.tsx"));
const ProfileVault = lazy(() => import("./pages/ProfileVault.tsx"));
const Communications = lazy(() => import("./pages/Communications.tsx"));
const Marketing = lazy(() => import("./pages/Marketing.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const Reports = lazy(() => import("./pages/Reports.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import { TierGate } from "./components/TierGate";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./components/RequireAuth";
import { UsageTracker } from "./lib/usage";
import { CookieConsent } from "./components/CookieConsent";

const queryClient = new QueryClient();

// Minimal fallback shown only for the brief moment a route chunk is loading.
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" aria-label="Loading" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <BrowserRouter>
        <AuthProvider>
          <UsageTracker />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />

              {/* Authenticated app */}
              <Route path="/dashboard" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
              <Route path="/exhibitions" element={<RequireAuth><Exhibitions /></RequireAuth>} />
              <Route path="/contacts" element={<RequireAuth><Contacts /></RequireAuth>} />
              <Route path="/studio-manager" element={<RequireAuth><TierGate><StudioManager /></TierGate></RequireAuth>} />
              <Route path="/profile-vault" element={<RequireAuth><TierGate><ProfileVault /></TierGate></RequireAuth>} />
              <Route path="/communications" element={<RequireAuth><TierGate><Communications /></TierGate></RequireAuth>} />
              <Route path="/marketing" element={<RequireAuth><TierGate><Marketing /></TierGate></RequireAuth>} />
              <Route path="/pricing" element={<RequireAuth><Pricing /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
