from fastapi import APIRouter
from models.schema import IngestRequest
from services.github_ingestion import parse_github_url, fetch_repo_files
from services.embedding_pipeline import chunk_and_embed

router = APIRouter()

@router.post("/api/ingest")
async def ingest_repo(request: IngestRequest):
    # Step 1: Parse the URL
    info = parse_github_url(request.repo_url)
    
    # Step 2: Fetch all files from the repo
    files = await fetch_repo_files(info["owner"], info["repo"], info["branch"])
    
    # Step 3: Chunk and embed the files into ChromaDB
    chunk_count = chunk_and_embed(request.repo_url, files)
    
    # Step 4: Return a summary
    return {
        "owner": info["owner"],
        "repo": info["repo"],
        "branch": info["branch"],
        "file_count": len(files),
        "chunk_count": chunk_count,
        "files": [
            {"path": f["path"], "language": f["language"], "size": f["size"]}
            for f in files
        ],
    }