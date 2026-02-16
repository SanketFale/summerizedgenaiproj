import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from io import BytesIO
  
load_dotenv()

# Load API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=api_key)

app = FastAPI(title="Gemini File Summarizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/summarize")
async def summarize_file(file: UploadFile = File(...)):
    try:
        # Read uploaded file content
        content = await file.read()
        file_type = file.filename.lower().split('.')[-1]

        # Extract text based on file type
        if file_type == 'txt':
            text = content.decode('utf-8')
        else:
            raise ValueError("Unsupported file type. Use PDF or TXT.")

        if not text.strip():
            raise ValueError("No text found in file.")

        # Build Gemini prompt for summarization
        user_prompt = (
            "Summarize the following text in a concise, structured way:\n"
            "- Key points as bullets\n"
            "- Main ideas and conclusions\n"
            "- Keep it objective and accurate\n"
            "- Limit to 300-500 words\n\n"
            f"Text:\n{text[:20000]}"  # Truncate if too long (Gemini limit ~32k tokens)
        )

        # Call Gemini
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[{"role": "user", "parts": [{"text": user_prompt}]}],
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )

        if not response.candidates or not response.candidates[0].content.parts:
            raise ValueError("No summary generated.")

        summary = response.candidates[0].content.parts[0].text.strip()

        return {"summary": summary}

    except Exception as e:
        raise HTTPException(500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "ok"}