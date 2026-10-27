import { describe, expect, it } from "vitest";
import worker, {
  extractLeadPayload,
  getLeadIntakeSchema,
  handleLeadSubmit,
  resolveHostRoute
} from "./worker.js";

function createMockD1() {
  const statements = [];

  return {
    statements,
    prepare(sql) {
      const statement = {
        sql,
        bindings: [],
        bind(...values) {
          this.bindings = values;
          return this;
        },
        async run() {
          statements.push({
            sql: this.sql,
            bindings: this.bindings
          });
          return { success: true };
        }
      };
      return statement;
    }
  };
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

describe("main-router lead payload extraction", () => {
  it("exposes a read-only lead intake schema contract", () => {
    const schema = getLeadIntakeSchema();

    expect(schema.version).toBe("2026-05-19.lead-intake.v1");
    expect(schema.endpoint).toBe("/api/trpc/lead.submit");
    expect(schema.required.all).toContain("name");
    expect(schema.required.oneOf).toEqual(["phone", "email", "lineUserId"]);
    expect(schema.payloadShapes).toContain("tRPC numeric-keyed batch");
    expect(schema.fields.map((field) => field.name)).toContain("monthlyBill");
    expect(schema.reviewGates).toContain("production POST smoke requires explicit approval");
  });

  it("extracts a tRPC numeric-keyed batch payload", () => {
    const result = extractLeadPayload({
      0: {
        json: {
          source: "contact",
          name: "Ada Solar",
          phone: "0812345678",
          monthlyBill: "45000"
        }
      }
    });

    expect(result.isBatch).toBe(true);
    expect(result.lead).toMatchObject({
      source: "contact",
      name: "Ada Solar",
      phone: "0812345678",
      monthlyBill: "45000"
    });
  });

  it("extracts array batch and input.json payload variants", () => {
    const result = extractLeadPayload([
      {
        input: {
          json: {
            source: "assessment",
            name: "Grace Energy",
            email: "grace@example.com",
            systemSize: "120 kWp",
            bessInterest: "yes"
          }
        }
      }
    ]);

    expect(result.isBatch).toBe(true);
    expect(result.lead).toMatchObject({
      source: "assessment",
      name: "Grace Energy",
      email: "grace@example.com",
      systemSize: "120 kWp",
      bessInterest: "yes"
    });
  });

  it("trims and bounds free-form fields", () => {
    const result = extractLeadPayload({
      json: {
        name: "  Nida  ",
        phone: "  0800000000  ",
        message: "x".repeat(5000)
      }
    });

    expect(result.lead.name).toBe("Nida");
    expect(result.lead.phone).toBe("0800000000");
    expect(result.lead.message).toHaveLength(4000);
  });
});

describe("main-router handleLeadSubmit", () => {
  it("stores a valid tRPC batch lead into D1", async () => {
    const db = createMockD1();
    const response = await handleLeadSubmit(
      new Request("https://www.sirinx.co/api/trpc/lead.submit?batch=1", {
        method: "POST",
        body: JSON.stringify({
          0: {
            json: {
              source: "contact",
              name: "Ada Solar",
              phone: "0812345678",
              interest: "Solar Carport",
              monthlyBill: "45000"
            }
          }
        })
      }),
      { LEAD_DB: db }
    );

    expect(response.status).toBe(200);
    const payload = await readJson(response);
    expect(payload[0].result.data.json.ok).toBe(true);
    expect(db.statements).toHaveLength(2);
    expect(db.statements[1].bindings).toContain("Ada Solar");
    expect(db.statements[1].bindings).toContain("0812345678");
  });

  it("accepts an email-only partner lead because email is a contact channel", async () => {
    const db = createMockD1();
    const response = await handleLeadSubmit(
      new Request("https://www.sirinx.co/api/trpc/lead.submit?batch=1", {
        method: "POST",
        body: JSON.stringify({
          0: {
            json: {
              source: "partner",
              name: "Partner Lead",
              email: "partner@example.com",
              interest: "พันธมิตร: investor"
            }
          }
        })
      }),
      { LEAD_DB: db }
    );

    expect(response.status).toBe(200);
    expect(db.statements[1].bindings).toContain("partner@example.com");
  });

  it("rejects a lead without any contact channel", async () => {
    const response = await handleLeadSubmit(
      new Request("https://www.sirinx.co/api/trpc/lead.submit", {
        method: "POST",
        body: JSON.stringify({
          json: {
            name: "No Channel"
          }
        })
      }),
      { LEAD_DB: createMockD1() }
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: {
        message: "At least one contact channel is required"
      }
    });
  });

  it("returns 503 when the lead database binding is missing", async () => {
    const response = await handleLeadSubmit(
      new Request("https://www.sirinx.co/api/trpc/lead.submit", {
        method: "POST",
        body: JSON.stringify({
          json: {
            name: "Missing Binding",
            phone: "0812345678"
          }
        })
      }),
      {}
    );

    expect(response.status).toBe(503);
  });
});

describe("main-router host routing (both zones)", () => {
  it("serves each www host from its own Pages project", () => {
    expect(resolveHostRoute("www.sirinx.co")).toEqual({
      kind: "site",
      pagesHost: "sirinx-co.pages.dev"
    });
    // sirinx.org is a custom domain of the sirinx-co-preview project; before
    // this the .org host was never routed here, so /api/trpc/lead.submit
    // answered 405 and the contact form could not submit.
    expect(resolveHostRoute("www.sirinx.org")).toEqual({
      kind: "site",
      pagesHost: "sirinx-co-preview.pages.dev"
    });
  });

  it("redirects both apexes to their own www host", () => {
    expect(resolveHostRoute("sirinx.co")).toEqual({
      kind: "redirect",
      host: "www.sirinx.co"
    });
    expect(resolveHostRoute("sirinx.org")).toEqual({
      kind: "redirect",
      host: "www.sirinx.org"
    });
  });

  it("refuses any other hostname", () => {
    expect(resolveHostRoute("sirinx.example")).toEqual({ kind: "not-found" });
    expect(resolveHostRoute("pages.dev")).toEqual({ kind: "not-found" });
  });

  it("answers the .org apex with a 301 to www.sirinx.org", async () => {
    const response = await worker.fetch(new Request("https://sirinx.org/pricing/"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://www.sirinx.org/pricing/");
  });

  it("keeps the .co apex redirect pointing at www.sirinx.co", async () => {
    const response = await worker.fetch(new Request("https://sirinx.co/"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://www.sirinx.co/");
  });

  it("hands the .org lead endpoint to the shared lead handler", async () => {
    // No D1 binding in this environment: the point is that the request reaches
    // handleLeadSubmit (503 "missing binding") instead of Pages' 405.
    const response = await worker.fetch(
      new Request("https://www.sirinx.org/api/trpc/lead.submit", {
        method: "POST",
        body: JSON.stringify({ json: { name: "Org Lead", phone: "0812345678" } })
      }),
      {}
    );
    expect(response.status).toBe(503);
    const body = await readJson(response);
    // tRPC internal-error envelope: proves the request reached the lead
    // handler instead of Pages answering 405 and dropping the lead.
    expect(body.error.code).toBe(-32603);
    expect(body.error.message).toMatch(/lead/i);
  });

  it("returns a plain 404 for unknown hosts instead of proxying", async () => {
    const response = await worker.fetch(new Request("https://evil.example/foo"), {});
    expect(response.status).toBe(404);
  });
});
