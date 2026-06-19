# Decision - Rust-First Coding

Date: 2026-06-05
Status: active local coding preference

## Decision

New SIRINXDev internal coding work should prefer Rust first when it is practical
and aligned with the task.

This applies especially to:

- local CLIs;
- evidence hashing and verification;
- deterministic file-processing tools;
- bounded runtime adapters;
- sandboxed plugins;
- security-sensitive local utilities;
- performance-sensitive hot paths.

## Non-Goals

This is not a blanket rewrite order.

Do not force Rust into:

- existing React/TypeScript frontend surfaces;
- Markdown documentation;
- JSON schemas and static config;
- CSS/UI styling;
- generated content packets;
- integration code where the target ecosystem requires another language.

## Rule Of Thumb

Use Rust for new executable local tooling unless the existing package,
framework, or runtime makes another language clearly more maintainable.

When another language is used, document why in the relevant implementation
report or task packet.

## Current Pilot

The first Rust-first candidate remains:

```text
packages/evidence-hasher
```

Prototype implementation still requires:

```text
APPROVE_RUST_WASM_EVIDENCE_HASHER_PROTOTYPE_LOCAL_ONLY
```
