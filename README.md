# Ollie: Sandbox Avanzado y GUI Agéntica para Ollama

Ollie es una interfaz de sandbox profesional y de alto rendimiento diseñada para la orquestación de LLMs locales mediante **Ollama**. Va más allá de las interfaces de chat simples, proporcionando un entorno robusto para la investigación autónoma, generación de documentos en múltiples formatos e integración con sistemas externos.

## 🚀 Características Clave

### 🧠 Motor de Personalidad
*   **Perfiles Dinámicos:** Crea y gestiona múltiples personalidades de agentes con *System Prompts* personalizados.
*   **Cambio Contextual:** Alterna sin problemas entre perfiles especializados (ej. Escritor Creativo, Arquitecto Senior, Experto en Código) sin perder el flujo de la sesión.

### 🔌 Conectividad Extensible (MCP/REST)
*   **Gestión de Conectores:** Integra APIs REST externas y servidores MCP (*Model Context Protocol*).
*   **Integración de Sistemas:** Conecta tu LLM local con bases de datos y servicios de terceros, permitiendo una experiencia agéntica verdaderamente conectada.

### 📚 Base de Conocimientos (Listo para RAG)
*   **Gestión de Documentos:** Sube y gestiona documentos locales (PDF, TXT, etc.) para que sirvan como un repositorio de conocimiento privado.
*   **Inyección de Contexto:** Mejora las respuestas del agente con fuentes de datos específicas proporcionadas por el usuario.

### 🔍 Investigación Autónoma y Herramientas
*   **Inteligencia Web:** Acceso a internet en tiempo real para investigaciones profundas y verificación de información.
*   **Exportación Multiformato:** Genera reportes profesionales en **PDF**, **Word**, **Excel**, **TXT** y **JSON** con estilos de alta fidelidad.
*   **Control de Hardware:** Control granular sobre la descarga a GPU (*offloading*), longitud de contexto y subprocesos de CPU.

---

## 🛠️ Requisitos Previos

1.  **Servidor Ollama**: Debe estar instalado y en ejecución. Descárgalo en [ollama.com](https://ollama.com/).
    *   Asegúrate de haber descargado al menos un modelo (ej: `ollama pull llama3`).
2.  **Entorno Node.js**: Versión 20.x o superior (se recomienda LTS).
3.  **Aceleración por Hardware (Opcional)**:
    *   **Windows/Linux (NVIDIA)**: Asegúrate de tener instalados los controladores de NVIDIA y el NVIDIA Container Toolkit.
    *   **macOS (Apple Silicon)**: Ollama utiliza automáticamente Metal para la aceleración en chips M1/M2/M3. No se requiere configuración adicional.

---

## 💻 Primeros Pasos

### 1. Instalación
Extrae el archivo ZIP exportado o clona el repositorio, luego abre una terminal en la carpeta del proyecto e instala las dependencias:
```bash
npm install
```

### 2. Modo de Desarrollo
Inicia el entorno full-stack (frontend Vite + backend Node.js):
```bash
npm run dev
```

### 3. Acceso
Navega a `http://localhost:3000` en tu navegador preferido.

---

## 🐧 Notas para Linux y macOS

*   **Linux**: Si encuentras problemas de permisos al intentar acceder al servidor de Ollama, asegúrate de que el servicio de Ollama esté corriendo (`systemctl status ollama`) y que tu usuario tenga los permisos necesarios.
*   **macOS**: En computadoras Mac con procesadores Intel, el rendimiento puede ser significativamente menor que en modelos con Apple Silicon (M1/M2/M3).
*   **Puertos**: La aplicación utiliza el puerto `3000` por defecto. Asegúrate de que no esté siendo utilizado por otro servicio (`lsof -i :3000` en Mac/Linux).

---

## 🏗️ Resumen de la Arquitectura

Ollie está construido sobre un stack moderno y reactivo diseñado para una ejecución local de baja latencia:

*   **Frontend**: React 18+ con TypeScript, estilizado con Tailwind CSS y Shadcn UI.
*   **Gestión de Estado**: Framer Motion para transiciones fluidas de la interfaz y hooks de React robustos para el estado local.
*   **Backend**: Proxy de Express.js que redirige las solicitudes a Ollama y maneja la ejecución de herramientas agénticas (Búsqueda Web, E/S de Archivos).
*   **Motor de Exportación**: Utilidades especializadas para la generación de documentos de alta fidelidad (`jspdf`, `docx`, `xlsx`).

---

## ⚠️ Notas Importantes

*   **Estado del Sistema**: Monitorea la pestaña "Estado" en la barra lateral para verificar la conectividad de Ollama y el estado de CUDA.
*   **Descarga a GPU**: Ajusta el control deslizante "GPU Offload" en "Configuraciones" para optimizar el rendimiento según tu VRAM disponible.
*   **Acceso a Internet**: El icono del "Globo" en la entrada de chat activa las capacidades de búsqueda web en tiempo real.

---
**Versión Arquitectónica: 1.1.0** | *Diseñado para la Privacidad, el Rendimiento y la Extensibilidad.*
