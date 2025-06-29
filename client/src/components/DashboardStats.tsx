import { Card, CardContent } from "@/components/ui/card";
import { Target, Flame, Dumbbell, Zap } from "lucide-react";

interface StatsData {
  currentStreak?: number;
  totalWorkouts?: number;
  totalCaloriesBurned?: number;
  weeklyProgress?: number;
  weeklyGoal?: number;
}

interface DashboardStatsProps {
  data?: StatsData;
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const stats = data || {};
  
  const weeklyProgressPercentage = stats.weeklyGoal 
    ? Math.round((stats.weeklyProgress || 0) / stats.weeklyGoal * 100)
    : 0;

  const statsCards = [
    {
      title: "Weekly Goal",
      value: `${weeklyProgressPercentage}%`,
      subtitle: `${stats.weeklyProgress || 0} of ${stats.weeklyGoal || 4} workouts`,
      icon: Target,
      color: "secondary",
      showProgress: true,
      progressValue: weeklyProgressPercentage,
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak || 0} days`,
      subtitle: stats.currentStreak ? "🔥 Keep it up!" : "Start your streak!",
      icon: Flame,
      color: "accent",
    },
    {
      title: "Total Workouts",
      value: `${stats.totalWorkouts || 0}`,
      subtitle: "All time",
      icon: Dumbbell,
      color: "primary",
    },
    {
      title: "Calories Burned",
      value: `${stats.totalCaloriesBurned?.toLocaleString() || 0}`,
      subtitle: "Total",
      icon: Zap,
      color: "red",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      secondary: "bg-secondary-100 text-secondary-600",
      accent: "bg-accent-100 text-accent-600",
      primary: "bg-primary-100 text-primary-600",
      red: "bg-red-100 text-red-600",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  const getProgressColor = (color: string) => {
    const colorMap = {
      secondary: "bg-secondary-500",
      accent: "bg-accent-500",
      primary: "bg-primary-500",
      red: "bg-red-500",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <Icon size={20} />
                </div>
              </div>
              {stat.showProgress && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stat.color)}`}
                      style={{ width: `${Math.min(stat.progressValue || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
