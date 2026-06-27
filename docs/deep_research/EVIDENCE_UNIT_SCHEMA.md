# Evidence Unit Schema

Status: local-only schema draft

Evidence units are the atomic records that connect source material to claims,
confidence, conflicts, and final recommendations.

## Evidence Unit

```json
{
  "evidence_id": "ev_001",
  "job_id": "DR-YYYYMMDD-001",
  "source_id": "src_001",
  "source_type": "video",
  "source_uri": "local-or-url-reference",
  "source_hash": "sha256:pending",
  "capture_time": "2026-06-24T00:00:00+07:00",
  "timestamp_start": "00:02:14",
  "timestamp_end": "00:02:31",
  "page_number": null,
  "bbox": null,
  "modality": ["speech", "visual", "ocr"],
  "raw_text": "ระบบนี้คืนทุนใน 3 ปี",
  "normalized_claim": "The system pays back in 3 years.",
  "claim_type": "financial",
  "visual_context": "Solar panels and battery cabinet are visible.",
  "confidence": 0.78,
  "extraction_method": "asr+visual_grounding",
  "review_state": "needs_verification"
}
```

## Source Quality Record

```json
{
  "source_id": "src_001",
  "title": "Source title",
  "url": "https://example.com",
  "publisher": "Publisher",
  "published_at": "2025-01-01",
  "source_class": "government",
  "authority_score": 0.9,
  "recency_score": 0.8,
  "directness_score": 0.9,
  "transparency_score": 0.8,
  "bias_penalty": 0.1,
  "notes": "Primary or authoritative source."
}
```

## Claim Verification Record

```json
{
  "claim_id": "claim_001",
  "claim_text": "Solar + BESS payback is 3 years in Thailand.",
  "claim_type": "financial",
  "source_evidence_ids": ["ev_001"],
  "external_evidence_ids": ["ev_020", "ev_021"],
  "status": "partially_supported",
  "confidence": "medium",
  "base_case": "4.8-6.2 years",
  "aggressive_case": "3.0 years under high self-consumption and low CAPEX",
  "worst_case": "7.5+ years",
  "assumptions": [
    "high tariff",
    "high self-consumption",
    "low CAPEX",
    "controlled battery degradation"
  ],
  "conflicts": ["Some sources report longer BESS payback ranges."],
  "recommendation": "Model project-specific load profile before accepting the 3-year claim."
}
```

## Confidence Status Values

```text
high
medium
low
unverified
```

## Verification Status Values

```text
supported
partially_supported
contradicted
unverified
out_of_scope
```

## Review State Values

```text
draft
needs_verification
verified
conflict_found
quarantined
accepted_for_report
```

## Storage Policy

- Keep raw confidential sources local.
- Store hashes for reproducibility.
- Store crops only when they support a report claim.
- Delete temporary frame renders after indexing unless marked as evidence.
- Never store secrets in evidence units.
- Never expose private client documents to public indexes.
