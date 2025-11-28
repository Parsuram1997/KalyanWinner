
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { analyzeHistoricalData } from "@/ai/flows/historical-data-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

const formSchema = z.object({
  historicalData: z.string().min(10, {
    message: "Please provide some historical data to analyze.",
  }),
  userQuery: z
    .string()
    .min(5, { message: "Please ask a specific question." }),
});

const sampleData = `Kalyan Day Results:
20/07/2024: 128-13-490
19/07/2024: 579-18-224
18/07/2024: 690-51-137
17/07/2024: 123-60-460
16/07/2024: 789-44-220`;

export default function AnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalData: sampleData,
      userQuery: "What are the recent trends in open panna?",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult("");
    try {
      const result = await analyzeHistoricalData(values);
      setAnalysisResult(result.analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not get insights from AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">AI Data Analysis</h1>
        <p className="text-muted-foreground">
          Get AI-powered insights from historical game data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Provide Data</CardTitle>
                <CardDescription>
                  Enter historical data and your query for analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="historicalData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historical Data</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste historical data here..."
                          className="min-h-[150px] font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Question</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 'Any patterns in Jodi numbers?'"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isLoading ? "Analyzing..." : "Analyze with AI"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Results from the AI analysis will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
            )}
            {analysisResult && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>{analysisResult}</p>
              </div>
            )}
            {!isLoading && !analysisResult && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 mb-4" />
                <p>Your analysis results will be displayed here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
