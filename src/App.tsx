import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DataExplorer from "./pages/DataExplorer";
import ReviewWorkspace from "./pages/ReviewWorkspace";
import AgentQueries from "./pages/AgentQueries";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Agents from "./pages/Agents";
import Users from "./pages/Users";
import Surveys from "./pages/Surveys";
import SurveyDetail from "./pages/SurveyDetail";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="survey-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="data" element={<DataExplorer />} />
              <Route path="review" element={<ReviewWorkspace />} />
              <Route path="queries" element={<AgentQueries />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="agents" element={<Agents />} />
              <Route path="users" element={<Users />} />
              <Route path="surveys" element={<Surveys />} />
              <Route path="surveys/:surveyId" element={<SurveyDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
