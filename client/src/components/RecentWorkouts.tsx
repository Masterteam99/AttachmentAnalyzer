import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Timer, Zap } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface WorkoutSession {
  id: number;
  name: string;
  type: string;
  duration: number;
  caloriesBurned?: number;
  intensity?: string;
  completedAt: string;
}

interface RecentWorkoutsProps {
  sessions: WorkoutSession[];
}

export default function RecentWorkouts({ sessions }: RecentWorkoutsProps) {
  const getWorkoutIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "strength":
        return Dumbbell;
      case "cardio":
        return Zap;
      default:
        return Timer;
    }
  };

  const getIntensityColor = (intensity?: string) => {
    switch (intensity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-600";
      case "medium":
        return "bg-accent-100 text-accent-600";
      case "low":
        return "bg-secondary-100 text-secondary-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (!sessions.length) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Workouts</CardTitle>
            <Link href="/workout-plans">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No workouts yet</p>
            <p className="text-sm text-gray-500 mt-1">Start your first workout to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Workouts</CardTitle>
          <Link href="/workout-plans">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.slice(0, 3).map((session) => {
            const WorkoutIcon = getWorkoutIcon(session.type);
            return (
              <div 
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIntensityColor(session.intensity)}`}>
                    <WorkoutIcon size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{session.name}</p>
                    <p className="text-sm text-gray-500">
                      {session.duration} minutes • {session.intensity || "Medium"} intensity
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session.caloriesBurned ? `${session.caloriesBurned} cal` : "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
