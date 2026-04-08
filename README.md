# Architect AI Chatbot - Guía de Instalación para Windows

Este chatbot es una aplicación portable diseñada para ejecutarse localmente en Windows, conectándose a tu instancia de Ollama.

## Requisitos Previos

1.  **Node.js**: Descarga e instala la versión LTS desde [nodejs.org](https://nodejs.org/).
2.  **Ollama**: Descarga e instala Ollama desde [ollama.com](https://ollama.com/).
    *   Una vez instalado, abre una terminal y descarga un modelo (ej: `ollama run llama3`).

## Pasos para Ejecutar la Aplicación

1.  **Descargar el Código**:
    *   Usa el menú de configuración en AI Studio para exportar el proyecto como un archivo ZIP y extráelo en tu laptop.

2.  **Instalar Dependencias**:
    *   Abre una terminal (PowerShell o CMD) en la carpeta del proyecto.
    *   Ejecuta el siguiente comando:
        ```bash
        npm install
        ```
    *   *Nota: Si ves errores de "Module not found", asegúrate de haber ejecutado este comando correctamente.*

3.  **Iniciar la Aplicación**:
    *   En la misma terminal, ejecuta:
        ```bash
        npm run dev
        ```
    *   Esto iniciará tanto el servidor backend como el frontend.

4.  **Acceder al Chatbot**:
    *   Abre tu navegador y ve a: `http://localhost:3000`

## Notas Importantes

*   **Servidor Ollama**: Asegúrate de que Ollama esté activo. Si el chatbot indica "Ollama Server Missing", verifica que el icono de Ollama aparezca en la barra de tareas de Windows.
*   **Modelos**: Debes tener al menos un modelo descargado en Ollama para poder seleccionarlo en el chatbot.
*   **Exportación**: Puedes usar los botones de descarga dentro del chat para generar reportes en PDF, Word o Excel directamente en tu equipo.

---
**Arquitectura Portable v1.0.4**
