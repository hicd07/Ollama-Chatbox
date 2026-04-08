export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'chart' | 'table' | 'report';
  data?: any;
  metrics?: {
    total_duration: number;
    prompt_eval_count: number;
    eval_count: number;
  };
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

export interface PersonalityProfile {
  id: string;
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
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
  ollama_url: string;
  show_metrics: boolean;
  fs_read_access: boolean;
  fs_write_access: boolean;
}
