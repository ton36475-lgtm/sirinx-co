# Approved Mercury Skills

- ai-ml/agent-audit-logging/SKILL.md
  name: agent-audit-logging
  desc: Implement comprehensive audit logging and reporting for multi-agent systems. Covers event capture, structured logging, traceability, compliance reporting, forensic analysis, and real-time monitoring dashboards for agent actions and decisions.
- ai-ml/agent-handoff-protocols/SKILL.md
  name: agent-handoff-protocols
  desc: Design and implement agent-to-agent handoff protocols for multi-agent systems. Covers context passing, escalation patterns, handshake mechanisms, conversation continuity, and routing between specialized agents in production workflows.
- ai-ml/agent-health-monitoring/SKILL.md
  name: agent-health-monitoring
  desc: Monitor AI agent health, detect anomalies, set up alerting, and maintain observability dashboards for production multi-agent systems. Covers liveness checks, performance metrics, drift detection, and incident response.
- ai-ml/agent-task-delegation/SKILL.md
  name: agent-task-delegation
  desc: Design and operate task delegation systems for multi-agent fleets. Covers workload distribution, load balancing, queue management, priority scheduling, and dynamic agent scaling for production agent systems.
- ai-ml/ai-agent-design/SKILL.md
  name: ai-agent-design
  desc: Comprehensive guide to designing, building, and operating AI agents. Covers agent architecture, tool use patterns, memory systems, orchestration strategies, planning approaches, error recovery, and safety guardrails for production-grade agent systems.
- ai-ml/error-recovery-retry/SKILL.md
  name: error-recovery-retry
  desc: Design robust error recovery, retry logic, and fallback strategies for production AI agents. Covers transient failure handling, circuit breakers, exponential backoff, state recovery, graceful degradation, and dead-letter queues for agent systems.
- ai-ml/gbrain-lite/SKILL.md
  name: gbrain-lite
  desc: Lightweight personal knowledge base — markdown + YAML frontmatter structured notes with full-text search and cross-referencing for AI agents
- ai-ml/memory-management/SKILL.md
  name: memory-management
  desc: Design and operate memory systems for long-running AI agents. Covers context window optimization, summarization strategies, vector-based retrieval, episodic memory, memory consolidation, and garbage collection for production agent systems.
- ai-ml/prompt-engineering/SKILL.md
  name: prompt-engineering
  desc: Master the art and science of crafting effective prompts for large language models. Covers foundational patterns, advanced techniques like chain-of-thought and role prompting, structured output formats, and practical strategies for iterative refinement.
- ai-ml/prompt-version-management/SKILL.md
  name: prompt-version-management
  desc: Manage prompt versions, run A/B tests across agent prompts, track performance regressions, and safely roll out prompt changes in production. Covers prompt diffing, semantic versioning, canary releases, and automated evaluation.
- ai-ml/token-budget-tracking/SKILL.md
  name: token-budget-tracking
  desc: Track, optimize, and control token consumption across multi-agent systems. Covers budget allocation, real-time monitoring, cost attribution, per-agent limits, and proactive cost optimization for production LLM deployments.
- backend/api-design/SKILL.md
  name: api-design
  desc: REST and GraphQL API design principles, versioning, error handling, and documentation patterns
- backend/authentication-authorization/SKILL.md
  name: authentication-authorization
  desc: JWT, OAuth2, SAML, session management, RBAC, ABAC, and MFA implementation
- backend/caching-strategies/SKILL.md
  name: caching-strategies
  desc: CDN, Redis, in-memory cache, cache invalidation, and distributed caching patterns
- backend/database-design/SKILL.md
  name: database-design
  desc: Schema design, normalization, indexing, migrations, and query optimization for SQL and NoSQL
- backend/message-queues/SKILL.md
  name: message-queues
  desc: RabbitMQ, Kafka, SQS, pub/sub, competing consumers, dead letter queues, and event streaming
- backend/microservices/SKILL.md
  name: microservices
  desc: Service boundaries, communication patterns, event sourcing, CQRS, and distributed tracing
- backend/nodejs-patterns/SKILL.md
  name: nodejs-patterns
  desc: Async control flow, error handling, module design, streams, and production hardening
