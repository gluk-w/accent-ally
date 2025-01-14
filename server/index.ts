import express from "express";
import { createServer } from "http";
import { setupVite, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const port = parseInt(process.env.PORT || "5000", 10);

  // Serve static files from the client directory during development
  app.use(express.static(path.resolve(__dirname, '../client')));

  // In development, set up Vite's dev server
  if (process.env.NODE_ENV !== "production") {
    try {
      await setupVite(app, server);
      log('Vite middleware setup complete');
    } catch (err) {
      console.error("Error setting up Vite:", err);
      process.exit(1);
    }
  }

  // For client-side routing, send index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(console.error);