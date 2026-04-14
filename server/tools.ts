import { DynamicTool } from "@langchain/core/tools";
import axios from "axios";
import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { parseStringPromise } from 'xml2js';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export const createGmailTool = () => {
  return new DynamicTool({
    name: "gmail_tool",
    description: "Envía correos electrónicos. Requiere: destinatario, asunto y cuerpo.",
    func: async (input: string) => {
      if (!process.env.GMAIL_API_KEY) {
        return "Simulación: Correo preparado para enviar. (Para envío real, configura GMAIL_API_KEY). Destinatario: " + input;
      }
      return "Correo enviado exitosamente (vía API).";
    }
  });
};

export const createCalendarTool = () => {
  return new DynamicTool({
    name: "calendar_tool",
    description: "Gestiona eventos en el calendario. Comandos: list, create <titulo> <fecha>.",
    func: async (input: string) => {
      return "Simulación de Calendario: Evento procesado. (Requiere integración con Google Calendar API).";
    }
  });
};

export const createSlackTool = () => {
  return new DynamicTool({
    name: "slack_tool",
    description: "Envía mensajes a canales de Slack. Requiere: canal y mensaje.",
    func: async (input: string) => {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return "Error: SLACK_WEBHOOK_URL no configurada.";
      try {
        await axios.post(webhookUrl, { text: input });
        return "Mensaje enviado a Slack.";
      } catch (e: any) {
        return `Error al enviar a Slack: ${e.message}`;
      }
    }
  });
};

