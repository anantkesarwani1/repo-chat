# 💬 Repo Chat

Chat and interact with any public GitHub repository seamlessly! Repo Chat combines an intelligent Retrieval-Augmented Generation (RAG) backend with a modern React interface, allowing you to ask questions, explore codebases, and understand architectural decisions of any codebase within seconds.

---

## 🏗️ Architecture & Backend Spotlight

The core strength of Repo Chat lies in its highly efficient, asynchronous backend powered by **FastAPI**, **LangChain**, and **Google Gemini AI**. The backend acts as the brain of the operation, ingesting repositories and serving as an intelligent chat engine.

### 🔹 1. GitHub Ingestion Engine (`services/github_ingestion.py`)
- **Asynchronous Fetching**: Utilizes `httpx` and `asyncio` to fetch files recursively from the GitHub REST API (`application/vnd.github.v3+json`).
- **Concurrency & Rate Limiting**: Employs an `asyncio.Semaphore` to manage concurrent requests smoothly without hitting rate limits.
- **Intelligent Filtering**: Automatically skips irrelevant files (e.g., binaries, media, `.git`, `node_modules`, `dist`) and enforces file size limits, saving bandwidth and processing time.
- **Language Detection**: Identifies programming languages based on file extensions to aid the AI in understanding context.

### 🔹 2. Embedding & Vector Pipeline (`services/embedding_pipeline.py`)
- **LangChain Integration**: Uses `RecursiveCharacterTextSplitter` to intelligently chunk code (1000 characters per chunk with 200 characters overlap) so that functions and classes aren't abruptly cut in half.
- **Gemini Embeddings**: Vectorizes the code chunks using `GoogleGenerativeAIEmbeddings` (`gemini-embedding-001`).
- **ChromaDB**: Stores the vectorized code in an efficient in-memory Chroma database, dynamically mapped to each unique repository URL for lightning-fast retrieval.

### 🔹 3. RAG Chat Engine (`services/chat_engine.py`)
- **Context Retrieval**: Queries the Chroma vector store to find the top 5 most relevant code chunks related to the user's question.
- **Gemini 3.5 Flash LLM**: Passes the retrieved code context to the fast and capable `ChatGoogleGenerativeAI` (`gemini-3.5-flash`) model.
- **Expert Responses**: Returns precise, context-aware answers about the codebase structure, logic, and implementations.

### 🔹 API Endpoints

- `POST /api/ingest`: Takes a `repo_url`, fetches all valid code files, chunks them, and embeds them into ChromaDB. Returns metadata on the number of files and chunks processed.
- `POST /api/chat`: Takes a `repo_url` and a `question`. Uses RAG to find relevant code snippets and streams back an intelligent answer from Gemini.

---

## 🖥️ Frontend Overview

The client-side interface provides a beautiful and reactive user experience to interact with the backend.

- **Framework**: React 19, Vite, TanStack Router & Start.
- **Styling**: Tailwind CSS 4, Radix UI primitives, and Framer Motion for smooth micro-animations.
- **Code Rendering**: Uses `streamdown`, `react-markdown`, and `lucide-react` to render complex markdown and syntax-highlighted code blocks dynamically.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+ & Bun (or npm/yarn)
- Google Gemini API Key

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GITHUB_TOKEN=your_github_token_here_for_higher_rate_limits (Optional)
   ```
4. Start the FastAPI server:
   ```bash
   fastapi dev main.py
   # Or using uvicorn: uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Start the development server:
   ```bash
   bun run dev
   ```
   The frontend will be available at `http://localhost:5173`.
