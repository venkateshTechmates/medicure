"""
MedCure AI Assistant service  (FastAPI, port 8100)

Provides a conversational backend for the in-app AI chatbot. It returns text
replies and, where useful, ready-to-run Python snippets that the browser can
execute in Pyodide. A server-side /run-python endpoint is also exposed for
calculations that need the full CPython stdlib in a sandboxed subprocess.

Endpoints
---------
GET  /health
POST /chat          conversational reply (text + optional python snippet)
POST /run-python    sandboxed server-side execution (subprocess, time-limited)
POST /transcribe    placeholder for STT — accepts audio bytes, returns text

The chat reply pipeline is intentionally pluggable: set MEDCURE_LLM_BACKEND to
"openai" or "anthropic" with the matching API key to enable a real LLM. Without
that, the service falls back to a deterministic clinical-calculator router that
handles BMI, Cockcroft-Gault CrCl, weight-based dosing, NEWS2, and a small set
of canned clinical responses.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
import subprocess
import sys
import tempfile
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
log = logging.getLogger("ai-assistant")

app = FastAPI(title="MedCure AI Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5050",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
#  Models                                                                     #
# --------------------------------------------------------------------------- #

class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = ""


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    image_b64: str | None = None


class ChatResponse(BaseModel):
    text: str
    python: str | None = None
    source: str = "rules"


class RunPythonRequest(BaseModel):
    code: str
    timeout_seconds: float = 4.0


class RunPythonResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool


class TranscribeRequest(BaseModel):
    audio_b64: str
    mime: str = "audio/webm"


class TranscribeResponse(BaseModel):
    text: str
    backend: str


# --------------------------------------------------------------------------- #
#  Rule-based clinical assistant                                              #
# --------------------------------------------------------------------------- #

BMI_SNIPPET = """\
weight_kg = 72
height_m = 1.78
bmi = weight_kg / (height_m ** 2)
category = (
    "underweight" if bmi < 18.5
    else "normal" if bmi < 25
    else "overweight" if bmi < 30
    else "obese"
)
print(f"BMI = {bmi:.1f}  ({category})")
"""

CRCL_SNIPPET = """\
# Cockcroft-Gault creatinine clearance
age = 64
weight_kg = 78
scr = 1.2   # mg/dL
sex = "M"   # 'M' or 'F'
crcl = ((140 - age) * weight_kg) / (72 * scr)
if sex.upper() == "F":
    crcl *= 0.85
