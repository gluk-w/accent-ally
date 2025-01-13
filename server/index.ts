import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Ensure we're in development mode for Vite
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Server initialization with proper error handling
(async () => {
  try {
    log('Starting server initialization...');

    // Register API routes first
    const server = registerRoutes(app);

    // Global error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite or static serving based on environment
    if (process.env.NODE_ENV === "development") {
      try {
        log('Setting up Vite in development mode...');
        await setupVite(app, server);
        log('Vite setup completed');
      } catch (error) {
        console.error('Failed to setup Vite:', error);
        process.exit(1);
      }
    } else {
      log('Setting up static serving for production...');
      serveStatic(app);
    }

    // Start server
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server listening on port ${PORT} in ${process.env.NODE_ENV} mode`);
    }).on('error', (error: any) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
})().catch(error => {
  console.error('Unhandled server error:', error);
  process.exit(1);
});