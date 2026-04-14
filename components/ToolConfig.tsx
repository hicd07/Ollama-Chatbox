import React from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ModelConfig } from '@/src/types';

interface ToolConfigProps {
  modelConfig: ModelConfig;
  setModelConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
}

export const ToolConfig: React.FC<ToolConfigProps> = ({ modelConfig, setModelConfig }) => {
  const toolGroups = [
    { 
      category: 'Búsqueda e Investigación', 
      items: [
        { id: 'web_search', label: 'Navegador Web', desc: 'Busca información actualizada en internet' },
        { id: 'wikipedia', label: 'Enciclopedia Wikipedia', desc: 'Consulta datos históricos, biográficos y conceptos' },
        { id: 'arxiv', label: 'Buscador Científico', desc: 'Encuentra papers y artículos académicos en Arxiv' },
        { id: 'youtube_search', label: 'Buscador de Videos', desc: 'Encuentra contenido multimedia en YouTube' }
      ]
    },
    {
      category: 'Análisis y Lógica',
      items: [
        { id: 'python_repl', label: 'Consola Python', desc: 'Ejecuta código para análisis de datos y lógica avanzada' },
        { id: 'csv_analyzer', label: 'Analista de Datos', desc: 'Extrae estadísticas de tus archivos CSV y Excel' },
        { id: 'wolfram_alpha', label: 'Cerebro Científico', desc: 'Resuelve matemáticas avanzadas y datos del mundo real' },
        { id: 'calculator', label: 'Calculadora Básica', desc: 'Operaciones simples (Usa Python para cálculos complejos)' }
      ]
    },
    {
      category: 'Productividad',
      items: [
        { id: 'gmail', label: 'Asistente de Correo', desc: 'Redacta y envía emails directamente desde el chat' },
        { id: 'calendar', label: 'Gestor de Agenda', desc: 'Organiza tus reuniones y eventos del calendario' },
        { id: 'slack', label: 'Enlace a Slack', desc: 'Envía notificaciones y mensajes a tus canales de equipo' }
      ]
    },
    {
      category: 'Creatividad y Archivos',
      items: [
        { id: 'image_generation', label: 'Creador de Imágenes', desc: 'Genera arte visual a partir de tus descripciones' },
        { id: 'file_system', label: 'Gestor de Archivos', desc: 'Lee, escribe y organiza archivos en el servidor' }
      ]
    },
    {
      category: 'Avanzado',
      items: [
        { id: 'mcp', label: 'Conector MCP', desc: 'Amplía mis capacidades con servidores externos (Protocolo MCP)' },
        { id: 'custom_api', label: 'API Personalizada', desc: 'Conéctame con tus propias bases de datos o servicios' }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {toolGroups.map((group) => (
        <div key={group.category} className="space-y-2 pt-2">
          <span className="text-[9px] font-mono font-bold text-[#141414]/40 uppercase px-1">{group.category}</span>
          <div className="grid grid-cols-1 gap-2">
            {group.items.map((tool) => (
              <div key={tool.id} className="space-y-2">
                <div 
                  className={cn(
                    "flex items-center justify-between p-3 border border-[#141414] transition-all cursor-pointer",
                    modelConfig.tools[tool.id as keyof typeof modelConfig.tools] ? "bg-[#141414] text-[#E4E3E0]" : "bg-white/50 text-[#141414]"
                  )}
                  onClick={() => setModelConfig(prev => ({ 
                    ...prev, 
                    tools: { ...prev.tools, [tool.id]: !prev.tools[tool.id as keyof typeof prev.tools] } 
                  }))}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase">{tool.label}</span>
                    <span className="text-[8px] font-mono opacity-50">{tool.desc}</span>
                  </div>
                  <Switch 
                    checked={modelConfig.tools[tool.id as keyof typeof modelConfig.tools]} 
                    onCheckedChange={(v) => setModelConfig(prev => ({ 
                      ...prev, 
                      tools: { ...prev.tools, [tool.id]: v } 
                    }))} 
                    onClick={(e) => e.stopPropagation()} 
                  />
                </div>
                
                {tool.id === 'mcp' && modelConfig.tools.mcp && (
                  <Input 
                    placeholder="URL del servidor MCP..." 
                    value={modelConfig.mcp_server_url}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, mcp_server_url: e.target.value }))}
                    className="text-[10px] h-8 font-mono"
                  />
                )}
                
                {tool.id === 'custom_api' && modelConfig.tools.custom_api && (
                  <Input 
                    placeholder="URL de la API personalizada..." 
                    value={modelConfig.custom_api_url}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, custom_api_url: e.target.value }))}
                    className="text-[10px] h-8 font-mono"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