print(f"CrCl approx {crcl:.0f} mL/min")
"""

DOSE_SNIPPET = """\
drug = "Vancomycin"
weight_kg = 78
mg_per_kg = 15
max_mg = 2000
dose = min(weight_kg * mg_per_kg, max_mg)
print(f"{drug}: {dose:.0f} mg q12h (cap {max_mg} mg)")
"""

NEWS2_SNIPPET = """\
# Minimal NEWS2 helper (subset of parameters)
rr = 22       # respirations/min
spo2 = 94     # % (scale 1)
temp = 38.4   # C
sbp = 108     # mmHg
hr = 112      # bpm
acvpu = "A"   # A/C/V/P/U
score = 0
score += 3 if rr <= 8 or rr >= 25 else 2 if rr >= 21 else 1 if rr <= 11 else 0
score += 3 if spo2 <= 91 else 2 if spo2 <= 93 else 1 if spo2 <= 95 else 0
score += 1 if temp <= 36.0 else 0
score += 1 if 38.1 <= temp <= 39.0 else 2 if temp >= 39.1 else 0
score += 3 if sbp <= 90 or sbp >= 220 else 2 if sbp <= 100 else 1 if sbp <= 110 else 0
score += 3 if hr <= 40 or hr >= 131 else 2 if hr >= 111 else 1 if (hr >= 91 or hr <= 50) else 0
score += 3 if acvpu != "A" else 0
print(f"NEWS2 = {score}")
"""


def rule_reply(message: str) -> ChatResponse:
    q = message.strip()
    lower = q.lower()

    if re.search(r"\bbmi\b", lower):
        return ChatResponse(text="Drafted a BMI calculator — edit the inputs and Run.", python=BMI_SNIPPET)
    if re.search(r"crcl|cockcroft|creatinine clearance", lower):
        return ChatResponse(text="Cockcroft-Gault CrCl. Adjust age / weight / SCr / sex and Run.", python=CRCL_SNIPPET)
    if re.search(r"\bdose\b|mg/kg|weight[- ]based", lower):
        return ChatResponse(text="Weight-based dose template. Change drug + mg/kg and Run.", python=DOSE_SNIPPET)
    if re.search(r"news2|sepsis", lower):
        return ChatResponse(
            text="NEWS2 helper. Score >= 5 triggers sepsis bundle review per local policy.",
            python=NEWS2_SNIPPET,
        )
    if re.search(r"discharge", lower):
        return ChatResponse(
            text="Discharge checklist: medication reconciliation, follow-up scheduled, teach-back complete, ride home confirmed, dietary review."
        )
    if re.search(r"python|calculate|compute", lower):
        return ChatResponse(
            text="I can run Python in-browser. Try 'compute BMI', 'CrCl', 'vanc dose', or 'NEWS2'.",
            python="import math\nprint(math.pi)",
        )
    if re.match(r"^(hi|hello|hey)\b", lower):
        return ChatResponse(
            text="Hi - I'm the MedCure assistant. I can answer clinical questions, draft Python calculators, "
                 "and accept voice or webcam input."
        )
    if re.search(r"help|what can", lower):
        return ChatResponse(
            text=(
                "I can:\n"
                "- Chat about clinical workflows\n"
                "- Generate Python calculators (BMI, CrCl, dose, NEWS2)\n"
                "- Run Python server-side via /run-python\n"
                "- Transcribe voice (when STT backend is configured)"
            )
        )
    return ChatResponse(
        text=f'I heard: "{q}". Ask for a Python calc (BMI / CrCl / dose / NEWS2), or use the mic / camera buttons.'
    )


# --------------------------------------------------------------------------- #
#  Optional LLM backends                                                      #
# --------------------------------------------------------------------------- #

async def llm_reply(req: ChatRequest) -> ChatResponse | None:
    backend = os.getenv("MEDCURE_LLM_BACKEND", "").lower()
    if backend == "openai" and os.getenv("OPENAI_API_KEY"):
        return await _openai_reply(req)
    if backend == "anthropic" and os.getenv("ANTHROPIC_API_KEY"):
        return await _anthropic_reply(req)
    return None


async def _openai_reply(req: ChatRequest) -> ChatResponse | None:
    import httpx

    system = (
        "You are MedCure's in-app clinical assistant. Be terse. When a calculation "
        "is helpful (BMI, CrCl, weight-based dose, NEWS2), reply briefly and put the "
        "code in a fenced ```python block. Never give specific dosing advice for a "
        "real patient without explicit clinician sign-off."
    )
    messages = [{"role": "system", "content": system}]
    for turn in req.history[-12:]:
        messages.append({"role": turn.role, "content": turn.text})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                json={
                    "model": os.getenv("MEDCURE_LLM_MODEL", "gpt-4o-mini"),
                    "messages": messages,
                    "temperature": 0.2,
                },
            )
            r.raise_for_status()
            text = r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        log.warning("openai backend failed: %s", e)
        return None

    return _split_python(text, source="openai")


async def _anthropic_reply(req: ChatRequest) -> ChatResponse | None:
    import httpx

    system = (
        "You are MedCure's in-app clinical assistant. Be terse. When a calculation "
        "is helpful, put runnable code in a ```python fence."
    )
    messages = []
    for turn in req.history[-12:]:
        messages.append({"role": turn.role, "content": turn.text})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": os.getenv("MEDCURE_LLM_MODEL", "claude-haiku-4-5-20251001"),
                    "max_tokens": 700,
                    "system": system,
                    "messages": messages,
                },
            )
            r.raise_for_status()
            body = r.json()
            text = "".join(part.get("text", "") for part in body.get("content", []) if part.get("type") == "text")
    except Exception as e:
        log.warning("anthropic backend failed: %s", e)
        return None

    return _split_python(text, source="anthropic")


FENCE_RE = re.compile(r"```python\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)


def _split_python(text: str, source: str) -> ChatResponse:
    m = FENCE_RE.search(text)
    if not m:
        return ChatResponse(text=text.strip(), source=source)
    code = m.group(1).strip()
    prose = FENCE_RE.sub("", text).strip()
    return ChatResponse(text=prose or "Drafted code below.", python=code, source=source)


# --------------------------------------------------------------------------- #
#  Sandboxed python execution                                                 #
# --------------------------------------------------------------------------- #

RESTRICTED_PREAMBLE = """\
import builtins, sys
_BLOCKED = {'open', 'compile', 'exec', 'eval'}
_orig_import = builtins.__import__
_DENY = {'os', 'subprocess', 'socket', 'shutil', 'pathlib', 'requests',
         'httpx', 'urllib', 'ctypes', 'multiprocessing', 'threading'}
