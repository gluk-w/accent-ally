import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Serve static files from the client directory during development
app.use(express.static(path.resolve(__dirname, '../client')));

// For client-side routing, send index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Development server running at http://0.0.0.0:${port}`);
});