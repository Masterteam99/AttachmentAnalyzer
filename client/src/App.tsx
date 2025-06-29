import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import WorkoutPlans from "./pages/WorkoutPlans";
import MovementAnalysis from "./pages/MovementAnalysis";
import Achievements from "./pages/Achievements";
import Wearables from "./pages/Wearables";
import Subscription from "./pages/Subscription";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/workout-plans" component={WorkoutPlans} />
          <Route path="/movement-analysis" component={MovementAnalysis} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/wearables" component={Wearables} />
          <Route path="/subscription" component={Subscription} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
