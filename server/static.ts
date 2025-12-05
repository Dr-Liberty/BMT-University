import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Handle both CommonJS (__dirname) and ESM (import.meta.url) contexts
  let distPath: string;
  
  // Try multiple strategies to find the public directory
  const possiblePaths = [
    // When running from dist/index.cjs, public is a sibling folder
    path.resolve(process.cwd(), "dist", "public"),
    // Fallback: check if __dirname is available (CommonJS)
    typeof __dirname !== "undefined" ? path.resolve(__dirname, "public") : null,
  ].filter(Boolean) as string[];

  distPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first. Tried: ${possiblePaths.join(", ")}`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
