import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Settings, 
  Globe, 
  FileText, 
  BarChart3, 
  Table as TableIcon, 
  Download, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Terminal,
  Layers,
  Search,
  Plus,
  Trash2,
  Link,
  Database,
  FileUp,
  Activity,
  ExternalLink,
  UserCircle,
  Edit2,
  Save,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

import { Message, OllamaModel, SystemStatus, ModelConfig, Connector, KnowledgeDocument, PersonalityProfile } from './types';
import { exportToPDF, exportToWord, exportToExcel, exportToTXT, exportToJSON } from './lib/exportUtils';
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    ollama: false,
    internet: true,
    gpu: 'unknown',
    dependencies: [
      { name: 'Ollama Server', status: 'missing' },
      { name: 'CUDA Drivers', status: 'missing' },
      { name: 'Node.js Runtime', status: 'ok', version: 'v20.x' },
      { name: 'File System Access', status: 'ok' }
    ]
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'connectors' | 'personality'>('status');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>([]);
  const [personalityProfiles, setPersonalityProfiles] = useState<PersonalityProfile[]>([
    {
      id: 'default',
      name: 'Ollie Estándar',
      systemPrompt: "Eres Ollie, una GUI de Sandbox para Ollama con funciones agénticas avanzadas. Tu objetivo es ser un asistente técnico, preciso y capaz de gestionar herramientas. FORMATO DE RESPUESTA: Usa Markdown estándar (headers, bold, listas, tablas). REGLA CRÍTICA: NO uses símbolos extraños, prefijos decorativos o caracteres especiales antes de los títulos. GENERACIÓN DE ARCHIVOS: Si el usuario te pide generar un archivo (PDF, Word, Excel, TXT, JSON), al final de tu respuesta DEBES incluir EXACTAMENTE este tag: [GENERATE_FILE:formato|nombre_archivo] donde formato es uno de: pdf, docx, xlsx, txt, json. Ejemplo: [GENERATE_FILE:pdf|Reporte_Analisis]. No menciones el tag en tu texto, solo ponlo al final.",
      isDefault: true
    },
    {
      id: 'creative',
      name: 'Escritor Creativo',
      systemPrompt: "Eres un asistente de escritura creativa. Tu tono es inspirador, descriptivo y artístico. Ayudas al usuario a desarrollar historias, poemas y guiones con un lenguaje rico y evocador. Mantén las reglas de generación de archivos de Ollie si es necesario.",
    },
    {
      id: 'coder',
      name: 'Experto en Código',
      systemPrompt: "Eres un ingeniero de software experto. Tus respuestas son concisas, enfocadas en el código y siguen las mejores prácticas. Siempre explicas el 'por qué' detrás de tus sugerencias de código. Mantén las reglas de generación de archivos de Ollie si es necesario.",
    }
  ]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    num_ctx: 4096,
    num_gpu: 35,
    num_thread: 4,
    temperature: 0.7,
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.1,
    seed: 42,
    internet_access: true,
    hardware_acceleration: true,
    ollama_url: 'http://localhost:11434'
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
    checkSystem();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkSystem = async () => {
    try {
      const res = await axios.get('/api/ollama/models', {
        params: { url: modelConfig.ollama_url }
      });
      
      let gpuActive: 'active' | 'inactive' | 'unknown' = 'unknown';
      if (res.data.models && res.data.models.length > 0) {
        gpuActive = 'active'; 
      }

      setSystemStatus(prev => ({
        ...prev,
        ollama: true,
        gpu: gpuActive,
        dependencies: prev.dependencies.map(d => {
          if (d.name === 'Ollama Server') return { ...d, status: 'ok' };
          if (d.name === 'CUDA Drivers') return { ...d, status: 'ok' };
          return d;
        })
      }));
      setGlobalError(null);
    } catch (e: any) {
      console.error("System check failed", e);
      setSystemStatus(prev => ({
        ...prev,
        ollama: false,
        dependencies: prev.dependencies.map(d => d.name === 'Ollama Server' ? { ...d, status: 'missing' } : d)
      }));
      
      if (!e.response) {
        setGlobalError("No se pudo conectar con el servidor backend. ¿Está el proceso de Node.js corriendo?");
      }
    }
  };

  const fetchModels = async () => {
    try {
      const res = await axios.get('/api/ollama/models', {
        params: { url: modelConfig.ollama_url }
      });
      setModels(res.data.models || []);
      if (res.data.models?.length > 0 && !selectedModel) {
        setSelectedModel(res.data.models[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch models", error);
    }
  };

  const addConnector = (name: string, type: 'rest' | 'mcp', url: string) => {
    const newConnector: Connector = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      url,
      status: 'inactive'
    };
    setConnectors(prev => [...prev, newConnector]);
  };

  const removeConnector = (id: string) => {
    setConnectors(prev => prev.filter(c => c.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newDoc: KnowledgeDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: Date.now()
      };
      setKnowledgeBase(prev => [...prev, newDoc]);
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let webContext = "";
      const searchMatch = input.match(/busca información de (.+)/i);
      
      if (searchMatch && modelConfig.internet_access) {
        const query = searchMatch[1];
        try {
          const searchRes = await axios.post('/api/search', { query });
          const results = searchRes.data.results;
          
          if (results && results.length > 0) {
            const fetchPromises = results.slice(0, 3).map((r: any) => 
              axios.post('/api/fetch-url', { url: r.url }).catch(() => null)
            );
            
            const contents = await Promise.all(fetchPromises);
            webContext = contents
              .filter(c => c && c.data && c.data.content)
              .map((c: any, i) => `\n[FUENTE ${i+1}: ${results[i].title}]\nURL: ${results[i].url}\nCONTENIDO:\n${c.data.content}\n`)
              .join("\n---\n");
          }
        } catch (e) {
          console.error("Search agent failed", e);
        }
      } else if (modelConfig.internet_access) {
        const urlMatch = input.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          try {
            const webRes = await axios.post('/api/fetch-url', { url });
            webContext = `\n\n[CONTEXTO WEB EXTRAÍDO DE ${url}]:\n${webRes.data.content}\n\n`;
          } catch (e) {
            console.error("Web fetch failed", e);
          }
        }
      }

      // 2. System Instruction from Selected Personality Profile
      const selectedProfile = personalityProfiles.find(p => p.id === selectedProfileId) || personalityProfiles[0];
      const systemInstruction = {
        role: 'system',
        content: selectedProfile.systemPrompt
      };

      const apiMessages = [
        systemInstruction,
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { 
          role: 'user', 
          content: webContext ? `${input}${webContext}` : input 
        }
      ];

      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollama_url: modelConfig.ollama_url,
          model: selectedModel,
          messages: apiMessages,
          stream: true,
          options: {
            num_ctx: modelConfig.num_ctx,
            num_gpu: modelConfig.hardware_acceleration ? modelConfig.num_gpu : 0,
            num_thread: modelConfig.num_thread,
            temperature: modelConfig.temperature,
            top_k: modelConfig.top_k,
            top_p: modelConfig.top_p,
            repeat_penalty: modelConfig.repeat_penalty,
            seed: modelConfig.seed
          }
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              assistantContent += json.message.content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantContent;
                return newMessages;
              });
            }
          } catch (e) {
            // Partial JSON or other error
          }
        }
      }

      const fileTagMatch = assistantContent.match(/\[GENERATE_FILE:(pdf|docx|xlsx|txt|json)\|([^\]]+)\]/);
      if (fileTagMatch) {
        const [fullTag, format, filename] = fileTagMatch;
        const cleanContent = assistantContent.replace(fullTag, "").trim();
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = cleanContent;
          return newMessages;
        });

        const exportMsg: Message = { role: 'assistant', content: cleanContent, timestamp: Date.now() };
        switch (format) {
          case 'pdf': exportToPDF(filename, cleanContent); break;
          case 'docx': exportToWord(filename, cleanContent); break;
          case 'txt': exportToTXT(filename, cleanContent); break;
          case 'json': exportToJSON(filename, cleanContent); break;
          case 'xlsx': exportToExcel(filename, [{ content: cleanContent }]); break;
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: "Error: No se pudo conectar con Ollama. Asegúrate de que el servidor esté corriendo localmente.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (type: 'pdf' | 'docx' | 'xlsx' | 'txt', msg: Message) => {
    const title = `Chat_Export_${new Date().toLocaleDateString()}`;
    switch (type) {
      case 'pdf': exportToPDF(title, msg.content); break;
      case 'docx': exportToWord(title, msg.content); break;
      case 'txt': exportToTXT(title, msg.content); break;
      case 'xlsx': 
        exportToExcel(title, [{ content: msg.content }]); 
        break;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-[100dvh] bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
        {globalError && (
          <div className="fixed inset-0 z-[100] bg-[#141414]/80 backdrop-blur-sm flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-[#141414] rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="font-mono uppercase flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Error de Conexión
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm font-mono">{globalError}</p>
                <Button 
                  className="w-full bg-[#141414] text-[#E4E3E0] rounded-none font-mono uppercase"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reintentar Conexión
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[#141414] flex flex-col bg-[#E4E3E0] z-20"
            >
              <div className="p-6 border-bottom border-[#141414]">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-[#141414] flex items-center justify-center rounded-sm">
                    <Terminal className="text-[#E4E3E0] w-5 h-5" />
                  </div>
                  <h1 className="font-mono font-bold tracking-tighter text-xl uppercase">Ollie</h1>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase opacity-50 mb-1 block">Modelo Activo</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-full border-[#141414] rounded-none bg-transparent font-mono text-xs">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#E4E3E0] border-[#141414] rounded-none">
                        {models.map(m => (
                          <SelectItem key={m.name} value={m.name} className="font-mono text-xs">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-[#141414] rounded-none font-mono text-[10px] uppercase h-8"
                    onClick={fetchModels}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" /> Actualizar Modelos
                  </Button>
                </div>
              </div>

              <Separator className="bg-[#141414]" />

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-[#141414]">
                  <button 
                    onClick={() => setActiveTab('status')}
                    className={cn(
                      "flex-1 py-2 font-mono text-[10px] uppercase transition-colors",
                      activeTab === 'status' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                    )}
                  >
                    Estado
                  </button>
                  <button 
                    onClick={() => setActiveTab('config')}
                    className={cn(
                      "flex-1 py-2 font-mono text-[10px] uppercase transition-colors",
                      activeTab === 'config' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                    )}
                  >
                    Configuraciones
                  </button>
                  <button 
                    onClick={() => setActiveTab('connectors')}
                    className={cn(
                      "flex-1 py-2 font-mono text-[10px] uppercase transition-colors",
                      activeTab === 'connectors' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                    )}
                  >
                    Conectores
                  </button>
                  <button 
                    onClick={() => setActiveTab('personality')}
                    className={cn(
                      "flex-1 py-2 font-mono text-[10px] uppercase transition-colors",
                      activeTab === 'personality' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                    )}
                  >
                    Personalidad
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'status' && (
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-[10px] font-mono uppercase opacity-50 mb-3">Estado del Sistema</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="opacity-70">GPU Acceleration</span>
                              {modelConfig.hardware_acceleration && systemStatus.gpu === 'active' ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-800 rounded-none text-[9px] px-1 py-0">CUDA ACTIVE</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-800 rounded-none text-[9px] px-1 py-0">DISABLED</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="opacity-70">Internet Access</span>
                              {modelConfig.internet_access ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-800 rounded-none text-[9px] px-1 py-0">ENABLED</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-800 rounded-none text-[9px] px-1 py-0">OFFLINE</Badge>
                              )}
                            </div>
                            {systemStatus.dependencies.map((dep, i) => (
                              <div key={i} className="flex items-center justify-between text-xs font-mono">
                                <span className="opacity-70">{dep.name}</span>
                                {dep.status === 'ok' ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-800 rounded-none text-[9px] px-1 py-0">OK</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-800 rounded-none text-[9px] px-1 py-0">MISSING</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {!systemStatus.ollama && (
                          <Alert variant="destructive" className="rounded-none border-red-800 bg-red-50 py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-[10px] uppercase font-bold">Error de Conexión</AlertTitle>
                            <AlertDescription className="text-[10px]">
                              Ollama no detectado en localhost:11434
                            </AlertDescription>
                          </Alert>
                        )}

                        <div>
                          <h3 className="text-[10px] font-mono uppercase opacity-50 mb-3">Capacidades</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { icon: Globe, label: 'Web Search' },
                              { icon: FileText, label: 'Reports' },
                              { icon: BarChart3, label: 'Charts' },
                              { icon: TableIcon, label: 'Tables' }
                            ].map((cap, i) => (
                              <div key={i} className="border border-[#141414] p-2 flex flex-col items-center justify-center gap-1 aspect-square">
                                <cap.icon className="w-4 h-4" />
                                <span className="text-[8px] uppercase font-bold text-center">{cap.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  )}

                  {activeTab === 'config' && (
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase opacity-50">Ollama API URL</label>
                            <div className="flex gap-2">
                              <Input 
                                value={modelConfig.ollama_url}
                                onChange={(e) => setModelConfig(prev => ({ ...prev, ollama_url: e.target.value }))}
                                placeholder="http://localhost:11434"
                                className="h-8 text-[10px] font-mono rounded-none border-[#141414] bg-white/50"
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 border-[#141414] rounded-none shrink-0"
                                onClick={() => {
                                  checkSystem();
                                  fetchModels();
                                }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-[8px] font-mono opacity-50 italic">Por defecto: http://localhost:11434</p>
                          </div>

                          <Separator className="bg-[#141414]/10" />

                          <div 
                            className={cn(
                              "flex items-center justify-between p-3 border border-[#141414] transition-all cursor-pointer",
                              modelConfig.internet_access 
                                ? "bg-[#141414] text-[#E4E3E0]" 
                                : "bg-white/50 text-[#141414] hover:bg-white/80"
                            )}
                            onClick={() => setModelConfig(prev => ({ ...prev, internet_access: !prev.internet_access }))}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-mono font-bold uppercase">Internet Access</span>
                              <span className={cn(
                                "text-[8px] font-mono",
                                modelConfig.internet_access ? "opacity-70" : "opacity-50"
                              )}>Permitir búsqueda web</span>
                            </div>
                            <Switch 
                              checked={modelConfig.internet_access} 
                              onCheckedChange={(v) => setModelConfig(prev => ({ ...prev, internet_access: v }))}
                              className={cn(
                                "data-[state=checked]:bg-[#E4E3E0] data-[state=checked]:border-[#E4E3E0]",
                                !modelConfig.internet_access && "data-[state=unchecked]:bg-[#141414]/20"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div 
                            className={cn(
                              "flex items-center justify-between p-3 border border-[#141414] transition-all cursor-pointer",
                              modelConfig.hardware_acceleration 
                                ? "bg-[#141414] text-[#E4E3E0]" 
                                : "bg-white/50 text-[#141414] hover:bg-white/80"
                            )}
                            onClick={() => setModelConfig(prev => ({ ...prev, hardware_acceleration: !prev.hardware_acceleration }))}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-mono font-bold uppercase">Hardware Acceleration</span>
                              <span className={cn(
                                "text-[8px] font-mono",
                                modelConfig.hardware_acceleration ? "opacity-70" : "opacity-50"
                              )}>Usar GPU si está disponible</span>
                            </div>
                            <Switch 
                              checked={modelConfig.hardware_acceleration} 
                              onCheckedChange={(v) => setModelConfig(prev => ({ ...prev, hardware_acceleration: v }))}
                              className={cn(
                                "data-[state=checked]:bg-[#E4E3E0] data-[state=checked]:border-[#E4E3E0]",
                                !modelConfig.hardware_acceleration && "data-[state=unchecked]:bg-[#141414]/20"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <Separator className="bg-[#141414]/10" />

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">Context Length</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.num_ctx}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.num_ctx]} 
                                min={512} max={32768} step={512}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, num_ctx: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">GPU Offload (Layers)</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.num_gpu}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.num_gpu]} 
                                min={0} max={100} step={1}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, num_gpu: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">CPU Threads</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.num_thread}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.num_thread]} 
                                min={1} max={32} step={1}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, num_thread: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <Separator className="bg-[#141414]/10" />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">Temperature</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.temperature}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.temperature]} 
                                min={0} max={2} step={0.1}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, temperature: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">Top P</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.top_p}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.top_p]} 
                                min={0} max={1} step={0.05}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, top_p: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">Top K</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.top_k}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.top_k]} 
                                min={1} max={100} step={1}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, top_k: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase opacity-50">Repeat Penalty</label>
                                <span className="text-[10px] font-mono font-bold">{modelConfig.repeat_penalty}</span>
                              </div>
                              <Slider 
                                value={[modelConfig.repeat_penalty]} 
                                min={1} max={2} step={0.1}
                                onValueChange={(v) => setModelConfig(prev => ({ ...prev, repeat_penalty: Array.isArray(v) ? v[0] : v }))}
                                className="[&_[role=slider]]:bg-[#141414] [&_[role=slider]]:border-[#141414]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  )}

                  {activeTab === 'connectors' && (
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <h3 className="text-[10px] font-mono uppercase opacity-50">Servidores MCP / API</h3>
                            <div className="space-y-2">
                              {connectors.map(c => (
                                <div key={c.id} className="p-3 border border-[#141414] bg-white/50 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase">{c.name}</span>
                                    <span className="text-[8px] font-mono opacity-50 truncate max-w-[150px]">{c.url}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[8px] rounded-none px-1 py-0">
                                      {c.type.toUpperCase()}
                                    </Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-red-600"
                                      onClick={() => removeConnector(c.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              <Button 
                                variant="outline" 
                                className="w-full border-dashed border-[#141414] rounded-none font-mono text-[10px] uppercase h-8"
                                onClick={() => {
                                  const name = prompt("Nombre del conector:");
                                  const url = prompt("URL del endpoint:");
                                  if (name && url) addConnector(name, 'rest', url);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-2" /> Nuevo Conector
                              </Button>
                            </div>
                          </div>

                          <Separator className="bg-[#141414]/10" />

                          <div className="flex flex-col gap-2">
                            <h3 className="text-[10px] font-mono uppercase opacity-50">Base de Conocimientos</h3>
                            <div className="space-y-2">
                              {knowledgeBase.map(doc => (
                                <div key={doc.id} className="p-3 border border-[#141414] bg-white/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="w-3 h-3 shrink-0" />
                                    <span className="text-[10px] font-mono truncate">{doc.name}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-red-600"
                                    onClick={() => setKnowledgeBase(prev => prev.filter(d => d.id !== doc.id))}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              <div className="relative">
                                <Input 
                                  type="file" 
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                  onChange={handleFileUpload}
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full border-dashed border-[#141414] rounded-none font-mono text-[10px] uppercase h-8"
                                >
                                  <FileUp className="w-3 h-3 mr-2" /> Adjuntar Documento
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  )}

                  {activeTab === 'personality' && (
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono uppercase opacity-50">Perfiles de Personalidad</h3>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 border-[#141414] rounded-none"
                            onClick={() => {
                              const newProfile: PersonalityProfile = {
                                id: Math.random().toString(36).substr(2, 9),
                                name: 'Nueva Personalidad',
                                systemPrompt: 'Eres un asistente útil...'
                              };
                              setPersonalityProfiles(prev => [...prev, newProfile]);
                              setEditingProfileId(newProfile.id);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {personalityProfiles.map(profile => (
                            <div 
                              key={profile.id}
                              className={cn(
                                "border border-[#141414] transition-all",
                                selectedProfileId === profile.id ? "bg-[#141414] text-[#E4E3E0]" : "bg-white/50"
                              )}
                            >
                              <div className="p-3 flex items-center justify-between">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => setSelectedProfileId(profile.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase">{profile.name}</span>
                                    {profile.isDefault && (
                                      <Badge variant="outline" className="text-[7px] rounded-none px-1 py-0 border-current opacity-50">DEFAULT</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn("h-6 w-6 rounded-none", selectedProfileId === profile.id ? "text-[#E4E3E0] hover:bg-white/10" : "text-[#141414] hover:bg-[#141414]/5")}
                                    onClick={() => setEditingProfileId(editingProfileId === profile.id ? null : profile.id)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  {!profile.isDefault && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={cn("h-6 w-6 rounded-none text-red-500", selectedProfileId === profile.id ? "hover:bg-white/10" : "hover:bg-[#141414]/5")}
                                      onClick={() => {
                                        if (selectedProfileId === profile.id) setSelectedProfileId('default');
                                        setPersonalityProfiles(prev => prev.filter(p => p.id !== profile.id));
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <AnimatePresence>
                                {editingProfileId === profile.id && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-3 pb-3 space-y-3 border-t border-[#141414]/20 pt-3"
                                  >
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-mono uppercase opacity-50">Nombre</label>
                                      <Input 
                                        value={profile.name}
                                        onChange={(e) => {
                                          setPersonalityProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, name: e.target.value } : p));
                                        }}
                                        className="h-7 text-[10px] font-mono rounded-none border-[#141414] bg-transparent"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-mono uppercase opacity-50">System Prompt</label>
                                      <textarea 
                                        value={profile.systemPrompt}
                                        onChange={(e) => {
                                          setPersonalityProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, systemPrompt: e.target.value } : p));
                                        }}
                                        className="w-full min-h-[100px] text-[10px] font-mono rounded-none border border-[#141414] bg-transparent p-2 focus:ring-0"
                                      />
                                    </div>
                                    <Button 
                                      className="w-full h-7 text-[8px] font-mono uppercase rounded-none bg-[#141414] text-[#E4E3E0]"
                                      onClick={() => setEditingProfileId(null)}
                                    >
                                      <Save className="w-3 h-3 mr-2" /> Guardar Perfil
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-[#141414] bg-[#141414] text-[#E4E3E0]">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase">
                  <Terminal className="w-3 h-3" />
                  <span>Portable Mode: v1.0.4</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-[#141414] flex items-center justify-between px-4 md:px-6 bg-[#E4E3E0]/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-[#141414] hover:text-[#E4E3E0] rounded-none"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase opacity-50">Sandbox Session</span>
                <span className="text-xs font-bold uppercase tracking-widest">Ollie_Sandbox_v1</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#141414] rounded-none font-mono text-[10px]">
                {selectedModel || 'Sin Modelo'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#141414] rounded-none font-mono text-[10px] uppercase"
                onClick={() => setMessages([])}
              >
                <Trash2 className="w-3 h-3 mr-2" /> Limpiar
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <ScrollArea className="flex-1 min-h-0 p-4 md:p-6" ref={scrollRef}>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              {messages.length === 0 && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Terminal className="w-16 h-16" />
                  <div className="max-w-md">
                    <h2 className="text-2xl font-mono uppercase font-bold tracking-tighter">Ollie Sandbox</h2>
                    <p className="text-sm font-mono">Entorno seguro para Ollama. Investiga la web, gestiona archivos y ejecuta tareas agénticas localmente.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 p-6 border border-transparent transition-colors",
                    msg.role === 'assistant' ? "bg-white/50 border-[#141414]/10" : "bg-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-sm shrink-0",
                    msg.role === 'assistant' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#141414]/20 text-[#141414]"
                  )}>
                    {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold opacity-50">
                        {msg.role === 'assistant' ? 'Ollie' : 'User'} — {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      
                      {msg.role === 'assistant' && msg.content && (
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={() => handleExport('pdf', msg)}>
                                <Download className="w-3 h-3" />
                              </Button>
                            } />
                            <TooltipContent className="bg-[#141414] text-[#E4E3E0] text-[10px] rounded-none">Export PDF</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={() => handleExport('docx', msg)}>
                                <FileText className="w-3 h-3" />
                              </Button>
                            } />
                            <TooltipContent className="bg-[#141414] text-[#E4E3E0] text-[10px] rounded-none">Export Word</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={() => handleExport('xlsx', msg)}>
                                <TableIcon className="w-3 h-3" />
                              </Button>
                            } />
                            <TooltipContent className="bg-[#141414] text-[#E4E3E0] text-[10px] rounded-none">Export Excel</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>

                    <div className="prose prose-sm max-w-none font-sans text-sm leading-relaxed text-[#141414]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-4 p-6">
                  <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center rounded-sm shrink-0 animate-pulse">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-[#141414]/10 w-1/4 animate-pulse" />
                    <div className="h-2 bg-[#141414]/10 w-3/4 animate-pulse" />
                    <div className="h-2 bg-[#141414]/10 w-1/2 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 md:p-6 border-t border-[#141414] bg-[#E4E3E0]">
            <div className="max-w-4xl mx-auto relative">
              <div className="flex items-end gap-2 border border-[#141414] bg-white p-2 focus-within:ring-1 ring-[#141414]">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Escribe un mensaje o pega una URL para analizar..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none p-2 text-sm font-sans min-h-[40px] max-h-[200px]"
                    rows={1}
                  />
                </div>
                <div className="flex items-center gap-1 pb-1">
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-8 w-8 rounded-none transition-colors",
                          modelConfig.internet_access ? "hover:bg-[#141414] hover:text-[#E4E3E0]" : "opacity-30 cursor-not-allowed"
                        )}
                        onClick={() => setModelConfig(prev => ({ ...prev, internet_access: !prev.internet_access }))}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                    } />
                    <TooltipContent className="bg-[#141414] text-[#E4E3E0] text-[10px] rounded-none">
                      {modelConfig.internet_access ? "Internet Access: ON" : "Internet Access: OFF"}
                    </TooltipContent>
                  </Tooltip>
                  <Button 
                    size="icon" 
                    className="h-8 w-8 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 rounded-none"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] font-mono uppercase opacity-50">
                <span>Shift + Enter para nueva línea</span>
                <span>Ollama: {selectedModel || 'None'}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
