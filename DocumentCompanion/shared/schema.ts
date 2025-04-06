import { pgTable, text, serial, integer, boolean, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  playerName: varchar("player_name", { length: 100 }).notNull(),
  score: integer("score").notNull(),
  level: integer("level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    scoreIdx: index("score_idx").on(table.score),
  }
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  playerName: true,
  score: true,
  level: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;
export type LeaderboardEntry = typeof leaderboard.$inferSelect;
