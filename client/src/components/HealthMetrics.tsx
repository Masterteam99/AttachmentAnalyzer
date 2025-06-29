import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Footprints, Moon, RefreshCw, Bluetooth } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wearableService } from "@/services/wearables";
import { useToast } from "@/hooks/use-toast";

interface HealthDataPoint {
  dataType: string;
  value: number;
  unit: string;
  recordedAt: string;
}

interface HealthMetricsProps {
  data: HealthDataPoint[];
}

export default function HealthMetrics({ data }: HealthMetricsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: wearableService.syncData,
    onSuccess: () => {
      toast({
        title: "Data Synced",
        description: "Health data has been synchronized successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync health data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMetricIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case "heart_rate":
        return Heart;
      case "steps":
        return Footprints;
      case "sleep":
        return Moon;
      default:
        return Heart;
    }
  };

  const getMetricColor = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case "heart_rate":
        return "text-red-500";
      case "steps":
        return "text-secondary-500";
      case "sleep":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const formatMetricName = (dataType: string) => {
    return dataType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getLatestMetrics = () => {
    const metricsByType = data.reduce((acc, point) => {
      if (!acc[point.dataType] || new Date(point.recordedAt) > new Date(acc[point.dataType].recordedAt)) {
        acc[point.dataType] = point;
      }
      return acc;
    }, {} as Record<string, HealthDataPoint>);

    return Object.values(metricsByType).slice(0, 3);
  };

  const latestMetrics = getLatestMetrics();

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Health Metrics</CardTitle>
          <Bluetooth className="text-primary-500" size={20} />
        </div>
      </CardHeader>
      <CardContent>
        {latestMetrics.length > 0 ? (
          <div className="space-y-4">
            {latestMetrics.map((metric) => {
              const MetricIcon = getMetricIcon(metric.dataType);
              return (
                <div key={metric.dataType} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MetricIcon className={`mr-3 ${getMetricColor(metric.dataType)}`} size={20} />
                    <span className="text-sm text-gray-600">{formatMetricName(metric.dataType)}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {metric.value} {metric.unit}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Bluetooth className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No health data available</p>
            <p className="text-xs text-gray-500 mt-1">Connect a wearable device to see your metrics</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
