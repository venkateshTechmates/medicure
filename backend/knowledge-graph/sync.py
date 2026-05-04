"""
Sync worker – pulls data from the MedCure .NET API and loads it into the KG.
Called on startup and periodically via background task.
"""

import asyncio
import logging
import os
import httpx
from graph_engine import kg

logger = logging.getLogger("kg.sync")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5050")
SYNC_TOKEN   = os.getenv("SYNC_TOKEN", "")          # optional pre-shared bearer token
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", "120"))  # seconds


def _headers() -> dict[str, str]:
    if SYNC_TOKEN:
        return {"Authorization": f"Bearer {SYNC_TOKEN}"}
    return {}


async def sync_once(client: httpx.AsyncClient) -> None:
    """Pull patients + related entities from the .NET API into the graph."""
    try:
        r = await client.get(f"{BACKEND_URL}/api/patients", headers=_headers(), timeout=15)
        if r.status_code != 200:
            logger.warning("Patients endpoint returned %s", r.status_code)
            return
        patients: list[dict] = r.json()
    except Exception as exc:
        logger.warning("Sync skipped – cannot reach backend: %s", exc)
        return

    for p in patients:
        mrn: str = p.get("mrn", "")
        kg.load_patient(p)

        # Load problems embedded in the patient response
        for prob in p.get("problems", []):
            kg.load_problem(mrn, prob)

        for vital in p.get("vitals", []):
            kg.load_vital(mrn, vital)

    logger.info("Graph sync complete – %s", kg.stats())


async def sync_patient(mrn: str, client: httpx.AsyncClient) -> None:
    """Re-sync a single patient on-demand."""
    try:
        r = await client.get(f"{BACKEND_URL}/api/patients/{mrn}", headers=_headers(), timeout=10)
        if r.status_code != 200:
            return
        p = r.json()
        kg.load_patient(p)
        for prob in p.get("problems", []):
            kg.load_problem(mrn, prob)
        for vital in p.get("vitals", []):
            kg.load_vital(mrn, vital)
    except Exception as exc:
        logger.warning("On-demand sync failed for %s: %s", mrn, exc)


async def background_sync_loop() -> None:
    async with httpx.AsyncClient() as client:
        while True:
            await sync_once(client)
            await asyncio.sleep(SYNC_INTERVAL)
