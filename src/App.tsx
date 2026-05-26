import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import Properties from "./pages/Properties";
import Customers from "./pages/Customers";
import SiteVisits from "./pages/SiteVisits";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import HR from "./pages/HR";
import Reports from "./pages/Reports";
import Partners from "./pages/Partners";
import Marketing from "./pages/Marketing";
import NotFound from "./pages/NotFound";
import { Navigate } from 'react-router-dom';
import Settings from "./pages/Settings";
import Cms from "./pages/Cms";
import CallLogs from "./pages/CallLogs";
import { LocationTracker } from "./components/LocationTracker";
import Seo from "./pages/Seo";
import Attendance from "./pages/AttendanceList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LocationTracker />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/site-visits" element={<ProtectedRoute><SiteVisits /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/hr" element={<ProtectedRoute ><HR /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/cms" element={<ProtectedRoute><Cms /></ProtectedRoute>} />
            <Route path="/calllogs" element={<ProtectedRoute><CallLogs /></ProtectedRoute>} />
            <Route path="/seo" element={<ProtectedRoute><Seo /></ProtectedRoute>} />            
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;
