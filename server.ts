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
    const ollamaUrl = (req.query.url as string) || "http://localhost:11434";
    try {
      const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 3000 });
      res.json(response.data);
    } catch (error: any) {
      res.status(503).json({ error: "Ollama not reachable", message: error.message });
    }
  });

  app.post("/api/ollama/chat", async (req, res) => {
    const { ollama_url, ...ollamaBody } = req.body;
    const targetUrl = ollama_url || "http://localhost:11434";
    try {
      const response = await axios.post(`${targetUrl}/api/chat`, ollamaBody, {
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header, noscript, iframe').remove();
      
      const html = $('body').html() || "";
      const markdown = NodeHtmlMarkdown.translate(html);
      
      res.json({ 
        title: $('title').text() || url,
        content: markdown.slice(0, 10000) // Limit per source to allow multi-source
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch URL", message: error.message });
    }
  });

  // Search Engine Proxy (DuckDuckGo HTML)
  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const $ = cheerio.load(response.data);
      const results: { title: string, url: string, snippet: string }[] = [];
      
      $('.result').each((i, el) => {
        if (i < 5) { // Top 5 results
          const title = $(el).find('.result__title').text().trim();
          const url = $(el).find('.result__url').text().trim();
          const snippet = $(el).find('.result__snippet').text().trim();
          if (title && url) results.push({ title, url: `https://${url}`, snippet });
        }
      });
      
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: "Search failed", message: error.message });
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
