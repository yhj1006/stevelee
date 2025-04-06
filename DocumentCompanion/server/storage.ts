import { users, leaderboard, type User, type InsertUser, type LeaderboardEntry, type InsertLeaderboardEntry } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leaderboard methods
  getTopScores(limit: number): Promise<LeaderboardEntry[]>;
  saveScore(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
}

// Set up the database connection using HTTP instead of WebSockets
// This is more reliable in some environments
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString, { 
  // Force the client to use prepared statements
  prepare: true,
  // Don't use WebSockets (use HTTP)
  ssl: 'require',
  max: 10
});
export const db = drizzle(client);

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async getTopScores(limit: number): Promise<LeaderboardEntry[]> {
    return await db.select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score))
      .limit(limit);
  }
  
  async saveScore(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const result = await db.insert(leaderboard)
      .values(entry)
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
