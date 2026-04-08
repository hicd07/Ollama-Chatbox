# Ollie: Advanced Ollama Sandbox & Agentic GUI

Ollie is a high-performance, professional-grade sandbox interface designed for local LLM orchestration using **Ollama**. It transcends simple chat interfaces by providing a robust environment for autonomous research, multi-format document generation, and external system integration.

## 🚀 Key Features

### 🧠 Personality Engine
*   **Dynamic Profiles:** Create and manage multiple agent personalities with custom System Prompts.
*   **Contextual Switching:** Seamlessly toggle between specialized profiles (e.g., Creative Writer, Senior Architect, Expert Coder) without losing session flow.

### 🔌 Extensible Connectivity (MCP/REST)
*   **Connector Management:** Integrate external REST APIs and MCP (Model Context Protocol) servers.
*   **System Integration:** Bridge your local LLM with third-party databases and services, enabling a truly connected agentic experience.

### 📚 Knowledge Base (RAG Ready)
*   **Document Management:** Upload and manage local documents (PDF, TXT, etc.) to serve as a private knowledge repository.
*   **Context Injection:** Enhance agent responses with specific, user-provided data sources.

### 🔍 Autonomous Research & Tools
*   **Web Intelligence:** Real-time internet access for deep-dive research and information verification.
*   **Multi-Format Export:** Generate professional reports in **PDF**, **Word**, **Excel**, **TXT**, and **JSON** with high-fidelity styling.
*   **Hardware Control:** Granular control over GPU offloading, context length, and CPU threading.

---

## 🛠️ Prerequisites

1.  **Ollama Server**: Must be installed and running. Download from [ollama.com](https://ollama.com/).
    *   Ensure at least one model is pulled (e.g., `ollama pull llama3`).
2.  **Node.js Runtime**: Version 20.x or higher (LTS recommended).
3.  **NVIDIA GPU (Optional)**: For hardware acceleration, ensure NVIDIA drivers and the NVIDIA Container Toolkit are installed.

---

## 💻 Getting Started

### 1. Installation
Clone the repository or extract the exported ZIP, then install dependencies:
```bash
npm install
```

### 2. Development Mode
Start the full-stack environment (Vite frontend + Node.js backend):
```bash
npm run dev
```

### 3. Access
Navigate to `http://localhost:3000` in your preferred browser.

---

## 🏗️ Architecture Overview

Ollie is built on a modern, reactive stack designed for low-latency local execution:

*   **Frontend**: React 18+ with TypeScript, styled with Tailwind CSS and Shadcn UI.
*   **State Management**: Framer Motion for fluid UI transitions and robust React hooks for local state.
*   **Backend**: Express.js proxying requests to Ollama and handling agentic tool execution (Web Search, File I/O).
*   **Export Engine**: Specialized utilities for high-fidelity document generation (`jspdf`, `docx`, `xlsx`).

---

## ⚠️ Important Notes

*   **System Status**: Monitor the "Estado" tab in the sidebar to verify Ollama connectivity and CUDA status.
*   **GPU Offloading**: Adjust the `GPU Offload` slider in "Configuraciones" to optimize performance based on your VRAM availability.
*   **Internet Access**: The "Globe" icon in the chat input toggles real-time web search capabilities.

---
**Architectural Version: 1.1.0** | *Designed for Privacy, Performance, and Extensibility.*
