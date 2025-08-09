import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";
import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { ConvexError } from "convex/values";

// Initialize rate limiters with multiple time windows
const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per minute limit
  trademarkGeneration: { 
    kind: "token bucket", 
    rate: 3, 
    period: MINUTE, 
    capacity: 3 
  },
  // Per hour limit  
  trademarkGenerationHourly: {
    kind: "token bucket",
    rate: 10,
    period: HOUR,
    capacity: 10
  },
  // Per day limit (24 hours in milliseconds)
  trademarkGenerationDaily: {
    kind: "fixed window",
    rate: 30,
    period: 24 * 60 * 60 * 1000, // 24 hours
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
    // Validate fingerprint format
    if (!args.ipAddress || !args.ipAddress.startsWith('fp-') || args.ipAddress.length < 5) {
      throw new ConvexError("Invalid request");
    }

    // Check multiple rate limits
    const minuteLimit = await rateLimiter.limit(
      ctx, 
      "trademarkGeneration", 
      { key: args.ipAddress }
    );
    
    if (!minuteLimit.ok) {
      throw new ConvexError({
        message: "Rate limit exceeded. Please try again in a minute.",
        retryAfter: minuteLimit.retryAfter,
      });
    }

    const hourlyLimit = await rateLimiter.limit(
      ctx,
      "trademarkGenerationHourly",
      { key: args.ipAddress }
    );

    if (!hourlyLimit.ok) {
      throw new ConvexError({
        message: "Hourly limit exceeded. Please try again later.",
        retryAfter: hourlyLimit.retryAfter,
      });
    }

    const dailyLimit = await rateLimiter.limit(
      ctx,
      "trademarkGenerationDaily", 
      { key: args.ipAddress }
    );

    if (!dailyLimit.ok) {
      throw new ConvexError({
        message: "Daily limit reached. Please try again tomorrow.",
        retryAfter: dailyLimit.retryAfter,
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
    const prompt = `Act as a trademark naming specialist with deep expertise in ancient Mesopotamian linguistics (Sumerian, Akkadian, Assyrian). Generate 10 brand names for general retail store services.

CRITICAL CONSTRAINTS:
1. NAME LENGTH: Every name MUST be 8 letters or fewer
2. UNIQUENESS: Do NOT use direct transliterations - names must be significantly modified
3. Must be easily pronounceable for English speakers
4. Names must be coined/invented words that don't exist in USPTO database

METHODOLOGY FOR EACH NAME:
1. Identify a Core Retail Concept: trade, craft, gather, prosper, earth, shine, gateway
2. Source an Ancient Word: Find Sumerian, Babylonian, or Assyrian word for that concept
3. Apply Creative Modification:
   - Shorten the word (e.g., damgār becomes GAR or DAG)
   - Alter vowels or consonants (e.g., kārum becomes KARUN or KORUM)
   - Use only evocative syllables
4. Avoid Common Knowledge: No Ishtar, Babylon, Gilgamesh, Ur, Enki. Focus on obscure words.

Focus on concepts like: merchant (damgār), gate (kā), house (é), strong (dannu), bright (nūru), tablet (ṭuppu), star (mul), place (ašru), craft (nemēqu).

Return ONLY a valid JSON array with exactly 10 objects. Each name should be modern-sounding and suitable for Amazon stores. Format:
[
  {"name": "KARUN", "description": "Modern take on ancient trading post concept", "industry": "Retail"}
]

Create 10 unique, coined names that feel timeless yet modern.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a trademark specialist with expertise in ancient Mesopotamian linguistics. You create coined, modified names that don't exist in USPTO database by transforming ancient words into modern, brandable names. Always return a JSON array with exactly 10 names, each 8 letters or fewer.",
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