import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { updateAboutPageSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get about page content
  app.get("/api/about", async (req, res) => {
    try {
      const aboutPage = await storage.getAboutPage();
      res.json(aboutPage);
    } catch (error) {
      console.error("Error fetching about page:", error);
      res.status(500).json({ error: "Failed to fetch about page content" });
    }
  });

  // Update about page content (admin only - auth to be added later)
  app.put("/api/about", async (req, res) => {
    try {
      const result = updateAboutPageSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromError(result.error);
        return res.status(400).json({ error: validationError.message });
      }

      const updatedPage = await storage.updateAboutPage(result.data);
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating about page:", error);
      res.status(500).json({ error: "Failed to update about page content" });
    }
  });

  return httpServer;
}