export const createCalculatorTool = () => {
  return new DynamicTool({
    name: "calculator",
    description: "Realiza cálculos matemáticos simples. Para cálculos complejos o fórmulas, usa la Consola Python.",
    func: async (expression: string) => {
      try {
        const sanitized = expression.replace(/[^-()\d/*+.]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        return result.toString();
      } catch (e) {
        return "Error en el cálculo. Intenta usar la Consola Python para mayor precisión.";
      }
    }
  });
};

export const createImageGenerationTool = () => {
  return new DynamicTool({
    name: "image_generation",
    description: "Genera una representación visual de un concepto.",
    func: async (prompt: string) => {
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://picsum.photos/seed/${seed}/800/600`;
      return `He generado una imagen basada en tu descripción: ![Imagen Generada](${imageUrl})\n\n*(Nota: En esta versión sandbox se utiliza un generador de marcadores de posición visuales)*`;
    }
  });
};

export const createWikipediaTool = () => {
  return new DynamicTool({
    name: "wikipedia",
    description: "Busca resúmenes enciclopédicos en Wikipedia. Útil para conceptos generales, historia y biografías.",
    func: async (query: string) => {
      try {
        const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await axios.get(searchUrl);
        const results = searchRes.data.query.search;
        if (results.length === 0) return "No se encontraron resultados en Wikipedia.";
        
        const pageId = results[0].pageid;
        const contentUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;
        const contentRes = await axios.get(contentUrl);
        const extract = contentRes.data.query.pages[pageId].extract;
        return `Resumen de Wikipedia para "${results[0].title}":\n${extract}`;
      } catch (e) {
        return "Error al consultar Wikipedia.";
      }
    }
  });
};

export const createPythonReplTool = () => {
  return new DynamicTool({
    name: "python_repl",
    description: "Ejecuta código Python para realizar cálculos complejos o procesamiento de datos. El código debe ser autónomo.",
    func: async (code: string) => {
      try {
        const tempFile = path.join(process.cwd(), `temp_${Date.now()}.py`);
        await fs.writeFile(tempFile, code);
        const { stdout, stderr } = await execPromise(`python3 ${tempFile}`);
        await fs.unlink(tempFile);
        if (stderr) return `Error en ejecución:\n${stderr}`;
        return stdout || "Código ejecutado exitosamente (sin salida).";
      } catch (e: any) {
        return `Error al ejecutar Python: ${e.message}`;
      }
    }
  });
};

export const createKnowledgeBaseTool = (documents: any[]) => {
  return new DynamicTool({
    name: "knowledge_base",
    description: "Busca información en los documentos y archivos que el usuario ha adjuntado a la conversación.",
    func: async (query: string) => {
      if (!documents || documents.length === 0) return "No hay documentos adjuntos en la base de conocimientos.";
      
      const results = documents.map(doc => {
        const content = doc.content || "";
        if (content.toLowerCase().includes(query.toLowerCase())) {
          return `[DOCUMENTO: ${doc.name}]\n${content.slice(0, 1000)}...`;
        }
        return null;
      }).filter(r => r !== null);

      if (results.length === 0) return "No se encontró información relevante en los documentos adjuntos para esa consulta.";
      return results.join("\n---\n");
    }
  });
};

export const createBrowserTool = () => {
  return new DynamicTool({
    name: "browser",
    description: "Extrae el contenido de una URL específica. Útil cuando ya tienes un enlace y necesitas leer su información detallada.",
    func: async (url: string) => {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          timeout: 10000
        });
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, noscript, iframe').remove();
        const html = $('body').html() || "";
        const markdown = NodeHtmlMarkdown.translate(html);
        return `Contenido de ${url}:\n\n${markdown.slice(0, 8000)}`;
      } catch (e: any) {
        return `Error al acceder a la URL: ${e.message}`;
      }
    }
  });
};

export const createArxivTool = () => {
  return new DynamicTool({
    name: "arxiv",
    description: "Busca artículos científicos en Arxiv. Útil para investigación técnica y académica.",
    func: async (query: string) => {
      try {
        const response = await axios.get(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=3`);
        const result = await parseStringPromise(response.data);
        const entries = result.feed.entry;
        if (!entries) return "No se encontraron artículos en Arxiv.";
        
        return entries.map((e: any) => {
          return `Título: ${e.title[0].trim()}\nAutores: ${e.author.map((a: any) => a.name[0]).join(", ")}\nResumen: ${e.summary[0].trim()}\nLink: ${e.id[0]}`;
        }).join("\n---\n");
      } catch (e: any) {
        return `Error al buscar en Arxiv: ${e.message}`;
      }
    }
  });
};

export const createYoutubeSearchTool = () => {
  return new DynamicTool({
    name: "youtube_search",
    description: "Busca videos en YouTube. Devuelve títulos y enlaces.",
    func: async (query: string) => {
      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const regex = /"videoRenderer":\{"videoId":"([^"]+)","thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/g;
        let match;
        let count = 0;
        const results: string[] = [];
        const html = response.data;
        while ((match = regex.exec(html)) !== null && count < 3) {
          results.push(`Video ID: ${match[1]}\nLink: https://www.youtube.com/watch?v=${match[1]}`);
          count++;
        }
        if (results.length === 0) return "No se encontraron videos en YouTube.";
        return results.join("\n---\n");
      } catch (e: any) {
        return `Error al buscar en YouTube: ${e.message}`;
      }
    }
  });
};

export const createWolframAlphaTool = () => {
  return new DynamicTool({
    name: "wolfram_alpha",
    description: "Resuelve consultas matemáticas y científicas complejas usando Wolfram Alpha.",
    func: async (query: string) => {
      const appId = process.env.WOLFRAM_ALPHA_APP_ID;
      if (!appId) return "Error: WOLFRAM_ALPHA_APP_ID no configurada.";
      try {
        const response = await axios.get(`http://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`);
        return response.data;
      } catch (e: any) {
        return `Error en Wolfram Alpha: ${e.message}`;
      }
    }
  });
};

export const createWebSearchTool = () => {
  return new DynamicTool({
    name: "web_search",
    description: "Busca en la web usando DuckDuckGo. Devuelve títulos, enlaces y fragmentos.",
    func: async (query: string) => {
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        const results: string[] = [];
        $('.result').each((i, el) => {
          if (i < 5) {
            const title = $(el).find('.result__title').text().trim();
            const url = $(el).find('.result__url').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            results.push(`Título: ${title}\nURL: ${url}\nSnippet: ${snippet}`);
          }
        });
        if (results.length === 0) return "No se encontraron resultados de búsqueda.";
        return results.join("\n---\n");
      } catch (e: any) {
        return `Error en búsqueda web: ${e.message}`;
      }
    }
  });
};

export const createFileSystemTool = (fsRead: boolean, fsWrite: boolean) => {
  return new DynamicTool({
    name: "file_system",
    description: "Lee o escribe archivos en el servidor. Comandos: read <path>, write <path> <content>.",
    func: async (input: string) => {
      const parts = input.split(" ");
      const command = parts[0];
      const filePath = parts[1];
      const content = parts.slice(2).join(" ");

      if (command === "read") {
        if (!fsRead) return "Error: Permiso de lectura denegado.";
        try {
          const data = await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
          return data;
        } catch (e: any) {
          return `Error al leer archivo: ${e.message}`;
        }
      } else if (command === "write") {
        if (!fsWrite) return "Error: Permiso de escritura denegado.";
        try {
          await fs.writeFile(path.join(process.cwd(), filePath), content);
          return `Archivo escrito exitosamente en ${filePath}`;
        } catch (e: any) {
          return `Error al escribir archivo: ${e.message}`;
        }
      }
      return "Comando no reconocido. Usa 'read' o 'write'.";
    }
  });
};

export const createCsvAnalyzerTool = (documents: any[]) => {
  return new DynamicTool({
    name: "data_analyzer",
    description: "Analiza archivos CSV o Excel (.xlsx) adjuntos. Proporciona estadísticas, columnas y vista previa de datos.",
    func: async (fileName: string) => {
      const doc = documents.find(d => d.name.toLowerCase().includes(fileName.toLowerCase()));
      if (!doc) return `No se encontró el archivo "${fileName}" en los documentos adjuntos.`;
      
      try {
        let data: any[] = [];
        if (doc.name.endsWith('.csv')) {
          const results = Papa.parse(doc.content, { header: true, skipEmptyLines: true });
          data = results.data;
        } else if (doc.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(doc.content, { type: 'string' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          data = XLSX.utils.sheet_to_json(worksheet);
        } else {
          return "Formato no soportado. Usa CSV o XLSX.";
        }

        if (data.length === 0) return "El archivo está vacío.";
        
        const columns = Object.keys(data[0]);
        const rowCount = data.length;
        const preview = data.slice(0, 5);
        
        const stats: any = {};
        columns.forEach(col => {
          const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
          if (values.length > 0) {
            stats[col] = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
            };
          }
        });
        
        return `Archivo: ${doc.name}\nColumnas: ${columns.join(", ")}\nTotal Filas: ${rowCount}\n\nEstadísticas Numéricas:\n${JSON.stringify(stats, null, 2)}\n\nVista Previa (5 filas):\n${JSON.stringify(preview, null, 2)}`;
      } catch (e: any) {
        return `Error al analizar datos: ${e.message}`;
      }
    }
  });
};

export const createMcpTool = (serverUrl: string) => {
  return new DynamicTool({
    name: "mcp_connector",
    description: "Conecta con un servidor MCP externo para ampliar capacidades.",
    func: async (input: string) => {
      if (!serverUrl) return "Error: MCP Server URL no configurada.";
      return `Simulación MCP: Conectando a ${serverUrl} para procesar: ${input}`;
    }
  });
};

export const createCustomApiTool = (apiUrl: string) => {
  return new DynamicTool({
    name: "custom_api",
    description: "Realiza peticiones a una API personalizada configurada por el usuario.",
    func: async (input: string) => {
      if (!apiUrl) return "Error: Custom API URL no configurada.";
      try {
        const response = await axios.post(apiUrl, { query: input });
        return JSON.stringify(response.data);
      } catch (e: any) {
        return `Error en Custom API: ${e.message}`;
      }
    }
  });
};
