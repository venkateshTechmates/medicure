# MedCure AI Assistant Service

FastAPI service on port **8100** that powers the in-app AI chatbot.

## Endpoints

| Method | Path           | Purpose                                                  |
|--------|----------------|----------------------------------------------------------|
| GET    | `/health`      | Liveness + active backend                                |
| POST   | `/chat`        | Conversational reply, optional `python` snippet          |
| POST   | `/run-python`  | Sandboxed server-side Python execution (subprocess)      |
| POST   | `/transcribe`  | Speech-to-text (Whisper if `OPENAI_API_KEY` set)         |

## Local dev

```bash
cd backend/ai-assistant
python -m venv .venv
.venv/Scripts/activate          # Windows; on *nix: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8100
```

Smoke test:

```bash
curl -s http://localhost:8100/health
curl -s -X POST http://localhost:8100/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"compute BMI"}'
```

## Configuration

| Env var                    | Effect                                                                 |
|----------------------------|------------------------------------------------------------------------|
| `MEDCURE_LLM_BACKEND`      | `openai` or `anthropic`. Empty -> rule-based replies (default).        |
| `MEDCURE_LLM_MODEL`        | Model name; defaults: `gpt-4o-mini` / `claude-haiku-4-5-20251001`.     |
| `OPENAI_API_KEY`           | Required for `openai` chat backend and Whisper STT.                    |
| `ANTHROPIC_API_KEY`        | Required for `anthropic` chat backend.                                 |
| `MEDCURE_STT_BACKEND`      | `openai` to enable Whisper-based `/transcribe`. Empty -> stub.         |
| `MEDCURE_STT_MODEL`        | Whisper model id (default `whisper-1`).                                |

## Sandbox notes

`/run-python` runs each request as `python -I -S` in a subprocess with a preamble
that blocks `os`, `subprocess`, `socket`, `urllib`, `ctypes`, `threading`, etc.,
and disables `open` / `exec` / `eval`. It is **not** a hardened sandbox -- treat
it as defence-in-depth for trusted internal users. Production deployments should
run this container with `--read-only`, `--network=none`, and a strict seccomp
profile, or replace `run_python_subprocess` with a real sandbox (e2b, Docker,
gVisor, etc.).

## Docker

```bash
docker compose up --build ai
```

The service is wired into the top-level [docker-compose.yml](../../docker-compose.yml)
as the `ai` service.
