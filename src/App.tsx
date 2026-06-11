import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Inventory from "./pages/Inventory.tsx";
import Sales from "./pages/Sales.tsx";
import Exhibitions from "./pages/Exhibitions.tsx";
import Contacts from "./pages/Contacts.tsx";
import StudioManager from "./pages/StudioManager.tsx";
import ProfileVault from "./pages/ProfileVault.tsx";
import Communications from "./pages/Communications.tsx";
import Marketing from "./pages/Marketing.tsx";
import Pricing from "./pages/Pricing.tsx";
import Settings from "./pages/Settings.tsx";
import Login from "./pages/Login.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Reports from "./pages/Reports.tsx";
import NotFound from "./pages/NotFound.tsx";
import { TierGate } from "./components/TierGate";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./components/RequireAuth";
import { UsageTracker } from "./lib/usage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UsageTracker />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated app */}
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
