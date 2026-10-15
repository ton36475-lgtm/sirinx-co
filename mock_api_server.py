#!/usr/bin/env python3
"""Local-only SIRINX prototype server. No database, external API, auth or persistence."""
from __future__ import annotations

import argparse
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
MAX_BODY = 64 * 1024
BESS_MASTER = json.loads((PUBLIC / "data" / "bess-master.json").read_text(encoding="utf-8"))

KNOWLEDGE = [
    {
        "id": "ORG-01",
        "topic": "solar-carport",
        "title": "Regional knowledge directory",
        "state": "website_claim",
        "summary": "The public .org site presents regional/provincial solar-carport knowledge links.",
        "sources": [{"url": "https://www.sirinx.org/", "publisher": "SIRINX public website", "reviewedAt": "2026-10-08", "state": "website_claim"}],
    },
    {
        "id": "CO-01",
        "topic": "projects",
        "title": "Projects displayed on the company website",
        "state": "website_claim",
        "summary": "Website-reported project details require evidence review; no independent production or savings measurement is attached.",
        "sources": [{"url": "https://www.sirinx.co/projects/", "publisher": "SIRINX public website", "reviewedAt": "2026-10-08", "state": "website_claim"}],
    },
] + BESS_MASTER["knowledgeRecords"]
EVIDENCE = [
    {"id": "ORG-01", "state": "website_claim", "measured": False, "verified": False, "sourceUrl": "https://www.sirinx.org/", "note": "Published directory structure; no energy measurement."},
    {"id": "CO-01", "state": "website_claim", "measured": False, "verified": False, "sourceUrl": "https://www.sirinx.co/projects/", "note": "Project content published by the website; not independently verified here."},
    {"id": "SIM-00", "state": "scenario", "measured": False, "verified": False, "sourceUrl": None, "note": "Local-only assessment brief; no calculation."},
    {"id": "OPS-00", "state": "offline", "measured": False, "verified": False, "sourceUrl": None, "note": "No telemetry or operational connector."},
] + [
    {"id": item["id"], "state": item["recordState"], "measured": False, "verified": False, "sourceUrl": next((source["url"] for source in BESS_MASTER["sources"] if source["id"] == item["sourceId"]), None), "reviewedAt": BESS_MASTER["reviewedAt"], "note": "Manufacturer-reported product data; internal discrepancy remains pending datasheet confirmation."}
    for item in BESS_MASTER["products"]
]
PROJECTS = [
    {"id": "SITE-CLAIM-01", "name": "Ruenphae Royal Park", "state": "website_claim", "sourceUrl": "https://www.sirinx.co/projects/", "independentMeasurement": False, "note": "Site-published description; evidence review required."},
    {"id": "SITE-CLAIM-02", "name": "Holatel", "state": "website_claim · status variance noted", "sourceUrl": "https://www.sirinx.co/projects/holatel-rim-nan/", "independentMeasurement": False, "note": "The prototype records a source-status discrepancy; recheck before publication."},
]

FORBIDDEN_KEYS = re.compile(r"(?:name|email|phone|mobile|address|token|secret|password|credential|payment|accountid)", re.I)


