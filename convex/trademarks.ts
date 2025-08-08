import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { ConvexError } from "convex/values";

// Initialize rate limiter with 3 requests per minute per IP
const rateLimiter = new RateLimiter(components.rateLimiter, {
  trademarkGeneration: { 
    kind: "token bucket", 
    rate: 3, 
    period: MINUTE, 
    capacity: 3 
  },
});

// Query to get the latest trademarks
export const getLatestTrademarks = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("trademarks")
      .order("desc")
      .first();
    return latest;
  },
});

// Mutation to save generated trademarks
export const saveTrademarks = mutation({
  args: {
    names: v.array(v.object({
      name: v.string(),
      description: v.string(),
      industry: v.string(),
    })),
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("trademarks", {
      names: args.names,
      createdAt: Date.now(),
      ipAddress: args.ipAddress,
    });
  },
});

// Check rate limit for a given IP
export const checkRateLimit = action({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const status = await rateLimiter.check(ctx, "trademarkGeneration", { 
      key: args.ipAddress 
    });
    return status;
  },
});

// Main action to generate trademarks
export const generateTrademarks = action({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    const { ok, retryAfter } = await rateLimiter.limit(
      ctx, 
      "trademarkGeneration", 
      { key: args.ipAddress }
    );
    
    if (!ok) {
      throw new ConvexError({
        message: "Rate limit exceeded. Please try again later.",
        retryAfter,
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new ConvexError("OpenAI API key is not configured");
    }

    // Build the prompt
    const prompt = `Act as a trademark naming specialist. Generate 10 unique brand names for general retail store services suitable for Amazon stores.

CRITICAL CONSTRAINTS:
1. Length must be between 4-9 LETTERS
2. Must be COINED/INVENTED names that don't exist in USPTO database
3. Must be easily pronounceable for English speakers
4. Names should feel modern, memorable, and brandable

METHODOLOGY:
- Create completely invented words that sound professional
- Blend sounds and syllables creatively
- Focus on euphonic combinations that roll off the tongue
- Avoid existing words or obvious derivatives

Return ONLY a valid JSON array (no markdown, no explanation) with exactly 10 objects. Start with [ and end with ]. Example format:
[
  {"name": "NEXORA", "description": "A fusion of 'next' and 'aurora', suggesting innovation", "industry": "Retail"},
  {"name": "VELURA", "description": "Combines velvet and allure for premium feel", "industry": "Retail"}
]

Generate 10 coined, unique names perfect for modern retail businesses.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a trademark specialist who creates unique, coined brand names. You specialize in inventing names that don't exist in USPTO database. Always return a JSON array with exactly 10 names between 4-9 letters.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.95,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new ConvexError("Failed to generate trademarks");
      }

      console.log("OpenAI raw response:", response);

      // Parse the response
      let trademarks;
      try {
        // Clean the response in case it has markdown code blocks
        const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);
        // Handle if the response is wrapped in an object
        trademarks = Array.isArray(parsed) ? parsed : (parsed.trademarks || parsed.names || parsed.data || []);
        
        // If still not an array, try to extract array from the parsed object
        if (!Array.isArray(trademarks)) {
          // Look for any property that is an array
          const arrayProp = Object.values(parsed).find(val => Array.isArray(val));
          trademarks = arrayProp || [];
        }
      } catch (e) {
        console.error("Failed to parse response:", response);
        console.error("Parse error:", e);
        throw new ConvexError("Failed to parse OpenAI response");
      }

      // Validate and clean the data
      const validTrademarks = trademarks.slice(0, 10).map((tm: any) => ({
        name: String(tm.name || "Unnamed"),
        description: String(tm.description || "A creative brand name").slice(0, 100),
        industry: String(tm.industry || "Retail"),
      }));

      // Save to database
      await ctx.runMutation(api.trademarks.saveTrademarks, {
        names: validTrademarks,
        ipAddress: args.ipAddress,
      });

      return validTrademarks;
    } catch (error) {
      console.error("OpenAI error:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to generate trademarks. Please try again.");
    }
  },
});