import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { api } from "@/services/api";
import NavigationSidebar from "@/components/NavigationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Crown, 
  Check, 
  X, 
  CreditCard, 
  Calendar,
  Shield,
  Zap,
  Star,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Load Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscriptionForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Activated",
        description: "Welcome to FitTracker Pro Premium!",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full bg-primary-600 hover:bg-primary-700"
      >
        {isLoading ? "Processing..." : "Subscribe to Premium"}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const createSubscriptionMutation = useMutation({
    mutationFn: () => api.createSubscription(),
    onSuccess: async (response) => {
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setIsUpgradeModalOpen(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will be cancelled at the end of the billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => api.exportData(),
    onSuccess: async (response) => {
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittracker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.deleteAccount(),
    onSuccess: () => {
      toast({
        title: "Account Deletion Initiated",
        description: "Your account and all data will be permanently deleted.",
      });
      setTimeout(() => {
        window.location.href = "/api/logout";
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const isPremium = user?.subscriptionStatus === 'active';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Get started with basic fitness tracking',
      features: [
        'Basic workout tracking',
        'Limited movement analysis',
        '3 workout plans',
        'Basic achievements',
        'Community support'
      ],
      limitations: [
        'No AI form analysis',
        'Limited wearable integration',
        'No premium workouts',
        'No advanced analytics'
      ],
      current: !isPremium
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      description: 'Unlock the full potential of AI-powered fitness',
      features: [
        'Unlimited AI movement analysis',
        'Advanced form feedback',
        'Unlimited workout plans',
        'Full wearable integration',
        'Advanced analytics & insights',
        'Premium workout library',
        'Priority support',
        'Custom coaching recommendations',
        'Export all your data'
      ],
      limitations: [],
      current: isPremium,
      popular: true
    }
  ];

  const handleUpgrade = () => {
    if (!stripePromise) {
      toast({
        title: "Payment Not Available",
        description: "Payment processing is not configured.",
        variant: "destructive",
      });
      return;
    }
    createSubscriptionMutation.mutate();
  };

  const onSubscriptionSuccess = () => {
    setIsUpgradeModalOpen(false);
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Subscription</h1>
              <p className="mt-1 text-gray-600">
                Manage your subscription and unlock premium features
              </p>
            </div>

            {/* Current Status */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className={`mr-3 h-6 w-6 ${isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Your active subscription status</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isPremium ? "default" : "secondary"} className="text-sm">
                    {isPremium ? 'Premium' : 'Free'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isPremium ? 'FitTracker Pro Premium' : 'FitTracker Pro Free'}
                    </h3>
                    <p className="text-gray-600">
                      {isPremium 
                        ? 'You have access to all premium features including AI analysis and unlimited workouts'
                        : 'Upgrade to premium to unlock AI-powered movement analysis and unlimited features'
                      }
                    </p>
                    {isPremium && (
                      <p className="text-sm text-gray-500 mt-2">
                        <Calendar className="inline mr-1 h-4 w-4" />
                        Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {!isPremium && (
                    <Button 
                      onClick={handleUpgrade}
                      disabled={createSubscriptionMutation.isPending}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      {createSubscriptionMutation.isPending ? 'Processing...' : 'Upgrade to Premium'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plans Comparison */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Plans & Features</CardTitle>
                <CardDescription>Compare features and choose the plan that's right for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`relative p-6 rounded-xl border-2 transition-all ${
                        plan.current 
                          ? 'border-primary-500 bg-primary-50' 
                          : plan.popular 
                            ? 'border-primary-300 hover:border-primary-400' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-primary-600 to-secondary-600">
                            <Star className="mr-1 h-3 w-3" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      {plan.current && (
                        <div className="absolute -top-3 right-4">
                          <Badge variant="default">Current Plan</Badge>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                          <span className="text-gray-600 ml-1">/{plan.period}</span>
                        </div>
                        <p className="text-gray-600">{plan.description}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            Included Features
                          </h4>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700">
                                <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {plan.limitations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <X className="mr-2 h-4 w-4 text-red-500" />
                              Limitations
                            </h4>
                            <ul className="space-y-2">
                              {plan.limitations.map((limitation, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-500">
                                  <X className="mr-2 h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span>{limitation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        {plan.current ? (
                          <Badge variant="outline" className="w-full py-2">
                            Your Current Plan
                          </Badge>
                        ) : plan.id === 'premium' ? (
                          <Button 
                            onClick={handleUpgrade}
                            disabled={createSubscriptionMutation.isPending}
                            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Upgrade Now
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            Current Plan
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Billing & Subscription Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Billing Management
                  </CardTitle>
                  <CardDescription>Manage your subscription and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPremium ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-green-800">Active Subscription</span>
                        </div>
                        <Badge variant="default">Premium</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Update Payment Method
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Billing History
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                              <X className="mr-2 h-4 w-4" />
                              Cancel Subscription
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Your subscription will remain active until the end of your current billing period. 
                                You'll lose access to premium features after that.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => cancelSubscriptionMutation.mutate()}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Subscription
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No active subscription</p>
                      <Button 
                        onClick={handleUpgrade}
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data & Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Data & Privacy
                  </CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">GDPR Compliance</p>
                        <p className="text-xs text-blue-700 mt-1">
                          You have full control over your data. Export or delete it at any time.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportDataMutation.mutate()}
                      disabled={exportDataMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {exportDataMutation.isPending ? 'Exporting...' : 'Export My Data'}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center text-red-600">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            Delete Account Permanently?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account,
                            all your workout data, achievements, and remove all associated information 
                            from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteAccountMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      Data export includes: workout history, achievements, health data, 
                      movement analyses, and account information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Modal */}
            {stripePromise && (
              <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                      Upgrade to Premium
                    </DialogTitle>
                    <DialogDescription>
                      Unlock AI-powered movement analysis, unlimited workouts, and premium features.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <SubscriptionForm onSuccess={onSubscriptionSuccess} />
                    </Elements>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
