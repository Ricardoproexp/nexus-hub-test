
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CompanyProvider } from "./context/CompanyContext";
import { CustomerProvider } from "./context/CustomerContext";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Schedule from "./pages/Schedule";
import CustomerAuth from "./pages/CustomerAuth";
import CompanyAuth from "./pages/CompanyAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CompanyProvider>
        <CustomerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/services" element={<Services />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/search" element={<Search />} />
              <Route path="/schedule/:id" element={<Schedule />} />
              <Route path="/customer/auth" element={<CustomerAuth />} />
              <Route path="/company/auth" element={<CompanyAuth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </CustomerProvider>
      </CompanyProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
