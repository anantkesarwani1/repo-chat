from services.embedding_pipeline import vector_stores
from langchain_google_genai import ChatGoogleGenerativeAI

def answer_repo_question(repo_url: str, question: str) -> str:
    """Retrieves relevant code chunks and asks Gemini to answer the question."""
    
    # 1. Check if we have ingested this repo yet
    if repo_url not in vector_stores:
        return "Error: I haven't read this repository yet. Please ingest it first."
        
    # Get the specific database for this repo
    vectorstore = vector_stores[repo_url]
    
    # 2. Retrieve the top 5 most relevant chunks
    # k=5 means "give me the 5 best matches"
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    relevant_docs = retriever.invoke(question)
    
    # 3. Combine the chunks into a single text block
    context = ""
    for doc in relevant_docs:
        context += doc.page_content + "\n\n"
        
    # 4. Setup Gemini Chat Model (flash is the fastest model)
    # Change from "gemini-1.5-flash" to "gemini-pro"
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash")
    
    # 5. Build the prompt
    prompt = f"""
    You are an expert programmer. Answer the user's question about the codebase using ONLY the provided context.
    If you cannot answer the question based on the context, say "I don't have enough context to answer that."
    
    Context from the codebase:
    {context}
    
    Question: {question}
    """
    
    # 6. Ask Gemini!
    print("Asking Gemini...")
    response = llm.invoke(prompt)
    
    return response.content