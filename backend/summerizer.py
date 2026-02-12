import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = "gemini-flash-latest"

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set ")
    return genai.Client(api_key=api_key)


class SummaryResponse(BaseModel):
    filename: str
    file_type: str
    summary: str
    key_points: list[str]
    word_count: int


PROMPT = """Analyze this file and return JSON with exactly:
{
  "summary": "2-4 paragraph summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "word_count": 1234
}"""


@app.get("/")
async def health_check():
    return {"status": "ok"}


@app.post("/summarize", response_model=SummaryResponse)
async def summarize_file(file: UploadFile = File(...)):
    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 10MB.")

    mime = file.content_type or "application/octet-stream"
    is_image = mime in {"image/jpeg", "image/png", "image/gif", "image/webp"}
    is_pdf = mime == "application/pdf"
    is_text = not is_image and not is_pdf

    if is_text:
        try:
            text = content.decode("utf-8", errors="replace")[:50_000]
        except Exception:
            raise HTTPException(400, f"Unsupported file type: {mime}")

    try:
        client = get_client()
        cfg = types.GenerateContentConfig(response_mime_type="application/json")

        if is_text:
            resp = client.models.generate_content(
                model=MODEL, contents=f"{PROMPT}\n\n{text}", config=cfg
            )
        else:
            part = types.Part.from_bytes(data=content, mime_type=mime)
            resp = client.models.generate_content(
                model=MODEL, contents=[PROMPT, part], config=cfg
            )

        data = json.loads(resp.text)
        return SummaryResponse(
            filename=file.filename or "unknown",
            file_type=mime,
            summary=data.get("summary", ""),
            key_points=data.get("key_points", []),
            word_count=data.get("word_count", 0),
        )
    except ValueError as e:
        raise HTTPException(500, str(e))
    except Exception as e:
        raise HTTPException(500, f"Summarization failed: {e}")