# Architectural Decision Records (ADR)

This document tracks major architectural decisions made during the design, scaling, and production deployment of the Enterprise HR AI Platform.

---

## 🏛️ ADR-001: Standardization on Temporal for Workflow Durability

### Status
**Approved**

### Context
HR mutations (such as deducting leave balances, dispatching laptop shipments, triggering payroll adjustments) are complex, long-running processes that span across multiple decoupled services (PostgreSQL databases, external shipping courier APIs, internal notification platforms). If any service fails in the middle of a process, the system can end up in an inconsistent state (e.g., leave balance is deducted, but the courier dispatch fails).

Traditional distributed 2-Phase Commit protocols (2PC) add significant database lock contention and do not scale. Custom retry and fallback queues are error-prone and complex to maintain.

### Decision
We standardize on **Temporal** for orchestrating all transaction processes as durable workflows (Sagas):
1. **Durable Execution**: Temporal guarantees execution completion even in the event of local server crashes or network outages.
2. **Explicit Saga Orchestration**: Allows developers to write standard code while managing complex rollback steps automatically if a step fails.
3. **Traceability**: Temporal preserves historical execution timelines, making it easy to audit and debug multi-system workflows.

### Consequences
* Requires running a Temporal frontend and database backend (or using Temporal Cloud).
* Developers must write decoupled, idempotent actions (Activities) matching clean interface contracts.

---

## 🏛️ ADR-002: Model Context Protocol (MCP) as the Unified Service Bridge

### Status
**Approved**

### Context
Our platform needs to read from and write to external services (Workday, SAP, Outlook Calendar, Slack). Building bespoke API clients for each integration creates massive SDK bloat, duplicate connection pools, and tight coupling with third-party APIs.

### Decision
Adopt the open **Model Context Protocol (MCP)** framework:
1. **Schema Standardization**: MCP defines standard JSON-RPC 2.0 schemas for exposing tools, resources, and prompt templates to AI models.
2. **Strict Isolation**: External integrations are decoupled into standalone MCP gateways. The main AI Control Plane communicates with these gateways via standard client connections, eliminating external SDK dependencies.
3. **Runtime Protection**: Gateway connections can be rate-limited, audited, or disabled independently without touching the core Control Plane.

### Consequences
* Eliminates custom API client SDK code from the core application.
* Requires implementing or running standard MCP server daemons for external integrations.

---

## 🏛️ ADR-003: Hybrid Vector-Keyword Retrieval (Dense + Sparse) with Cross-Encoder Reranking

### Status
**Approved**

### Context
HR compliance and legal query accuracy require 100% precision. Standard dense-only retrieval (e.g., cosine similarity search) is great at capturing semantic meaning but often misses specific compliance numbers or code sections (e.g., *California Labor Code Section 246*), leading to incorrect policy suggestions.

### Decision
We implement a hybrid retrieval pipeline paired with a Cross-Encoder reranking step:
1. **Dense Retrieval**: Use Qdrant with BAAI BGE-M3 embeddings (1024-dimension) to retrieve semantically relevant documents.
2. **Sparse Retrieval**: Use Elasticsearch (BM25 score matching) to retrieve precise keyword and token matches.
3. **Cross-Encoder Reranking**: Run candidate documents through a BGE-Reranker model to calculate a unified relevance score, ensuring the most accurate context is injected into the prompt.

### Consequences
* Slightly higher query latency (additional 50-80ms for reranking), which is mitigated by caching frequent queries in Redis.
* Requires running both Qdrant and Elasticsearch services in production.
