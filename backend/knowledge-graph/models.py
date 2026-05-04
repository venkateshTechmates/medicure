"""Pydantic models for the knowledge graph REST API."""

from typing import Any
from pydantic import BaseModel


class NodeOut(BaseModel):
    id: str
    kind: str
    data: dict[str, Any] = {}


class EdgeOut(BaseModel):
    source: str
    target: str
    rel: str


class NetworkOut(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class StatsOut(BaseModel):
    total_nodes: int
    total_edges: int
    by_kind: dict[str, int]


class SyncPatientRequest(BaseModel):
    patient: dict[str, Any]
    problems: list[dict[str, Any]] = []
    orders: list[dict[str, Any]] = []
    labs: list[dict[str, Any]] = []
    vitals: list[dict[str, Any]] = []
    encounters: list[dict[str, Any]] = []
