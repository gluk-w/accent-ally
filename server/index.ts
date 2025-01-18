import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // Create Vite server in middleware mode and configure it
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        server: httpServer
      }
    },
    appType: 'custom'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files from the dist directory in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, '../dist')));
  }

  const port = process.env.PORT || 5000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

createApp().catch((e) => {
  console.error(e);
  process.exit(1);
});