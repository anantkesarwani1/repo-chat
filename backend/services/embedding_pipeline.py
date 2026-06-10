import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# Load the GEMINI_API_KEY from the .env file
load_dotenv()

# We'll keep our vector stores in memory here, mapping repo_url -> Chroma instance
vector_stores = {}

def chunk_and_embed(repo_url: str, files: list):
    """Takes downloaded files, chunks them, and stores them in ChromaDB."""
    
    # 1. Setup our embeddings model (uses the API key automatically)
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    
    # 2. Setup text splitter
    # 1000 chars per chunk, with 200 chars overlap so we don't cut functions in half abruptly
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    
    documents = []
    
    # 3. Create LangChain Document objects
    for f in files:
        # Don't try to split empty files
        if not f["content"].strip():
            continue
            
        # Add the file path as a header so the AI knows where this code lives
        content_with_header = f"# File: {f['path']}\n\n{f['content']}"
        
        # Split the file into smaller chunks
        chunks = text_splitter.split_text(content_with_header)
        
        for chunk in chunks:
            # Document is a standard format combining text and metadata
            doc = Document(
                page_content=chunk,
                metadata={"path": f["path"], "language": f["language"]}
            )
            documents.append(doc)
            
    print(f"Split files into {len(documents)} chunks. Creating vector store...")
    
    # 4. Create the in-memory Chroma database
    # This automatically sends the text to Gemini, gets the vectors, and stores them
    if documents:
        vectorstore = Chroma.from_documents(documents, embeddings)
        vector_stores[repo_url] = vectorstore
        print("Vector store created successfully!")
        
    return len(documents)