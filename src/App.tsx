import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/orchestra-core/ScrollToTop";
import { SiteLayout } from "./components/orchestra-core/SiteLayout";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Lessons from "./pages/Lessons";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Split out of the first download. The reader pulls in the whole markdown
// renderer, and the rest of these are pages most visitors never open — no
// reason to make everyone pay for them on a phone connection.
const Lesson = lazy(() => import("./pages/Lesson"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Consultants = lazy(() => import("./pages/Consultants"));
const ConsultantProfile = lazy(() => import("./pages/ConsultantProfile"));
const Teach = lazy(() => import("./pages/Teach"));
const Contact = lazy(() => import("./pages/Contact"));
const MySessions = lazy(() => import("./pages/MySessions"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:code" element={<Lesson />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/consultants" element={<Consultants />} />
            <Route path="/consultants/:slug" element={<ConsultantProfile />} />
            <Route path="/teach" element={<Teach />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sessions" element={<MySessions />} />
            <Route path="/teach/dashboard" element={<TeacherDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Retired routes that may still be linked from elsewhere — keep
                them resolving to something sensible rather than a 404. */}
            <Route path="/try" element={<Navigate to="/lessons" replace />} />
            <Route path="/ask" element={<Navigate to="/lessons" replace />} />
            <Route path="/download" element={<Navigate to="/dashboard" replace />} />
            <Route path="/support" element={<Navigate to="/about" replace />} />
          </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
