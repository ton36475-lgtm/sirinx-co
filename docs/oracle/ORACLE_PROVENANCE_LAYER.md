# Oracle Provenance Layer

Status: LOCAL ONLY - WAITING FOR PART 8 APPROVAL

## Axioms

- The past is not what you remember. The past is what you can prove.
- Memory is not truth. Evidence is a truth candidate.
- Verify before assert.
- PROVEN is not guessed.
- Timeline records are append-only.
- Nothing is silently deleted.

## Purpose

Oracle Provenance turns chat history, screenshots, exports, prompts, transcripts,
local files, and Git evidence into reviewable project memory. It is a witness
layer, not a storytelling layer.

The layer must answer:

1. What claim was made?
2. What evidence exists?
3. What evidence is missing?
4. What proof state is allowed?
5. Which timeline event links the decision, artifact, and evidence?

## Proof States

| State      | Meaning                                | Minimum evidence                                       |
| ---------- | -------------------------------------- | ------------------------------------------------------ |
| UNVERIFIED | Claim, idea, memory, or assumption     | Raw note only                                          |
| LOCAL      | Artifact exists on this machine        | Local path and metadata                                |
| EVIDENCED  | Artifact has hash and manifest         | Evidence JSON and SHA-256                              |
| COMMITTED  | Artifact is anchored in Git history    | Commit SHA, note, or tag                               |
| EXTERNAL   | Third-party or external record exists  | Verified remote record or attestation                  |
| PROVEN     | Chain is complete for the agreed scope | Claim -> artifact -> hash -> commit -> external record |

## Rules

- Do not move a claim to `PROVEN_FACTS.md` without an evidence chain.
- Record corrections as new events; do not silently rewrite old timeline entries.
- Local files alone are not external proof.
- Git commit, Git note, signed tag, and external verification are separate proof levels.
- Keep Thai/English identity terms exact when they are part of the claim.

## Primary Files

```text
vault/oracle-memory/MEMORY.md
vault/oracle-memory/CLAIMS.md
vault/oracle-memory/STRONG_BELIEFS.md
vault/oracle-memory/UNVERIFIED_NOTES.md
vault/oracle-memory/PROVEN_FACTS.md
vault/timeline/index.md
vault/evidence/
schemas/evidence.schema.json
schemas/timeline-event.schema.json
schemas/proof-status.schema.json
```

## Operating Boundary

```text
local_only=true
deploy=false
push=false
public_tunnel=false
external_activation=false
real_customer_data=false
real_secrets=false
```
