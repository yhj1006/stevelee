import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema, type InsertLeaderboardEntry } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leaderboard API routes
  
  // Get top scores
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const scores = await storage.getTopScores(limit);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  
  // Submit a new score
  app.post("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertLeaderboardSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid score data", details: result.error });
      }
      
      const entry: InsertLeaderboardEntry = result.data;
      const savedEntry = await storage.saveScore(entry);
      res.status(201).json(savedEntry);
    } catch (error) {
      console.error("Error saving score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
