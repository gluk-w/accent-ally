import express from "express";
import { setupVite, serveStatic, log } from "./vite";
//import { registerRoutes } from "./routes"; // Removed as it's not used in the simplified static serving

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  //const server = registerRoutes(app); // Removed as it's not used in the simplified static serving

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, app); //passing app instead of server which is not defined now
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  app.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  })
  .on('error', (error: any) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
})();