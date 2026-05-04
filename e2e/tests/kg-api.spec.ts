/**
 * Knowledge Graph API E2E tests
 * ──────────────────────────────
 * Validates the Python KG service is running and returning expected data.
 * Requires the KG service to be up on http://localhost:8000.
 *
 * Run with:   KG_API_URL=http://localhost:8000 npx playwright test kg-api
 */
import { test, expect, request } from "@playwright/test";

const KG = process.env.KG_API_URL || "http://localhost:8000";

test.describe("Knowledge Graph API", () => {
  test("health endpoint returns ok", async () => {
    const ctx = await request.newContext({ baseURL: KG });
    const res = await ctx.get("/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.total_nodes).toBe("number");
  });

  test("stats endpoint returns node counts", async () => {
    const ctx = await request.newContext({ baseURL: KG });
    const res = await ctx.get("/stats");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("total_nodes");
    expect(body).toHaveProperty("total_edges");
    expect(body).toHaveProperty("by_kind");
  });

  test("search endpoint responds for generic query", async () => {
    const ctx = await request.newContext({ baseURL: KG });
    const res = await ctx.get("/graph/search?q=patient");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("results");
    expect(Array.isArray(body.results)).toBeTruthy();
  });

  test("unknown patient returns 404", async () => {
    const ctx = await request.newContext({ baseURL: KG });
    const res = await ctx.get("/graph/patient/DOES_NOT_EXIST_XYZ");
    expect(res.status()).toBe(404);
  });

  test("ingest and retrieve patient", async () => {
    const ctx = await request.newContext({ baseURL: KG });

    const payload = {
      patient: { mrn: "TST001", firstName: "Test", lastName: "User", ward: "ICU", attendingName: "Dr. Smith" },
      problems: [{ code: "I10", name: "Hypertension" }],
      orders: [{ id: "ord-1", medicationName: "Lisinopril" }],
      labs: [],
      vitals: [],
      encounters: [],
    };

    // Ingest
    const ingestRes = await ctx.post("/graph/ingest", { data: payload });
    expect(ingestRes.status()).toBe(204);

    // Retrieve
    const getRes = await ctx.get("/graph/patient/TST001");
    expect(getRes.ok()).toBeTruthy();
    const node = await getRes.json();
    expect(node.mrn).toBe("TST001");

    // Network
    const netRes = await ctx.get("/graph/patient/TST001/network?depth=2");
    expect(netRes.ok()).toBeTruthy();
    const net = await netRes.json();
    expect(Array.isArray(net.nodes)).toBeTruthy();
    expect(net.nodes.length).toBeGreaterThan(0);

    // Similar patients (I10 shared)
    const simRes = await ctx.get("/graph/patient/TST001/similar");
    expect(simRes.ok()).toBeTruthy();

    // Drug index
    const drugRes = await ctx.get("/graph/drug/Lisinopril/patients");
    expect(drugRes.ok()).toBeTruthy();
    const drugBody = await drugRes.json();
    expect(drugBody.patients).toContain("TST001");

    // Cleanup
    await ctx.delete("/graph/cache/patient:TST001");
  });
});
