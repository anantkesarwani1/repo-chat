from fastapi import APIRouter
from models.schema import ChatRequest
from services.chat_engine import answer_repo_question

router = APIRouter()

@router.post("/api/chat")
async def chat_with_repo(request: ChatRequest):
    # Pass the URL and the question to our new chat engine
    answer = answer_repo_question(request.repo_url, request.question)
    
    # Return the answer as JSON
    return {
        "repo_url": request.repo_url,
        "question": request.question,
        "answer": answer
    }