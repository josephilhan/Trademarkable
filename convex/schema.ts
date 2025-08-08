import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trademarks: defineTable({
    names: v.array(v.object({
      name: v.string(),
      description: v.string(),
      industry: v.string(),
    })),
    createdAt: v.number(),
    ipAddress: v.string(),
  }).index("by_ip", ["ipAddress"]),
});