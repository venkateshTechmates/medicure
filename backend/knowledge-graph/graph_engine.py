"""
MedCure Knowledge Graph Engine
In-memory graph (NetworkX) with TTL cache.

Node kinds and their ID format:
  patient:MRN001        Patient
  encounter:{id}        Encounter
  order:{id}            Order
  lab:{id}              LabResult
  vital:{id}            Vital
  problem:{code}        Problem/Diagnosis  (shared across patients)
  drug:{name}           Medication/Drug    (shared across patients)
  provider:{name}       Attending/nurse    (shared)
  ward:{name}           Ward               (shared)
"""

import time
import threading
from typing import Any
import networkx as nx

# Default TTL in seconds for each node kind
DEFAULT_TTL: dict[str, int] = {
    "patient":   300,   # 5 min
    "encounter": 600,   # 10 min
    "order":     120,   # 2 min
    "lab":       180,   # 3 min
    "vital":     60,    # 1 min
    "problem":   3600,  # 1 hr  (reference data)
    "drug":      3600,
    "provider":  3600,
    "ward":      3600,
}


class KnowledgeGraph:
    """Thread-safe in-memory medical knowledge graph."""

    def __init__(self) -> None:
        self._g: nx.DiGraph = nx.DiGraph()
        self._lock = threading.RLock()

    # ------------------------------------------------------------------ #
    #  Internal helpers                                                    #
    # ------------------------------------------------------------------ #

    def _kind(self, node_id: str) -> str:
        return node_id.split(":")[0] if ":" in node_id else "unknown"

    def _ttl_for(self, node_id: str) -> int:
        return DEFAULT_TTL.get(self._kind(node_id), 300)

    def _is_stale(self, node_id: str) -> bool:
        data = self._g.nodes.get(node_id, {})
        ts = data.get("_ts", 0)
        ttl = self._ttl_for(node_id)
        return (time.time() - ts) > ttl

    def _touch(self, node_id: str) -> None:
        if self._g.has_node(node_id):
            self._g.nodes[node_id]["_ts"] = time.time()

    # ------------------------------------------------------------------ #
    #  Write API                                                           #
    # ------------------------------------------------------------------ #

    def upsert_node(self, node_id: str, **attrs: Any) -> None:
        """Add or refresh a node with arbitrary attributes."""
        with self._lock:
            if self._g.has_node(node_id):
                self._g.nodes[node_id].update(attrs)
                self._touch(node_id)
            else:
                self._g.add_node(node_id, _ts=time.time(), **attrs)

    def upsert_edge(self, src: str, dst: str, rel: str, **attrs: Any) -> None:
        """Add or refresh a directed edge."""
        with self._lock:
            self._g.add_edge(src, dst, rel=rel, **attrs)

    def load_patient(self, patient: dict[str, Any]) -> None:
        """Upsert a Patient node and its reference edges."""
        mrn = patient.get("mrn", "")
        pid = f"patient:{mrn}"
        self.upsert_node(pid, kind="patient", **patient)

        if ward := patient.get("ward"):
            wid = f"ward:{ward}"
            self.upsert_node(wid, kind="ward", name=ward)
            self.upsert_edge(pid, wid, "admitted_to")

        if provider := patient.get("attendingName"):
            prov_id = f"provider:{provider}"
            self.upsert_node(prov_id, kind="provider", name=provider)
            self.upsert_edge(pid, prov_id, "attended_by")

    def load_problem(self, patient_mrn: str, problem: dict[str, Any]) -> None:
        code = problem.get("code", problem.get("name", "unknown"))
        pid = f"patient:{patient_mrn}"
        prob_id = f"problem:{code}"
        self.upsert_node(prob_id, kind="problem", **problem)
        self.upsert_edge(pid, prob_id, "has_diagnosis")

    def load_order(self, patient_mrn: str, order: dict[str, Any]) -> None:
        oid = f"order:{order.get('id', '')}"
        pid = f"patient:{patient_mrn}"
        self.upsert_node(oid, kind="order", **order)
        self.upsert_edge(pid, oid, "has_order")

        if drug := order.get("medicationName"):
            drug_id = f"drug:{drug}"
            self.upsert_node(drug_id, kind="drug", name=drug)
            self.upsert_edge(oid, drug_id, "prescribes")

    def load_lab(self, patient_mrn: str, lab: dict[str, Any]) -> None:
        lid = f"lab:{lab.get('id', '')}"
        pid = f"patient:{patient_mrn}"
        self.upsert_node(lid, kind="lab", **lab)
        self.upsert_edge(pid, lid, "has_lab")

    def load_vital(self, patient_mrn: str, vital: dict[str, Any]) -> None:
        vid = f"vital:{vital.get('id', '')}"
        pid = f"patient:{patient_mrn}"
        self.upsert_node(vid, kind="vital", **vital)
        self.upsert_edge(pid, vid, "has_vital")

    def load_encounter(self, patient_mrn: str, encounter: dict[str, Any]) -> None:
        eid = f"encounter:{encounter.get('id', '')}"
        pid = f"patient:{patient_mrn}"
        self.upsert_node(eid, kind="encounter", **encounter)
        self.upsert_edge(pid, eid, "has_encounter")

    def invalidate(self, node_id: str) -> None:
        with self._lock:
            if self._g.has_node(node_id):
                self._g.nodes[node_id]["_ts"] = 0  # force stale

    def clear(self) -> None:
        with self._lock:
            self._g.clear()

    # ------------------------------------------------------------------ #
    #  Read API                                                            #
    # ------------------------------------------------------------------ #

    def get_node(self, node_id: str) -> dict[str, Any] | None:
        with self._lock:
            if not self._g.has_node(node_id):
                return None
            if self._is_stale(node_id):
                return None
            return dict(self._g.nodes[node_id])

    def get_patient_network(self, mrn: str, depth: int = 2) -> dict[str, Any]:
        """Return the ego-graph around a patient node up to *depth* hops."""
        pid = f"patient:{mrn}"
        with self._lock:
            if not self._g.has_node(pid):
                return {"nodes": [], "edges": []}
            sub = nx.ego_graph(self._g, pid, radius=depth, undirected=False)
            nodes = [
                {"id": n, "kind": self._kind(n), **{k: v for k, v in sub.nodes[n].items() if not k.startswith("_")}}
                for n in sub.nodes
            ]
            edges = [
                {"source": u, "target": v, "rel": sub.edges[u, v].get("rel", "")}
                for u, v in sub.edges
            ]
            return {"nodes": nodes, "edges": edges}

    def find_similar_patients(self, mrn: str) -> list[str]:
        """Patients sharing at least one diagnosis with this patient."""
        pid = f"patient:{mrn}"
        with self._lock:
            shared_problems = [
                n for n in self._g.successors(pid) if self._kind(n) == "problem"
            ]
            similar: set[str] = set()
            for prob in shared_problems:
                for neighbor in self._g.predecessors(prob):
                    if self._kind(neighbor) == "patient" and neighbor != pid:
                        similar.add(neighbor.split(":")[1])  # return MRN
            return sorted(similar)

    def patients_on_drug(self, drug_name: str) -> list[str]:
        """MRNs of patients who have an order for this drug."""
        drug_id = f"drug:{drug_name}"
        with self._lock:
            if not self._g.has_node(drug_id):
                return []
            mrns: set[str] = set()
            for order_node in self._g.predecessors(drug_id):
                for patient_node in self._g.predecessors(order_node):
                    if self._kind(patient_node) == "patient":
                        mrns.add(patient_node.split(":")[1])
            return sorted(mrns)

    def search_nodes(self, text: str, kinds: list[str] | None = None) -> list[dict[str, Any]]:
        """Full-text search over node attribute values."""
        q = text.lower()
        results = []
        with self._lock:
            for nid, data in self._g.nodes(data=True):
                if kinds and self._kind(nid) not in kinds:
                    continue
                haystack = " ".join(str(v) for v in data.values()).lower()
                if q in haystack:
                    results.append({"id": nid, "kind": self._kind(nid), **{k: v for k, v in data.items() if not k.startswith("_")}})
        return results

    def stats(self) -> dict[str, Any]:
        with self._lock:
            by_kind: dict[str, int] = {}
            for n in self._g.nodes:
                k = self._kind(n)
                by_kind[k] = by_kind.get(k, 0) + 1
            return {
                "total_nodes": self._g.number_of_nodes(),
                "total_edges": self._g.number_of_edges(),
                "by_kind": by_kind,
            }


# Singleton instance
kg = KnowledgeGraph()