def _safe_import(name, *a, **kw):
    root = name.split('.')[0]
    if root in _DENY:
        raise ImportError(f'import of {root!r} is not allowed in the sandbox')
    return _orig_import(name, *a, **kw)
builtins.__import__ = _safe_import
for n in _BLOCKED:
    if hasattr(builtins, n):
        setattr(builtins, n, None)
"""


async def run_python_subprocess(code: str, timeout: float) -> RunPythonResponse:
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(RESTRICTED_PREAMBLE)
        f.write("\n")
        f.write(code)
        path = f.name

    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-I", "-S", path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    timed_out = False
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        timed_out = True
        proc.kill()
        stdout, stderr = await proc.communicate()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    return RunPythonResponse(
        stdout=stdout.decode("utf-8", errors="replace")[:20_000],
        stderr=stderr.decode("utf-8", errors="replace")[:20_000],
        exit_code=proc.returncode if proc.returncode is not None else -1,
        timed_out=timed_out,
    )


# --------------------------------------------------------------------------- #
#  Endpoints                                                                  #
# --------------------------------------------------------------------------- #

@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "service": "medcure-ai-assistant",
        "llm_backend": os.getenv("MEDCURE_LLM_BACKEND", "") or "rules",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not req.message and not req.image_b64:
        raise HTTPException(status_code=400, detail="message or image_b64 required")

    if req.image_b64 and not req.message:
        return ChatResponse(text="Got the snapshot. I don't have a vision model wired up yet - "
                                  "describe what you'd like me to do with it.")

    llm = await llm_reply(req)
    return llm or rule_reply(req.message)


@app.post("/run-python", response_model=RunPythonResponse)
async def run_python(req: RunPythonRequest) -> RunPythonResponse:
    if len(req.code) > 20_000:
        raise HTTPException(status_code=413, detail="code too large")
    timeout = max(0.5, min(req.timeout_seconds, 10.0))
    return await run_python_subprocess(req.code, timeout)


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(req: TranscribeRequest) -> TranscribeResponse:
    try:
        raw = base64.b64decode(req.audio_b64, validate=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"bad audio_b64: {e}")
    backend = os.getenv("MEDCURE_STT_BACKEND", "").lower()

    if backend == "openai" and os.getenv("OPENAI_API_KEY"):
        import httpx
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                files = {"file": ("audio." + req.mime.split("/")[-1], raw, req.mime)}
                data = {"model": os.getenv("MEDCURE_STT_MODEL", "whisper-1")}
                r = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                    files=files,
                    data=data,
                )
                r.raise_for_status()
                return TranscribeResponse(text=r.json().get("text", "").strip(), backend="openai")
        except Exception as e:
            log.warning("whisper transcribe failed: %s", e)

    return TranscribeResponse(
        text="",
        backend="none (configure MEDCURE_STT_BACKEND=openai and OPENAI_API_KEY, or use the browser's built-in mic)",
    )