- backend/python-patterns/SKILL.md
  name: python-patterns
  desc: Python best practices including type hints, async patterns, testing, and project structure
- backend/serverless-patterns/SKILL.md
  name: serverless-patterns
  desc: Lambda, cold starts, event-driven design, API Gateway, and serverless frameworks
- design/accessibility/SKILL.md
  name: accessibility
  desc: Achieve and maintain WCAG compliance through inclusive design practices, proper ARIA usage, and comprehensive testing methodologies.
- design/ui-design-system/SKILL.md
  name: ui-design-system
  desc: Master the creation, maintenance, and governance of design systems — from design tokens and component architecture to documentation, versioning, and accessibility.
- development/api-documentation/SKILL.md
  name: api-documentation
  desc: API Documentation
- development/architecture-decision-records/SKILL.md
  name: architecture-decision-records
  desc: ADR methodology, templates, decision capture workflows, and architectural governance patterns
- development/clean-code/SKILL.md
  name: clean-code
  desc: Principles and practices for writing readable, maintainable, and testable code
- development/code-review/SKILL.md
  name: code-review
  desc: Systematic code review methodology, PR checklist, feedback techniques, and review automation patterns
- development/debugging-mastery/SKILL.md
  name: debugging-mastery
  desc: Structured debugging methodology, root cause analysis, logging strategies, and troubleshooting workflows
- development/dependency-management/SKILL.md
  name: dependency-management
  desc: Version pinning, vulnerability scanning, monorepo patterns, and upgrade workflows
- development/documentation-generation/SKILL.md
  name: documentation-generation
  desc: Effective technical documentation strategies, API docs, README patterns, and doc generation workflows
- development/git-workflow/SKILL.md
  name: git-workflow
  desc: Git best practices, branching strategies, commit conventions, and code review patterns
- development/hyperframes-cli/SKILL.md
  name: hyperframes-cli
  desc: HyperFrames CLI dev loop — project scaffolding, validation (lint/inspect), browser preview with live reload, MP4/WebM rendering, and environment troubleshooting (doctor, browser, info, upgrade). Use when running any npx hyperframes command or troubleshooting the build/render environment. For composition authoring see the hyperframes skill; for asset preprocessing (tts, transcribe, remove-background) see the hyperframes-media skill.
- development/hyperframes-media/SKILL.md
  name: hyperframes-media
  desc: Asset preprocessing for HyperFrames compositions — local text-to-speech narration (Kokoro-82M, no API key), audio/video transcription (Whisper), and background removal for transparent overlays (u2net). Use when generating voiceover from text, transcribing speech for captions, removing background from video/images, choosing TTS voices or whisper models, or chaining TTS -> transcribe -> captions. Each command downloads its own model on first run.
- development/hyperframes/SKILL.md
  name: hyperframes
  desc: Create, compose, animate, and render HTML-based video compositions using HyperFrames — an open-source video rendering framework built for AI agents. Covers composition authoring with data attributes, GSAP timelines, caption/subtitle generation, text-to-speech narration, audio-reactive animations, scene transitions, variable-driven parametrized renders, and the full video production workflow.
- development/knowledge-base/SKILL.md
  name: knowledge-base
  desc: Knowledge Base Creation
- development/markdown-mastery/SKILL.md
  name: markdown-mastery
  desc: Markdown Mastery
- development/refactoring-patterns/SKILL.md
  name: refactoring-patterns
  desc: Systematic refactoring techniques, code smell elimination, pattern extraction, and legacy modernization
- development/technical-writing/SKILL.md
  name: technical-writing
  desc: Technical Writing Mastery
- development/testing-strategies/SKILL.md
  name: testing-strategies
  desc: Comprehensive testing strategy covering unit, integration, e2e, property-based, and mutation testing with practical patterns
- devops/ci-cd-pipeline/SKILL.md
  name: ci-cd-pipeline
  desc: Design and implement production-grade CI/CD pipelines with GitHub Actions, layered testing strategies, secure deployment patterns, and environment management.
- devops/cloud-architecture/SKILL.md
  name: cloud-architecture
  desc: Multi-cloud, VPC design, high availability, disaster recovery, and cost optimization
