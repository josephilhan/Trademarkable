"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import { Sparkles, RefreshCw, Zap, Lightbulb, Target } from "lucide-react";

interface Trademark {
  name: string;
  description: string;
  industry: string;
}

export default function Home() {
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  
  const generateTrademarks = useAction(api.trademarks.generateTrademarks);
  const latestTrademarks = useQuery(api.trademarks.getLatestTrademarks);

  // Get IP address on mount
  useEffect(() => {
    // Use localStorage to persist the client ID across page refreshes
    let clientId = localStorage.getItem("clientId");
    if (!clientId) {
      clientId = "client-" + Math.random().toString(36).substring(7);
      localStorage.setItem("clientId", clientId);
    }
    setIpAddress(clientId);
  }, []);

  // Load initial data
  useEffect(() => {
    if (ipAddress && !latestTrademarks) {
      handleGenerate();
    } else if (latestTrademarks) {
      setTrademarks(latestTrademarks.names);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipAddress, latestTrademarks]);

  const handleGenerate = async () => {
    if (!ipAddress) return;
    
    setIsGenerating(true);
    setIsLoading(true);
    
    try {
      const newTrademarks = await generateTrademarks({
        ipAddress,
      });
      
      setTrademarks(newTrademarks);
      toast.success("New trademark names generated successfully!");
    } catch (error) {
      console.error("Error generating trademarks:", error);
      
      const errorData = (error as { data?: { message?: string; retryAfter?: number } })?.data;
      
      if (errorData?.message?.includes("Rate limit")) {
        const retryTime = errorData.retryAfter;
        const seconds = retryTime ? Math.ceil((retryTime - Date.now()) / 1000) : 60;
        toast.error(`Rate limit exceeded. Try again in ${seconds} seconds.`, {
          duration: 5000,
        });
      } else if (errorData?.message?.includes("OpenAI API key")) {
        toast.error("OpenAI API key not configured. Please set up your API key.");
      } else {
        toast.error("Failed to generate trademarks. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-center" richColors />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="text-center space-y-4 mb-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-[#2D5EE7] to-indigo-500 opacity-30 rounded-full"></div>
              <Sparkles className="w-16 h-16 text-[#2D5EE7] relative z-10" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#2D5EE7] to-indigo-600 bg-clip-text text-transparent">
            NameForge AI
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate unique, coined trademark names powered by AI.
            Perfect for Amazon stores and retail businesses seeking distinctive brand identities.
          </p>
          
          <div className="flex gap-4 justify-center items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Instant Creation</span>
            </div>
            <div className="flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <span>USPTO Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-green-500" />
              <span>Amazon Optimized</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-[#2D5EE7] to-indigo-600 hover:from-[#1E4BC8] hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Generating Names...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate New Names
              </>
            )}
          </Button>
        </div>

        {/* Trademark Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {isLoading ? (
            // Skeleton Loading
            Array.from({ length: 10 }).map((_, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-4/5" />
                </CardContent>
              </Card>
            ))
          ) : (
            // Actual Trademark Cards
            trademarks.map((trademark, index) => (
              <Card 
                key={index} 
                className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-[#2D5EE7]/5 hover:to-indigo-500/5 group"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-[#2D5EE7] to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider">
                    {trademark.name}
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    className="w-fit text-xs bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900"
                  >
                    {trademark.industry}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm line-clamp-2">
                    {trademark.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Unique coined names • 4-9 letters • USPTO-ready</p>
          <p className="mt-1">Rate limited to 3 requests per minute • Powered by Ekur AI</p>
        </div>
      </div>
    </div>
  );
}