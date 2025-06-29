import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Target, Star } from "lucide-react";
import { Link } from "wouter";

interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  earnedAt: string;
}

interface AchievementCardProps {
  achievements: Achievement[];
}

export default function AchievementCard({ achievements }: AchievementCardProps) {
  const getAchievementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return Flame;
      case "perfectionist":
        return Target;
      case "explorer":
        return Star;
      default:
        return Trophy;
    }
  };

  const getAchievementGradient = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return "from-accent-50 to-red-50";
      case "perfectionist":
        return "from-primary-50 to-secondary-50";
      case "explorer":
        return "from-purple-50 to-indigo-50";
      default:
        return "from-accent-50 to-secondary-50";
    }
  };

  const getIconGradient = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return "from-accent-500 to-red-500";
      case "perfectionist":
        return "from-primary-500 to-secondary-500";
      case "explorer":
        return "from-purple-500 to-indigo-500";
      default:
        return "from-accent-500 to-secondary-500";
    }
  };

  if (!achievements.length) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Latest Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No achievements yet</p>
            <p className="text-sm text-gray-500 mt-1">Complete workouts to earn your first achievement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Latest Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.slice(0, 2).map((achievement) => {
            const AchievementIcon = getAchievementIcon(achievement.type);
            return (
              <div 
                key={achievement.id}
                className={`flex items-center space-x-4 p-3 bg-gradient-to-r ${getAchievementGradient(achievement.type)} rounded-lg animate-bounce-slow`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${getIconGradient(achievement.type)} rounded-full flex items-center justify-center shadow-lg achievement-badge`}>
                  <AchievementIcon className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link href="/achievements">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View all achievements
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
