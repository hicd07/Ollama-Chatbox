import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { ChatOllama } from "@langchain/ollama";
import { DynamicTool } from "@langchain/core/tools";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { 
  createWebSearchTool, 
  createGmailTool, 
  createCalendarTool, 
  createSlackTool, 
  createCalculatorTool, 
  createImageGenerationTool, 
  createWikipediaTool, 
  createPythonReplTool, 
  createKnowledgeBaseTool, 
  createBrowserTool, 
  createArxivTool, 
  createYoutubeSearchTool, 
  createWolframAlphaTool, 
  createFileSystemTool, 
  createCsvAnalyzerTool, 
  createMcpTool, 
  createCustomApiTool 
} from "./server/tools";

const MessagesState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  
  // --- LangGraph Agent Implementation ---

  app.post("/api/agent/chat", async (req, res) => {
    const { ollama_url, model, messages, config, knowledge_base } = req.body;
    const targetUrl = ollama_url || "http://localhost:11434";

    const tools: DynamicTool[] = [];
    const hasInternet = config.internet_access;

    // Local / Configured Tools (Prioritized)
    if (config.tools.knowledge_base || (knowledge_base && knowledge_base.length > 0)) {
      tools.push(createKnowledgeBaseTool(knowledge_base || []));
    }
    if (config.tools.mcp) tools.push(createMcpTool(config.mcp_server_url));
    if (config.tools.custom_api) tools.push(createCustomApiTool(config.custom_api_url));
    if (config.tools.file_system) tools.push(createFileSystemTool(config.fs_read_access, config.fs_write_access));
    if (config.tools.csv_analyzer) tools.push(createCsvAnalyzerTool(knowledge_base || []));
    if (config.tools.calculator) tools.push(createCalculatorTool());
    if (config.tools.python_repl) tools.push(createPythonReplTool());

    // Internet Dependent Tools (Only if internet_access is enabled)
    if (hasInternet) {
      if (config.tools.web_search) {
        tools.push(createWebSearchTool());
        tools.push(createBrowserTool());
      }
      if (config.tools.wikipedia) tools.push(createWikipediaTool());
      if (config.tools.arxiv) tools.push(createArxivTool());
      if (config.tools.youtube_search) tools.push(createYoutubeSearchTool());
      if (config.tools.wolfram_alpha) tools.push(createWolframAlphaTool());
      if (config.tools.gmail) tools.push(createGmailTool());
      if (config.tools.calendar) tools.push(createCalendarTool());
      if (config.tools.slack) tools.push(createSlackTool());
      if (config.tools.image_generation) tools.push(createImageGenerationTool());
    }

    const llm = new ChatOllama({
      baseUrl: targetUrl,
      model: model,
      temperature: config.temperature,
      numCtx: config.num_ctx,
      numGpu: config.num_gpu,
      numThread: config.num_thread,
      topK: config.top_k,
      topP: config.top_p,
      repeatPenalty: config.repeat_penalty,
      seed: config.seed,
    }).bindTools(tools);

    const toolNode = new ToolNode(tools);

    const callModel = async (state: typeof MessagesState.State) => {
      const enhancedMessages = [...state.messages];
      const systemMsgIndex = enhancedMessages.findIndex(m => m instanceof SystemMessage);
      
      const priorityInstruction = `
STRICT TOOL PRIORITIZATION RULE:
1. ALWAYS check internal/local sources FIRST: 'knowledge_base', 'mcp_connector', 'custom_api', 'file_system'.
2. ONLY use internet-based tools ('web_search', 'wikipedia', 'arxiv', etc.) if the information is NOT found in local sources.
3. If 'internet_access' is disabled (not in your tool list), do NOT attempt to search the web.
4. Respect file system permissions: 'file_system' will return errors if read/write is disabled.
`;

      if (systemMsgIndex !== -1) {
        const existingContent = enhancedMessages[systemMsgIndex].content;
        enhancedMessages[systemMsgIndex] = new SystemMessage(existingContent + "\n" + priorityInstruction);
      } else {
        enhancedMessages.unshift(new SystemMessage(priorityInstruction));
      }

      const response = await llm.invoke(enhancedMessages);
      return { messages: [response] };
    };

    const shouldContinue = (state: typeof MessagesState.State) => {
      const { messages } = state;
      const lastMessage = messages[messages.length - 1] as AIMessage;
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
      }
      return END;
    };

    const workflow = new StateGraph(MessagesState)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge(START, "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent");

    const graph = workflow.compile();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const inputs = {
        messages: messages.map((m: any) => {
          if (m.role === 'user') return new HumanMessage(m.content);
          if (m.role === 'assistant') return new AIMessage(m.content);
          if (m.role === 'system') return new SystemMessage(m.content);
          return new HumanMessage(m.content);
        })
      };

      const stream = await graph.stream(inputs, { streamMode: "values" });

      for await (const chunk of stream) {
        const messages = (chunk as any).messages;
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage instanceof AIMessage) {
            res.write(JSON.stringify({ 
              message: { 
                role: 'assistant', 
                content: lastMessage.content,
                tool_calls: lastMessage.tool_calls,
                metrics: lastMessage.usage_metadata ? {
                  total_duration: (lastMessage.response_metadata as any)?.total_duration || 0,
                  prompt_eval_count: lastMessage.usage_metadata.input_tokens || 0,
                  eval_count: lastMessage.usage_metadata.output_tokens || 0
                } : undefined
              } 
            }) + '\n');
          }
        }
      }
      res.write(JSON.stringify({ done: true }) + '\n');
      res.end();
    } catch (error: any) {
      console.error("Agent Error:", error);
      res.write(JSON.stringify({ error: "Agent failed", message: error.message }) + '\n');
      res.end();
    }
  });

  // --- End LangGraph Agent Implementation ---
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