- devops/docker-patterns/SKILL.md
  name: docker-patterns
  desc: Master Dockerfile optimization, multi-stage builds, docker-compose patterns, security hardening, and image size reduction techniques for production-grade containerization.
- devops/kubernetes-patterns/SKILL.md
  name: kubernetes-patterns
  desc: Pods, deployments, services, ingress, RBAC, autoscaling, and production cluster best practices
- devops/monitoring-observability/SKILL.md
  name: monitoring-observability
  desc: Prometheus, Grafana, ELK/Loki, Jaeger, metrics, logging, tracing, and alerting
- devops/sre-practices/SKILL.md
  name: sre-practices
  desc: SLIs/SLOs/SLAs, error budgets, incident response, postmortems, and reliability patterns
- devops/terraform-iac/SKILL.md
  name: terraform-iac
  desc: State management, modules, workspaces, remote backends, and multi-environment strategies
- frontend/component-design-systems/SKILL.md
  name: component-design-systems
  desc: Building and maintaining scalable component libraries, design tokens, accessibility, and cross-team collaboration patterns
- frontend/frontend-testing/SKILL.md
  name: frontend-testing
  desc: Comprehensive frontend testing strategy covering unit, integration, E2E, visual regression, and accessibility testing
- frontend/nextjs-patterns/SKILL.md
  name: nextjs-patterns
  desc: Next.js best practices, server components, app router patterns, caching strategies, and full-stack architecture
- frontend/react-patterns/SKILL.md
  name: react-patterns
  desc: Component patterns, hooks, state management, and performance optimization for React applications
- frontend/responsive-design/SKILL.md
  name: responsive-design
  desc: Responsive web design patterns, mobile-first CSS, container queries, fluid typography, and accessibility-first layouts
- frontend/state-management/SKILL.md
  name: state-management
  desc: Modern frontend state management patterns, tools, architecture decisions, and scalability patterns
- frontend/tailwind-css/SKILL.md
  name: tailwind-css
  desc: Best practices for utility-first CSS with Tailwind, responsive design, and component patterns
- frontend/web-performance/SKILL.md
  name: web-performance
  desc: Web performance optimization patterns, Core Web Vitals, lazy loading, code splitting, caching strategies, and monitoring
- product/product-strategy/SKILL.md
  name: Product Strategy
  desc: A comprehensive skill for product strategy — covering frameworks, opportunity sizing, prioritization, roadmap building, OKRs, and stakeholder management. From early-stage discovery to mature product org execution.
- product/user-research/SKILL.md
  name: User Research
  desc: A comprehensive skill for user research — covering research methods, interview techniques, participant recruitment, synthesis, insight generation, readout formats, and continuous discovery habits. From early generative research to evaluative usability testing.
- security/secure-coding/SKILL.md
  name: secure-coding
  desc: Comprehensive secure coding practices covering input validation, authentication, authorization, cryptography, secrets management, and error handling. Provides actionable code examples and checklists for building security into every stage of development.
- security/security-audit/SKILL.md
  name: security-audit
  desc: Comprehensive security audit methodology covering OWASP Top 10, dependency scanning, threat modeling, and vulnerability assessment. Provides actionable guidance for conducting systematic security audits from scope definition to final reporting.
- testing-qa/accessibility-testing/SKILL.md
  name: accessibility-testing
  desc: WCAG 2.1/2.2 audit, axe, Lighthouse, manual testing, screen reader testing, and remediation
- testing-qa/api-testing/SKILL.md
  name: api-testing
  desc: REST and GraphQL testing, Postman/Insomnia patterns, contract testing, schema validation, and monitoring
- testing-qa/e2e-testing/SKILL.md
  name: e2e-testing
  desc: Playwright and Cypress patterns, selectors, assertions, API mocking, visual testing, and CI/CD
- testing-qa/performance-testing/SKILL.md
  name: performance-testing
  desc: Load, stress, spike testing with k6/Locust, bottleneck analysis, and performance test automation
- testing-qa/test-strategy/SKILL.md
  name: test-strategy
  desc: Test pyramid, risk-based testing, test planning, coverage metrics, and SDLC integration
