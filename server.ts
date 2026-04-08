import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  
  // Proxy to Ollama (to handle CORS and provide a single endpoint)
  app.get("/api/ollama/models", async (req, res) => {
    try {
      const response = await axios.get("http://localhost:11434/api/tags", { timeout: 2000 });
      res.json(response.data);
    } catch (error: any) {
      res.status(503).json({ error: "Ollama not reachable", message: error.message });
    }
  });

  app.post("/api/ollama/chat", async (req, res) => {
    try {
      const response = await axios.post("http://localhost:11434/api/chat", req.body, {
        responseType: 'stream'
      });
      response.data.pipe(res);
    } catch (error: any) {
      res.status(503).json({ error: "Ollama chat failed", message: error.message });
    }
  });

  // Web Content Fetcher
  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove script, style, and nav elements
      $('script, style, nav, footer, header').remove();
      
      const html = $('body').html() || "";
      const markdown = NodeHtmlMarkdown.translate(html);
      
      res.json({ 
        title: $('title').text() || url,
        content: markdown.slice(0, 15000) // Limit content size
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch URL", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
