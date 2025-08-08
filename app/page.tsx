"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, Toaster } from "sonner";
import { Sparkles, RefreshCw, Zap, Lightbulb, Target, Copy, Check } from "lucide-react";

interface Trademark {
  name: string;
  description: string;
  industry: string;
}

export default function Home() {
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false - no loading on page load
  const [isGenerating, setIsGenerating] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [lastClickTime, setLastClickTime] = useState(0);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  
  const generateTrademarks = useAction(api.trademarks.generateTrademarks);
  // Don't query for latest trademarks - only generate when user clicks
  // const latestTrademarks = useQuery(api.trademarks.getLatestTrademarks);

  // Generate browser fingerprint
  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    const canvasData = canvas.toDataURL();
    
    const fingerprint = {
      screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      userAgent: navigator.userAgent.slice(0, 50),
      canvas: canvasData.slice(-50), // Last 50 chars of canvas
    };
    
    // Create a simple hash from the fingerprint
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `fp-${Math.abs(hash).toString(36)}`;
  };

  // Get IP address on mount
  useEffect(() => {
    // Generate fingerprint for better tracking
    const fingerprint = generateFingerprint();
    setIpAddress(fingerprint);
  }, []);

  // Remove this useEffect - not needed since isLoading starts as false

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    toast.success(`"${name}" copied to clipboard!`);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedName(null);
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!ipAddress) return;
    
    // Basic bot detection - check if clicking too fast (less than 500ms)
    const now = Date.now();
    if (lastClickTime && (now - lastClickTime) < 500) {
      toast.error("Please slow down. Try again in a moment.");
      return;
    }
    setLastClickTime(now);
    
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
      
      if (errorData?.message?.includes("Daily limit")) {
        toast.error("Daily limit reached. Please try again tomorrow.", {
          duration: 7000,
        });
      } else if (errorData?.message?.includes("Hourly limit")) {
        toast.error("Hourly limit reached. Please wait a while before trying again.", {
          duration: 6000,
        });
      } else if (errorData?.message?.includes("Rate limit")) {
        toast.error("Too many requests. Please wait less than a minute.", {
          duration: 5000,
        });
      } else if (errorData?.message?.includes("Invalid request")) {
        toast.error("Security validation failed. Please refresh the page.");
      } else if (errorData?.message?.includes("OpenAI API key")) {
        toast.error("API key not configured. Please set up your API key.");
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
            Trademarkable
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
            // Skeleton Loading - show when generating
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
          ) : trademarks.length > 0 ? (
            // Actual Trademark Cards
            trademarks.map((trademark, index) => (
              <Card 
                key={index} 
                className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-[#2D5EE7]/5 hover:to-indigo-500/5 group relative"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-[#2D5EE7] to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider pr-8">
                    {trademark.name}
                  </CardTitle>
                  <Button
                    onClick={() => handleCopy(trademark.name)}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    title="Copy name"
                  >
                    {copiedName === trademark.name ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500 hover:text-[#2D5EE7]" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {trademark.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          ) : (
            // Welcome state - no names generated yet
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <Sparkles className="w-12 h-12 text-[#2D5EE7] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Ready to Generate Names
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click the button above to generate unique trademark names for your business
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        {trademarks.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-6 max-w-2xl mx-auto">
            These AI-generated names have high uniqueness potential but need to be verified by our trademark expert team 
            before use to ensure availability and registrability.
          </p>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Unique coined names • Instantly memorable • USPTO-ready</p>
          <p className="mt-1">Limited to 3 requests per minute • Powered by Ekur AI</p>
          <p className="mt-4 text-xs">Made with love ❤️ by EKUR Team</p>
          <p className="mt-1 text-xs">© {new Date().getFullYear()} EKUR LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}