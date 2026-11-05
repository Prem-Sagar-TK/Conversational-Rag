# Conversational RAG — Frontend Studio UI

The frontend for the **Conversational Retrieval-Augmented Generation (RAG)** application. Engineered with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**, this dashboard provides a complete workspace for document indexing, conversational chat, and real-time retrieval transparency.

---

## ⚡ Core Features

- **Multi-Session Chat Interface**: Switch between conversations, create new sessions, and track turns.
- **RAG Transparency Panel**: Inspect the raw user query, contextually rewritten query, retrieved document chunks, match similarity scores, and compressed conversation memory state.
- **Document Management**: Upload PDF, TXT, DOCX, and Markdown documents with instant chunk status and deletion controls.
- **Citation Cards**: Interactive source cards attached to each assistant message with document names, page numbers, and exact text snippets.
- **Studio Theme & Navigation Rail**: Dark-mode optimized navigation rail and responsive layout.

---

## 🏗️ Component Architecture

```text
src/
├── components/
│   ├── ChatInterface.tsx         # Main chat viewport, message stream, and input box
│   ├── MessageItem.tsx           # Individual message rendering with Markdown support
│   ├── CitationCard.tsx          # Structured document source citation cards
│   ├── RagTransparencyPanel.tsx  # Accordion displaying rewritten query & vector matches
│   ├── ConversationSidebar.tsx   # History list of active sessions with creation/deletion
│   ├── DocumentManager.tsx       # Document upload, chunk statistics, and vector management
│   ├── StudioNavRail.tsx         # Side navigation bar for switching views
│   └── StudioTheme.tsx           # Layout wrapper and theme context
├── services/
│   └── api.ts                    # Axios HTTP client configured for backend endpoints
├── types/
│   └── index.ts                  # TypeScript types for messages, documents, and sessions
├── App.tsx                       # Root view composition and state management
├── main.tsx                      # Vite React entry point
└── index.css                     # Tailwind CSS base and utility styles
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
Production assets are bundled and optimized into the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🔌 API Proxy Configuration

The development server (`vite.config.ts`) is configured to proxy all `/api` requests to the FastAPI backend running on port 8000:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 📦 Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript with `tsc -b` and creates production bundle |
| `npm run lint` | Runs ESLint across the codebase |
| `npm run preview` | Serves the production build locally |