def json_bytes(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def response_base() -> dict:
    return {"demoOnly": True, "persisted": False}


def bounded_text(value: object, limit: int = 160) -> str:
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if len(value) > limit:
        raise ValueError(f"Text field exceeds {limit} characters")
    return value


def reject_sensitive_keys(value: object) -> None:
    if isinstance(value, dict):
        for key, nested in value.items():
            if FORBIDDEN_KEYS.search(str(key)):
                raise ValueError("Personal/contact/secret fields are not accepted by this mock API")
            reject_sensitive_keys(nested)
    elif isinstance(value, list):
        for nested in value:
            reject_sensitive_keys(nested)


class Handler(SimpleHTTPRequestHandler):
    server_version = "SIRINX-Local-Mock"
    sys_version = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        # Do not log request bodies, tokens, query payloads or user-provided values.
        return

    def _json(self, status: int, payload: object) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Prototype-Only", "true")
        self.end_headers()
        self.wfile.write(body)

    def _static_or_get(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/v1/status":
            self._json(200, {"demoOnly": True, "liveIntegrations": False, "persisted": False, "deviceCommands": False, "note": "Loopback-only static proposal prototype."})
            return
        if path == "/api/v1/knowledge":
            self._json(200, {"demoOnly": True, "records": KNOWLEDGE})
            return
        if path == "/api/v1/evidence":
            self._json(200, {"demoOnly": True, "records": EVIDENCE})
            return
        if path == "/api/v1/projects":
            self._json(200, {"demoOnly": True, "records": PROJECTS})
            return
        if path.startswith("/api/"):
            self._json(404, {"demoOnly": True, "error": "Unknown mock route", "persisted": False})
            return
        super().do_GET()

    def do_GET(self) -> None:
        self._static_or_get()

    def do_HEAD(self) -> None:
        path = urlsplit(self.path).path
        if path.startswith("/api/"):
            self._json(405, {"demoOnly": True, "error": "Use GET or POST as documented"})
            return
        super().do_HEAD()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Allow", "GET, POST, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self) -> None:
        path = urlsplit(self.path).path
        if not path.startswith("/api/"):
            self._json(404, {"demoOnly": True, "error": "Only documented local mock API routes accept POST"})
            return
        if not self.headers.get("Content-Type", "").lower().startswith("application/json"):
            self._json(415, {"demoOnly": True, "error": "Content-Type must be application/json"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._json(400, {"demoOnly": True, "error": "Invalid Content-Length"})
            return
        if length < 0 or length > MAX_BODY:
            self._json(413, {"demoOnly": True, "error": "Request body limit is 64 KiB"})
            return
        try:
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw.decode("utf-8"))
            if not isinstance(body, dict):
                raise ValueError("JSON body must be an object")
            reject_sensitive_keys(body)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self._json(400, {"demoOnly": True, "error": str(exc)[:180], "persisted": False})
            return

        try:
            if path == "/api/v1/assessments":
                allowed = {"businessType": 80, "province": 80, "monthlyBillRange": 40, "siteAreaRange": 40, "solution": 80, "bessGoal": 40, "loadProfile": 40, "existingSolar": 40, "siteDataStatus": 40}
                unknown = set(body) - set(allowed)
                if unknown:
                    raise ValueError("Unsupported assessment fields")
                brief = {key: bounded_text(body.get(key, ""), limit) for key, limit in allowed.items() if key in body}
                self._json(200, {**response_base(), "leadCreated": False, "calculationPerformed": False, "roiForecastGenerated": False, "state": "scenario_brief_only", "brief": brief, "nextStep": "Human engineering review required before any real assessment."})
                return

            if path == "/api/v1/ai/knowledge-query":
                if set(body) - {"topic", "question"}:
                    raise ValueError("Unsupported AI query fields")
                topic = bounded_text(body.get("topic", ""), 120)
                bounded_text(body.get("question", ""), 500)
                self._json(200, {**response_base(), "llmCalled": False, "topic": topic, "response": "No AI model is connected. Verify public sources and send the question to a human reviewer.", "sources": []})
                return

            if path == "/api/v1/cloud/workload-intakes":
                if set(body) - {"workloadType", "region", "dataClass"}:
                    raise ValueError("Unsupported cloud intake fields")
                workload = bounded_text(body.get("workloadType", "not_sure"), 30)
                data_class = bounded_text(body.get("dataClass", "unknown"), 30)
                region = bounded_text(body.get("region", ""), 80)
                if workload not in {"inference", "training", "storage", "not_sure"}:
                    raise ValueError("Invalid workloadType")
                if data_class not in {"public", "internal", "sensitive_unknown", "unknown"}:
                    raise ValueError("Invalid dataClass")
                self._json(200, {**response_base(), "workloadType": workload, "region": region, "dataClass": data_class, "availability": "unknown", "pricing": "unknown", "requestCreated": False, "capacityReserved": False})
                return

            if path == "/api/v1/pricing/scenarios":
                if set(body) - {"solutionPackage", "commercialStructure", "region"}:
                    raise ValueError("Unsupported pricing scenario fields")
                solution = bounded_text(body.get("solutionPackage", "solar_carport"), 40)
                structure = bounded_text(body.get("commercialStructure", "not_sure"), 30)
                region = bounded_text(body.get("region", "not_provided"), 80)
                if solution not in {"solar_carport", "rooftop", "floating_solar", "bess", "ev_charging", "ems"}:
                    raise ValueError("Invalid solutionPackage")
                if structure not in {"purchase", "lease", "third_party", "not_sure"}:
                    raise ValueError("Invalid commercialStructure")
                self._json(200, {**response_base(), "solutionPackage": solution, "commercialStructure": structure, "region": region, "priceAvailable": False, "quoteCreated": False, "roiCalculated": False, "requiredInputs": ["approved site survey", "load profile and tariff", "structural/electrical review", "current vendor offer and warranty", "owner-approved commercial terms"]})
                return

            if path == "/api/v1/editorial/review-briefs":
                if set(body) - {"route", "format", "topic"}:
                    raise ValueError("Unsupported editorial brief fields")
                route = bounded_text(body.get("route", "blog"), 30)
                content_format = bounded_text(body.get("format", "article"), 30)
                topic = bounded_text(body.get("topic", ""), 160)
                if route not in {"about", "leadership", "services", "blog", "strategy"}:
                    raise ValueError("Invalid route")
                if content_format not in {"webpage", "media_kit", "video", "speaking", "article"}:
                    raise ValueError("Invalid format")
                self._json(200, {**response_base(), "route": route, "format": content_format, "topic": topic, "sourceVerified": False, "ownerReviewRequired": True, "draftCreated": False, "published": False, "checklist": ["approved facts and source", "owner/rights review", "expiry and correction path"]})
                return

            if path == "/api/v1/contact/routing":
                if set(body) - {"intent", "region"}:
                    raise ValueError("Unsupported contact routing fields")
                intent = bounded_text(body.get("intent", "assessment"), 30)
                region = bounded_text(body.get("region", "not_provided"), 80)
                routes = {"assessment": "/co.html#assessment", "partner": "/prototypes/#partners", "correction": "/#policy", "media": "/prototypes/#branding"}
                if intent not in routes:
                    raise ValueError("Invalid intent")
                self._json(200, {**response_base(), "intent": intent, "region": region, "contactCaptured": False, "inquirySent": False, "suggestedPrototypeRoute": routes[intent]})
                return

            if path == "/api/v1/brand-consents":
                if set(body) - {"role", "assets", "channels", "duration"}:
                    raise ValueError("Unsupported consent checklist fields")
                role = bounded_text(body.get("role", "other"), 20)
                if role not in {"CEO", "staff", "other"}:
                    raise ValueError("Invalid role")
                assets = body.get("assets", [])
                channels = body.get("channels", [])
                if not isinstance(assets, list) or not isinstance(channels, list):
                    raise ValueError("assets and channels must be arrays")
                allowed_assets = {"name", "photo", "voice", "video", "quote", "byline", "credentials"}
                allowed_channels = {"website", "blog", "press", "social", "event", "youtube"}
                if any(item not in allowed_assets for item in assets) or any(item not in allowed_channels for item in channels):
                    raise ValueError("Unsupported asset or channel")
                duration = bounded_text(body.get("duration", "review_required"), 30)
                checklist = ["Consent is not recorded by this prototype.", "Confirm purpose and owner approval.", "Set expiry and a withdrawal/update route."]
                self._json(200, {**response_base(), "role": role, "assets": assets, "channels": channels, "duration": duration, "consentRecorded": False, "checklist": checklist})
                return

            if path == "/api/v1/partner-inquiries":
                if set(body) - {"partnerType", "region", "interest"}:
                    raise ValueError("Unsupported partner intake fields")
                self._json(200, {**response_base(), "status": "preview_only", "partnerType": bounded_text(body.get("partnerType", ""), 80), "region": bounded_text(body.get("region", ""), 80), "interest": bounded_text(body.get("interest", ""), 160), "inquirySent": False})
                return

            self._json(404, {"demoOnly": True, "error": "Unknown mock route", "persisted": False})
        except ValueError as exc:
            self._json(400, {"demoOnly": True, "error": str(exc)[:180], "persisted": False})


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the SIRINX static prototype and non-persistent local mock API.")
    parser.add_argument("--port", type=int, default=8766, help="Local TCP port (default: 8766)")
    args = parser.parse_args()
    if not PUBLIC.is_dir():
        raise SystemExit(f"Missing static prototype folder: {PUBLIC}")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"SIRINX mock prototype: http://127.0.0.1:{args.port}/prototypes/")
    print("API base: http://127.0.0.1:%d/api · loopback only · no persistence" % args.port)
    print("Press Ctrl-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        print("Stopped.")


if __name__ == "__main__":
    main()
