import re
import httpx
import asyncio

def parse_github_url(url: str):
    pattern = r"github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+))?"
    match = re.search(pattern, url)

    if not match:
        raise ValueError(f"Invalid Github URL: {url}")
    
    owner = match.group(1)
    repo = match.group(2).replace(".git","")
    branch = match.group(3) or "main"

    return {"owner": owner, "repo": repo, "branch": branch}

SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".woff", ".woff2", ".ttf", ".eot",
    ".mp3", ".mp4", ".wav", ".avi",
    ".zip", ".tar", ".gz", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".pdf", ".doc", ".docx",
    ".pyc", ".class", ".o",
}

SKIP_DIRECTORIES = {
    "node_modules", ".git", "dist", "build",
    "__pycache__", ".venv", "venv", "vendor",
    ".next", ".nuxt", "coverage", ".cache",
}

MAX_FILE_SIZE = 500000

def should_include_file(file_path: str, file_size: int):
    parts = file_path.split("/")
    for part in parts:
        if part in SKIP_DIRECTORIES:
            return False
        
    for ext in SKIP_EXTENSIONS:
        if file_path.lower().endswith(ext):
            return False
        
    if file_size > MAX_FILE_SIZE:
        return False
    
    return True

LANGUAGE = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".jsx": "React JSX",
    ".tsx": "React TSX",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".html": "HTML",
    ".css": "CSS",
    ".json": "JSON",
    ".md": "Markdown",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".sql": "SQL",
    ".sh": "Shell",
    ".rb": "Ruby",
    ".php": "PHP",
}

def detect_language(file_path: str) -> str:
    for ext, language in LANGUAGE.items():
        if file_path.lower().endswith(ext):
            return language
    return "Unknown"


async def fetch_single_file(client, owner: str, repo: str, file_path: str, branch: str, headers: dict) -> dict:
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}?ref={branch}"
    
    response = await client.get(url, headers={**headers, "Accept": "application/vnd.github.v3.raw"})
    
    if response.status_code != 200:
        return None
    
    return {
        "path": file_path,
        "content": response.text,
        "language": detect_language(file_path),
        "size": len(response.text),
    }


async def fetch_file_with_limit(semaphore, client, owner, repo, file_path, branch, headers):
    async with semaphore:
        return await fetch_single_file(client, owner, repo, file_path, branch, headers)


async def fetch_repo_files(owner: str, repo: str, branch: str, github_token: str = None):
    headers = {"Accept": "application/vnd.github.v3+json"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    async with httpx.AsyncClient() as client:
        branches = [branch, "main", "master"]
        
        response = None
        for b in branches:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{b}?recursive=1"
            response = await client.get(tree_url, headers=headers)
            if response.status_code == 200:
                branch = b
                break
        
        if response.status_code != 200:
            raise Exception(f"Repository not found or inaccessible: {owner}/{repo}")
        
        tree_data = response.json()

        files_to_fetch = []

        for item in tree_data["tree"]:
            if item["type"] != "blob":
                continue
            if not should_include_file(item["path"], item.get("size", 0)):
                continue
            files_to_fetch.append(item)

        semaphore = asyncio.Semaphore(10)
        
        tasks = []
        for item in files_to_fetch:
            task = fetch_file_with_limit(
                semaphore, client, owner, repo, item["path"], branch, headers
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # Remove any None results (files that failed to download)
        files = [f for f in results if f is not None]
        
        print(f"Successfully downloaded {len(files)} files")
        return files

        print(f"Found {len(tree_data['tree'])} total items, fetching {len(files_to_fetch)} text files")