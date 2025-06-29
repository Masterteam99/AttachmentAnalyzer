import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { wearableService } from "@/services/wearables";
import NavigationSidebar from "@/components/NavigationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Watch, 
  Bluetooth, 
  RefreshCw, 
  Heart, 
  Footprints, 
  Moon, 
  Zap,
  CheckCircle,
  XCircle,
  Plus,
  Smartphone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Wearables() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: integrations, isLoading: isIntegrationsLoading, error } = useQuery({
    queryKey: ["/api/wearables/integrations"],
    queryFn: wearableService.getIntegrations,
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: healthData } = useQuery({
    queryKey: ["/api/health-data"],
    queryFn: () => wearableService.getHealthData(),
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const connectMutation = useMutation({
    mutationFn: ({ provider }: { provider: string }) => 
      wearableService.connectDevice(provider, `simulated_auth_code_${Date.now()}`),
    onSuccess: (result, variables) => {
      toast({
        title: "Device Connected",
        description: `Successfully connected your ${variables.provider} device!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
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
        title: "Connection Failed",
        description: "Failed to connect device. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: wearableService.syncData,
    onSuccess: (result) => {
      toast({
        title: "Data Synced",
        description: `Synced ${result.synced} new data points successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/integrations"] });
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
        title: "Sync Failed",
        description: "Failed to sync health data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const availableProviders = [
    {
      id: "fitbit",
      name: "Fitbit",
      description: "Connect your Fitbit device to sync health and fitness data",
      icon: Watch,
      color: "bg-blue-500",
    },
    {
      id: "garmin",
      name: "Garmin",
      description: "Sync data from your Garmin watch or fitness tracker",
      icon: Watch,
      color: "bg-green-500",
    },
    {
      id: "apple_health",
      name: "Apple Health",
      description: "Connect with Apple Health to sync iPhone and Apple Watch data",
      icon: Smartphone,
      color: "bg-gray-800",
    },
    {
      id: "google_fit",
      name: "Google Fit",
      description: "Sync fitness data from Google Fit and compatible Android devices",
      icon: Smartphone,
      color: "bg-red-500",
    },
  ];

  const getHealthIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case "heart_rate":
        return Heart;
      case "steps":
        return Footprints;
      case "sleep":
        return Moon;
      case "calories_burned":
      case "active_minutes":
        return Zap;
      default:
        return Watch;
    }
  };

  const getHealthColor = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case "heart_rate":
        return "text-red-500";
      case "steps":
        return "text-blue-500";
      case "sleep":
        return "text-purple-500";
      case "calories_burned":
        return "text-orange-500";
      case "active_minutes":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDataType = (dataType: string) => {
    return dataType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getLatestHealthData = () => {
    if (!healthData || healthData.length === 0) return {};
    
    const latestByType = healthData.reduce((acc: any, point: any) => {
      if (!acc[point.dataType] || new Date(point.recordedAt) > new Date(acc[point.dataType].recordedAt)) {
        acc[point.dataType] = point;
      }
      return acc;
    }, {});

    return latestByType;
  };

  if (isLoading || isIntegrationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const connectedIntegrations = integrations || [];
  const connectedProviderIds = new Set(connectedIntegrations.map((i: any) => i.provider));
  const latestHealthData = getLatestHealthData();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Wearable Devices</h1>
                  <p className="mt-1 text-gray-600">
                    Connect your fitness devices to automatically sync health data
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button 
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending || connectedIntegrations.length === 0}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncMutation.isPending ? 'Syncing...' : 'Sync All'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Connected Devices */}
              <div className="lg:col-span-2 space-y-6">
                {/* Connected Integrations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bluetooth className="mr-2 h-5 w-5 text-primary-500" />
                      Connected Devices
                    </CardTitle>
                    <CardDescription>
                      Manage your connected fitness devices and data sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {connectedIntegrations.length > 0 ? (
                      <div className="space-y-4">
                        {connectedIntegrations.map((integration: any) => {
                          const provider = availableProviders.find(p => p.id === integration.provider);
                          const ProviderIcon = provider?.icon || Watch;
                          
                          return (
                            <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 ${provider?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                                  <ProviderIcon className="text-white" size={20} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {provider?.name || integration.provider}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {integration.isActive ? (
                                      <span className="flex items-center">
                                        <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                                        Connected
                                      </span>
                                    ) : (
                                      <span className="flex items-center">
                                        <XCircle className="mr-1 h-3 w-3 text-red-500" />
                                        Disconnected
                                      </span>
                                    )}
                                  </p>
                                  {integration.lastSync && (
                                    <p className="text-xs text-gray-500">
                                      Last sync: {formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={integration.isActive ? "default" : "secondary"}>
                                  {integration.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  Manage
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bluetooth className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">No devices connected</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Connect a device below to start syncing your health data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Devices */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Devices</CardTitle>
                    <CardDescription>
                      Connect your fitness devices to start syncing data automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableProviders.map((provider) => {
                        const ProviderIcon = provider.icon;
                        const isConnected = connectedProviderIds.has(provider.id);
                        
                        return (
                          <div 
                            key={provider.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`w-10 h-10 ${provider.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <ProviderIcon className="text-white" size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900">{provider.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                <div className="mt-3">
                                  {isConnected ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Connected
                                    </Badge>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => connectMutation.mutate({ provider: provider.id })}
                                      disabled={connectMutation.isPending}
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      Connect
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Health Data Overview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Health Data</CardTitle>
                    <CardDescription>Latest metrics from your connected devices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(latestHealthData).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(latestHealthData).slice(0, 5).map(([dataType, data]: [string, any]) => {
                          const HealthIcon = getHealthIcon(dataType);
                          return (
                            <div key={dataType} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <HealthIcon className={`h-5 w-5 ${getHealthColor(dataType)}`} />
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDataType(dataType)}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {data.value} {data.unit}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(data.recordedAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Watch className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">No health data available</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Connect a device and sync to see your metrics
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sync Status */}
                {connectedIntegrations.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {connectedIntegrations.map((integration: any) => (
                          <div key={integration.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {integration.provider}
                              </span>
                              <span className={`text-xs ${integration.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {integration.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <Progress 
                              value={integration.isActive ? 100 : 0} 
                              className="h-2"
                            />
                            {integration.lastSync && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last sync: {new Date(integration.lastSync).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Privacy Note */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="text-white" size={12} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          Your Data is Secure
                        </h4>
                        <p className="text-xs text-blue-700">
                          All health data is encrypted and stored securely. You can disconnect 
                          devices and delete your data at any time.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
