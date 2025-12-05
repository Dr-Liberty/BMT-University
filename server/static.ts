import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production, the client build is at dist/public relative to the project root
  // process.cwd() gives us the project root in production
  const distPath = path.join(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Build directory not found at: ${distPath}`);
    console.error(`Current working directory: ${process.cwd()}`);
    console.error(`Directory contents:`, fs.readdirSync(process.cwd()));
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
