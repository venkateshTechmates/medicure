"""
MedCure Knowledge Graph REST API  (FastAPI, port 8000)

Endpoints
---------
GET  /health
GET  /stats
POST /sync              trigger full backend sync
POST /sync/patient/{mrn}  on-demand patient sync
POST /graph/ingest      push a patient bundle directly (used by .NET backend)
GET  /graph/patient/{mrn}         get patient node (cache hit or miss)
GET  /graph/patient/{mrn}/network get ego-graph at depth N
GET  /graph/patient/{mrn}/similar find patients with shared diagnoses
GET  /graph/drug/{name}/patients  patients currently on this drug
GET  /graph/search                full-text search
DELETE /graph/cache               clear entire graph
DELETE /graph/cache/{node_id}     invalidate a single node
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from graph_engine import kg
from models import NetworkOut, StatsOut, SyncPatientRequest
from sync import background_sync_loop, sync_once, sync_patient

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    task = asyncio.create_task(background_sync_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="MedCure Knowledge Graph", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5050"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ #
#  Health                                                              #
# ------------------------------------------------------------------ #


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **kg.stats()}


# ------------------------------------------------------------------ #
#  Stats                                                               #
# ------------------------------------------------------------------ #


@app.get("/stats", response_model=StatsOut)
def stats() -> StatsOut:
    return StatsOut(**kg.stats())


# ------------------------------------------------------------------ #
#  Sync triggers                                                       #
# ------------------------------------------------------------------ #


@app.post("/sync")
async def trigger_sync() -> dict:
    async with httpx.AsyncClient() as client:
        await sync_once(client)
    return kg.stats()


@app.post("/sync/patient/{mrn}")
async def trigger_patient_sync(mrn: str) -> dict:
    async with httpx.AsyncClient() as client:
        await sync_patient(mrn, client)
    node = kg.get_node(f"patient:{mrn}")
    if not node:
        raise HTTPException(404, f"Patient {mrn} not found after sync")
    return node


# ------------------------------------------------------------------ #
#  Ingest (push from .NET backend)                                     #
# ------------------------------------------------------------------ #


@app.post("/graph/ingest", status_code=204)
def ingest(body: SyncPatientRequest) -> None:
    """
    .NET backend pushes a patient bundle here after writes.
    Keeps the KG in sync without polling.
    """
    mrn: str = body.patient.get("mrn", "")
    if not mrn:
        raise HTTPException(422, "patient.mrn is required")
    kg.load_patient(body.patient)
    for prob in body.problems:
        kg.load_problem(mrn, prob)
    for order in body.orders:
        kg.load_order(mrn, order)
    for lab in body.labs:
        kg.load_lab(mrn, lab)
    for vital in body.vitals:
        kg.load_vital(mrn, vital)
    for enc in body.encounters:
        kg.load_encounter(mrn, enc)


# ------------------------------------------------------------------ #
#  Graph queries                                                       #
# ------------------------------------------------------------------ #


@app.get("/graph/patient/{mrn}")
def get_patient(mrn: str) -> dict:
    node = kg.get_node(f"patient:{mrn}")
    if not node:
        raise HTTPException(404, f"Patient {mrn} not in cache")
    return node


@app.get("/graph/patient/{mrn}/network", response_model=NetworkOut)
def get_patient_network(
    mrn: str,
    depth: int = Query(default=2, ge=1, le=4),
) -> NetworkOut:
    net = kg.get_patient_network(mrn, depth=depth)
    return NetworkOut(**net)


@app.get("/graph/patient/{mrn}/similar")
def get_similar_patients(mrn: str) -> dict:
    similar = kg.find_similar_patients(mrn)
    return {"mrn": mrn, "similar": similar, "count": len(similar)}


@app.get("/graph/drug/{name}/patients")
def patients_on_drug(name: str) -> dict:
    mrns = kg.patients_on_drug(name)
    return {"drug": name, "patients": mrns, "count": len(mrns)}


@app.get("/graph/search")
def search(
    q: str = Query(min_length=1),
    kinds: str | None = Query(default=None, description="Comma-separated node kinds to filter"),
) -> dict:
    kind_list = [k.strip() for k in kinds.split(",")] if kinds else None
    results = kg.search_nodes(q, kind_list)
    return {"query": q, "count": len(results), "results": results}


# ------------------------------------------------------------------ #
#  Cache invalidation                                                  #
# ------------------------------------------------------------------ #


@app.delete("/graph/cache")
def clear_cache() -> dict:
    kg.clear()
    return {"cleared": True}


@app.delete("/graph/cache/{node_id:path}")
def invalidate_node(node_id: str) -> dict:
    kg.invalidate(node_id)
    return {"invalidated": node_id}


# ------------------------------------------------------------------ #
#  Entry point                                                         #
# ------------------------------------------------------------------ #


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("KG_PORT", "8000")), reload=True)
