import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { workoutService } from "@/services/workouts";
import NavigationSidebar from "@/components/NavigationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Dumbbell, Clock, Target, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const workoutPreferencesSchema = z.object({
  goals: z.array(z.string()).min(1, "Select at least one goal"),
  fitnessLevel: z.number().min(1).max(5),
  timeAvailable: z.number().min(15).max(120),
  equipment: z.array(z.string()).min(1, "Select at least one equipment option"),
});

type WorkoutPreferences = z.infer<typeof workoutPreferencesSchema>;

export default function WorkoutPlans() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

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

  const { data: workoutPlans, isLoading: isPlansLoading, error } = useQuery({
    queryKey: ["/api/workout-plans"],
    queryFn: workoutService.getPlans,
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

  const generatePlanMutation = useMutation({
    mutationFn: workoutService.generatePlan,
    onSuccess: () => {
      toast({
        title: "Workout Plan Generated",
        description: "Your personalized workout plan has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-plans"] });
      setIsGeneratorOpen(false);
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
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<WorkoutPreferences>({
    resolver: zodResolver(workoutPreferencesSchema),
    defaultValues: {
      goals: [],
      fitnessLevel: 3,
      timeAvailable: 45,
      equipment: [],
    },
  });

  const onSubmit = (data: WorkoutPreferences) => {
    generatePlanMutation.mutate(data);
  };

  if (isLoading || isPlansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const goalOptions = [
    { id: "weight_loss", label: "Weight Loss" },
    { id: "muscle_gain", label: "Muscle Gain" },
    { id: "endurance", label: "Endurance" },
    { id: "strength", label: "Strength" },
    { id: "flexibility", label: "Flexibility" },
    { id: "general_fitness", label: "General Fitness" },
  ];

  const equipmentOptions = [
    { id: "bodyweight", label: "Bodyweight Only" },
    { id: "dumbbells", label: "Dumbbells" },
    { id: "resistance_bands", label: "Resistance Bands" },
    { id: "pull_up_bar", label: "Pull-up Bar" },
    { id: "yoga_mat", label: "Yoga Mat" },
    { id: "full_gym", label: "Full Gym Access" },
  ];

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
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Workout Plans</h1>
                  <p className="mt-1 text-gray-600">Create and manage your personalized workout routines</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Generate Personalized Workout Plan</DialogTitle>
                        <DialogDescription>
                          Tell us about your fitness goals and preferences to create a tailored workout plan.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          {/* Goals */}
                          <FormField
                            control={form.control}
                            name="goals"
                            render={() => (
                              <FormItem>
                                <FormLabel>Fitness Goals</FormLabel>
                                <div className="grid grid-cols-2 gap-3">
                                  {goalOptions.map((goal) => (
                                    <FormField
                                      key={goal.id}
                                      control={form.control}
                                      name="goals"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(goal.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, goal.id])
                                                  : field.onChange(
                                                      field.value?.filter((value) => value !== goal.id)
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {goal.label}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Fitness Level */}
                          <FormField
                            control={form.control}
                            name="fitnessLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fitness Level</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your fitness level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">Beginner</SelectItem>
                                    <SelectItem value="2">Novice</SelectItem>
                                    <SelectItem value="3">Intermediate</SelectItem>
                                    <SelectItem value="4">Advanced</SelectItem>
                                    <SelectItem value="5">Expert</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Time Available */}
                          <FormField
                            control={form.control}
                            name="timeAvailable"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Available (minutes per session)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="15" 
                                    max="120" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Equipment */}
                          <FormField
                            control={form.control}
                            name="equipment"
                            render={() => (
                              <FormItem>
                                <FormLabel>Available Equipment</FormLabel>
                                <div className="grid grid-cols-2 gap-3">
                                  {equipmentOptions.map((equipment) => (
                                    <FormField
                                      key={equipment.id}
                                      control={form.control}
                                      name="equipment"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(equipment.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, equipment.id])
                                                  : field.onChange(
                                                      field.value?.filter((value) => value !== equipment.id)
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {equipment.label}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-4">
                            <Button type="button" variant="outline" onClick={() => setIsGeneratorOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={generatePlanMutation.isPending}>
                              {generatePlanMutation.isPending ? "Generating..." : "Generate Plan"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Workout Plans Grid */}
            {workoutPlans && workoutPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workoutPlans.map((plan: any) => (
                  <Card key={plan.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.isActive 
                            ? 'bg-secondary-100 text-secondary-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Target className="mr-1 h-4 w-4" />
                          <span>Level {plan.difficulty}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Dumbbell className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workout plans yet</h3>
                <p className="text-gray-600 mb-6">
                  Generate your first personalized workout plan to get started with your fitness journey.
                </p>
                <Button onClick={() => setIsGeneratorOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Your First Plan
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
