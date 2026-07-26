import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./myevryday/Home";

/**
 * My Evryday — brand marketing site.
 * Purchasing lives on the Squarespace store; every "Shop" CTA links out there.
 */
const App = () => (
  <TooltipProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Single-page brand site — any unknown path falls back to home. */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
