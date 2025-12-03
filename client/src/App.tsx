import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import Quiz from "@/pages/Quiz";
import About from "@/pages/About";
import AboutEditor from "@/pages/AboutEditor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/quiz/:courseId" component={Quiz} />
      <Route path="/about" component={About} />
      <Route path="/admin/about" component={AboutEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
