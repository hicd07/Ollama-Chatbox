export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'chart' | 'table' | 'report';
  data?: any;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface SystemStatus {
  ollama: boolean;
  internet: boolean;
  gpu: 'active' | 'inactive' | 'unknown';
  dependencies: {
    name: string;
    status: 'ok' | 'missing';
    version?: string;
  }[];
}

export interface Connector {
  id: string;
  name: string;
  type: 'rest' | 'mcp';
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastChecked?: number;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: number;
}

export interface ModelConfig {
  num_ctx: number;
  num_gpu: number;
  num_thread: number;
  temperature: number;
  top_k: number;
  top_p: number;
  repeat_penalty: number;
  seed: number;
  internet_access: boolean;
  hardware_acceleration: boolean;
}
