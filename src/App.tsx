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
import NotFound from "./pages/NotFound.tsx";
import { TierGate } from "./components/TierGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/exhibitions" element={<Exhibitions />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/studio-manager" element={<TierGate><StudioManager /></TierGate>} />
          <Route path="/profile-vault" element={<TierGate><ProfileVault /></TierGate>} />
          <Route path="/communications" element={<TierGate><Communications /></TierGate>} />
          <Route path="/marketing" element={<TierGate><Marketing /></TierGate>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
