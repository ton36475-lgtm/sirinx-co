# Multi-Agent JSON Handoff Skill

## Purpose

Define and preserve machine-readable payloads across routing, analysis, design, creation, validation, and delivery.

## When To Use

- creating or patching orchestration contracts
- adding agent-to-agent payloads
- reviewing workflow drift

## Inputs

- `ORCHESTRATION_SCHEMA.json`
- `schemas/*.schema.json`
- `.ops/contracts/*.json`

## Outputs

- valid JSON schemas
- payload contract docs
- validator-ready handoff shapes

## Hard Constraints

- payloads must stay JSON-valid
- validator gates must remain explicit
- no fake completion flags

## Validation Checklist

- schema parses with `python3 -m json.tool`
- handoff fields match documented role boundaries
- design lane payloads do not mutate facts

## May Touch

- `ORCHESTRATION_SCHEMA.json`
- `schemas/`
- `.ops/contracts/`
- `MULTI_AGENT_SYSTEM_PROMPTS.md`

## Must Not Touch

- live runtime secrets
- production databases
