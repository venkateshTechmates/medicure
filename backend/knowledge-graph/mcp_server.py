"""
MedCure Knowledge Graph – MCP Server

Exposes the graph as MCP tools so AI agents can query patient relationships,
find similar patients, trace drug prescriptions, and inspect the cache.

Run standalone:
    python mcp_server.py

Or configure in .vscode/mcp.json (see project root).
"""

import os
import sys

import httpx
from mcp.server.fastmcp import FastMCP

KG_API = os.getenv("KG_API_URL", "http://localhost:8000")

mcp = FastMCP("medcure-knowledge-graph")


def _kg(path: str, method: str = "GET", json: dict | None = None) -> dict:
    """Simple synchronous helper to call the KG REST API."""
    with httpx.Client(timeout=10) as client:
        if method == "GET":
            r = client.get(f"{KG_API}{path}")
        elif method == "POST":
            r = client.post(f"{KG_API}{path}", json=json or {})
        elif method == "DELETE":
            r = client.delete(f"{KG_API}{path}")
        else:
            raise ValueError(f"Unsupported method {method}")
        r.raise_for_status()
        if r.status_code == 204:
            return {}
        return r.json()


# ------------------------------------------------------------------ #
#  Tools                                                               #
# ------------------------------------------------------------------ #


@mcp.tool()
def kg_health() -> dict:
    """Check knowledge graph health and return node/edge counts."""
    return _kg("/health")


@mcp.tool()
def kg_stats() -> dict:
    """Return statistics: total nodes, total edges, counts per node kind."""
    return _kg("/stats")


@mcp.tool()
def kg_get_patient(mrn: str) -> dict:
    """
    Retrieve a cached patient node by MRN.
    Returns patient attributes if found, or an error if not in cache.
    """
    try:
        return _kg(f"/graph/patient/{mrn}")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "mrn": mrn}


@mcp.tool()
def kg_patient_network(mrn: str, depth: int = 2) -> dict:
    """
    Return the ego-graph of a patient up to *depth* hops (1-4).
    Includes connected encounters, orders, labs, vitals, diagnoses, and drugs.
    """
    try:
        return _kg(f"/graph/patient/{mrn}/network?depth={depth}")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "mrn": mrn}


@mcp.tool()
def kg_similar_patients(mrn: str) -> dict:
    """
    Find other patients who share at least one diagnosis with this patient.
    Useful for cohort analysis and population health queries.
    """
    try:
        return _kg(f"/graph/patient/{mrn}/similar")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "mrn": mrn}


@mcp.tool()
def kg_patients_on_drug(drug_name: str) -> dict:
    """
    List all patients currently with an active order for *drug_name*.
    Useful for drug-interaction audits and medication safety checks.
    """
    try:
        return _kg(f"/graph/drug/{drug_name}/patients")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "drug": drug_name}


@mcp.tool()
def kg_search(query: str, kinds: str = "") -> dict:
    """
    Full-text search across all graph nodes.
    *kinds*: optional comma-separated node kinds to filter
    (patient, encounter, order, lab, vital, problem, drug, provider, ward).
    """
    params = f"q={query}"
    if kinds:
        params += f"&kinds={kinds}"
    try:
        return _kg(f"/graph/search?{params}")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "query": query}


@mcp.tool()
def kg_sync_patient(mrn: str) -> dict:
    """
    Force a re-sync of a single patient from the .NET backend into the graph.
    Call this after you know a patient's data has been updated.
    """
    try:
        return _kg(f"/sync/patient/{mrn}", method="POST")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "mrn": mrn}


@mcp.tool()
def kg_sync_all() -> dict:
    """
    Trigger a full sync of all patients from the .NET backend.
    Use sparingly – it pulls the entire patient list.
    """
    try:
        return _kg("/sync", method="POST")
    except httpx.HTTPStatusError as e:
        return {"error": str(e)}


@mcp.tool()
def kg_clear_cache() -> dict:
    """
    Wipe the entire in-memory knowledge graph.
    A background sync will repopulate it automatically.
    """
    try:
        return _kg("/graph/cache", method="DELETE")
    except httpx.HTTPStatusError as e:
        return {"error": str(e)}


@mcp.tool()
def kg_invalidate_node(node_id: str) -> dict:
    """
    Mark a specific node stale so it will be re-fetched on next access.
    node_id format: patient:MRN001, order:42, drug:Aspirin, etc.
    """
    try:
        return _kg(f"/graph/cache/{node_id}", method="DELETE")
    except httpx.HTTPStatusError as e:
        return {"error": str(e), "node_id": node_id}


# ------------------------------------------------------------------ #
#  Entry point                                                         #
# ------------------------------------------------------------------ #


if __name__ == "__main__":
    mcp.run(transport="stdio")
